const express = require("express");
const app = express();
const path = require("path");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const fileUpload = require("express-fileupload");
const cors = require("cors");

const aiRoutes = require("./routes/ai.routes");

const errorMiddleware = require("./middlewares/errors");

// ===============================
// CORS
// ===============================
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// ===============================
// Middleware
// ===============================
app.use(express.json({ limit: "30kb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "30kb" }));
app.use(cookieParser());
app.use(fileUpload());

// ===============================
// Import Routes
// ===============================
const foodRouter = require("./routes/foodItem");
const restaurant = require("./routes/restaurant");
const menuRouter = require("./routes/menu");
const coupon = require("./routes/couponRoutes");
const order = require("./routes/order");
const auth = require("./routes/auth");
const payment = require("./routes/payment");
const cart = require("./routes/cart");

// ===============================
// API Routes
// ===============================
app.use("/api/v1/eats", foodRouter);
app.use("/api/v1/eats/menus", menuRouter);
app.use("/api/v1/eats/stores", restaurant);
app.use("/api/v1/eats/orders", order);

app.use("/api/v1/users", auth);
app.use("/api/v1", payment);
app.use("/api/v1/coupon", coupon);
app.use("/api/v1/eats/cart", cart);

app.use("/api/v1/ai", aiRoutes);

// ===============================
// Pug
// ===============================
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

// ===============================
// 404 Handler
// ===============================
app.all("*", (req, res, next) => {
  res.status(404).json({
    status: "fail",
    message: `Can't find ${req.originalUrl} on this server!`,
  });
});

// ===============================
// Error Middleware
// ===============================
app.use(errorMiddleware);

module.exports = app;