const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const User = require("../models/user");
const Product = require("../models/product");
const Review = require("../models/review");
const HttpError = require("../models/http-error");

const url = process.env.DB_URL;
mongoose.connect(url).then(() => console.log("Connected!"));

const addReview = async (req, res, next) => {
  const { review, uid, pid, rate } = req.body;
  let result;
  try {
    const creator = await User.findOne({ _id: mongoose.Types.ObjectId(uid) });
    const product = await Product.findOne({
      _id: mongoose.Types.ObjectId(pid),
    });

    const newReview = new Review({
      creator: mongoose.Types.ObjectId(creator),
      product: mongoose.Types.ObjectId(product),
      review,
      rate,
    });

    creator.reviews.push(newReview);
    product.reviews.push(newReview);
    result = await newReview.save();
    const avg = await Review.aggregate([
      { $match: { product: product._id } },
      { $group: { _id: null, val: { $avg: "$rate" } } },
    ]);
    console.log(avg[0])
    product.overallRating = avg[0].val.toFixed(1);
    await creator.save();
    await product.save();
  } catch (err) {
    const error = new HttpError(
      "Can't submit the review, please try again",
      500
    );
    return next(error);
  }
  res.status(201).json({ result });
};

const getReview = async (req, res, next) => {
  const { pid } = req.params;
  let hasProduct;
  try {
    hasProduct = await Product.findOne({
      _id: mongoose.Types.ObjectId(pid),
    });
  } catch (err) {
    const error = new HttpError("Wrong id", 401);
    return next(error);
  }
  if (!hasProduct) {
    const error = new HttpError("Can't find the product", 401);
    return next(error);
  }
  let result;
  try {
    result = await Review.find({
      product: mongoose.Types.ObjectId(pid),
    }).populate("creator", "name");
  } catch (err) {
    const error = new HttpError("Can't find reviews, please try again", 500);
    return next(error);
  }
  res.status(201).json({ result });
};

exports.addReview = addReview;
exports.getReview = getReview;
