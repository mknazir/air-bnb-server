const { ObjectId } = require("mongodb");
const { getDb } = require("../db/db");
// Create a new course
exports.createCourse = async (req, res) => {
  try {
    const db = getDb();
    const {
      title,
      subtitle,
      duration,
      module,
      price,
      level,
      category,
      subcategory,
      mode,
      learning,
      skills,
      pedagogy,
      courseStructure,
      outcome,
      batchType,
      instructors,
      image
    } = req.body;

    // Validation to ensure all required fields are provided
    if (
      !title ||
      !subtitle ||
      !duration ||
      !module ||
      !price ||
      !level ||
      !category ||
      !subcategory ||
      !mode ||
      !learning ||
      !skills ||
      !pedagogy ||
      !courseStructure ||
      !outcome ||
      !batchType ||
      !instructors||!image
    ) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const currentDate = new Date(); // Get the current date

    const course = {
      title,
      subtitle,
      duration,
      module,
      price,
      level, // e.g., Beginner, Intermediate, Advanced
      category, // e.g., Internship, Training, Tutorials
      subcategory, // e.g., Postgraduate, Graduate, Early Career, Professional
      mode,
      learning, // Array of learning points (5-6 strings)
      skills, // Array of skill strings (2-3 words)
      pedagogy, // Array of objects with URL and text
      courseStructure, // Array of objects {heading, subheading: [text]}
      outcome, // Array of outcome texts
      batchType, // e.g., Weekend, Daily
      batches: [], // Empty array for now
      instructors, // Array of instructor objects {img_url, degree, name, specialization, experience}
      isActive : true ,
      createdAt: currentDate, // Set the creation date
      updatedAt: currentDate, // Set the updated date to the same value initially
      images:image
    };

    // Insert course into the 'courses' collection
    const result = await db.collection("courses").insertOne(course);

    // Send a detailed success response
    res.status(201).json({
      message: "Course created successfully",
      courseId: result.insertedId,
      course: course, // Send the created course details
    });
  } catch (error) {
    // Error handling
    res.status(500).json({ error: "Failed to create course" });
  }
};

exports.getCoursesByCategory = async (req, res) => {
  console.log("called");

  try {
    const db = getDb();
    const { category } = req.params; // Get category from request parameters

    // Validate category
    const validCategories = [
      "workshops",
      "internships",
      "training",
      "tutorials",
    ];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: "Invalid category provided" });
    }

    // Query to find courses by the specified category
    const courses = await db
      .collection("courses")
      .find({ category: category , isActive : true})
      .toArray();

    // Check if courses were found
    if (courses.length === 0) {
      return res
        .status(404)
        .json({ message: "No courses found for this category" });
    }

    // Send the list of courses as a response
    res.status(200).json(courses);
  } catch (error) {
    // Handle any errors that occur during the database query
    res.status(500).json({ error: "Failed to fetch courses" });
  }
};

exports.getLatestCoursesByCategory = async (req, res) => {
  console.log("getLatestCoursesByCategory called");

  try {
    const db = getDb();
    const { category } = req.params; // Get category from request parameters
    console.log(category);

    // Validate category
    const validCategories = [
      "workshops",
      "internships",
      "training",
      "tutorials",
    ];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: "Invalid category provided" });
    }

    // Query to find courses by the specified category, sorted by createdAt in descending order
    // and limited to the latest 10 courses
    const courses = await db
      .collection("courses")
      .find({ category: category , isActive : true})
      .sort({ createdAt: -1 }) // Sort by creation date, latest first
      .limit(10) // Limit to 10 courses
      .toArray();

    // Check if courses were found
    if (courses.length === 0) {
      return res
        .status(404)
        .json({ message: "No courses found for this category" });
    }

    // Send the list of courses as a response
    res.status(200).json(courses);
  } catch (error) {
    // Handle any errors that occur during the database query
    res.status(500).json({ error: "Failed to fetch courses" });
  }
};

