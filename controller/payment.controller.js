const Razorpay = require("razorpay");
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");
const { sendTemplatedEmail } = require("../SES/ses.js");
const { getDb } = require("../db/db");


const razorpay = new Razorpay({
  key_id: "rzp_test_IqmS1BltCU4SFU",
  key_secret: "tJA2Z7X9lDyG8FHfmZ6J2qv6",
});
const RAZORPAY_WEBHOOK_SECRET = "your_webhook_secret";

const createOrder = async (req, res) => {
  try {
    console.log("isnide create order", req.body);
    const options = {
      amount: req.body.amount * 100, // amount in the smallest currency unit
      currency: "INR",
      receipt: uuidv4(),
    };

    const order = await razorpay.orders.create(options);
    console.log("iside order crate", order);
    return res.status(200).json(order);
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
      error: true,
    });
  }
};

const verifyOrder = async (req, res) => {
  console.log("Inside verify", req.body);

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, courseId, batchId, price } = req.body;
    console.log("body>>",req.body);
    
    const hmac = crypto.createHmac("sha256", razorpay.key_secret);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generated_signature = hmac.digest("hex");

    if (generated_signature === razorpay_signature) {
      console.log("Inside success");

      // Get user ID from req.user
      const userId = req.user._id; // Assuming req.user contains the authenticated user
      console.log("userDetails>>",req.user);
      console.log("id>>",userId);
      
      const db = getDb(); // Get the database connection

      // Create payment details document
      const paymentDetails = {
        userId,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        courseId,
        batchId,
        price,
        createdAt: new Date(), // Optional: add a timestamp
      };

      console.log("paymentDetials>>",paymentDetails);
      

      // Save payment details to the payments collection
      const result = await db.collection("payments").insertOne(paymentDetails);
      console.log(result);
      
      const paymentId = result.insertedId; // Get the newly created document ID

      // Update the user's purchasedCourses array
      await db.collection("users").updateOne(
        { _id: userId },
        { $push: { purchasedCourses: paymentId } } // Add the paymentId to the purchasedCourses array
      );

      return res.status(200).json({ message: "Payment verified successfully.", paymentId });
    } else {
      console.log("Inside failure");
      return res.status(400).json({ message: "Payment verification failed." });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal Server Error",
      error: true,
    });
  }
};

const createPaymentLink = async (req, res) => {
  const {
    name,
    email,
    phone_number,
    amount,
    currency,
    therapist_id,
    user_id,
    payment_mode,
    appointment_id,
    type,
  } = req.body;

  // Map the `type` to its corresponding value (e.g., post or preconsultation)
  let typeValue;
  if (type === "session") {
    typeValue = "post";
  } else if (type === "preconsultation") {
    typeValue = "pre";
  } else {
    return res.status(400).json({ error: "Invalid type provided" });
  }

  const currentTimeInSeconds = Math.floor(Date.now() / 1000);
  const expirationDuration = 20 * 60; // 20 minutes in seconds
  const expireBy = currentTimeInSeconds + expirationDuration;

  const options = {
    amount: amount * 100, // Amount in paise
    currency: currency,
    accept_partial: false,
    description: "Payment via Link",
    customer: {
      contact: phone_number,
      email: email,
    },
    notify: {
      sms: true,
      email: true,
    },
    reminder_enable: true,
    expire_by: expireBy,
    notes: {
      name,
      amount,
      therapist_id,
      user_id,
      payment_mode,
      appointment_id,
      type: typeValue, // Mapped type
    },
  };

  try {
    const response = await razorpay.paymentLink.create(options);
    const paymentLink = response.short_url;

    // Prepare email content
    const templateData = {
      name,
      paymentLink,
    };

    // Send payment link via email
    await sendTemplatedEmail([email], "SendPaymentLink", templateData);

    res
      .status(200)
      .json({
        message: "Payment link created and email sent successfully",
        paymentLink,
      });
  } catch (error) {
    console.error("Error creating payment link or sending email:", error);
    res
      .status(500)
      .json({ error: "Error creating payment link or sending email" });
  }
};

