const express = require('express');
const {createBatch}=require('../controller/batch.controller')



const batchRouter = express.Router();


batchRouter.post('/batch/createBatch/:courseId', createBatch);


module.exports = batchRouter;