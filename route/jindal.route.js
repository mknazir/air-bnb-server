const express = require('express');
const { jindalCreateCourse, getjindalCourseDetails } = require('../controller/jndal.controller');
const jindalRouter = express.Router();
jindalRouter.post('/course/jindalcreateCourse', jindalCreateCourse);
jindalRouter.get('/course/jindalcoursedetails/:courseId', getjindalCourseDetails);
module.exports =jindalRouter;

  