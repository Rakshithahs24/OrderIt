const express = require("express");
const router = express.Router();

const {
  newOrder,
  getSingleOrder,
  myOrders,
  allOrders,
  updateOrderStatus,
} = require("../controllers/orderController");

const authController = require("../controllers/authController");
const { authorizeRoles } = require("../middlewares/authorizeRoles");

// ==================================================
// CREATE NEW ORDER
// ==================================================
router
  .route("/new")
  .post(authController.protect, newOrder);

// ==================================================
// ADMIN - GET ALL ORDERS
// ==================================================
router
  .route("/admin/orders")
  .get(
    authController.protect,
    authorizeRoles("admin"),
    allOrders
  );

// ==================================================
// ADMIN - UPDATE ORDER STATUS
// ==================================================
router
  .route("/admin/orders/:id")
  .put(
    authController.protect,
    authorizeRoles("admin"),
    updateOrderStatus
  );

// ==================================================
// GET LOGGED-IN USER ORDERS
// ==================================================
router
  .route("/me/myOrders")
  .get(
    authController.protect,
    myOrders
  );

// ==================================================
// GET SINGLE ORDER
// ==================================================
router
  .route("/:id")
  .get(
    authController.protect,
    getSingleOrder
  );

module.exports = router;