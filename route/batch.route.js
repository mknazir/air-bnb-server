const express = require('express');
const {createBatch, getBatchesByCourseId, AddFile}=require('../controller/batch.controller')



const batchRouter = express.Router();


batchRouter.post('/batch/createBatch/:courseId', createBatch);
batchRouter.get('/getBatchesByCourseId/:courseId',getBatchesByCourseId)
batchRouter.get('/addFile',AddFile)


module.exports = batchRouter;