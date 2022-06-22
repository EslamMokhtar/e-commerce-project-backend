const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const checkAuth = require("../middleware/check-auth");
const productControllers = require("../controllers/product-controllers");
const multer = require("multer");

const storage = multer.memoryStorage({
  destination: (req, file, callback) => {
    callback(null, "");
  },
});
const upload = multer({ storage }).array("images", 5);

router.post(
  "/search",
  [check("searchString").not().isEmpty()],
  productControllers.searchProducts
);
router.get("/get-products", productControllers.getProducts);
router.get("/category/:category", productControllers.getCategory);
router.get("/:pid", productControllers.getProduct);
router.use(checkAuth);
router.post(
  "/add",
  upload,
  [
    check("title").not().isEmpty(),
    check("categoryName").not().isEmpty(),
    check("quantity").not().isEmpty(),
    check("quantity").isNumeric(),
    check("price").not().isEmpty(),
    check("price").isNumeric(),
  ],
  productControllers.addProduct
);
router.delete("/:pid", productControllers.deleteProduct);
router.put(
  "/:pid",
  upload,
  [
    check("title").not().isEmpty(),
    check("quantity").not().isEmpty(),
    check("quantity").isNumeric(),
    check("price").not().isEmpty(),
    check("price").isNumeric(),
  ],
  productControllers.editProduct
);

module.exports = router;
