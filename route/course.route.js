const express = require('express');
const {createCourse,getAllCourses,getLatestCourses,getCoursesByCategory,getLatestCoursesByCategory,getCoursesBySubcategory,getLatestCoursesBySubcategory,getCourseById,purchaseCourse,ad, addLecturesToBatch, batchDetailsById, deactivateCourseById, getLectureDetails, editLectureInBatch, deleteLectureFromBatch, getAllInstructors, editInstructorDetails, deleteInstructor, addInstructorDetails, editCourse,uploadCertificate}=require('../controller/course.controller')
const authenticateToken = require('../middleware/authToken.middleware');

const courseRouter = express.Router();


courseRouter.post('/course/createCourse', createCourse);
courseRouter.post('/course/editCourse/:courseId', editCourse);
courseRouter.get('/course/getAllCourse', getAllCourses);
courseRouter.get('/course/getLatestCourses', getLatestCourses);
courseRouter.get('/course/getCoursesByCategory/:category', getCoursesByCategory);
courseRouter.get('/course/getLatestCoursesByCategory/:category', getLatestCoursesByCategory);
courseRouter.get('/course/getCoursesBySubcategory/:category', getCoursesBySubcategory);
courseRouter.get('/course/getLatestCoursesBySubcategory/:category', getLatestCoursesBySubcategory);
courseRouter.get('/getCourseDetails/:courseId',getCourseById)
courseRouter.get('/course/getPurchasedCourses',authenticateToken,purchaseCourse)
courseRouter.get('/course/deactivateCourseById/:courseId',deactivateCourseById)
courseRouter.post('/course/addLecture',addLecturesToBatch)
courseRouter.post('/course/editLecture',editLectureInBatch)
courseRouter.get('/course/deleteLectureFromBatch/:batch_id/:lecture_id',deleteLectureFromBatch)
courseRouter.get('/batchdetails/:id',batchDetailsById)
courseRouter.get('/getLectureDetails/:batchId/:lectureId',getLectureDetails)
courseRouter.get('/getAllInstructors',getAllInstructors)
courseRouter.post('/addInstructorDetails',addInstructorDetails)
courseRouter.post('/editInstructorDetails/:instructorId',editInstructorDetails)
courseRouter.get('/deleteInstructor/:instructorId',deleteInstructor)
courseRouter.post('/uploadCertificate',uploadCertificate)


module.exports = courseRouter;