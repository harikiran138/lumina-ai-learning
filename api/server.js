/**
 * Lumina Community PostgreSQL Vector Database API Server
 * Express server with pgvector integration for semantic search
 */

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Serve static frontend files from the root lumnia directory
app.use(express.static(path.join(__dirname, '..')));

// Serve static files from the js directory explicitly
app.use('/js', express.static(path.join(__dirname, '..', 'js')));

// Database connection
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'lumina_community',
    user: process.env.DB_USER || 'lumina_user',
    password: process.env.DB_PASSWORD || 'lumina_pass',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://lumina.edu', 'https://www.lumina.edu']
        : ['http://localhost:8080', 'http://127.0.0.1:8080', 'http://localhost:3000', 'http://localhost:9000', 'http://localhost:8000']
}));

app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute window
    max: 120, // allow 120 requests per minute (2 per second)
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// Optional authentication middleware (doesn't require token)
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (!err) {
                req.user = user;
            }
            next();
        });
    } else {
        next();
    }
};

// Demo users for different roles
const demoUsers = {
    'admin@lumina.com': {
        id: 'admin_user',
        name: 'Prof. Evelyn Reed (Admin)',
        email: 'admin@lumina.com',
        role: 'admin',
        avatar: 'A',
        color: 'bg-red-600'
    },
    'teacher@lumina.com': {
        id: 'teacher_user',
        name: 'Jane Doe (Teacher)',
        email: 'teacher@lumina.com',
        role: 'teacher',
        avatar: 'J',
        color: 'bg-green-600'
    },
    'student@lumina.com': {
        id: 'student_user',
        name: 'Student User',
        email: 'student@lumina.com',
        role: 'student',
        avatar: 'S',
        color: 'bg-blue-500'
    }
};

// Health check endpoint
app.get('/api/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({
            status: 'ok',
            database: 'connected',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Health check failed:', error);
        res.status(500).json({
            status: 'error',
            database: 'disconnected',
            error: error.message
        });
    }
});