exports.getCoursesBySubcategory = async (req, res) => {
  try {
    const db = getDb();
    const { category } = req.params; // Get subcategory from request parameters
    console.log(category);

    // Validate subcategory
    const validSubcategories = [
      "undergraduate",
      "postgraduate",
      "11-12",
      "earlycareer",
      "school",
    ];
    console.log(validSubcategories.includes(category));

    if (!validSubcategories.includes(category)) {
      return res.status(400).json({ error: "Invalid subcategory provided" });
    }

    // Query to find courses by the specified subcategory
    const courses = await db
      .collection("courses")
      .find({ subcategory: category , isActive: true})
      .toArray();

    // Check if courses were found
    if (courses.length === 0) {
      return res
        .status(404)
        .json({ message: "No courses found for this subcategory" });
    }

    // Send the list of courses as a response
    res.status(200).json(courses);
  } catch (error) {
    // Handle any errors that occur during the database query
    res.status(500).json({ error: "Failed to fetch courses" });
  }
};

exports.getLatestCoursesBySubcategory = async (req, res) => {
  try {
    const db = getDb();
    const { category } = req.params; // Get subcategory from request parameters
    console.log(category);

    // Validate subcategory
    const validSubcategories = [
      "undergraduate",
      "postgraduate",
      "11-12",
      "earlycareer",
      "school",
    ];
    if (!validSubcategories.includes(category)) {
      return res.status(400).json({ error: "Invalid subcategory provided" });
    }

    // Query to find courses by the specified subcategory, sort by creation time, and limit to 10
    const courses = await db
      .collection("courses")
      .find({ subcategory: category , isActive: true })
      .sort({ createdAt: -1 }) // Sort by `createdAt` field in descending order
      .limit(10) // Limit the result to max 10 courses
      .toArray();

    // Check if courses were found
    if (courses.length === 0) {
      return res
        .status(404)
        .json({ message: "No courses found for this subcategory" });
    }

    // Send the list of courses as a response
    res.status(200).json(courses);
  } catch (error) {
    // Handle any errors that occur during the database query
    res.status(500).json({ error: "Failed to fetch courses" });
  }
};

exports.getAllCourses = async (req, res) => {
  try {
    const db = getDb();

    // Fetch the latest 10 courses sorted by the 'created' field in descending order
    const latestCourses = await db.collection("courses").find({isActive: true}).toArray();

    // Send the response
    res.status(200).json(latestCourses);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch latest courses" });
  }
};

exports.getLatestCourses = async (req, res) => {
  try {
    const db = getDb();

    // Fetch the latest 10 courses sorted by the 'created' field in descending order
    const latestCourses = await db
      .collection("courses")
      .find({isActive: true})
      .sort({ created: -1 }) // Sort by created date in descending order
      .limit(5) // Limit to the latest 10 courses
      .toArray();

    // Send the response
    res.status(200).json(latestCourses);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch latest courses" });
  }
};

exports.getCourseById = async (req, res) => {
  try {
    const db = getDb();

    // Step 1: Find the course by its ID
    const course = await db
      .collection("courses")
      .findOne({ _id: new ObjectId(req.params.courseId) , isActive: true });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Step 2: Extract batch IDs (assuming they are stored in the course document)
    const batchIds = course.batches; // Assuming batches is an array of batch IDs

    // Step 3: Find all batch details from the 'batches' collection using the batch IDs
    let batches = [];
    if (batchIds && batchIds.length > 0) {
      batches = await db
        .collection("batches")
        .find({
          _id: { $in: batchIds.map((id) => new ObjectId(id)) },
        })
        .toArray();
    }

    // Step 4: Extract instructor names and find their details from the 'instructors' collection
    const instructorNames = course.instructors || [];
    let instructors = [];
    if (instructorNames.length > 0) {
      instructors = await db
        .collection("instructors")
        .find({
          name: { $in: instructorNames },
        })
        .toArray();
    }

    // Step 5: Return the course with the full batch details and instructor details
    res.status(200).json({
      ...course,
      batches,
      instructors,
    });
  } catch (error) {
    console.error("Error fetching course:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch course, batches, or instructors" });
  }
};

