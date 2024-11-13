const { ObjectId } = require("mongodb");
const { getDb } = require("../db/db");
const { generateSignedUrl } = require("../S3/s3");

// Create a batch for a course
exports.createBatch = async (req, res) => {
  try {
    const db = getDb();
    const { courseId } = req.params; // Ensure courseId is coming from request parameters
    const { batchLevel, batchType, date, mode, time, price } = req.body;
    console.log("courseID>>", req.params);

    // Create the batch object
    const batch = {
      batchLevel,
      batchType,
      date,
      mode,
      time,
      price,
      lectures: [], // You can add lectures later
    };

    // Insert the batch into the 'batches' collection
    const result = await db.collection("batches").insertOne(batch);
    const batchId = result.insertedId;
    console.log("Batch created with ID:", batchId);

    // Push the batch ID into the 'batches' array of the course
    const updateResult = await db
      .collection("courses")
      .updateOne(
        { _id: new ObjectId(courseId) },
        { $push: { batches: batchId } }
      );

    if (updateResult.modifiedCount === 1) {
      console.log("Batch ID added to course successfully.");
      res
        .status(201)
        .json({ message: "Batch created and added to course", batchId });
    } else {
      console.log("Course not found or batch not added.");
      res.status(404).json({ error: "Course not found or batch not added" });
    }
  } catch (error) {
    console.error("Error creating batch:", error);
    res.status(500).json({ error: "Failed to create batch" });
  }
};

exports.getBatchesByCourseId = async (req, res) => {
  try {
    const db = getDb();
    const batches = await db
      .collection("batches")
      .find({ course_id: new ObjectId(req.params.courseId) })
      .toArray();
    res.status(200).json(batches);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch batches" });
  }
};

exports.getBatchesByCourseId = async (req, res) => {
  try {
    const db = getDb();
    const { courseId } = req.params; // Get courseId from request parameters

    // Step 1: Find the course by its unique courseId
    const course = await db
      .collection("courses")
      .findOne({ _id: new ObjectId(courseId) , isActive: true});

    // Check if course exists
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Step 2: Extract the batches array from the found course
    const { batches } = course;

    // Check if batches exist in the course
    if (!batches || batches.length === 0) {
      return res
        .status(404)
        .json({ message: "No batches found for this course" });
    }

    // Step 3: Query the 'batches' collection using the batch IDs
    const batchDetails = await db
      .collection("batches")
      .find({ _id: { $in: batches } })
      .toArray();

    // Step 4: Return the batch details in the response
    res.status(200).json(batchDetails);
  } catch (error) {
    // Handle any errors that occur during the database query
    res.status(500).json({ error: "Failed to fetch batch details" });
  }
};

exports.AddFile=async(req,res)=>{

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
}

exports.deleteBatch = async (req, res) => {
  try {
    const db = getDb();
    const { courseId, batchId } = req.params;

    // Delete the batch from the 'batches' collection
    const deleteResult = await db.collection("batches").deleteOne({ _id: new ObjectId(batchId) });
    
    if (deleteResult.deletedCount === 1) {
      console.log("Batch deleted successfully.");

      // Remove the batch ID from the 'batches' array in the course
      const updateResult = await db.collection("courses").updateOne(
        { _id: new ObjectId(courseId) },
        { $pull: { batches: new ObjectId(batchId) } }
      );

      if (updateResult.modifiedCount === 1) {
        console.log("Batch ID removed from course successfully.");
        res.status(200).json({ message: "Batch deleted and removed from course" });
      } else {
        console.log("Course not found or batch ID not removed from course.");
        res.status(404).json({ error: "Course not found or batch ID not removed from course" });
      }
    } else {
      console.log("Batch not found.");
      res.status(404).json({ error: "Batch not found" });
    }
  } catch (error) {
    console.error("Error deleting batch:", error);
    res.status(500).json({ error: "Failed to delete batch" });
  }
};

exports.editBatch = async (req, res) => {
  try {
    const db = getDb();
    const { batchId } = req.params;
    const { batchLevel, batchType, date, mode, time, price } = req.body;

    // Update the batch in the 'batches' collection
    const updateResult = await db.collection("batches").updateOne(
      { _id: new ObjectId(batchId) },
      { $set: { batchLevel, batchType, date, mode, time, price } }
    );

    if (updateResult.modifiedCount === 1) {
      console.log("Batch updated successfully.");
      res.status(200).json({ message: "Batch updated successfully" });
    } else {
      console.log("Batch not found or no changes made.");
      res.status(404).json({ error: "Batch not found or no changes made" });
    }
  } catch (error) {
    console.error("Error updating batch:", error);
    res.status(500).json({ error: "Failed to update batch" });
  }
};
