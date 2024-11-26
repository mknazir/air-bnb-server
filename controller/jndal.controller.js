const { ObjectId } = require("mongodb");
const { getDb } = require("../db/db");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");

exports.jindalCreateCourse = async (req, res) => {
    try {
      const db = getDb();
      const {
        title,
        subtitle,
        duration,
        price,
        period,
        category,
        subcategory,
        mode,
        learning,
        skills,
        pedagogy,
        courseStructure,
        outcome,
        batchType,
        courseImageUrl,
        electives,
        courseStructureDescription,
        images
      } = req.body;
  
      // Validation to ensure all required fields are provided
      if (
        !title ||
        !subtitle ||
        !duration ||
        !price ||!period||
        !category ||
        !subcategory ||
        !mode ||
        !learning ||
        !skills ||
        !pedagogy ||
        !courseStructure ||
        !outcome ||
        !batchType ||
        !courseImageUrl ||
        !courseStructureDescription ||
        !images
      ) {
        return res.status(400).json({ error: "All fields are required" });
      }
  
    //   if (
    //     !Array.isArray(electives) ||
    //     electives.some((e) => !e.heading || !e.subheading)
    //   ) {
    //     return res
    //       .status(400)
    //       .json({ error: "Electives must be an array of objects with heading and subheading" });
    //   }
  
      const currentDate = new Date(); // Get the current date
  
      const course = {
        title,
        subtitle,
        duration,
        period,
        price,
        category, // e.g., Training, Workshops, etc.
        subcategory, // e.g., Postgraduate, Undergraduate
        mode, // Array of strings: ['Offline', 'Hybrid']
        learning, // Array of learning points
        skills, // Array of skills
        pedagogy, // Array of objects with image URL and description
        courseStructure, // Array of objects {heading, subheading}
        courseStructureDescription, // Description of the course structure
        outcome, // Array of objects {title, description}
        batchType, // e.g., Weekend, Daily
        isActive: true,
        createdAt: currentDate, // Set the creation date
        updatedAt: currentDate, // Set the updated date to the same value initially
        courseImageUrl,
        images, // Contains URLs for course and outcome images
        electives:electives?electives:[],
      };
  
      // Insert course into the 'courses' collection
      const result = await db.collection("jindalcourse").insertOne(course);
  
      // Send a detailed success response
      res.status(201).json({
        message: "Course created successfully",
        courseId: result.insertedId,
        course, // Send the created course details
      });
    } catch (error) {
      // Error handling
      console.error("Error creating course:", error);
      res.status(500).json({ error: "Failed to create course" });
    }
  };


exports.getjindalCourseDetails = async (req, res) => {
  try {
    const db = getDb();
    const { courseId } = req.params; 

    // Validate the courseId
    if (!courseId || !ObjectId.isValid(courseId)) {
      return res.status(400).json({ error: "Invalid or missing course ID" });
    }

    // Fetch the course details from the 'jindalcourse' collection
    const course = await db
      .collection("jindalcourse")
      .findOne({ _id: new ObjectId(courseId) });

    // If no course is found
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }
    res.status(200).json({ message: "Course details fetched successfully", course });
  } catch (error) {
    // Error handling
    console.error("Error fetching course details:", error);
    res.status(500).json({ error: "Failed to fetch course details" });
  }
};
const razorpay = new Razorpay({
  key_id: 'rzp_live_IIwhdZvx1c4BGz',
  key_secret: 'MKwPrI8XsBlj2cmzbuFnZ51s'
});

exports.createOrder = async (req, res) => {
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


exports.verifyOrder = async (req, res) => {
  console.log("Inside verify", req.body);

  const db = getDb(); // Replace with your MongoDB database connection logic
  const collection = db.collection("jindalregistration"); // Adjust the collection name if needed

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

