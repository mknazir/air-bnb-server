const express = require('express');
const { jindalCreateCourse, getjindalCourseDetails, createOrder, verifyOrder } = require('../controller/jndal.controller');
const jindalRouter = express.Router();
jindalRouter.post('/course/jindalcreateCourse', jindalCreateCourse);
jindalRouter.get('/course/jindalcoursedetails/:courseId', getjindalCourseDetails);
jindalRouter.post('/jindal/createOrder', createOrder);
jindalRouter.post('/jindal/verifyOrder',verifyOrder)
module.exports =jindalRouter;

  