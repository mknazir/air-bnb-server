const { ObjectId } = require('mongodb');
const { getDb } = require("../db/db");

// Create a batch for a course
exports.createBatch = async (req, res) => {
  try {
      const db = getDb();
      const { courseId } = req.params;  // Ensure courseId is coming from request parameters
      const { batchLevel,batchType, date, mode ,time,price} = req.body;
      console.log("courseID>>",req.params);

      // Create the batch object
      const batch = {
        batchLevel,
        batchType,
        date,
        mode,
        time,
        price,
        lectures: [] // You can add lectures later
      };

      // Insert the batch into the 'batches' collection
      const result = await db.collection('batches').insertOne(batch);
      const batchId = result.insertedId;
      console.log("Batch created with ID:", batchId);

      // Push the batch ID into the 'batches' array of the course
      const updateResult = await db.collection('courses').updateOne(
          { _id: new ObjectId(courseId) },
          { $push: { batches: batchId } }
      );

      if (updateResult.modifiedCount === 1) {
          console.log("Batch ID added to course successfully.");
          res.status(201).json({ message: 'Batch created and added to course', batchId });
      } else {
          console.log("Course not found or batch not added.");
          res.status(404).json({ error: 'Course not found or batch not added' });
      }
  } catch (error) {
      console.error('Error creating batch:', error);
      res.status(500).json({ error: 'Failed to create batch' });
  }
};
  
  // Get all batches for a course
  exports.getBatchesByCourseId = async (req, res) => {
    try {
      const db = getDb();
      const batches = await db.collection('batches').find({ course_id: new ObjectId(req.params.courseId) }).toArray();
      res.status(200).json(batches);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch batches' });
    }
  };

  exports.getBatchesByCourseId = async (req, res) => {
    try {
      const db = getDb();
      const { courseId } = req.params; // Get courseId from request parameters
  
      // Step 1: Find the course by its unique courseId
      const course = await db.collection('courses').findOne({ _id:new ObjectId(courseId) });
  
      // Check if course exists
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }
  
      // Step 2: Extract the batches array from the found course
      const { batches } = course;
  
      // Check if batches exist in the course
      if (!batches || batches.length === 0) {
        return res.status(404).json({ message: 'No batches found for this course' });
      }
  
      // Step 3: Query the 'batches' collection using the batch IDs
      const batchDetails = await db.collection('batches').find({ _id: { $in: batches } }).toArray();
  
      // Step 4: Return the batch details in the response
      res.status(200).json(batchDetails);
    } catch (error) {
      // Handle any errors that occur during the database query
      res.status(500).json({ error: 'Failed to fetch batch details' });
    }
  };