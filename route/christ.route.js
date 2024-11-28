const express = require('express');
const { christCreateCourse, getchristCourseDetails, createOrder, verifyOrder,getAllchristCourses } = require('../controller/christ.controller')
const christRouter = express.Router();
christRouter.post('/course/christcreateCourse', christCreateCourse);
christRouter.get('/course/getAllchristCourses', getAllchristCourses);
christRouter.get('/course/christcoursedetails/:courseId', getchristCourseDetails);
christRouter.post('/christ/createOrder', createOrder);
christRouter.post('/christ/verifyOrder',verifyOrder)
module.exports =christRouter;
