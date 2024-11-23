const Razorpay = require("razorpay");
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");
const { getDb } = require("../db/db");

const razorpay = new Razorpay({
  key_id: 'rzp_live_IIwhdZvx1c4BGz',
  key_secret: 'MKwPrI8XsBlj2cmzbuFnZ51s'
});

const createOrder = async (req, res) => {
  try {
    console.log("Inside create order", req.body);
     const {data}=req.body
    // Convert the amount to paise and round to the nearest integer
    const amountInPaise = Math.round(data.price * 100);

    const options = {
      amount: amountInPaise, // amount in the smallest currency unit
      currency: "INR",
      receipt: uuidv4(),
    };

    const order = await razorpay.orders.create(options);
    console.log("Order created successfully:", order);
    return res.status(200).json(order);
  } catch (error) {
    console.error("Error creating order:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      error: true,
    });
  }
};


const verifyOrder = async (req, res) => {
  console.log("Inside verify", req.body);

  const db = getDb(); // Replace with your MongoDB database connection logic
  const collection = db.collection("geuRegistration"); // Adjust the collection name if needed

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      currentPayementDetails,
    } = req.body;

    // Ensure required fields are present
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    // Verify the payment signature
    const hmac = crypto.createHmac("sha256", razorpay.key_secret);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generated_signature = hmac.digest("hex");

    if (generated_signature === razorpay_signature) {
      console.log("Payment verification successful.");

      // Extract user email from the first member's email in the array
      const userIdentifier = currentPayementDetails.members[0]?.email;

      if (!userIdentifier) {
        return res.status(400).json({ message: "No valid user email found." });
      }

      // Prepare payment details to update or insert into the database
      const paymentDetails = {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        ...currentPayementDetails,
        createdAt: new Date(),
      };

      // Update user payment details or create a new user if not found
      const updateResult = await collection.updateOne(
        { email: userIdentifier }, // Use email as identifier for the user
        {
          $set: {
            lastPaymentDetails: {
              razorpay_order_id,
              razorpay_payment_id,
              razorpay_signature,
              ...currentPayementDetails,
            },
          },
          $push: {
            paymentHistory: {
              razorpay_order_id,
              razorpay_payment_id,
              razorpay_signature,
              ...currentPayementDetails,
              date: new Date(),
            },
          },
        },
        { upsert: true } // Create a new document if no match is found
      );

      if (updateResult.matchedCount === 0) {
        console.log("New user record created");
      } else {
        console.log("User payment details updated");
      }

      return res.status(200).json({
        message: "Payment verified successfully and user payment details updated.",
        paymentId: razorpay_payment_id,
      });
    } else {
      console.log("Payment verification failed.");
      return res.status(400).json({ message: "Payment verification failed." });
    }
  } catch (error) {
    console.error("Error during payment verification:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      error: true,
    });
  }
};

module.exports = {
  createOrder,
  verifyOrder,
};
