const express = require('express');
const { createOrder,verifyOrder} = require('../controller/geu.controller');
// Import the controllers


// Create a new router
const userRouter = express.Router();

// Define the routes using authRouter, not router


userRouter.post('/geu/createOrder', createOrder);
userRouter.post('/geu/verifyOrder',verifyOrder)

// Export the router
module.exports = userRouter;