// Webhook handler
const handleWebhook = async (req, res) => {

  
  const receivedSignature = req.headers["x-razorpay-signature"];
  const requestBody = JSON.stringify(req.body);

  // Verifying webhook signature
  const expectedSignature = crypto
    .createHmac("sha256", RAZORPAY_WEBHOOK_SECRET)
    .update(requestBody)
    .digest("hex");

  if (receivedSignature === expectedSignature) {
    const event = req.body.event;

    // Only handle 'payment_link.paid' event
    if (event === "payment_link.paid") {
      const paymentLinkEntity = req.body.payload.payment_link.entity;
      const paymentDetails = paymentLinkEntity;

      // Extracting necessary fields from payload
      const {
        name,
        amount,
        therapist_id,
        user_id,
        payment_mode,
        appointment_id,
        type,
      } = paymentLinkEntity.notes;
      const { order_id, payment_id } = paymentLinkEntity; // Extract order_id and payment_id from paymentLinkEntity

      // Additional fields to store
      const drcr = "Debit"; // Credit or Debit transaction indicator

      // Get the current date and time
      const currentDate = new Date();
      const date = currentDate.toISOString(); // Store the ISO date format
      const time = currentDate.toTimeString().split(" ")[0]; // Extract only "HH:MM:SS" from time

      // Log the details
      console.log("Payment via link was successful!", paymentDetails);
      console.log("Name:", name);
      console.log("Amount:", amount);
      console.log("Therapist ID:", therapist_id);
      console.log("User ID:", user_id);
      console.log("Payment Mode:", payment_mode);
      console.log("Appointment ID:", appointment_id);
      console.log("Type:", type); // "post" or "pre"
      console.log("Order ID:", order_id); // Extracted order_id
      console.log("Payment ID:", payment_id); // Extracted payment_id
      console.log("Dr/Cr:", drcr); // Transaction type
      console.log("Date:", date); // Current date in ISO format
      console.log("Time:", time); // Current time in "HH:MM:SS" format

      // Here you can handle the data, store it in the database with additional fields
      // For example: Save order_id, payment_id, drcr, date, and time in the database
      const data = {
        name,
        amount,
        drcr,
        data,
        time,
        type,
        order_id,
        payment_id,
        user_id,
        therapist_id,
        appointment_id,
      };

      const paymentCollection = db.collection("payments");
      const appointmentCollection = db.collection("appointments");

      await paymentCollection.insertOne(data);

      const updateResult = await appointmentCollection.updateOne(
        { _id: appointment_id},
        { $set: { payment_status: 1 } }
      );
  
      if (updateResult.matchedCount === 0) {
        return res.status(404).json({
          message: "Failed to update the slots.",
          error: true,
        });
      }

      // Check if the update was successful
      if (result.modifiedCount === 0) {
        return res.status(500).json({
          message: "Failed to update wallet and payment history.",
          error: true,
        });
      }
      res.status(200).json({
        status: "success",
        message: "Payment link paid",
        paymentDetails: {
          name,
          amount,
          therapist_id,
          user_id,
          payment_mode,
          appointment_id,
          type,
          order_id,
          payment_id,
          drcr,
          date,
          time,
        },
      });
    } else {
      // Ignore other events and return success response
      res
        .status(200)
        .json({ status: "ignored", message: "Event not processed" });
    }
  } else {
    res.status(400).json({ status: "failed", message: "Invalid signature" });
  }
};

const applyCouponCode = async (req, res) => {
  const { couponCode, amount } = req.body;

  try {
    const db = getDb(); // Get the database connection
    const coupon = await db.collection("coupons").findOne({ code: couponCode });

    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found." });
    }

    // Check if the coupon is active
    if (coupon.status !== "active") {
      return res.status(400).json({ message: "Coupon is not active." });
    }

    // Check if the coupon is expired
    const currentDate = new Date();
    if (new Date(coupon.expirationDate) < currentDate) {
      return res.status(400).json({ message: "Coupon has expired." });
    }

    // Check usage limit
    if (coupon.usageLimit <= coupon.usedCount) {
      return res.status(400).json({ message: "Coupon usage limit reached." });
    }

    // Apply the discount
    let finalAmount;
    if (coupon.discountType === "percentage") {
      finalAmount = amount - (amount * coupon.discountValue) / 100;
    } else if (coupon.discountType === "flat") {
      finalAmount = amount - coupon.discountValue;
    }

    // Ensure the amount is not less than zero
    finalAmount = Math.max(finalAmount, 0);

    // Return the updated amount after applying the coupon
    return res.status(200).json({
      message: "Coupon applied successfully.",
      originalAmount: amount,
      discountAmount: amount - finalAmount,
      finalAmount,
    });
  } catch (error) {
    console.error("Error applying coupon:", error);
    res.status(500).json({ message: "Internal Server Error", error: true });
  }
};

module.exports = { createOrder, verifyOrder, createPaymentLink, handleWebhook, applyCouponCode };
