const Fooditem = require("../models/foodItem");
const Restaurant = require("../models/restaurant");
const Menu = require("../models/menu");

const dotenv = require("dotenv");
const connectDatabase = require("../config/database");

const fooditems = require("../data/foodItem.json");
const restaurants = require("../data/restaurant.json");

dotenv.config({ path: "./config/config.env" });

connectDatabase();

const seedData = async () => {
  try {
    // Delete old data
    await Fooditem.deleteMany();
    await Menu.deleteMany();
    await Restaurant.deleteMany();

    console.log("Old data deleted");

    // Create restaurants
    const createdRestaurants = await Restaurant.insertMany(restaurants);

    console.log(
      `${createdRestaurants.length} Restaurants are added.`
    );

    // Create menus and food items for every restaurant
    for (const restaurant of createdRestaurants) {
      const menu = await Menu.create({
        restaurant: restaurant._id,
        menu: [
          {
            category: "Main Course",
            items: [],
          },
        ],
      });

      // Create food items for this restaurant
      const foodItemsForRestaurant = fooditems.map((item) => ({
        ...item,
        restaurant: restaurant._id,
        menu: menu._id,
      }));

      const createdFoodItems = await Fooditem.insertMany(
        foodItemsForRestaurant
      );

      // Add all food item IDs to Main Course
      menu.menu[0].items = createdFoodItems.map(
        (item) => item._id
      );

      await menu.save();
    }

    console.log("Menus and Food Items are added successfully.");

    process.exit();
  } catch (error) {
    console.log("SEED ERROR:", error.message);
    process.exit(1);
  }
};

seedData();