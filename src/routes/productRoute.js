const express = require("express");
const {
    getAllProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    getSingleProduct,
    createProductReview,
    getAllReviewsOfAProduct,
    deleteProductReview,
    getAllAdminProducts,
} = require("../controller/productController");
const { isAuth, authRole } = require("../../middleware/auth");
const router = express.Router();

router.get("/products", getAllProduct);
router.get("/admin/products", isAuth, authRole("admin"), getAllAdminProducts);
router.get("/product/:id", getSingleProduct);
router.post("/admin/product/new", isAuth, authRole("admin"), createProduct);
router.put("/admin/product/:id", isAuth, authRole("admin"), updateProduct);
router.put("/review", isAuth, createProductReview);
router.delete("/admin/product/:id", isAuth, authRole("admin"), deleteProduct);
router.get("/reviews", getAllReviewsOfAProduct);
router.delete("/reviews", isAuth, deleteProductReview);

module.exports = router;
