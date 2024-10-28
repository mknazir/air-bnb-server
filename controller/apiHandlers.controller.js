const { ObjectId } = require("mongodb");
const { getDb } = require("../db/db");
// const validator = require("validator");
const { sendSMS } = require("../SNS/sns");
const { sendTemplatedEmail } = require("../SES/ses");
const { generateSignedUrl } = require("../S3/s3");
const jwt = require("jsonwebtoken");

// Function to generate OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000);

// API to validate OTP
const validateOTP = async (req, res) => {
  console.log("Request received with body:", req.body);

  try {
    const db = getDb();
    const { email, phoneNumber, otp } = req.body;
    console.log(req.body);

    // Validate input: OTP, role, and either email or phoneNumber are required
    if (!otp || (!email && !phoneNumber)) {
      return res.status(400).json({
        message:
          "OTP, and either email or phone number are required (not both).",
        error: true,
      });
    }

    const collection = await db.collection("users");
    const user = await collection.findOne({
      $or: [
        email ? { email: email } : null,
        phoneNumber ? { phone_number: phoneNumber } : null,
      ].filter(Boolean),
    });

    // If user not found

    console.log("user>>", user);

    if (!user) {
      return res.status(404).json({ message: "User not found.", error: true });
    }

    // Check if the OTP matches
    if (user.otp !== +otp) {
      return res.status(401).json({ message: "Incorrect OTP.", error: true });
    }

    console.log("OTP validated successfully for:", email || phoneNumber);

    // Generate token (for authentication purposes)

    // Send token and user details in response
    console.log("user>>", user);
    if (user.isRegistered) {
      const token = jwt.sign(
        { id: user._id }, // Use the _id from the updated user
        process.env.JWT_SECRET_KEY
      );

      // Prepare the response with only the needed fields
      const userDetails = {
        token,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        school: user.school,
        course: user.course,
        isRegistered: user.isRegistered,
      };

      return res
        .status(200)
        .json({ message: "User Logged in successfully", user: userDetails });
    }

    return res.status(200).json({
      message: "Sign-in successful",
      user: {
        id: user._id,
        isRegistered: user.isRegistered,
      },
    });
  } catch (error) {
    console.error("Error validating OTP:", error);
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error.toString() });
  }
};

const sendOtpWithSms = async (req, res) => {
  const { phoneNumber, countryCode } = req.body;

  // Validate the input
  if (!phoneNumber || !countryCode) {
    return res
      .status(400)
      .json({ message: "Phone number and country code are required." });
  }

  const db = getDb();
  const usersCollection = db.collection("users");

  try {
    // Check if user exists with the given phone number
    let user = await usersCollection.findOne({ phone_number: phoneNumber });
    console.log("user>>", user);

    // Generate the OTP
    const otp = generateOTP();
    console.log(otp);
    console.log(typeof otp);

    const fullPhoneNumber = `${countryCode}${phoneNumber}`;
    console.log("fullPhoneNumber", fullPhoneNumber);

    const message = `Your OTP is ${otp}. Please do not share it with anyone.`;

    // Case 1: First-time login (User document does not exist in DB)
    if (!user) {
      const newUser = {
        phone_number: phoneNumber,
        country_code: countryCode,
        otp,
        isRegistered: false, // User has not completed registration yet
        createdAt: new Date(),
      };

      await usersCollection.insertOne(newUser);

      // Send OTP via SMS
      await sendSMS(fullPhoneNumber, message);

      return res.status(200).json({
        message:
          "OTP sent successfully. New user, redirect to registration form.",
        newUser: true,
        otpSent: true,
        isRegistered: false, // User is not registered yet
        phoneNumber,
        otp,
      });
    }

    // Case 2: User exists but not fully registered
    if (user && !user.isRegistered) {
      await usersCollection.updateOne(
        { phone_number: phoneNumber },
        { $set: { otp } }
      );

      // Send OTP via SMS
      await sendSMS(fullPhoneNumber, message);

      return res.status(200).json({
        message:
          "OTP sent successfully. User not fully registered, proceed with registration.",
        newUser: false, // User document already exists
        isRegistered: false, // User has not completed registration
        otpSent: true,
        otp,
      });
    }

    // Case 3: User is fully registered
    if (user && user.isRegistered) {
      await usersCollection.updateOne(
        { phone_number: phoneNumber },
        { $set: { otp } }
      );

      // Send OTP via SMS
      await sendSMS(fullPhoneNumber, message);

      return res.status(200).json({
        message: "User is already registered. OTP sent successfully.",
        newUser: false,
        isRegistered: true, // User is fully registered
        otpSent: true,
        otp,
      });
    }
  } catch (error) {
    console.error("Error sending OTP:", error);
    return res.status(500).json({ message: "Failed to send OTP." });
  }
};

