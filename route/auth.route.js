const express = require("express");
const { register, login, profile , logout , uploadPhotos , uploadByLink , createPlace , getUserPlaces , getPlaceById , updatePlace , getAllPlaces , createBooking , getBookings} = require("../controller/auth.controller");

// Create a new router
const authRouter = express.Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.get("/profile", profile);
authRouter.post("/logout", logout);
authRouter.post("/upload-by-link", uploadByLink);
authRouter.get("/upload", uploadPhotos);
authRouter.post("/places", createPlace);
authRouter.get("/user-places", getUserPlaces);
authRouter.get("/places/:id", getPlaceById);
authRouter.put("/places", updatePlace);
authRouter.get("/places", getAllPlaces);
authRouter.post("/bookings", createBooking);
authRouter.get("/bookings", getBookings);

// Export the router
module.exports = authRouter;
