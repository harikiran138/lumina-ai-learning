# 👨‍💻 DEVELOPER GUIDE - Lumina AI Learning Platform

Complete development reference for working with the Lumina AI Learning codebase.

---

## 📋 **TABLE OF CONTENTS**

1. [Getting Started](#getting-started)
2. [Development Environment Setup](#development-environment-setup)
3. [Project Structure](#project-structure)
4. [Core Concepts](#core-concepts)
5. [Working with Modules](#working-with-modules)
6. [Common Tasks](#common-tasks)
7. [Debugging Guide](#debugging-guide)
8. [Best Practices](#best-practices)
9. [Performance Optimization](#performance-optimization)
10. [Deployment Checklist](#deployment-checklist)

---

## 🚀 **GETTING STARTED**

### Prerequisites

- Node.js 18+ ([Download](https://nodejs.org/))
- npm 9+ (included with Node.js)
- Code editor (VS Code recommended)
- Git for version control

### Quick Setup

```bash
# 1. Clone repository
git clone https://github.com/harikiran138/lumina-ai-learning.git
cd lumina-ai-learning

# 2. Install dependencies
npm install

# 3. Start development server
npm start

# 4. Open browser
# Visit http://localhost:1234
```

### First Run Experience

1. Development server starts automatically
2. Hot reload enabled (changes reflect instantly)
3. Open http://localhost:1234 in your browser
4. Login with demo account: `student@lumina.com` / `student123`

---

## 🔧 **DEVELOPMENT ENVIRONMENT SETUP**

### VS Code Extensions (Recommended)

```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-javascript-debug",
    "GitHub.copilot"
  ]
}
```

**Installation**:
1. Open VS Code
2. Press `Ctrl+Shift+X` (Cmd+Shift+X on Mac)
3. Search for extension name
4. Click "Install"

### Configuration Files

**`.prettierrc`** (Code formatting)
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

**`.eslintrc.json`** (Code linting)
```json
{
  "env": {
    "browser": true,
    "es2021": true
  },
  "extends": "eslint:recommended"
}
```

### Terminal Setup

**Windows (PowerShell)**:
```powershell
# Install packages
npm install

# Start dev server
npm start
```

**Mac/Linux (Bash)**:
```bash
# Install packages
npm install

# Start dev server
npm start
```

---

## 📁 **PROJECT STRUCTURE**

### Directory Organization

```
lumina-ai-learning/
│
├── 📄 Documentation Files
│   ├── README.md
│   ├── QUICK_START.md
│   ├── REDESIGN_SUMMARY.md
│   ├── FEATURES_DOCUMENTATION.md
│   ├── DOCUMENTATION_INDEX.md
│   └── DEVELOPER_GUIDE.md (this file)
│
├── 🔧 Configuration Files
│   ├── package.json              # Dependencies & scripts
│   ├── vercel.json               # Vercel deployment config
│   ├── build.sh                  # Custom build script
│   └── .gitignore                # Git ignore patterns
│
├── 📁 src/                       # Source files
│   ├── 📄 index.html             # Landing page
│   ├── 📄 login.html             # Login page
│   │
│   ├── 📁 student/               # Student pages (13 files)
│   │   ├── dashboard.html        # Main dashboard
│   │   ├── course_explorer.html  # Course discovery
│   │   ├── profile.html          # User profile
│   │   ├── settings.html         # Account settings
│   │   ├── ai_tutor.html         # AI tutoring
│   │   ├── assessment.html       # Assessment page
│   │   ├── assessment_result.html # Assessment results
│   │   ├── lesson_page.html      # Lesson content
│   │   ├── my_notes.html         # Notes page
│   │   ├── progress_streaks.html # Progress tracking
│   │   ├── leaderboard.html      # Leaderboard
│   │   └── community.html        # Community hub
│   │
│   ├── 📁 teacher/               # Teacher pages (5 files)
│   │   ├── dashboard.html        # Teacher dashboard
│   │   ├── content_upload.html   # Content management
│   │   ├── assessment_management.html
│   │   ├── reports.html          # Analytics
│   │   └── community.html        # Moderation
│   │
│   ├── 📁 admin/                 # Admin pages (2 files)
│   │   ├── dashboard.html        # Admin dashboard
│   │   └── community.html        # Community management
│   │
│   ├── 📁 js/                    # JavaScript modules (20 files)
│   │   ├── database.js           # IndexedDB management
│   │   ├── courses-data.js       # Course database
│   │   ├── messaging-system.js   # Messaging module
│   │   ├── profile-manager.js    # Profile management
│   │   ├── notifications.js      # Notifications module
│   │   ├── navigation.js         # Navigation builder
│   │   ├── api.js                # API layer
│   │   ├── utils.js              # Utility functions
│   │   ├── validation.js         # Form validation
│   │   ├── analytics.js          # Analytics tracking
│   │   └── [other modules]       # Additional modules
│   │
│   └── 📁 css/                   # Styling
│       └── styles.css            # Global styles & design system
│
├── 📁 dist/                      # Build output (generated)
│   └── [compiled files]          # Created by npm run build
│
└── 📁 node_modules/              # Dependencies (generated)
    └── [packages]                # Created by npm install
```

### Key Files to Know

| File | Purpose | Type |
|------|---------|------|
| `package.json` | Dependencies & npm scripts | Config |
| `src/js/database.js` | IndexedDB initialization & management | Core |
| `src/js/courses-data.js` | 15-course database | Data |
| `src/css/styles.css` | Global CSS & design system | Styles |
| `src/index.html` | Landing page | Entry |
| `src/student/dashboard.html` | Student main page | Page |

---

## 🎯 **CORE CONCEPTS**

### 1. Module Pattern

All major functionality uses the module pattern:

```javascript
// Pattern: IIFE + Global Instance
const ModuleName = (() => {
  // Private variables
  const privateVar = 'hidden';
  
  // Private functions
  const privateFunc = () => {};
  
  // Public API
  return {
    publicMethod: function() {
      return privateVar;
    }
  };
})();

// Make available globally
window.moduleName = ModuleName;
```

**Modules in the project**:
- `database` - Database operations
- `courses` - Course management
- `messagingSystem` - Messaging
- `profileManager` - User profiles
- `notificationsManager` - Notifications
- `navigationManager` - Navigation UI

### 2. CSS Variables

The entire design system uses CSS variables:

```css
/* Define in styles.css */
:root {
  --primary-color: #f59e0b;
  --secondary-color: #6b7280;
  --spacing-md: 1rem;
  --radius-sm: 0.375rem;
  --duration-base: 200ms;
}

/* Use anywhere */
.button {
  background-color: var(--primary-color);
  padding: var(--spacing-md);
  border-radius: var(--radius-sm);
  transition: all var(--duration-base) ease;
}
```

**Benefits**:
- Change entire theme by updating variables
- Consistent spacing and colors
- Easy dark mode support
- Maintainable codebase

### 3. IndexedDB Structure

Client-side database with multiple stores:

```javascript
// Database initialization
const DB_NAME = 'LuminaDB';
const DB_VERSION = 1;

const STORES = {
  users: 'id, email',
  courses: 'id, category',
  progress: 'id, studentId, courseId',
  messages: 'id, timestamp',
  assessments: 'id, courseId',
  // ...
};
```

**Usage Pattern**:
```javascript
// Open database
const db = await openDB('LuminaDB');

// Get data
const user = await db.get('users', 'user1');

// Put data
await db.put('users', {...userObj});

// Query
const courseUsers = await db.getAllFromIndex('progress', 'courseId', 'course1');

// Delete
await db.delete('messages', 'msg1');
```

### 4. Event System

Components use an event subscription pattern:

```javascript
// Module subscribes to events
messagingSystem.subscribe('messageReceived', (message) => {
  console.log('New message:', message);
  updateUI(message);
});

// Another module emits events
messagingSystem.notify('messageReceived', newMessage);
```

### 5. Role-Based Access

Different features based on user role:

```javascript
const user = await getCurrentUser();

if (user.role === 'student') {
  // Show student dashboard
} else if (user.role === 'teacher') {
  // Show teacher dashboard
} else if (user.role === 'admin') {
  // Show admin dashboard
}
```

---

## 🧩 **WORKING WITH MODULES**

### Database Module (`database.js`)

**Initialization**:
```javascript
await window.luminaDB.init();
```

**Common Operations**:
```javascript
// Get current user
const user = await window.luminaDB.getCurrentUser();

// Add course to progress
await window.luminaDB.enrollStudent('student1', 'course1');

// Get user progress
const progress = await window.luminaDB.getStudentProgress('student1', 'course1');

// Update progress
await window.luminaDB.updateProgress('student1', 'course1', { progress: 50 });
```

### Courses Module (`courses-data.js`)

**Available Functions**:
```javascript
// Get all courses
const courses = window.getAllCourses();

// Get specific course
const course = window.getCourseById('python101');

// Filter by category
const mathCourses = window.getCoursesByCategory('Mathematics');

// Filter by level
const beginnerCourses = window.getCoursesByLevel('Beginner');

// Search courses
const results = window.searchCourses('python');

// Get featured courses
const featured = window.getFeaturedCourses();

// Get categories
const categories = window.getCategories();
```

### Messaging Module (`messaging-system.js`)

**Key Methods**:
```javascript
const msg = window.messagingSystem;

// Send direct message
await msg.sendDirectMessage('recipient123', 'Hello!');

// Send room message
await msg.sendRoomMessage('room1', 'Hi everyone!');

// Get messages
const messages = await msg.getRoomMessages('room1');

// Mark as read
await msg.markAsRead('msg123');

// Edit message
await msg.editMessage('msg123', 'Updated text');

// Add reaction
await msg.addReaction('msg123', '👍');

// Subscribe to updates
msg.subscribe('messageReceived', (msg) => {
  console.log('New message:', msg);
});
```

### Profile Module (`profile-manager.js`)

**Key Methods**:
```javascript
const profile = window.profileManager;

// Get user profile
const user = await profile.getUserProfile('user123');

// Update profile
await profile.updateProfile('user123', {
  name: 'John Doe',
  bio: 'New bio'
});

// Get statistics
const stats = await profile.getUserStatistics('user123');

// Award badge
await profile.awardBadge('user123', {
  id: 'badge1',
  name: 'First Step'
});

// Get badges
const badges = await profile.getUserBadges('user123');

// Change password
await profile.changePassword('user123', oldPwd, newPwd);
```

### Notifications Module (`notifications.js`)

**Usage Examples**:
```javascript
const notify = window.notificationsManager;

// Show notifications
notify.success('Success!', 'Action completed');
notify.error('Error!', 'Something went wrong');
notify.warning('Warning!', 'Be careful');
notify.info('Info', 'FYI...');

// Get all notifications
const all = notify.getAll();

// Get unread
const unread = notify.getUnreadNotifications();

// Mark as read
notify.markAsRead('notif1');

// Clear all
notify.clearAll();
```

### Navigation Module (`navigation.js`)

**Setup Navigation**:
```javascript
// Initialize
await window.navigationManager.init();

// Generate top nav
const topNav = window.navigationManager.generateTopNav('student');

// Generate sidebar
const sidebar = window.navigationManager.generateSidebar('student');

// Get navigation links
const links = window.navigationManager.getNavLinks('student');
```

---

## 📋 **COMMON TASKS**

### Adding a New Course

**File**: `src/js/courses-data.js`

```javascript
// Add to COURSES_DATABASE object
{
  id: "new_course",
  name: "Course Name",
  category: "Computer Science",
  level: "Beginner",
  description: "Course description",
  instructor: {
    id: "instructor1",
    name: "Instructor Name",
    email: "instructor@email.com"
  },
  rating: 4.8,
  reviews: 120,
  students: 456,
  price: 49.99,
  modules: 5,
  lessons: 23,
  videos: 23,
  quizzes: 8,
  assignments: 4,
  totalHours: 48,
  duration: "12 weeks",
  objectives: [
    "Learn basics",
    "Build projects"
  ]
}
```

### Creating a New Page

**Step 1: Create HTML file**
```html
<!-- src/student/new_page.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Page Title</title>
  <link rel="stylesheet" href="../css/styles.css">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>
  <!-- Include all required scripts -->
  <script src="../js/database.js"></script>
  <script src="../js/courses-data.js"></script>
  <script src="../js/messaging-system.js"></script>
  <script src="../js/profile-manager.js"></script>
  <script src="../js/notifications.js"></script>
  <script src="../js/navigation.js"></script>

  <!-- Page content -->
  <div id="app">
    <!-- Navigation will be inserted here -->
  </div>

  <!-- Page-specific script -->
  <script>
    (async function() {
      // Initialize database
      await window.luminaDB.init();
      
      // Setup navigation
      const topNav = window.navigationManager.generateTopNav('student');
      const sidebar = window.navigationManager.generateSidebar('student');
      
      // Get current user
      const user = await window.luminaDB.getCurrentUser();
      if (!user) {
        window.location.href = '../login.html';
        return;
      }

      // Your page logic here
      console.log('Page initialized');
    })();
  </script>
</body>
</html>
```

### Modifying the Design System

**File**: `src/css/styles.css`

```css
/* Update color variables */
:root {
  --amber-500: #f59e0b; /* Change hex value */
  --new-color: #0066ff; /* Add new color */
}

/* Add new button style */
.btn-new {
  background-color: var(--new-color);
  color: white;
  padding: var(--space-md);
  border-radius: var(--radius-md);
  border: none;
  cursor: pointer;
  transition: all var(--duration-base) ease;
}

.btn-new:hover {
  opacity: 0.9;
  transform: translateY(-2px);
}
```

### Adding a New Feature to Dashboard

**File**: `src/student/dashboard.html`

```html
<!-- Add new section -->
<section class="card">
  <h2 class="text-2xl font-bold mb-4">New Feature Title</h2>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <!-- Feature content -->
  </div>
</section>
```

### Handling Form Submission

```javascript
// Get form
const form = document.getElementById('myForm');

// Add event listener
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // Get form data
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);
  
  try {
    // Process data
    await window.profileManager.updateProfile(userId, data);
    
    // Show success
    window.notificationsManager.success('Success', 'Changes saved');
  } catch (error) {
    // Show error
    window.notificationsManager.error('Error', error.message);
  }
});
```

---

## 🐛 **DEBUGGING GUIDE**

### Browser DevTools

**Open DevTools**: Press `F12` or `Ctrl+Shift+I`

**Tabs**:
- **Console**: View logs and errors
- **Elements**: Inspect HTML/CSS
- **Network**: Monitor requests
- **Application**: View storage (IndexedDB, localStorage)
- **Sources**: Debug JavaScript

### Logging

```javascript
// Log messages
console.log('Regular log:', variable);
console.info('Info message');
console.warn('Warning message');
console.error('Error message');

// Log objects nicely
console.table(arrayOfObjects);

// Log with formatting
console.log('%cStyled log', 'color: red; font-size: 16px;');

// Performance logging
console.time('myTimer');
// ... code to measure ...
console.timeEnd('myTimer');
```

### Debugging IndexedDB

**In Browser Console**:
```javascript
// Open database
const db = await idb.openDB('LuminaDB');

// List all stores
Object.keys(db.objectStoreNames).forEach(store => {
  console.log(`Store: ${store}`);
});

// Get all users
const users = await db.getAll('users');
console.table(users);

// Get specific user
const user = await db.get('users', 'user1');
console.log('User:', user);

// Check courses
const courses = await db.getAll('courses');
console.log(`${courses.length} courses found`);
```

### Debugging Modules

```javascript
// Check if modules loaded
console.log('Database:', window.luminaDB);
console.log('Courses:', window.getAllCourses());
console.log('Messaging:', window.messagingSystem);
console.log('Profile:', window.profileManager);
console.log('Notifications:', window.notificationsManager);
console.log('Navigation:', window.navigationManager);
```

### Common Issues

**Issue**: Page shows blank screen
```javascript
// Check if user is logged in
const user = await window.luminaDB.getCurrentUser();
console.log('Current user:', user);

// If null, need to login
if (!user) console.log('Not logged in');
```

**Issue**: Styles not applying
```css
/* Check specificity - use !important as last resort */
.class {
  color: red !important;
}

/* Or check if CSS file is loaded */
/* Open DevTools > Application > Stylesheets */
```

**Issue**: JavaScript errors in console
```javascript
// Check for typos
window.navigationManager.init() // Capital M
window.navigationmanager.init() // Wrong - lowercase m

// Check if function exists
console.log(typeof window.luminaDB.init); // Should be 'function'
```

---

## ✨ **BEST PRACTICES**

### Code Organization

✅ **Good**:
```javascript
// Group related functionality
const userModule = {
  getCurrentUser: async () => {},
  updateUser: async () => {},
  deleteUser: async () => {}
};
```

❌ **Bad**:
```javascript
// Mixed unrelated functions
async function getUser() {}
function calculateTax() {}
async function deleteMessage() {}
```

### Error Handling

✅ **Good**:
```javascript
try {
  const data = await fetchData();
  processData(data);
} catch (error) {
  console.error('Failed to fetch:', error);
  showErrorNotification('Failed to load data');
}
```

❌ **Bad**:
```javascript
// No error handling
const data = await fetchData();
processData(data);
```

### Naming Conventions

✅ **Good**:
```javascript
const getUserProfile = () => {} // Function
const isUserLoggedIn = true    // Boolean
const MAX_RETRIES = 3          // Constant
```

❌ **Bad**:
```javascript
const get_user_profile = () => {}  // Snake case
const _isUserLoggedIn = true       // Underscore prefix
const maxRetries = 3               // Variable named like constant
```

### Comments

✅ **Good**:
```javascript
// Calculate user's total learning hours
const totalHours = courses.reduce((sum, course) => {
  return sum + course.duration;
}, 0);
```

❌ **Bad**:
```javascript
// Add the hours
const totalHours = courses.reduce((sum, course) => {
  return sum + course.duration; // This is obvious
}, 0);
```

### Async Operations

✅ **Good**:
```javascript
// Use async/await
const data = await fetchData();
const processed = processData(data);
```

❌ **Bad**:
```javascript
// Callback hell
fetchData((data) => {
  processData(data, (result) => {
    saveData(result, () => {
      // Deeply nested
    });
  });
});
```

---

## ⚡ **PERFORMANCE OPTIMIZATION**

### Bundle Size

**Check what's included**:
```bash
npm run build
# Output shows dist size
```

### Optimize CSS

```css
/* ✅ Use classes instead of inline styles */
.highlight { color: red; }

/* ❌ Avoid inline styles */
<div style="color: red;">

/* ✅ Use CSS variables for common values */
:root { --spacing: 1rem; }

/* ❌ Avoid hardcoding values */
.box { margin: 1rem; padding: 1rem; }
```

### Optimize JavaScript

```javascript
/* ✅ Use event delegation */
document.addEventListener('click', (e) => {
  if (e.target.matches('.delete-btn')) {
    deleteItem(e.target);
  }
});

/* ❌ Add listeners to every element */
document.querySelectorAll('.delete-btn').forEach(btn => {
  btn.addEventListener('click', deleteItem);
});
```

### Lazy Loading

```javascript
/* Load modules only when needed */
const loadModule = () => {
  return import('../js/heavy-module.js');
};

// Only load when user interacts
button.addEventListener('click', async () => {
  const module = await loadModule();
  module.run();
});
```

---

## 🚀 **DEPLOYMENT CHECKLIST**

Before deploying to production:

- [ ] **Testing**
  - [ ] All pages load correctly
  - [ ] No console errors
  - [ ] Navigation works
  - [ ] Forms submit properly
  - [ ] Dark mode toggles
  - [ ] Responsive on mobile

- [ ] **Performance**
  - [ ] CSS minified
  - [ ] JavaScript minified
  - [ ] Images optimized
  - [ ] Page loads < 2 seconds
  - [ ] No unused code

- [ ] **Security**
  - [ ] No API keys in code
  - [ ] User input validated
  - [ ] No sensitive data in localStorage
  - [ ] HTTPS enforced
  - [ ] CSP headers set

- [ ] **Accessibility**
  - [ ] Alt text on images
  - [ ] Keyboard navigation works
  - [ ] Color contrast sufficient
  - [ ] Form labels present
  - [ ] ARIA labels where needed

- [ ] **Documentation**
  - [ ] README updated
  - [ ] CHANGELOG created
  - [ ] API documentation current
  - [ ] Environment variables documented
  - [ ] Deployment steps clear

- [ ] **Configuration**
  - [ ] Environment variables set
  - [ ] Database migrations run
  - [ ] Cache cleared
  - [ ] CDN configured
  - [ ] Monitoring enabled

### Deploy Command

```bash
# Build production version
npm run build

# Verify build
npm run start # Test locally

# Deploy
vercel --prod
```

---

## 📚 **ADDITIONAL RESOURCES**

### Useful Tools

- [MDN Web Docs](https://developer.mozilla.org/)
- [Can I Use](https://caniuse.com/)
- [CSS Tricks](https://css-tricks.com/)
- [Dev.to](https://dev.to/)
- [Stackoverflow](https://stackoverflow.com/)

### Learning Resources

- [JavaScript Fundamentals](https://javascript.info/)
- [ES6+ Features](https://es6.io/)
- [CSS Grid Guide](https://css-tricks.com/snippets/css/complete-guide-grid/)
- [Flexbox Guide](https://css-tricks.com/snippets/css/a-guide-to-flexbox/)

### Development Tools

- VS Code
- Chrome DevTools
- Git & GitHub
- npm & Node.js
- Parcel (build tool)

---

## 🤝 **GETTING HELP**

### Documentation
- Check [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)
- Review [FEATURES_DOCUMENTATION.md](FEATURES_DOCUMENTATION.md)
- See [QUICK_START.md](QUICK_START.md)

### Issues
- Create GitHub Issue
- Check existing issues
- Provide error message & steps to reproduce

### Community
- Check GitHub Discussions
- Search Stack Overflow
- Ask in community forums

---

## 📝 **VERSION HISTORY**

- **v2.0** - Complete redesign (Nov 2025)
- **v1.0** - Initial release

---

**Last Updated**: November 26, 2025  
**Maintained By**: Lumina AI Learning Team
