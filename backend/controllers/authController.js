
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const ErrorHandler = require("../utils/errorHandler");
const User = require("../models/user");
const sendToken = require("../utils/sendToken");
const jwt = require("jsonwebtoken");
const Email = require("../utils/email");
const crypto = require("crypto");
const cloudinary = require("../config/cloudinary");

// =====================================================
// LOGIN
// =====================================================
exports.login = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(
      new ErrorHandler("Please enter email & password", 400)
    );
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(
      new ErrorHandler("Invalid Email or Password", 401)
    );
  }

  const isPasswordMatched = await user.correctPassword(
    password,
    user.password
  );

  if (!isPasswordMatched) {
    return next(
      new ErrorHandler("Invalid Email or Password", 401)
    );
  }

  sendToken(user, 200, res);
});

// =====================================================
// PROTECT ROUTES
// =====================================================
exports.protect = catchAsyncErrors(async (req, res, next) => {
  let token;

  if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new ErrorHandler(
        "Please login to access this resource",
        401
      )
    );
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id);

  if (!user) {
    return next(
      new ErrorHandler("User no longer exists", 401)
    );
  }

  if (user.changedPasswordAfter(decoded.iat)) {
    return next(
      new ErrorHandler(
        "Password recently changed. Please login again",
        401
      )
    );
  }

  req.user = user;
  next();
});

// =====================================================
// SIGNUP
// =====================================================
exports.signup = catchAsyncErrors(async (req, res, next) => {
  const {
    name,
    email,
    password,
    passwordConfirm,
    phoneNumber,
  } = req.body;

  if (
    !name ||
    !email ||
    !password ||
    !passwordConfirm ||
    !phoneNumber
  ) {
    return next(
      new ErrorHandler("Please enter all required fields", 400)
    );
  }

  if (password !== passwordConfirm) {
    return next(
      new ErrorHandler("Passwords do not match", 400)
    );
  }

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    return next(
      new ErrorHandler(
        "User already exists with this email",
        400
      )
    );
  }

  const userData = {
    name,
    email,
    password,
    passwordConfirm,
    phoneNumber,
  };

  // Get the uploaded avatar, if present.
  const avatarFile = req.files?.avatar;

  console.log("Avatar received:", !!avatarFile);

  if (avatarFile) {
    if (!avatarFile.mimetype?.startsWith("image/")) {
      return next(
        new ErrorHandler("Please upload a valid image file", 400)
      );
    }

    if (!avatarFile.tempFilePath) {
      return next(
        new ErrorHandler(
          "Avatar temporary file is unavailable. Check file-upload middleware.",
          400
        )
      );
    }

    const result = await cloudinary.uploader.upload(
      avatarFile.tempFilePath,
      {
        folder: "OrderIt/avatars",
        resource_type: "image",
      }
    );

    userData.avatar = {
      public_id: result.public_id,
      url: result.secure_url,
    };
  }

  const user = await User.create(userData);

  sendToken(user, 201, res);
});

// =====================================================
// FORGOT PASSWORD
// =====================================================
exports.forgotPassword = catchAsyncErrors(
  async (req, res, next) => {
    const { email } = req.body;

    if (!email) {
      return next(
        new ErrorHandler("Please enter your email", 400)
      );
    }

    const user = await User.findOne({ email });

    if (!user) {
      return next(
        new ErrorHandler(
          "There is no user with this email",
          404
        )
      );
    }

    const resetToken = user.createPasswordResetToken();

    await user.save({ validateBeforeSave: false });

    const resetURL = `${
      process.env.FRONTEND_URL || "http://localhost:5173"
    }/password/reset/${resetToken}`;

    try {
      await new Email(user, resetURL).sendPasswordReset();

      return res.status(200).json({
        success: true,
        message: "Token sent to email",
      });
    } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;

      await user.save({ validateBeforeSave: false });

      console.error("Password reset email failed:", err.message);

      return next(
        new ErrorHandler(
          "There was an error sending the email. Try again later.",
          500
        )
      );
    }
  }
);

