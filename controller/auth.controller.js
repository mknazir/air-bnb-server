const { getDb } = require("../db/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const env = require("dotenv");
const { ObjectId } = require("mongodb");
const imageDownloader = require('image-downloader');
const {S3Client, PutObjectCommand} = require('@aws-sdk/client-s3');
const fs = require('fs');
const mime = require('mime-types');
const { generateSignedUrl } = require("../S3/s3");
env.config();

const bcryptSalt = 10; // Define the bcrypt salt rounds
const jwtSecret = process.env.JWT_SECRET_KEY

const register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const db = getDb();

    // Hash the password
    const hashedPassword = bcrypt.hashSync(password, bcryptSalt);

    // Create a new user document
    const newUser = {
      name,
      email,
      password: hashedPassword,
      createdAt: new Date(), // Add timestamps for consistency
      updatedAt: new Date(),
    };

    // Insert the user into the database
    const result = await db.collection("users").insertOne(newUser);

    // Generate a JWT token
    const token = jwt.sign(
      { id: result.insertedId },
      process.env.JWT_SECRET_KEY
    );

    // Prepare the response object with the user's details
    const user = {
      token,
      name: newUser.name,
      email: newUser.email,
    };

    // Respond with a success message and the user data
    return res.status(201).json({ message: "User registered successfully", user });
  } catch (error) {
    console.error("Error registering user:", error);

    // Handle validation errors (like duplicate email)
    if (error.code === 11000) {
      return res.status(422).json({ message: "Email already exists" });
    }

    // Respond with a generic server error message
    return res.status(500).json({ message: "Server error" });
  }
};

