
const Order = require("../models/order");
const Cart = require("../models/cartModel");
const { ObjectId } = require("mongodb");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const dotenv = require("dotenv");

dotenv.config({ path: "./config/config.env" });

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// ==================================================
// CREATE A NEW ORDER
// => /api/v1/eats/orders/new
// ==================================================
exports.newOrder = catchAsyncErrors(async (req, res, next) => {
  const { session_id } = req.body;

  console.log("NEW ORDER REQUEST RECEIVED");
  console.log("Session ID present:", Boolean(session_id));
  console.log("User ID:", req.user?._id);

  if (!session_id) {
    return next(new ErrorHandler("Stripe session ID is required", 400));
  }

  if (!req.user?._id) {
    return next(
      new ErrorHandler("Please login to place your order", 401)
    );
  }

  // Retrieve the Checkout Session from Stripe
  const session = await stripe.checkout.sessions.retrieve(session_id);

  console.log("Stripe session retrieved:", Boolean(session.id));
  console.log("Stripe payment status:", session.payment_status);

  // Verify payment before creating an order
  if (session.payment_status !== "paid") {
    return next(
      new ErrorHandler("Stripe payment has not been completed", 400)
    );
  }

  // Prevent duplicate orders for the same Stripe payment
  const existingOrder = await Order.findOne({
    "paymentInfo.id": session.payment_intent,
  });

  if (existingOrder) {
    return res.status(200).json({
      success: true,
      order: existingOrder,
    });
  }

  // Ensure the session belongs to this user if metadata is configured
  if (
    session.metadata?.userId &&
    session.metadata.userId.toString() !== req.user._id.toString()
  ) {
    return next(
      new ErrorHandler("This payment belongs to another user", 403)
    );
  }

  // Get the logged-in user's cart
  const cart = await Cart.findOne({ user: req.user._id })
    .populate({
      path: "items.foodItem",
      select: "name price images",
    })
    .populate({
      path: "restaurant",
      select: "name",
    });

  if (!cart || !cart.items?.length || !cart.restaurant) {
    return next(new ErrorHandler("Cart or restaurant not found", 404));
  }

  // Obtain delivery address from Stripe
  const address =
    session.shipping_details?.address ||
    session.customer_details?.address;

  if (!address) {
    return next(
      new ErrorHandler("Delivery address is missing from Stripe", 400)
    );
  }

  const deliveryInfo = {
    address: [address.line1, address.line2].filter(Boolean).join(" "),
    city: address.city || "",
    phoneNo: session.customer_details?.phone || "",
    postalCode: address.postal_code || "",
    country: address.country || "",
  };

  // Prepare order items
  const orderItems = cart.items.map((item) => {
    if (!item.foodItem) {
      throw new Error("A food item in your cart could not be found");
    }

    return {
      name: item.foodItem.name,
      quantity: item.quantity,
      image: item.foodItem.images?.[0]?.url || "",
      price: item.foodItem.price,
      fooditem: item.foodItem._id,
    };
  });

  // Save the order
  const order = await Order.create({
    orderItems,
    deliveryInfo,
    paymentInfo: {
      id: session.payment_intent,
      status: session.payment_status,
    },
    deliveryCharge: (session.shipping_cost?.amount_total || 0) / 100,
    itemsPrice: (session.amount_subtotal || 0) / 100,
    finalTotal: session.amount_total / 100,
    user: req.user._id,
    restaurant: cart.restaurant._id,
    paidAt: new Date(),
  });

  // Clear the cart only after the order has been saved
  await Cart.findOneAndDelete({ user: req.user._id });

  console.log("ORDER SAVED SUCCESSFULLY:", order._id.toString());

  return res.status(200).json({
    success: true,
    order,
  });
});

// ==================================================
// GET SINGLE ORDER
// => /api/v1/eats/orders/:id
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
// => /api/v1/eats/orders/me/myOrders
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

  const totalAmount = orders.reduce(
    (total, order) => total + (order.finalTotal || 0),
    0
  );

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
        new ErrorHandler("Please provide order status", 400)
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
        new ErrorHandler("Invalid order status", 400)
      );
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return next(
        new ErrorHandler("Order not found with this ID", 404)
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
