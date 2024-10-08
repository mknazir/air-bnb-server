const express = require('express');
const {createCourse,getAllCourses,getLatestCourses,getCoursesByCategory,getCoursesBySubcategory,getCourseById}=require('../controller/course.controller')


const courseRouter = express.Router();


courseRouter.post('/course/createCourse', createCourse);
courseRouter.get('/course/getAllCourse', getAllCourses);
courseRouter.get('/course/getLatestCourses', getLatestCourses);
courseRouter.get('/course/getCoursesByCategory/:category', getCoursesByCategory);
courseRouter.get('/course/getCoursesBySubcategory', getCoursesBySubcategory);


module.exports = courseRouter;