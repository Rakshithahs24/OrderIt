
const mongoose = require("mongoose");

const connectDatabase = async () => {
  try {
    const mongoUri = process.env.DB_LOCAL_URI;

    if (!mongoUri) {
      throw new Error("DB_LOCAL_URI is missing from environment variables");
    }

    const connection = await mongoose.connect(mongoUri);

    console.log(
      `MongoDB connected successfully: ${connection.connection.host}`
    );
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDatabase;
