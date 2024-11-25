const { ObjectId } = require("mongodb");
const { getDb } = require("../db/db");

exports.jindalCreateCourse = async (req, res) => {
    try {
      const db = getDb();
      const {
        title,
        subtitle,
        duration,
        price,
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
        !price ||
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
        !electives ||
        !courseStructureDescription ||
        !images
      ) {
        return res.status(400).json({ error: "All fields are required" });
      }
  
      if (
        !Array.isArray(electives) ||
        electives.some((e) => !e.heading || !e.subheading)
      ) {
        return res
          .status(400)
          .json({ error: "Electives must be an array of objects with heading and subheading" });
      }
  
      const currentDate = new Date(); // Get the current date
  
      const course = {
        title,
        subtitle,
        duration,
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
        electives,
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
