const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');

router.get('/dashboard', studentController.getDashboard);
router.get('/ai-tutor', studentController.getAiTutor);
router.get('/courses', studentController.getCourses);
router.get('/notes', studentController.getNotes);
router.get('/progress', studentController.getProgress);
router.get('/leaderboard', studentController.getLeaderboard);
router.get('/community', studentController.getCommunity);

module.exports = router;