const login = async (req, res) => {
  try {
    const db = getDb(); // Connect to the database
    const { email, password } = req.body;

    // Check if the email exists in the database
    const userDoc = await db.collection("users").findOne({ email });

    if (!userDoc) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify the password
    const passOk = bcrypt.compareSync(password, userDoc.password);

    if (!passOk) {
      return res.status(422).json({ message: "Incorrect password" });
    }

    // Generate a JWT token
    const token = jwt.sign(
      { email: userDoc.email, id: userDoc._id },
      jwtSecret,
      { expiresIn: "1d" } // Set token expiry to 1 day
    );

    // Set the token in a cookie and send the user data
    res
      .cookie("token", token, {
        httpOnly: true, // Prevents client-side access to the cookie
        sameSite: "strict", // Ensures the cookie is sent only for same-site requests
      })
      .status(200)
      .json({
        message: "Login successful",
        user: {
          id: userDoc._id,
          name: userDoc.name,
          email: userDoc.email,
        },
      });
  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

const profile = async (req, res) => {
  const { token } = req.cookies;

  try {
    if (!token) {
      return res.json(null);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const db = getDb();
    const user = await db.collection("users").findOne({ _id: new ObjectId(decoded.id) });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { name, email, _id } = user;
    res.json({ name, email, _id });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const logout = (req, res) => {
  res.cookie("token", "").json({ message: "Logged out successfully" });
};

const uploadByLink = async (req, res) => {
  const { link } = req.body;
  const newName = `photo${Date.now()}.jpg`;

  try {
    await imageDownloader.image({
      url: link,
      dest: `/tmp/${newName}`,
    });

    const url = await uploadToS3(`/tmp/${newName}`, newName, mime.lookup(`/tmp/${newName}`));
    res.json({ url });
  } catch (error) {
    console.error("Error uploading by link:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const uploadPhotos = async (req, res) => {
  try {
    const result = await generateSignedUrl();
    console.log("res", result);
    return res.status(200).json({
      message: "Get URL successfully.",
      data: result,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.toString(),
    });
  }
};

const createPlace = async (req, res) => {
  const { token } = req.cookies;
  if (!token) {
    return res.status(401).json({ message: "Token is missing" });
  }
  const {
    title,
    address,
    addedPhotos,
    description,
    price,
    perks,
    extraInfo,
    checkIn,
    checkOut,
    maxGuests,
  } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const db = getDb();
    const place = await db.collection("places").insertOne({
      owner: new ObjectId(decoded.id),
      title,
      address,
      photos: addedPhotos,
      description,
      price,
      perks,
      extraInfo,
      checkIn,
      checkOut,
      maxGuests,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    res.status(201).json({ message: "Place created successfully", place });
  } catch (error) {
    console.error("Error creating place:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getUserPlaces = async (req, res) => {
  const { token } = req.cookies;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const db = getDb();
    const places = await db.collection("places").find({ owner: new ObjectId(decoded.id) }).toArray();

    res.json({ places });
  } catch (error) {
    console.error("Error fetching user places:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getPlaceById = async (req, res) => {
  const { id } = req.params;

  try {
    const db = getDb();
    const place = await db.collection("places").findOne({ _id: new ObjectId(id) });

    if (!place) {
      return res.status(404).json({ message: "Place not found" });
    }

    res.json({ place });
  } catch (error) {
    console.error("Error fetching place by ID:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const updatePlace = async (req, res) => {
  const { token } = req.cookies;
  const {
    id,
    title,
    address,
    addedPhotos,
    description,
    perks,
    extraInfo,
    checkIn,
    checkOut,
    maxGuests,
    price,
  } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const db = getDb();

    const place = await db.collection("places").findOne({ _id: new ObjectId(id) });

    if (!place || place.owner.toString() !== decoded.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await db.collection("places").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          title,
          address,
          photos: addedPhotos,
          description,
          perks,
          extraInfo,
          checkIn,
          checkOut,
          maxGuests,
          price,
          updatedAt: new Date(),
        },
      }
    );

    res.json({ message: "Place updated successfully" });
  } catch (error) {
    console.error("Error updating place:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getAllPlaces = async (req, res) => {
  try {
    const db = getDb();
    const places = await db.collection("places").find().toArray();
    res.json({ places });
  } catch (error) {
    console.error("Error fetching all places:", error);
    res.status(500).json({ message: "Server error" });
  }
};

function getUserDataFromReq(req) {
  return new Promise((resolve, reject) => {
    jwt.verify(req.cookies.token, jwtSecret, {}, async (err, userData) => {
      if (err) throw err;
      resolve(userData);
    });
  });
}

const createBooking = async (req, res) => {
  const userData = await getUserDataFromReq(req);
  const { place, checkIn, checkOut, numberOfGuests, name, phone, price } = req.body;

  try {
    const db = getDb();
    const result = await db.collection("bookings").insertOne({
      place,
      checkIn,
      checkOut,
      numberOfGuests,
      name,
      phone,
      price,
      user: new ObjectId(userData.id),
      createdAt: new Date(),
    });

    res.status(201).json({
      message: "Booking created successfully",
      booking: {
        _id: result.insertedId, // MongoDB automatically generates the _id
        place,
        checkIn,
        checkOut,
        numberOfGuests,
        name,
        phone,
        price,
        user: userData.id,
        createdAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getBookings = async (req, res) => {
  try {
    // Fetch user data from the request
    const userData = await getUserDataFromReq(req);
    if (!userData || !userData.id) {
      return res.status(401).json({ message: "Unauthorized: User not authenticated" });
    }

    const db = getDb();

    // Retrieve bookings for the authenticated user
    const bookings = await db
      .collection("bookings")
      .find({ user: new ObjectId(userData.id) }) // Filter bookings by user ID
      .toArray();

    res.status(200).json({ message: "Bookings retrieved successfully", bookings });
  } catch (error) {
    console.error("Error retrieving bookings:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { register , login , profile , logout , uploadByLink , uploadPhotos , createPlace , getUserPlaces , getPlaceById , updatePlace , getAllPlaces , createBooking , getBookings};