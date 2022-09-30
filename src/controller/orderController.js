const Order = require("../models/orderModels");
const ErrorHandeler = require("../../utils/errorHandeler");
const catchAssyncErrors = require("../../middleware/catchAssyncErrors");
const Product = require("../models/productModel");

// create new order
exports.createOrder = catchAssyncErrors(async (req, res, next) => {
    const {
        shippingInfo,
        orderItems,
        paymentInfo,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
    } = req.body;

    const order = await Order.create({
        shippingInfo,
        orderItems,
        paymentInfo,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
        paidAt: Date.now(),
        user: req.user._id,
    });

    res.status(201).json({
        success: true,
        order,
    });
});

// get single order
exports.getSingleOrder = catchAssyncErrors(async (req, res, next) => {
    const order = await Order.findById(req.params.id).populate(
        "user",
        "name email"
    );

    if (!order) {
        return next(new ErrorHandeler("Order not found", 404));
    }

    res.status(200).json({
        success: true,
        order,
    });
});

// get log in users oeder
exports.myOrders = catchAssyncErrors(async (req, res, next) => {
    const orders = await Order.find({ user: req.user.id });

    if (!orders) {
        return next(new ErrorHandeler("Order not found", 404));
    }

    res.status(200).json({
        success: true,
        orders,
    });
});

// get all orders --- admin
exports.getAllOrders = catchAssyncErrors(async (req, res, next) => {
    const orders = await Order.find();

    let totalAmount = 0;
    orders.forEach((order) => {
        totalAmount += order.totalPrice;
    });

    res.status(200).json({
        success: true,
        totalAmount,
        orders,
    });
});

// update order status --- admin
exports.updateOrderStatus = catchAssyncErrors(async (req, res, next) => {
    const order = await Order.findById(req.params.id);
    if (!order) {
        return next(new ErrorHandeler("Order not found", 404));
    }

    if (order.orderStatus === "Delivered") {
        return next(
            new ErrorHandeler("You are already delivered this order", 400)
        );
    }
    if (req.body.status === "Shipped") {
        order.orderItems.forEach(async (orderItem) => {
            await updateStock(orderItem.product, orderItem.quantity);
        });
    }

    order.orderStatus = req.body.status;
    if (req.body.status === "Delivered") order.deliveredAt = Date.now();

    await order.save({ validateBeforeSave: false });
    res.status(200).json({
        success: true,
        totalAmount: order.totalPrice,
        order,
    });
});

async function updateStock(id, quantity) {
    const product = await Product.findById(id);

    product.stock = product.stock - quantity;
    await product.save({ validateBeforeSave: false });
}

// delete order
exports.deleteOrder = catchAssyncErrors(async (req, res, next) => {
    const order = await Order.findById(req.params.id);
    if (!order) {
        return next(new ErrorHandeler("Order not found", 404));
    }
    await order.remove();

    res.status(200).json({
        success: true,
    });
});
