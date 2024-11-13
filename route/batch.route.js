const express = require('express');
const {createBatch, getBatchesByCourseId, AddFile, deleteBatch, editBatch}=require('../controller/batch.controller')



const batchRouter = express.Router();


batchRouter.post('/batch/createBatch/:courseId', createBatch);
batchRouter.get('/getBatchesByCourseId/:courseId',getBatchesByCourseId)
batchRouter.get('/batch/deleteBatch/:courseId/:batchId',deleteBatch)
batchRouter.post('/batch/editBatch/:batchId',editBatch)
batchRouter.get('/addFile',AddFile)


module.exports = batchRouter;