const sendOtpWithEmail = async (req, res) => {
  console.log(req.body);

  const { email } = req.body;

  // Validate the input
  if (!email) {
    return res.status(400).json({ message: "Email is required." });
  }

  const db = getDb();
  const usersCollection = db.collection("users");

  try {
    // Check if user exists with the given email
    let user = await usersCollection.findOne({ email });
    console.log("user>>", user);

    // Generate the OTP
    const otp = generateOTP();
    console.log(otp);
    console.log(typeof otp);

    // Case 1: First-time login (User document does not exist in DB)
    if (!user) {
      const newUser = {
        email,
        otp,
        isRegistered: false, // User has not completed registration yet
        createdAt: new Date(),
      };

      await usersCollection.insertOne(newUser);

      // Send OTP via email
      const templateData = { otp: otp.toString() };
      await sendTemplatedEmail([email], "OTPAuthentication", templateData);

      return res.status(200).json({
        message:
          "OTP sent successfully. New user, redirect to registration form.",
        newUser: true,
        otpSent: true,
        isRegistered: false, // User is not registered yet
        email,
        otp,
      });
    }

    // Case 2: User exists but not fully registered
    if (user && !user.isRegistered) {
      await usersCollection.updateOne({ email }, { $set: { otp } });

      // Send OTP via email
      const templateData = { otp: otp.toString() };
      await sendTemplatedEmail([email], "OTPAuthentication", templateData);

      return res.status(200).json({
        message:
          "OTP sent successfully. User not fully registered, proceed with registration.",
        newUser: false, // User document already exists
        isRegistered: false, // User has not completed registration
        otpSent: true,
        otp,
      });
    }

    // Case 3: User is fully registered
    if (user && user.isRegistered) {
      await usersCollection.updateOne({ email }, { $set: { otp } });

      // Send OTP via email
      const templateData = { otp: otp.toString() };
      await sendTemplatedEmail([email], "OTPAuthentication", templateData);

      return res.status(200).json({
        message: "User is already registered. OTP sent successfully.",
        newUser: false,
        isRegistered: true, // User is fully registered
        otpSent: true,
        otp,
      });
    }
  } catch (error) {
    console.error("Error sending OTP:", error);
    return res.status(500).json({ message: "Failed to send OTP." });
  }
};

const uploadImage = async (req, res) => {
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

const insertEmail = async (req, res) => {
  const { email } = req.body;
  console.log(email);
  if (!email) {
    return res.status(400).json({
      message: "Email is not available",
    });
  }

  const db = getDb();
  const emailsCollection = db.collection("emails");

  try {
    await emailsCollection.insertOne({ email });
    res.status(200).json({
      message: "Email inserted successfully",
    });
  } catch (error) {
    console.error("Error inserting email:", error);
    res.status(500).json({
      message: "Failed to insert email",
    });
  }
};

const register = async (req, res) => {
  const { id, firstName, lastName, email, phone, school, course,year } = req.body;

  try {
    const db = getDb(); // Get MongoDB instance

    // Find the user by ID and update the specified fields, leaving others intact
    const userDetails = await db.collection("users").findOneAndUpdate(
      { _id: new ObjectId(id), isRegistered: false }, // Query to find user with specified ID and ensure not registered
      {
        $set: {
          firstName, // Only add or update these fields
          lastName,
          email,
          phone,
          school,
          course,
          year,
          isRegistered: true, // Set the `isRegistered` flag to true
          updatedAt: new Date(), // Add the `updatedAt` timestamp
        },
        $setOnInsert: {
          createdAt: new Date(), // This ensures `createdAt` is only added if the document is newly inserted (not applicable here but ensures consistency)
        },
      },
      {
        returnDocument: "after", // Return the updated document
        upsert: false, // Do not create a new document if it doesn't exist (you only want to update)
      }
    );

    console.log(userDetails);

    if (userDetails) {
      // Check if a document was updated

      const token = jwt.sign(
        { id: userDetails._id }, // Use the _id from the updated user
        process.env.JWT_SECRET_KEY
      );

      // Prepare the response with only the needed fields
      const user = {
        token,
        firstName: userDetails.firstName,
        lastName: userDetails.lastName,
        email: userDetails.email,
        phone: userDetails.phone,
        school: userDetails.school,
        course: userDetails.course,
        year:userDetails.year
      };

      return res
        .status(200)
        .json({ message: "User registered successfully", user });
      // return res.status(200).json({ message: 'User registered successfully', user });
    } else {
      return res
        .status(404)
        .json({ message: "User not found or already registered" });
    }
  } catch (error) {
    console.error("Error registering user:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// const register = async (req, res) => {
//   const { id, firstName, lastName, email, phone, school, course } = req.body;

//   try {
//     const db = getDb(); // Get MongoDB instance

//     // Find the user by ID and update the specified fields, leaving others intact
//     const user = await db.collection("users").findOneAndUpdate(
//       { _id: new ObjectId(id), isRegistered: false }, // Query to find user with specified ID and ensure not registered
//       {
//         $set: {
//           firstName,          // Only add or update these fields
//           lastName,
//           email,
//           phone,
//           school,
//           course,
//           isRegistered: true, // Set the `isRegistered` flag to true
//           updatedAt: new Date() // Add the `updatedAt` timestamp
//         }
//       },
//       {
//         returnDocument: 'after', // Return the updated document
//         upsert: false // Do not create a new document if it doesn't exist (you only want to update)
//       }
//     );

//     // If the user was found and updated
//     if (user.value) {
//       const token = jwt.sign(
//         { id: user.value._id }, // Use the _id from the updated user
//         process.env.JWT_SECRET_KEY,
//         { expiresIn: '1h' } // Set the token expiration time as needed
//       );

//       // Prepare the response with only the needed fields
//       const responseData = {
//         token,
//         firstName: user.value.firstName,
//         lastName: user.value.lastName,
//         email: user.value.email,
//         phone: user.value.phone,
//         school: user.value.school,
//         course: user.value.course,
//       };

//       return res.status(200).json({ message: 'User registered successfully', user: responseData });
//     } else {
//       return res.status(404).json({ message: 'User not found or already registered' });
//     }
//   } catch (error) {
//     console.error('Error registering user:', error);
//     return res.status(500).json({ message: 'Server error' });
//   }
// };

module.exports = {
  sendOtpWithSms,
  sendOtpWithEmail,
  validateOTP,
  register,
  uploadImage,
  insertEmail,
};
