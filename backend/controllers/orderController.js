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
  console.log("User ID:", req.user?._id?.toString());

  if (!session_id) {
    return next(
      new ErrorHandler("Stripe session ID is required", 400)
    );
  }

  if (!req.user?._id) {
    return next(
      new ErrorHandler("Please login to place your order", 401)
    );
  }

  // 1. Retrieve the Stripe Checkout Session.
  const session = await stripe.checkout.sessions.retrieve(
    session_id,
    { expand: ["line_items"] }
  );

  console.log("Stripe session retrieved:", Boolean(session.id));
  console.log("Stripe payment status:", session.payment_status);

  // 2. Confirm that the payment succeeded.
  if (session.payment_status !== "paid") {
    return next(
      new ErrorHandler(
        "Stripe payment has not been completed",
        400
      )
    );
  }

  // 3. Verify the checkout belongs to the logged-in user.
  const checkoutUserId =
    session.metadata?.userId || session.client_reference_id;

  if (
    !checkoutUserId ||
    checkoutUserId.toString() !== req.user._id.toString()
  ) {
    return next(
      new ErrorHandler(
        "Unable to verify the owner of this payment",
        403
      )
    );
  }

  // 4. Prevent duplicate orders for the same Stripe payment.
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

  if (!paymentIntentId) {
    return next(
      new ErrorHandler(
        "Stripe payment reference is missing",
        400
      )
    );
  }

  const existingOrder = await Order.findOne({
    "paymentInfo.id": paymentIntentId,
  });

  if (existingOrder) {
    return res.status(200).json({
      success: true,
      order: existingOrder,
    });
  }

  // 5. Find the cart and restaurant.
  // Keep the cart items populated so we can map them to the
  // food-item IDs required by your existing order structure.
  const cart = await Cart.findOne({
    user: req.user._id,
  })
    .populate({
      path: "items.foodItem",
      select: "name price images",
    })
    .populate({
      path: "restaurant",
      select: "name",
    });

  if (!cart || !cart.items?.length || !cart.restaurant) {
    return next(
      new ErrorHandler(
        "Cart or restaurant not found. The order was not created.",
        404
      )
    );
  }

  // 6. Obtain the delivery address from Stripe.
  const address =
    session.shipping_details?.address ||
    session.customer_details?.address;

  if (!address) {
    return next(
      new ErrorHandler(
        "Delivery address is missing from Stripe",
        400
      )
    );
  }

  const deliveryInfo = {
    address: [address.line1, address.line2]
      .filter(Boolean)
      .join(" "),
    city: address.city || "",
    phoneNo: session.customer_details?.phone || "",
    postalCode: address.postal_code || "",
    country: address.country || "",
  };

  // 7. Check that Stripe returned purchased line items.
  const stripeItems = session.line_items?.data || [];

  if (!stripeItems.length) {
    return next(
      new ErrorHandler(
        "No purchased items found in Stripe session",
        400
      )
    );
  }

  // 8. Match the Stripe items with the cart items.
  // Stripe product names are compared with cart food-item names.
  // If any item cannot be matched, stop rather than save an
  // incomplete or incorrect order.
  const orderItems = [];

  for (const stripeItem of stripeItems) {
    const cartItem = cart.items.find(
      (item) =>
        item.foodItem &&
        item.foodItem.name === stripeItem.description
    );

    if (!cartItem) {
      return next(
        new ErrorHandler(
          `Could not match purchased item "${stripeItem.description}" with the cart`,
          400
        )
      );
    }

    if (
      Number(cartItem.quantity) !== Number(stripeItem.quantity)
    ) {
      return next(
        new ErrorHandler(
          `Quantity mismatch for "${stripeItem.description}". The order was not created.`,
          400
        )
      );
    }

    orderItems.push({
      name: cartItem.foodItem.name,
      quantity: stripeItem.quantity,
      image: cartItem.foodItem.images?.[0]?.url || "",
      price:
        stripeItem.price?.unit_amount != null
          ? stripeItem.price.unit_amount / 100
          : cartItem.foodItem.price,
      fooditem: cartItem.foodItem._id,
    });
  }

  // 9. Save the verified, paid order.
  const order = await Order.create({
    orderItems,
    deliveryInfo,
    paymentInfo: {
      id: paymentIntentId,
      status: session.payment_status,
    },
    deliveryCharge:
      (session.shipping_cost?.amount_total || 0) / 100,
    itemsPrice: (session.amount_subtotal || 0) / 100,
    finalTotal: (session.amount_total || 0) / 100,
    user: req.user._id,
    restaurant: cart.restaurant._id,
    paidAt: new Date(),
  });

  console.log(
    "ORDER SAVED SUCCESSFULLY:",
    order._id.toString()
  );

  // 10. Clear the cart only after the order has been saved.
  await Cart.findOneAndDelete({
    user: req.user._id,
  });

  return res.status(200).json({
    success: true,
    order,
  });
});

// ==================================================
// GET SINGLE ORDER
// => /api/v1/eats/orders/:id
// ==================================================
exports.getSingleOrder = catchAsyncErrors(
  async (req, res, next) => {
    const order = await Order.findById(req.params.id)
      .populate("user", "name email")
      .populate("restaurant")
      .exec();

    if (!order) {
      return next(
        new ErrorHandler(
          "No Order found with this ID",
          404
        )
      );
    }

    return res.status(200).json({
      success: true,
      order,
    });
  }
);

// ==================================================
// GET LOGGED-IN USER ORDERS
// => /api/v1/eats/orders/me/myOrders
// ==================================================
exports.myOrders = catchAsyncErrors(
  async (req, res, next) => {
    if (!req.user?._id) {
      return next(
        new ErrorHandler(
          "Please login to access your orders",
          401
        )
      );
    }

    const orders = await Order.find({
      user: req.user._id,
    })
      .populate("user", "name email")
      .populate("restaurant")
      .exec();

    return res.status(200).json({
      success: true,
      orders,
    });
  }
);

// ==================================================
// GET ALL ORDERS - ADMIN
// => /api/v1/eats/orders/admin/orders
// ==================================================
exports.allOrders = catchAsyncErrors(
  async (req, res, next) => {
    const orders = await Order.find()
      .populate("user", "name email")
      .populate("restaurant", "name")
      .exec();

    const totalAmount = orders.reduce(
      (total, order) => total + (order.finalTotal || 0),
      0
    );

    return res.status(200).json({
      success: true,
      totalAmount,
      orders,
    });
  }
);

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

    return res.status(200).json({
      success: true,
      order,
    });
  }
);
