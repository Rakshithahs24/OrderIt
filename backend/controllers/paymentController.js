
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const dotenv = require("dotenv");

dotenv.config({ path: "./config/config.env" });

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// Create Stripe Checkout session
exports.processPayment = catchAsyncErrors(async (req, res, next) => {
  console.log("PAYMENT REQUEST RECEIVED");
  console.log("User email present:", Boolean(req.user?.email));
  console.log("Cart items count:", req.body.items?.length);

  if (!req.body.items || req.body.items.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Your cart is empty.",
    });
  }

  if (!process.env.FRONTEND_URL) {
    return res.status(500).json({
      success: false,
      message: "Frontend URL is not configured.",
    });
  }

  const session = await stripe.checkout.sessions.create({
    customer_email: req.user.email,

    phone_number_collection: {
      enabled: true,
    },

    line_items: req.body.items.map((item) => ({
      price_data: {
        currency: "inr",
        product_data: {
          name: item.foodItem.name,
        },
        unit_amount: Math.round(Number(item.foodItem.price) * 100),
      },
      quantity: item.quantity,
    })),

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
            minimum: { unit: "hour", value: 1 },
            maximum: { unit: "hour", value: 3 },
          },
        },
      },
    ],

    success_url:
      `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,

    cancel_url: `${process.env.FRONTEND_URL}/cart`,
  });

  // Diagnostic logs: never log secret keys or payment details.
  console.log("Stripe session created:", Boolean(session.id));
  console.log("Stripe success URL:", session.success_url);

  return res.status(200).json({
    success: true,
    url: session.url,
  });
});

// Send Stripe publishable API key
exports.sendStripApi = catchAsyncErrors(async (req, res, next) => {
  return res.status(200).json({
    stripeApiKey: process.env.STRIPE_API_KEY,
  });
});
