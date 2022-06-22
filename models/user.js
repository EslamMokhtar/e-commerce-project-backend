const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
  },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  admin: { type: Boolean, default: false },
  verified: { type: Boolean, default: false },
  resetToken: { type: String, required: false },
  status: { type: String, default: "active" },
  reviews: [{ type: mongoose.Types.ObjectId, required: true, ref: "Review" }],
  orders: [{ type: mongoose.Types.ObjectId, required: true, ref: "Order" }],
});

module.exports = mongoose.model("User", userSchema);
