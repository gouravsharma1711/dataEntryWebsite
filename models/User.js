const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  enrollmentNumber: String,
  branch: String,
  image: String, // Store base64-encoded image or file path
  lastAttendance: Date, // To track last attendance time
});

module.exports = mongoose.model("User", userSchema);