exports.purchaseCourse = async (req, res) => {
  try {
    console.log(req.user);
    console.log(req.body);

    const { _id } = req.user;
    const db = getDb();

    // Step 1: Get the user document
    const user = await db.collection("users").findOne({ _id });

    // Step 2: Check if purchasedCourses field exists
    if (!user || !user.purchasedCourses || user.purchasedCourses.length === 0) {
      return res.status(404).json({ message: "No purchased courses found" });
    }

    // Step 3: Extract purchasedCourses document IDs
    const purchasedCourseIds = user.purchasedCourses;
    console.log("purchasedCourseIds>>", purchasedCourseIds);

    // Step 4: Fetch payment documents using purchasedCourseIds
    const payments = await db
      .collection("payments")
      .find({ _id: { $in: purchasedCourseIds } })
      .toArray();
    console.log("payments", payments);

    // Step 5: Fetch course and batch details and merge them
    const courseDetails = await Promise.all(
      payments.map(async (payment) => {
        const course = await db
          .collection("courses")
          .findOne({ _id: new ObjectId(payment.courseId) , isActive: true});
        const batch = await db
          .collection("batches")
          .findOne({ _id: new ObjectId(payment.batchId) });

        // Return merged object with all course and batch fields
        return {
          paymentId: payment._id,
          course: course, // Include entire course object
          batch: batch, // Include entire batch object
        };
      })
    );

    // Step 6: Return combined results
    res
      .status(200)
      .json({
        message: "Fetched purchased course details successfully",
        data: courseDetails,
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to purchase course" });
  }
};

exports.addLecturesToBatch = async (req, res) => {
  try {
    const { batch_id, lecture } = req.body;

    // Validate input: batch_id must be provided and lecture must be an object
    if (!batch_id || !lecture || typeof lecture !== "object") {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: batch_id or lecture object is invalid",
      });
    }

    const db = getDb();
    const batchCollection = db.collection("batches");

    // Check if the batch exists (using ObjectId for _id)
    const batch = await batchCollection.findOne({
      _id: new ObjectId(batch_id),
    });

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found",
      });
    }

    // Add the lecture object to the existing lectures array
    const result = await batchCollection.updateOne(
      { _id: new ObjectId(batch_id) },
      {
        $push: {
          lectures: lecture, // Append the lecture object into the existing lectures array
        },
      }
    );

    // Check if the operation was successful
    if (result.modifiedCount > 0) {
      return res.status(200).json({
        success: true,
        message: "Lecture successfully added to the batch",
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "Failed to add the lecture to the batch",
      });
    }
  } catch (error) {
    console.error("Error during lecture addition:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.batchDetailsById = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if the provided id is a valid ObjectId
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid batch ID format",
      });
    }

    const batch_id = new ObjectId(id);
    const db = getDb();
    const batchCollection = db.collection("batches");

    // Fetch the batch details using the batch_id
    const batch = await batchCollection.findOne({ _id: batch_id });

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found",
      });
    }

    // Return the batch details
    return res.status(200).json({
      success: true,
      message: "Batch details retrieved successfully",
      data: batch,
    });
  } catch (error) {
    console.error("Error fetching batch details:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.deactivateCourseById = async (req, res) => {
  try {
    const db = getDb();

    // Step 1: Find the course by its ID and update `isActive` to false
    const result = await db
      .collection("courses")
      .updateOne(
        { _id: new ObjectId(req.params.courseId) },
        { $set: { isActive: false } }
      );

    // Step 2: Check if the course was found and updated
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Step 3: Send success response
    res.status(200).json({ message: "Course deactivated successfully" });
  } catch (error) {
    console.error("Error deactivating course:", error);
    res.status(500).json({ error: "Failed to deactivate course" });
  }
};