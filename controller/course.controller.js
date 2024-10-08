const { ObjectId } = require('mongodb');
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
      instructors 
    } = req.body;

    // Validation to ensure all required fields are provided
    if (
      !title || !subtitle || !duration || !module || !price || 
      !level || !category || !subcategory || !mode || 
      !learning || !skills || !pedagogy || !courseStructure || 
      !outcome || !batchType || !instructors
    ) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const currentDate = new Date();  // Get the current date

    const course = {
      title,
      subtitle,
      duration,
      module,
      price,
      level,                // e.g., Beginner, Intermediate, Advanced
      category,             // e.g., Internship, Training, Tutorials
      subcategory,          // e.g., Postgraduate, Graduate, Early Career, Professional
      mode,
      learning,             // Array of learning points (5-6 strings)
      skills,               // Array of skill strings (2-3 words)
      pedagogy,             // Array of objects with URL and text
      courseStructure,      // Array of objects {heading, subheading: [text]}
      outcome,              // Array of outcome texts
      batchType,            // e.g., Weekend, Daily
      batches: [],          // Empty array for now
      instructors,          // Array of instructor objects {img_url, degree, name, specialization, experience}
      createdAt: currentDate, // Set the creation date
      updatedAt: currentDate  // Set the updated date to the same value initially
    };

    // Insert course into the 'courses' collection
    const result = await db.collection('courses').insertOne(course);

    // Send a detailed success response
    res.status(201).json({ 
      message: 'Course created successfully', 
      courseId: result.insertedId, 
      course: course // Send the created course details
    });
  } catch (error) {
    // Error handling
    res.status(500).json({ error: 'Failed to create course' });
  }
};



exports.getCoursesByCategory = async (req, res) => {
  console.log("called");
  
  try {
    const db = getDb();
    const { category } = req.params; // Get category from request parameters
    
    // Validate category
    const validCategories = ['workshops', 'internships', 'training', 'tutorials'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: 'Invalid category provided' });
    }

    // Query to find courses by the specified category
    const courses = await db.collection('courses').find({ category: category }).toArray();

    // Check if courses were found
    if (courses.length === 0) {
      return res.status(404).json({ message: 'No courses found for this category' });
    }

    // Send the list of courses as a response
    res.status(200).json(courses);
  } catch (error) {
    // Handle any errors that occur during the database query
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
};
exports.getLatestCoursesByCategory = async (req, res) => {
  console.log("getLatestCoursesByCategory called");
  
  try {
    const db = getDb();
    const { category } = req.params; // Get category from request parameters
    console.log(category);
    
    // Validate category
    const validCategories = ['workshops', 'internships', 'training', 'tutorials'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: 'Invalid category provided' });
    }

    // Query to find courses by the specified category, sorted by createdAt in descending order
    // and limited to the latest 10 courses
    const courses = await db.collection('courses')
      .find({ category: category })
      .sort({ createdAt: -1 })  // Sort by creation date, latest first
      .limit(10)                 // Limit to 10 courses
      .toArray();

    // Check if courses were found
    if (courses.length === 0) {
      return res.status(404).json({ message: 'No courses found for this category' });
    }

    // Send the list of courses as a response
    res.status(200).json(courses);
  } catch (error) {
    // Handle any errors that occur during the database query
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
};


exports.getCoursesBySubcategory = async (req, res) => {
  try {
    const db = getDb();
    const { category } = req.params; // Get subcategory from request parameters
   console.log(category);
   
    // Validate subcategory
    const validSubcategories = ['undergraduate', 'postgraduate','11-12', 'earlycareer'];
    console.log(validSubcategories.includes(category));
    
    if (!validSubcategories.includes(category)) {
      return res.status(400).json({ error: 'Invalid subcategory provided' });
    }

    // Query to find courses by the specified subcategory
    const courses = await db.collection('courses').find({ subcategory:category }).toArray();

    // Check if courses were found
    if (courses.length === 0) {
      return res.status(404).json({ message: 'No courses found for this subcategory' });
    }

    // Send the list of courses as a response
    res.status(200).json(courses);
  } catch (error) {
    // Handle any errors that occur during the database query
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
};

exports.getLatestCoursesBySubcategory = async (req, res) => {
  try {
    const db = getDb();
    const { category } = req.params; // Get subcategory from request parameters
    console.log(category);
   
    // Validate subcategory
    const validSubcategories = ['undergraduate', 'postgraduate', '11-12', 'earlycareer'];
    if (!validSubcategories.includes(category)) {
      return res.status(400).json({ error: 'Invalid subcategory provided' });
    }

    // Query to find courses by the specified subcategory, sort by creation time, and limit to 10
    const courses = await db.collection('courses')
      .find({ subcategory: category })
      .sort({ createdAt: -1 }) // Sort by `createdAt` field in descending order
      .limit(10) // Limit the result to max 10 courses
      .toArray();

    // Check if courses were found
    if (courses.length === 0) {
      return res.status(404).json({ message: 'No courses found for this subcategory' });
    }

    // Send the list of courses as a response
    res.status(200).json(courses);
  } catch (error) {
    // Handle any errors that occur during the database query
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
};




// Get all courses
exports.getAllCourses = async (req, res) => {

  console.log("getAllCourse");
  
  try {
    const db = getDb();

    // Fetch all courses from the database
    const courses = await db.collection('courses').find().toArray();

    // Initialize arrays for each subcategory
    const courses11_12 = [];
    const coursesUnderGraduate = [];
    const coursesPostGraduate = [];
    const coursesEarlyCareer = [];

    // Populate the arrays based on subcategory
    courses.forEach(course => {
      switch (course.subcategory) {
        case '11-12':
          courses11_12.push(course);
          break;
        case 'undergraduate':
          coursesUnderGraduate.push(course);
          break;
        case 'postgraduate':
          coursesPostGraduate.push(course);
          break;
        case 'earlycareer':
          coursesEarlyCareer.push(course);
          break;
      }
    });

    // Create the response object
    const response = {
      "11-12": courses11_12,
      "UnderGraduate": coursesUnderGraduate,
      "PostGraduate": coursesPostGraduate,
      "EarlyCareer": coursesEarlyCareer
    };

    // Send the response
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
};

exports.getLatestCourses = async (req, res) => {
  try {
    const db = getDb();

    // Fetch the latest 10 courses sorted by the 'created' field in descending order
    const latestCourses = await db.collection('courses')
      .find()
      .sort({ created: -1 }) // Sort by created date in descending order
      .limit(10)             // Limit to the latest 10 courses
      .toArray();

    // Send the response
    res.status(200).json(latestCourses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch latest courses' });
  }
};

// Get course by ID
exports.getCourseById = async (req, res) => {
  try {
    const db = getDb();
    const course = await db.collection('courses').findOne({ _id: new ObjectId(req.params.courseId) });
    if (course) {
      res.status(200).json(course);
    } else {
      res.status(404).json({ message: 'Course not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch course' });
  }
};