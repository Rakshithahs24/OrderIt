
const Fooditem = require("../models/foodItem");
const Menu = require("../models/menu");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");

// Get all food items for a restaurant
exports.getAllFoodItems = catchAsyncErrors(async (req, res, next) => {
  const foodItems = await Fooditem.find({
    restaurant: req.params.storeId,
  }).populate("restaurant");

  res.status(200).json({
    success: true,
    data: foodItems,
  });
});

// Create a food item
exports.createFoodItem = catchAsyncErrors(async (req, res, next) => {
  const body = { ...req.body };

  // Convert the image URL from the admin form into the model format
  if (body.imageUrl) {
    body.images = [
      {
        public_id: "default",
        url: body.imageUrl,
      },
    ];
    delete body.imageUrl;
  }

  const fooditem = await Fooditem.create(body);

  res.status(201).json({
    success: true,
    data: fooditem,
  });
});

// Get one food item
exports.getFoodItem = catchAsyncErrors(async (req, res, next) => {
  const fooditem = await Fooditem.findById(req.params.foodId)
    .populate("restaurant");

  if (!fooditem) {
    return next(new ErrorHandler("Food item not found", 404));
  }

  res.status(200).json({
    success: true,
    data: fooditem,
  });
});

// Update a food item
exports.updateFoodItem = catchAsyncErrors(async (req, res, next) => {
  const body = { ...req.body };

  if (body.imageUrl) {
    body.images = [
      {
        public_id: "default",
        url: body.imageUrl,
      },
    ];
    delete body.imageUrl;
  }

  let fooditem = await Fooditem.findById(req.params.foodId);

  if (!fooditem) {
    return next(new ErrorHandler("Food item not found", 404));
  }

  fooditem = await Fooditem.findByIdAndUpdate(
    req.params.foodId,
    body,
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    success: true,
    data: fooditem,
  });
});

// Delete a food item
exports.deleteFoodItem = catchAsyncErrors(async (req, res, next) => {
  const fooditem = await Fooditem.findById(req.params.foodId);

  if (!fooditem) {
    return next(new ErrorHandler("Food item not found", 404));
  }

  await Fooditem.findByIdAndDelete(req.params.foodId);

  // Remove this food item from every menu category
  await Menu.updateMany(
    {},
    {
      $pull: {
        "menu.$[].items": fooditem._id,
      },
    }
  );

  res.status(200).json({
    success: true,
    message: "Food item deleted successfully",
  });
});
