const Order = require("../models/order");
const Cart = require("../models/cartModel");
const { ObjectId } = require("mongodb");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const dotenv = require("dotenv");

// Setting up config file
dotenv.config({ path: "./config/config.env" });

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// ==================================================
// CREATE A NEW ORDER
// => /api/v1/order/new
// ==================================================
exports.newOrder = catchAsyncErrors(async (req, res, next) => {
  const { session_id } = req.body;

  const session = await stripe.checkout.sessions.retrieve(session_id, {
    expand: ["customer"],
  });

  const cart = await Cart.findOne({ user: req.user._id })
    .populate({
      path: "items.foodItem",
      select: "name price images",
    })
    .populate({
      path: "restaurant",
      select: "name",
    });

  if (!cart) {
    return next(new ErrorHandler("Cart not found", 404));
  }

  const deliveryInfo = {
    address:
      session.shipping_details.address.line1 +
      " " +
      session.shipping_details.address.line2,
    city: session.shipping_details.address.city,
    phoneNo: session.customer_details.phone,
    postalCode: session.shipping_details.address.postal_code,
    country: session.shipping_details.address.country,
  };

  const orderItems = cart.items.map((item) => ({
    name: item.foodItem.name,
    quantity: item.quantity,
    image: item.foodItem.images[0].url,
    price: item.foodItem.price,
    fooditem: item.foodItem._id,
  }));

  const paymentInfo = {
    id: session.payment_intent,
    status: session.payment_status,
  };

  const order = await Order.create({
    orderItems,
    deliveryInfo,
    paymentInfo,
    deliveryCharge: +session.shipping_cost.amount_subtotal / 100,
    itemsPrice: +session.amount_subtotal / 100,
    finalTotal: +session.amount_total / 100,
    user: req.user.id,
    restaurant: cart.restaurant._id,
    paidAt: Date.now(),
  });

  await Cart.findOneAndDelete({
    user: req.user._id,
  });

  res.status(200).json({
    success: true,
    order,
  });
});

// ==================================================
// GET SINGLE ORDER
// => /api/v1/orders/:id
// ==================================================
exports.getSingleOrder = catchAsyncErrors(async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate("user", "name email")
    .populate("restaurant")
    .exec();

  if (!order) {
    return next(
      new ErrorHandler("No Order found with this ID", 404)
    );
  }

  res.status(200).json({
    success: true,
    order,
  });
});

// ==================================================
// GET LOGGED-IN USER ORDERS
// => /api/v1/orders/me/myOrders
// ==================================================
exports.myOrders = catchAsyncErrors(async (req, res, next) => {
  const userId = new ObjectId(req.user.id);

  const orders = await Order.find({
    user: userId,
  })
    .populate("user", "name email")
    .populate("restaurant")
    .exec();

  res.status(200).json({
    success: true,
    orders,
  });
});

// ==================================================
// GET ALL ORDERS - ADMIN
// => /api/v1/eats/orders/admin/orders
// ==================================================
exports.allOrders = catchAsyncErrors(async (req, res, next) => {
  const orders = await Order.find()
    .populate("user", "name email")
    .populate("restaurant", "name");

  let totalAmount = 0;

  orders.forEach((order) => {
    totalAmount += order.finalTotal;
  });

  res.status(200).json({
    success: true,
    totalAmount,
    orders,
  });
});

// ==================================================
// UPDATE ORDER STATUS - ADMIN
// => /api/v1/eats/orders/admin/orders/:id
// ==================================================
exports.updateOrderStatus = catchAsyncErrors(
  async (req, res, next) => {
    const { status } = req.body;

    if (!status) {
      return next(
        new ErrorHandler(
          "Please provide order status",
          400
        )
      );
    }

    const allowedStatuses = [
      "Processing",
      "Shipped",
      "Delivered",
      "Cancelled",
    ];

    if (!allowedStatuses.includes(status)) {
      return next(
        new ErrorHandler(
          "Invalid order status",
          400
        )
      );
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return next(
        new ErrorHandler(
          "Order not found with this ID",
          404
        )
      );
    }

    order.orderStatus = status;

    await order.save();

    res.status(200).json({
      success: true,
      order,
    });
  }
);