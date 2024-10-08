const { ObjectId } = require("mongodb");
const { getDb } = require("../db/db");
const moment = require("moment");
const {sendTemplatedEmail} = require('../SES/ses.js')



const userDetails = async (req, res) => {
  try {
    const user = req.user;

    return res.status(200).json({
      message: "User details",
      data: user,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || error,
      error: true,
    });
  }
};

const getUserDetails = async (req, res) => {
  try {
    const db = getDb();
    const userId = req.params; // Get the user ID from the URL parameter

    // Validate the ObjectId
    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({
        message: "Invalid user ID format.",
      });
    }

    // Fetch user details from the database
    const user = await db.collection("users").findOne(
      { _id: new ObjectId(userId) },
      {
        projection: { appointments: 0, clientHistory: 0 },
      }
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    return res.status(200).json({
      message: "User details retrieved successfully.",
      data: user,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.toString(),
    });
  }
};


module.exports = {
  userDetails,
  getUserDetails,

};
