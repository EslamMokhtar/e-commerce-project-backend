require("dotenv").config();
const bodyParser = require("body-parser");
const express = require("express");
const cors = require("cors");
const HttpError = require("./models/http-error");
const userRoutes = require("./routes/user-routes");
const productRoutes = require("./routes/product-routes");
const reviewRoutes = require("./routes/review-routes");
const orderRoutes = require("./routes/order-routes");

const app = express();

app.use(bodyParser.json());
app.use(cors());

app.use("/api/user", userRoutes);
app.use("/api/review", reviewRoutes);
app.use("/api/product", productRoutes);
app.use("/api/order", orderRoutes);

app.use((req, res, next) => {
  throw new HttpError("Could not find this route.", 404);
});
app.use((error, req, res, next) => {
  if (res.headerSent) {
    return next(error);
  }
  res.status(error.code || 500);
  res.json({ message: error.message || "An unknown error occured!" });
});

app.listen(process.env.PORT || 5000);
