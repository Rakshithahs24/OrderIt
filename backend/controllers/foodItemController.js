

const Fooditem = require("../models/foodItem");
const Menu = require("../models/menu");
const ErrorHandler = require("../utils/errorHandler");
const catchAsync = require("../middlewares/catchAsyncErrors");
const APIFeatures = require("../utils/apiFeatures");

// Get all food items, optionally filtered by restaurant
exports.getAllFoodItems = catchAsync(async (req, res, next) => {
  const filter = {};

  if (req.params.storeId) {
    filter.restaurant = req.params.storeId;
  }

  const foodItems = await Fooditem.find(filter).populate("restaurant");

  res.status(200).json({
    status: "success",
    results: foodItems.length,
    data: foodItems,
  });
});

// Create a food item and automatically link it to the restaurant menu
exports.createFoodItem = catchAsync(async (req, res, next) => {
  const body = { ...req.body };

  // Convert imageUrl into the images array when provided
  if (body.imageUrl) {
    body.images = [
      {
        public_id: "default",
        url: body.imageUrl,
      },
    ];

    delete body.imageUrl;
  }

  // A restaurant ID is required
  if (!body.restaurant) {
    return next(
      new ErrorHandler("Restaurant ID is required", 400)
    );
  }

  // Find the existing menu for this restaurant
  const menu = await Menu.findOne({
    restaurant: body.restaurant,
  });

  if (!menu) {
    return next(
      new ErrorHandler("Menu not found for this restaurant", 404)
    );
  }

  // Associate the new food item with the menu
  body.menu = menu._id;

  // Create the food item
  const fooditem = await Fooditem.create(body);

  try {
    // Use the selected category, or Main Course as the default
    const categoryName = body.category || "Main Course";

    let category = menu.menu.find(
      (item) => item.category === categoryName
    );

    if (!category) {
      menu.menu.push({
        category: categoryName,
        items: [fooditem._id],
      });
    } else {
      const alreadyExists = category.items.some(
        (id) => id.toString() === fooditem._id.toString()
      );

      if (!alreadyExists) {
        category.items.push(fooditem._id);
      }
    }

    await menu.save();
  } catch (error) {
    // Roll back the food item if linking it to the menu fails
    await Fooditem.findByIdAndDelete(fooditem._id);
    throw error;
  }

  res.status(201).json({
    status: "success",
    data: fooditem,
  });
});

// Get one food item
exports.getFoodItem = catchAsync(async (req, res, next) => {
  const foodItem = await Fooditem.findById(req.params.foodId);

  if (!foodItem) {
    return next(
      new ErrorHandler("No foodItem found with that ID", 404)
    );
  }

  res.status(200).json({
    status: "success",
    data: foodItem,
  });
});

// Update a food item
exports.updateFoodItem = catchAsync(async (req, res, next) => {
  const foodItem = await Fooditem.findByIdAndUpdate(
    req.params.foodId,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!foodItem) {
    return next(
      new ErrorHandler("No document found with that ID", 404)
    );
  }

  res.status(200).json({
    status: "success",
    data: foodItem,
  });
});

// Delete a food item and remove its references from menus
exports.deleteFoodItem = catchAsync(async (req, res, next) => {
  const foodItem = await Fooditem.findById(req.params.foodId);

  if (!foodItem) {
    return next(
      new ErrorHandler("No document found with that ID", 404)
    );
  }

  // Remove the food item from every menu category first
  await Menu.updateMany(
    {},
    {
      $pull: {
        "menu.$[].items": foodItem._id,
      },
    }
  );

  await Fooditem.findByIdAndDelete(foodItem._id);

  res.status(204).json({
    status: "success",
  });
});