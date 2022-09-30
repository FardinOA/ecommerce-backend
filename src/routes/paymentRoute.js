const express = require("express");
const router = express.Router();
const { isAuth } = require("../../middleware/auth");
const {
    processPayment,
    sendStripeApiKey,
} = require("../controller/paymentController");
router.post("/payment/process", isAuth, processPayment);
router.get("/stripeapikey", isAuth, sendStripeApiKey);

module.exports = router;
