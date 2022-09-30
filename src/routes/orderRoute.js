const express = require("express");
const router = express.Router();
const { isAuth, authRole } = require("../../middleware/auth");
const {
    createOrder,
    getSingleOrder,
    myOrders,
    getAllOrders,
    updateOrderStatus,
    deleteOrder,
} = require("../controller/orderController");

router.post("/order/new", isAuth, createOrder);
router.get("/orders/me", isAuth, myOrders);
router.get("/order/:id", isAuth, getSingleOrder);
router.get("/admin/orders", isAuth, authRole("admin"), getAllOrders);
router.put("/admin/order/:id", isAuth, authRole("admin"), updateOrderStatus);
router.delete("/admin/order/:id", isAuth, authRole("admin"), deleteOrder);

module.exports = router;