// =====================================================
// RESET PASSWORD
// =====================================================
exports.resetPassword = catchAsyncErrors(
  async (req, res, next) => {
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return next(
        new ErrorHandler(
          "Token is invalid or has expired",
          400
        )
      );
    }

    const { password, passwordConfirm } = req.body;

    if (!password || !passwordConfirm) {
      return next(
        new ErrorHandler(
          "Please enter password and password confirmation",
          400
        )
      );
    }

    if (password !== passwordConfirm) {
      return next(
        new ErrorHandler("Passwords do not match", 400)
      );
    }

    user.password = password;
    user.passwordConfirm = passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save({ validateModifiedOnly: true });

    sendToken(user, 200, res);
  }
);

// =====================================================
// LOGOUT
// =====================================================
exports.logout = (req, res) => {
  res.cookie("jwt", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

// =====================================================
// GET CURRENT USER PROFILE
// =====================================================
exports.getUserProfile = catchAsyncErrors(
  async (req, res, next) => {
    const user = await User.findById(req.user.id);

    if (!user) {
      return next(
        new ErrorHandler("User not found", 404)
      );
    }

    res.status(200).json({
      success: true,
      user,
    });
  }
);

// =====================================================
// UPDATE PASSWORD
// =====================================================
exports.updatePassword = catchAsyncErrors(
  async (req, res, next) => {
    const user = await User.findById(req.user.id)
      .select("+password");

    if (!user) {
      return next(
        new ErrorHandler("User not found", 404)
      );
    }

    const {
      currentPassword,
      newPassword,
      passwordConfirm,
    } = req.body;

    if (
      !currentPassword ||
      !newPassword ||
      !passwordConfirm
    ) {
      return next(
        new ErrorHandler(
          "Please enter all password fields",
          400
        )
      );
    }

    const isPasswordMatched = await user.correctPassword(
      currentPassword,
      user.password
    );

    if (!isPasswordMatched) {
      return next(
        new ErrorHandler(
          "Current password is incorrect",
          401
        )
      );
    }

    if (newPassword !== passwordConfirm) {
      return next(
        new ErrorHandler(
          "New passwords do not match",
          400
        )
      );
    }

    user.password = newPassword;
    user.passwordConfirm = passwordConfirm;

    await user.save();

    sendToken(user, 200, res);
  }
);

// =====================================================
// UPDATE PROFILE
// =====================================================
exports.updateProfile = catchAsyncErrors(
  async (req, res, next) => {
    const { name, email, phoneNumber } = req.body;

    const updateData = {};

    if (name !== undefined && name.trim() !== "") {
      updateData.name = name.trim();
    }

    if (email !== undefined && email.trim() !== "") {
      updateData.email = email.trim();
    }

    if (
      phoneNumber !== undefined &&
      phoneNumber.trim() !== ""
    ) {
      updateData.phoneNumber = phoneNumber.trim();
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return next(
        new ErrorHandler("User not found", 404)
      );
    }

    // Upload a new avatar if one was selected.
    const avatarFile = req.files?.avatar;

    if (avatarFile) {
      if (!avatarFile.mimetype?.startsWith("image/")) {
        return next(
          new ErrorHandler(
            "Please upload a valid image file",
            400
          )
        );
      }

      if (!avatarFile.tempFilePath) {
        return next(
          new ErrorHandler(
            "Avatar temporary file is unavailable",
            400
          )
        );
      }

      const result = await cloudinary.uploader.upload(
        avatarFile.tempFilePath,
        {
          folder: "OrderIt/avatars",
          resource_type: "image",
        }
      );

      updateData.avatar = {
        public_id: result.public_id,
        url: result.secure_url,
      };
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      {
        new: true,
        runValidators: true,
      }
    );

    // Delete the previous Cloudinary image after saving the new one.
    if (
      updateData.avatar &&
      user.avatar &&
      user.avatar.public_id
    ) {
      try {
        await cloudinary.uploader.destroy(
          user.avatar.public_id
        );
      } catch (error) {
        console.error(
          "Old avatar cleanup failed:",
          error.message
        );
      }
    }

    res.status(200).json({
      success: true,
      user: updatedUser,
    });
  }
);

// =====================================================
// GET USER COUNT - ADMIN DASHBOARD
// =====================================================
exports.getUserCount = catchAsyncErrors(
  async (req, res, next) => {
    const count = await User.countDocuments();

    res.status(200).json({
      success: true,
      count,
    });
  }
);
