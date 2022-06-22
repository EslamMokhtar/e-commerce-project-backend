const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  title: { type: String, required: true },
  price: { type: Number, required: true },
  images: {
    links: [{ type: String, required: true }],
    imageFolder: { type: String, required: true },
  },
  description: { type: String, required: false },
  stock: {
    outOfStock: { type: Boolean, required: true, default: false },
    quantity: { type: Number, required: true },
  },
  overallRating: { type: Number, required: false },
  reviews: [{ type: mongoose.Types.ObjectId, required: true, ref: "Review" }],
  category: { type: mongoose.Types.ObjectId, required: true, ref: "Category" },
});

module.exports = mongoose.model("Product", productSchema);
