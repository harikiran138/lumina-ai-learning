const db = require('../models/db');

exports.getDashboard = (req, res) => {
    const user = db.get('users')[0];
    res.render('student/dashboard', {
        title: 'Student Dashboard',
        path: '/student/dashboard',
        layout: 'layouts/main',
        user: user
    });
};

exports.getAiTutor = (req, res) => {
    const user = db.get('users')[0];
    res.render('student/ai_tutor', {
        title: 'AI Tutor',
        path: '/student/ai-tutor',
        layout: 'layouts/main',
        user: user
    });
};

exports.getCourses = (req, res) => {
    const user = db.get('users')[0];
    const courses = db.get('courses');
    res.render('student/course_explorer', {
        title: 'Course Explorer',
        path: '/student/courses',
        layout: 'layouts/main',
        user: user,
        courses: courses
    });
};

exports.getNotes = (req, res) => {
    const user = db.get('users')[0];
    const notes = db.get('notes');
    res.render('student/my_notes', {
        title: 'My Notes',
        path: '/student/notes',
        layout: 'layouts/main',
        user: user,
        notes: notes
    });
};

exports.getProgress = (req, res) => {
    const user = db.get('users')[0];
    res.render('student/progress_streaks', {
        title: 'My Progress',
        path: '/student/progress',
        layout: 'layouts/main',
        user: user
    });
};

exports.getLeaderboard = (req, res) => {
    const user = db.get('users')[0];
    res.render('student/leaderboard', {
        title: 'Leaderboard',
        path: '/student/leaderboard',
        layout: 'layouts/main',
        user: user
    });
};

exports.getCommunity = (req, res) => {
    const user = db.get('users')[0];
    res.render('student/community', {
        title: 'Community',
        path: '/student/community',
        layout: 'layouts/main',
        user: user
    });
};

