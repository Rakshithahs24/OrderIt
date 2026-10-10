
const dotenv = require("dotenv");

// Load environment variables first
dotenv.config({ path: "./config/config.env" });

console.log("FRONTEND URL:", process.env.FRONTEND_URL);

const app = require("./app");
const connectDatabase = require("./config/database");

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("ERROR:", err.stack || err.message);
  process.exit(1);
});

// Connect to database
connectDatabase();

// Start server
const server = app.listen(process.env.PORT, () => {
  console.log(
    `Server started on PORT: ${process.env.PORT} in ${
      process.env.NODE_ENV || "development"
    } mode.`
  );
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("ERROR:", err.message);

  server.close(() => {
    process.exit(1);
  });
});
