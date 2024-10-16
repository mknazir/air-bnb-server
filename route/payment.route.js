const express = require('express');
const authenticateToken = require('../middleware/authToken.middleware');
const { createOrder, verifyOrder,createPaymentLink,handleWebhook, applyCouponCode } = require('../controller/payment.controller');


const paymentRouter = express.Router();

paymentRouter.post('/payment/createOrder', authenticateToken, createOrder);
paymentRouter.post('/payment/verifyOrder', authenticateToken, verifyOrder);
paymentRouter.post('/payment/applyCouponCode', authenticateToken, applyCouponCode);
paymentRouter.post('/payment/createPaymentLink', authenticateToken, createPaymentLink);
paymentRouter.post('/payment/webhook', authenticateToken, handleWebhook);

module.exports = paymentRouter;