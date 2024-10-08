const express = require('express');
const {createCourse,getAllCourses,getLatestCourses,getCoursesByCategory,getLatestCoursesByCategory,getCoursesBySubcategory,getLatestCoursesBySubcategory,getCourseById}=require('../controller/course.controller')


const courseRouter = express.Router();


courseRouter.post('/course/createCourse', createCourse);
courseRouter.get('/course/getAllCourse', getAllCourses);
courseRouter.get('/course/getLatestCourses', getLatestCourses);
courseRouter.get('/course/getCoursesByCategory/:category', getCoursesByCategory);
courseRouter.get('/course/getLatestCoursesByCategory/:category', getLatestCoursesByCategory);

courseRouter.get('/course/getCoursesBySubcategory/:category', getCoursesBySubcategory);
courseRouter.get('/course/getLatestCoursesBySubcategory/:category', getLatestCoursesBySubcategory);


module.exports = courseRouter;