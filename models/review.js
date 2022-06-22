const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    creator: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
    product: { type: mongoose.Types.ObjectId, required: true, ref: "Product" },
    review: { type: String, required: false },
    rate: { type: Number, required: true },
  },
  { timestamps: { createdAt: "createdAt" } }
);

module.exports = mongoose.model("Review", reviewSchema);
