const express = require('express');
const {createCourse,getAllCourses,getLatestCourses,getCoursesByCategory,getLatestCoursesByCategory,getCoursesBySubcategory,getLatestCoursesBySubcategory,getCourseById,purchaseCourse,ad, addLecturesToBatch, batchDetailsById}=require('../controller/course.controller')
const authenticateToken = require('../middleware/authToken.middleware');

const courseRouter = express.Router();


courseRouter.post('/course/createCourse', createCourse);
courseRouter.get('/course/getAllCourse', getAllCourses);
courseRouter.get('/course/getLatestCourses', getLatestCourses);
courseRouter.get('/course/getCoursesByCategory/:category', getCoursesByCategory);
courseRouter.get('/course/getLatestCoursesByCategory/:category', getLatestCoursesByCategory);

courseRouter.get('/course/getCoursesBySubcategory/:category', getCoursesBySubcategory);
courseRouter.get('/course/getLatestCoursesBySubcategory/:category', getLatestCoursesBySubcategory);
courseRouter.get('/getCourseDetails/:courseId',getCourseById)
courseRouter.get('/course/getPurchasedCourses',authenticateToken,purchaseCourse)
courseRouter.post('/course/addLecture',addLecturesToBatch)
courseRouter.get('/batchdetails/:id',batchDetailsById)

module.exports = courseRouter;