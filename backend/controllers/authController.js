const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const ErrorHandler = require("../utils/errorHandler");
const User = require("../models/user");
const sendToken = require("../utils/sendToken");
const jwt = require("jsonwebtoken");
const Email = require("../utils/email");
const crypto = require("crypto");

// =====================================================
// LOGIN
// =====================================================

exports.login = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;

  console.log("========== LOGIN DEBUG ==========");
  console.log("Email received:", email);
  console.log("Password received:", password ? "YES" : "NO");

  // Check email and password
  if (!email || !password) {
    return next(
      new ErrorHandler("Please enter email & password", 400)
    );
  }

  // Find user and include password
  const user = await User.findOne({ email }).select("+password");

  console.log("User found:", !!user);

  if (!user) {
    console.log("LOGIN FAILED: USER NOT FOUND");

    return next(
      new ErrorHandler("Invalid Email or Password", 401)
    );
  }

  // Compare password
  const isPasswordMatched = await user.correctPassword(
    password,
    user.password
  );

  console.log("Password matched:", isPasswordMatched);

  if (!isPasswordMatched) {
    console.log("LOGIN FAILED: PASSWORD DOES NOT MATCH");

    return next(
      new ErrorHandler("Invalid Email or Password", 401)
    );
  }

  console.log("LOGIN SUCCESS");

  // Send JWT token
  sendToken(user, 200, res);
});

// =====================================================
// PROTECT ROUTES
// =====================================================

exports.protect = catchAsyncErrors(async (req, res, next) => {
  let token;

  // Get token from cookie
  if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  // If no token
  if (!token) {
    return next(
      new ErrorHandler(
        "Please login to access this resource",
        401
      )
    );
  }

  // Verify token
  const decoded = jwt.verify(
    token,
    process.env.JWT_SECRET
  );

  // Find user
  const user = await User.findById(decoded.id);

  if (!user) {
    return next(
      new ErrorHandler("User no longer exists", 401)
    );
  }

  // Check whether password was changed
  if (user.changedPasswordAfter(decoded.iat)) {
    return next(
      new ErrorHandler(
        "Password recently changed. Please login again",
        401
      )
    );
  }

  // Store user in request
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

  // Check required fields
  if (
    !name ||
    !email ||
    !password ||
    !passwordConfirm ||
    !phoneNumber
  ) {
    return next(
      new ErrorHandler(
        "Please enter all required fields",
        400
      )
    );
  }

  // Check password confirmation
  if (password !== passwordConfirm) {
    return next(
      new ErrorHandler(
        "Passwords do not match",
        400
      )
    );
  }

  // Check existing user
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    return next(
      new ErrorHandler(
        "User already exists with this email",
        400
      )
    );
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    passwordConfirm,
    phoneNumber,
  });

  // Login user after signup
  sendToken(user, 201, res);
});

// =====================================================
// FORGOT PASSWORD
// =====================================================

exports.forgotPassword = catchAsyncErrors(
  async (req, res, next) => {
    console.log(
      "========== FORGOT PASSWORD DEBUG =========="
    );

    const { email } = req.body;

    console.log("Email received:", email);

    // Check email
    if (!email) {
      console.log("NO EMAIL");

      return next(
        new ErrorHandler(
          "Please enter your email",
          400
        )
      );
    }

    console.log("Finding user...");

    // Find user
    const user = await User.findOne({ email });

    console.log("User found:", !!user);

    if (!user) {
      console.log("USER NOT FOUND");

      return next(
        new ErrorHandler(
          "There is no user with this email",
          404
        )
      );
    }

    console.log("Creating reset token...");

    // Create reset token
    const resetToken =
      user.createPasswordResetToken();

    console.log("Reset token created");

    // Save reset token
    await user.save({
      validateBeforeSave: false,
    });

    console.log("User saved with reset token");

    // Create reset URL
    const resetURL = `${
      process.env.FRONTEND_URL ||
      "http://localhost:5173"
    }/password/reset/${resetToken}`;

    console.log("RESET URL:", resetURL);

    try {
      console.log("Sending reset email...");

      // Send reset email
      await new Email(
        user,
        resetURL
      ).sendPasswordReset();

      console.log("RESET EMAIL SENT");

      return res.status(200).json({
        success: true,
        message: "Token sent to email",
      });
    } catch (err) {
      console.log("EMAIL ERROR:", err);

      // Remove reset token if email fails
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;

      await user.save({
        validateBeforeSave: false,
      });

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

    // Hash token from URL
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    // Find user with valid token
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: {
        $gt: Date.now(),
      },
    });

    if (!user) {
      return next(
        new ErrorHandler(
          "Token is invalid or has expired",
          400
        )
      );
    }

    const {
      password,
      passwordConfirm,
    } = req.body;

    // Check passwords
    if (!password || !passwordConfirm) {
      return next(
        new ErrorHandler(
          "Please enter password and password confirmation",
          400
        )
      );
    }

    // Check password confirmation
    if (password !== passwordConfirm) {
      return next(
        new ErrorHandler(
          "Passwords do not match",
          400
        )
      );
    }

    // Set new password
    user.password = password;
    user.passwordConfirm = passwordConfirm;

    // Remove reset token
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    // Save user
    await user.save();

    // Login user with new password
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

    const user = await User.findById(
      req.user.id
    );

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

    // Get current user with password
    const user = await User.findById(
      req.user.id
    ).select("+password");

    const {
      currentPassword,
      newPassword,
      passwordConfirm,
    } = req.body;

    // Check fields
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

    // Check current password
    const isPasswordMatched =
      await user.correctPassword(
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

    // Check new password confirmation
    if (newPassword !== passwordConfirm) {
      return next(
        new ErrorHandler(
          "New passwords do not match",
          400
        )
      );
    }

    // Set new password
    user.password = newPassword;
    user.passwordConfirm = passwordConfirm;

    // Save user
    await user.save();

    // Login again
    sendToken(user, 200, res);
  }
);

// =====================================================
// UPDATE PROFILE
// =====================================================

exports.updateProfile = catchAsyncErrors(
  async (req, res, next) => {

    const {
      name,
      email,
      phoneNumber,
    } = req.body;

    const user = await User.findById(
      req.user.id
    );

    if (!user) {
      return next(
        new ErrorHandler(
          "User not found",
          404
        )
      );
    }

    // Update fields
    if (name) {
      user.name = name;
    }

    if (email) {
      user.email = email;
    }

    if (phoneNumber) {
      user.phoneNumber = phoneNumber;
    }

    // Save user
    await user.save();

    res.status(200).json({
      success: true,
      user,
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