// Login endpoint - accepts any email/password and uses selected role
app.post('/api/auth/login', async (req, res) => {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
        return res.status(400).json({ error: 'Email, password, and role are required' });
    }

    if (!['student', 'teacher', 'admin'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
    }

    try {
        // Create demo user based on selected role (no authentication required)
        const demoUsers = {
            student: {
                name: 'Demo Student',
                avatar: 'S',
                color: 'bg-blue-500'
            },
            teacher: {
                name: 'Demo Teacher',
                avatar: 'T',
                color: 'bg-green-600'
            },
            admin: {
                name: 'Demo Admin',
                avatar: 'A',
                color: 'bg-red-600'
            }
        };

        const userInfo = demoUsers[role];
        const userId = `demo_${role}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const user = {
            id: userId,
            email: email,
            role: role,
            name: userInfo.name,
            avatar: userInfo.avatar,
            color: userInfo.color,
            created_at: new Date().toISOString()
        };

        // Generate JWT token
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        res.json({
            message: 'Login successful',
            user: user,
            token: token
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
        return res.status(400).json({ error: 'Name, email, password, and role are required' });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    if (!['student', 'teacher', 'admin'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
    }

    try {
        // Check if user already exists
        const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(409).json({ error: 'User with this email already exists' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Generate user ID
        const userId = `${role}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Insert new user
        const result = await pool.query(
            'INSERT INTO users (id, name, email, password_hash, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, avatar, color, created_at',
            [userId, name, email, passwordHash, role]
        );

        const newUser = result.rows[0];

        // Generate token
        const token = jwt.sign(
            {
                id: newUser.id,
                email: newUser.email,
                role: newUser.role
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        res.status(201).json({
            message: 'Account created successfully',
            user: newUser,
            token: token
        });

    } catch (error) {
        console.error('Registration error:', error);
        // Enhanced error logging
        if (error.detail) {
            console.error('Database error detail:', error.detail);
        }
        if (error.code) {
            console.error('Database error code:', error.code);
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Other API routes and error handling omitted for brevity...

// Dynamic login page route
app.get('/login', (req, res) => {
    const loginHtml = `<!DOCTYPE html>
<html lang="en" class="">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login & Signup - Lumina</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">

    <!-- Lumina Core Scripts -->
    <script src="/js/postgresql-api.js"></script>
    <style>
        body {
            font-family: 'Inter', sans-serif;
        }
        .gradient-text {
            background: linear-gradient(to right, #f59e0b, #fbbf24);
            background-clip: text;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        #light-icon, #dark-icon { display: none; }
        html.dark #dark-icon { display: block; }
        html:not(.dark) #light-icon { display: block; }
    </style>
    <script>
        // On page load or when changing themes, best to add inline in \`head\` to avoid FOUC
        if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    </script>
</head>
<body class="bg-gray-50 dark:bg-black text-gray-800 dark:text-gray-300 transition-colors duration-300">

    <div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div class="absolute top-4 right-4 z-20">
             <button id="theme-toggle" class="p-2 rounded-lg bg-white/50 dark:bg-black/50 backdrop-blur-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800">
                <svg id="light-icon" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                <svg id="dark-icon" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            </button>
        </div>

        <div class="max-w-md w-full space-y-8">
            <div>
                <div class="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-gradient-to-r from-yellow-400 to-orange-500">
                    <svg class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                </div>
                <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
                    Welcome to <span class="gradient-text">Lumina</span>
                </h2>
                <p class="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                    Sign in to your account or create a new one
                </p>
            </div>

            <!-- Login Form -->
            <form id="signin-form" class="mt-8 space-y-6">
                <input type="hidden" name="remember" value="true" />
                <div class="rounded-md shadow-sm -space-y-px">
                    <div>
                        <label for="signin-email" class="sr-only">Email address</label>
                        <input id="signin-email" name="email" type="email" autocomplete="email" required class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-t-md focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 focus:z-10 sm:text-sm bg-white dark:bg-gray-800" placeholder="Email address">
                    </div>
                    <div>
                        <label for="signin-password" class="sr-only">Password</label>
                        <input id="signin-password" name="password" type="password" autocomplete="current-password" required class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 focus:z-10 sm:text-sm bg-white dark:bg-gray-800" placeholder="Password">
                    </div>
                    <div>
                        <label for="role" class="sr-only">Role</label>
                        <select id="role" name="role" required class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-b-md focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 focus:z-10 sm:text-sm bg-white dark:bg-gray-800">
                            <option value="">Select Role</option>
                            <option value="student">Student</option>
                            <option value="teacher">Teacher</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                </div>

                <div>
                    <button id="signin-btn" type="submit" class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors duration-200">
                        <span id="signin-text" class="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">Sign in</span>
                        <span id="signin-loading" class="hidden absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                            <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </span>
                    </button>
                </div>

                <div class="text-center">
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                        Demo accounts:
                        <button type="button" onclick="quickLogin('student')" class="text-yellow-600 hover:text-yellow-500 font-medium">Student</button> |
                        <button type="button" onclick="quickLogin('teacher')" class="text-yellow-600 hover:text-yellow-500 font-medium">Teacher</button> |
                        <button type="button" onclick="quickLogin('admin')" class="text-yellow-600 hover:text-yellow-500 font-medium">Admin</button>
                    </p>
                </div>
            </form>
        </div>
    </div>

    <script>
        // Theme toggle functionality
        const themeToggle = document.getElementById('theme-toggle');
        themeToggle.addEventListener('click', () => {
            const html = document.documentElement;
            if (html.classList.contains('dark')) {
                html.classList.remove('dark');
                localStorage.setItem('theme', 'light');
            } else {
                html.classList.add('dark');
                localStorage.setItem('theme', 'dark');
            }
        });

        // Quick login functionality
        async function quickLogin(role) {
            // For demo purposes, accept any email/password and use selected role
            const demoEmails = {
                admin: 'demo-admin@lumina.com',
                teacher: 'demo-teacher@lumina.com',
                student: 'demo-student@lumina.com'
            };

            const email = demoEmails[role] || 'demo@lumina.com';
            const password = 'demo123';

            document.getElementById('signin-email').value = email;
            document.getElementById('signin-password').value = password;

            // Set role in the role select dropdown
            const roleSelect = document.getElementById('role');
            if (roleSelect) {
                roleSelect.value = role;
            }

            // Trigger form submission
            document.getElementById('signin-form').dispatchEvent(new Event('submit'));
        }

        // Handle sign in
        async function handleSignIn(event) {
            event.preventDefault();

            const email = document.getElementById('signin-email').value;
            const password = document.getElementById('signin-password').value;
            const role = document.getElementById('role').value;
            const submitBtn = document.getElementById('signin-btn');
            const submitText = document.getElementById('signin-text');
            const submitLoading = document.getElementById('signin-loading');

            // Show loading state
            submitText.classList.add('hidden');
            submitLoading.classList.remove('hidden');
            submitBtn.disabled = true;

            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: email,
                        password: password,
                        role: role
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    // Store user data and token
                    localStorage.setItem('user', JSON.stringify(data.user));
                    localStorage.setItem('token', data.token);

                    // Show success notification
                    showNotification('Login successful! Redirecting...', 'success');

                    // Redirect to appropriate dashboard based on role
                    setTimeout(() => {
                        redirectToDashboard(data.user.role);
                    }, 1000);
                } else {
                    throw new Error(data.error || 'Login failed');
                }

            } catch (error) {
                console.error('Login failed:', error);
                showNotification(error.message || 'Login failed', 'error');
            } finally {
                // Reset button state
                submitText.classList.remove('hidden');
                submitLoading.classList.add('hidden');
                submitBtn.disabled = false;
            }
        }

        // Redirect to dashboard based on role
        function redirectToDashboard(role) {
            const dashboards = {
                student: '/student/dashboard.html',
                teacher: '/teacher/dashboard.html',
                admin: '/admin/dashboard.html'
            };

            const dashboardUrl = dashboards[role] || '/student/dashboard.html';
            window.location.href = dashboardUrl;
        }

        // Notification system
        function showNotification(message, type = 'info') {
            // Remove existing notifications
            const existingNotifications = document.querySelectorAll('.notification');
            existingNotifications.forEach(notification => notification.remove());

            const notification = document.createElement('div');
            notification.className = \`notification fixed top-4 right-4 z-50 p-4 rounded-md shadow-lg transition-all duration-300 transform translate-x-full\`;

            if (type === 'success') {
                notification.classList.add('bg-green-500', 'text-white');
            } else if (type === 'error') {
                notification.classList.add('bg-red-500', 'text-white');
            } else {
                notification.classList.add('bg-blue-500', 'text-white');
            }

            notification.textContent = message;
            document.body.appendChild(notification);

            // Animate in
            setTimeout(() => {
                notification.classList.remove('translate-x-full');
            }, 100);

            // Auto remove after 3 seconds
            setTimeout(() => {
                notification.classList.add('translate-x-full');
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }, 3000);
        }

        // Event listeners
        document.getElementById('signin-form').addEventListener('submit', handleSignIn);
    </script>
</body>
</html>`;
    res.send(loginHtml);
});

// Start server
app.listen(port, () => {
    console.log(`🚀 Lumina PostgreSQL API Server running on port ${port}`);
    console.log(`📊 Health check: http://localhost:${port}/api/health`);
    console.log(`🔍 API docs: http://localhost:${port}/api/`);
    console.log(`🔐 Dynamic login page: http://localhost/login`);

    // Test database connection
    pool.query('SELECT NOW()', (err, result) => {
        if (err) {
            console.error('❌ Database connection failed:', err.message);
        } else {
            console.log('✅ Database connected successfully');
        }
    });
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down server...');
    await pool.end();
    process.exit(0);
});
