const express = require('express');
const path = require('path');
const compression = require('compression');
const expressLayouts = require('express-ejs-layouts');
const app = express();
const PORT = process.env.PORT || 1234;

// Performance: Enable Gzip compression
app.use(compression());

// View engine setup
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layouts/main'); // Default layout

// Middleware to handle HTMX requests (disable layout)
app.use((req, res, next) => {
    if (req.headers['hx-request']) {
        req.app.set('layout', false);
    } else {
        req.app.set('layout', 'layouts/main');
    }
    next();
});

// Performance: Cache static files for 1 day
const oneDay = 86400000;
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: oneDay,
    etag: true
}));

// Routes
const studentRoutes = require('./routes/student');

// Landing Page
app.get('/', (req, res) => {
    res.render('index', {
        title: 'Lumina - AI Learning Platform',
        layout: false // Landing page has its own structure
    });
});

// Auth
app.get('/login', (req, res) => {
    res.render('login', {
        title: 'Login - Lumina',
        layout: false // Login page has its own structure
    });
});

// Mount Student Routes
app.use('/student', studentRoutes);

// Placeholder Routes (Teacher/Admin)
app.get('/teacher/dashboard', (req, res) => {
    res.render('teacher/dashboard', { title: 'Teacher Dashboard', layout: false });
});
app.get('/admin/dashboard', (req, res) => {
    res.render('admin/dashboard', { title: 'Admin Dashboard', layout: false });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
