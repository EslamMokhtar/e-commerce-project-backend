const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const User = require("../models/user");
const Product = require("../models/product");
const Order = require("../models/order");
const HttpError = require("../models/http-error");

const url = process.env.DB_URL;
mongoose.connect(url).then(() => console.log("Connected!"));

const submitOrder = async (req, res, next) => {
  res.status(201).json({ message: "hi" });
};

const getOrders = async (req, res, next) => {
  const uid = req.params.uid;
  let orders;
  //   if (req.userData.admin) {
  //     try {
  //       orders = await Order.find({})
  //         .sort({ createdAt: -1 })
  //         .populate("creator", "name email");
  //     } catch (err) {
  //       const error = new HttpError("Can't get orders", 500);
  //       return next(error);
  //     }

  //     return res.status(200).json({ orders });
  //   }

  try {
    orders = await Order.find({ creator: uid })
      .sort({ createdAt: -1 })
      .populate("creator", "name email");
  } catch (err) {
    const error = new HttpError("Can't get order", 500);
    return next(error);
  }
  res.status(200).json({ orders });
};

exports.submitOrder = submitOrder;
exports.getOrders = getOrders;
