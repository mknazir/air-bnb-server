const express = require('express');
const {createBatch, getBatchesByCourseId}=require('../controller/batch.controller')



const batchRouter = express.Router();


batchRouter.post('/batch/createBatch/:courseId', createBatch);
batchRouter.get('/getBatchesByCourseId/:courseId',getBatchesByCourseId)


module.exports = batchRouter;