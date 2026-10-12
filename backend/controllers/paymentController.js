
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const dotenv = require("dotenv");

dotenv.config({ path: "./config/config.env" });

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// ==================================================
// CREATE STRIPE CHECKOUT SESSION
// => /api/v1/payment/process
// ==================================================
exports.processPayment = catchAsyncErrors(async (req, res, next) => {
  console.log("PAYMENT REQUEST RECEIVED");
  console.log("User authenticated:", Boolean(req.user?._id));
  console.log("Cart items count:", req.body.items?.length);

  // Verify user authentication
  if (!req.user?._id || !req.user?.email) {
    return res.status(401).json({
      success: false,
      message: "Please log in before making a payment.",
    });
  }

  // Verify cart items
  if (!Array.isArray(req.body.items) || req.body.items.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Your cart is empty.",
    });
  }

  // Verify frontend URL
  if (!process.env.FRONTEND_URL) {
    return res.status(500).json({
      success: false,
      message: "Frontend URL is not configured.",
    });
  }

  const frontendUrl = process.env.FRONTEND_URL.replace(/\/+$/, "");

  // Create Stripe Checkout Session
  const session = await stripe.checkout.sessions.create({
    customer_email: req.user.email,

    client_reference_id: req.user._id.toString(),

    metadata: {
      userId: req.user._id.toString(),
    },

    phone_number_collection: {
      enabled: true,
    },

    line_items: req.body.items.map((item) => {
      const price = Number(item.foodItem?.price);
      const quantity = Number(item.quantity);

      if (
        !item.foodItem?.name ||
        !Number.isFinite(price) ||
        price <= 0 ||
        !Number.isInteger(quantity) ||
        quantity < 1
      ) {
        throw new Error("Invalid item or quantity in checkout.");
      }

      return {
        price_data: {
          currency: "inr",
          product_data: {
            name: item.foodItem.name,
          },
          unit_amount: Math.round(price * 100),
        },
        quantity,
      };
    }),

    mode: "payment",

    shipping_address_collection: {
      allowed_countries: ["US", "IN"],
    },

    shipping_options: [
      {
        shipping_rate_data: {
          display_name: "Delivery Charges",
          type: "fixed_amount",
          fixed_amount: {
            amount: 5500,
            currency: "inr",
          },
          delivery_estimate: {
            minimum: {
              unit: "hour",
              value: 1,
            },
            maximum: {
              unit: "hour",
              value: 3,
            },
          },
        },
      },
    ],

    // Stripe replaces this placeholder with the actual session ID.
    success_url:
      `${frontendUrl}/success?session_id={CHECKOUT_SESSION_ID}`,

    cancel_url: `${frontendUrl}/cart`,
  });

  // Safe diagnostic information; never log secret keys.
  console.log("Stripe session created:", Boolean(session.id));
  console.log("Stripe success URL:", session.success_url);

  return res.status(200).json({
    success: true,
    url: session.url,
  });
});

// ==================================================
// SEND STRIPE PUBLISHABLE API KEY
// => /api/v1/stripeapi
// ==================================================
exports.sendStripApi = catchAsyncErrors(async (req, res, next) => {
  if (!process.env.STRIPE_API_KEY) {
    return res.status(500).json({
      success: false,
      message: "Stripe publishable key is not configured.",
    });
  }

  return res.status(200).json({
    stripeApiKey: process.env.STRIPE_API_KEY,
  });
});
