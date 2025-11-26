const express = require('express');
const path = require('path');
const compression = require('compression');
const app = express();
const PORT = process.env.PORT || 3000;

// Performance: Enable Gzip compression
app.use(compression());

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Performance: Cache static files for 1 day
const oneDay = 86400000;
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: oneDay,
    etag: true
}));

// Routes

// Landing Page
app.get('/', (req, res) => {
    res.render('index', { title: 'Lumina - AI Learning Platform' });
});

// Auth
app.get('/login', (req, res) => {
    res.render('login', { title: 'Login - Lumina' });
});

// Student Routes
app.get('/student/dashboard', (req, res) => {
    res.render('student/dashboard', {
        title: 'Student Dashboard',
        path: '/student/dashboard',
        user: { name: 'Alex Turner', role: 'Student' }
    });
});

app.get('/student/ai-tutor', (req, res) => {
    res.render('student/ai_tutor', {
        title: 'AI Tutor',
        path: '/student/ai-tutor',
        user: { name: 'Alex Turner', role: 'Student' }
    });
});

app.get('/student/courses', (req, res) => {
    res.render('student/course_explorer', {
        title: 'Course Explorer',
        path: '/student/courses',
        user: { name: 'Alex Turner', role: 'Student' }
    });
});

app.get('/student/notes', (req, res) => {
    res.render('student/my_notes', {
        title: 'My Notes',
        path: '/student/notes',
        user: { name: 'Alex Turner', role: 'Student' }
    });
});

app.get('/student/progress', (req, res) => {
    res.render('student/progress_streaks', {
        title: 'My Progress',
        path: '/student/progress',
        user: { name: 'Alex Turner', role: 'Student' }
    });
});

app.get('/student/leaderboard', (req, res) => {
    res.render('student/leaderboard', {
        title: 'Leaderboard',
        path: '/student/leaderboard',
        user: { name: 'Alex Turner', role: 'Student' }
    });
});

app.get('/student/community', (req, res) => {
    res.render('student/community', {
        title: 'Community',
        path: '/student/community',
        user: { name: 'Alex Turner', role: 'Student' }
    });
});

// Teacher Routes
app.get('/teacher/dashboard', (req, res) => {
    res.render('teacher/dashboard', {
        title: 'Teacher Dashboard',
        path: '/teacher/dashboard',
        user: { name: 'Sarah Connor', role: 'Teacher' }
    });
});

// Admin Routes
app.get('/admin/dashboard', (req, res) => {
    res.render('admin/dashboard', {
        title: 'Admin Dashboard',
        path: '/admin/dashboard',
        user: { name: 'Admin User', role: 'Admin' }
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
