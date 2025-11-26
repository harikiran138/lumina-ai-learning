# Lumina AI Learning Platform

> AI-powered personalized learning management system with intelligent tutoring and adaptive assessments

[![Vercel](https://vercelbadge.vercel.app/api/harikiran138/lumina-ai-learning)](https://lumina-ai-learning.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🌟 Features

- **🤖 AI-Powered Tutoring** - Personalized learning assistance using Google Gemini AI
- **📊 Adaptive Dashboards** - Role-based interfaces for students, teachers, and administrators
- **📈 Progress Tracking** - Real-time learning analytics and mastery tracking
- **🎯 Smart Assessments** - Adaptive quizzes with intelligent feedback
- **💬 Community Hub** - Moderated discussion forums with AI content filtering
- **📱 Responsive Design** - Mobile-first design using Tailwind CSS
- **🌙 Dark Mode** - Full dark mode support across all pages

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/harikiran138/lumina-ai-learning.git
cd lumina-ai-learning

# Install dependencies
npm install
```

### Development

```bash
# Start development server
npm start

# Open http://localhost:1234
```

### Build

```bash
# Clean previous builds
npm run clean

# Build for production
npm run build

# Output will be in dist/
```

## 📁 Project Structure

```
lumina-ai-learning/
├── src/
│   ├── index.html              # Landing page
│   ├── login.html              # Authentication page
│   ├── admin/                  # Admin dashboard & tools
│   │   ├── dashboard.html
│   │   └── community.html
│   ├── teacher/                # Teacher portal
│   │   ├── dashboard.html
│   │   ├── content_upload.html
│   │   ├── assessment_management.html
│   │   ├── reports.html
│   │   └── community.html
│   ├── student/                # Student portal
│   │   ├── dashboard.html
│   │   ├── ai_tutor.html
│   │   ├── course_explorer.html
│   │   ├── assessment.html
│   │   ├── my_notes.html
│   │   ├── progress_streaks.html
│   │   ├── leaderboard.html
│   │   └── community.html
│   └── js/                     # JavaScript modules
│       ├── database.js         # IndexedDB management
│       ├── api.js              # API layer
│       ├── dynamic-dashboard.js # Dashboard renderer
│       ├── gemini-ai.js         # AI integration
│       ├── utils.js            # Utility functions
│       ├── validation.js       # Form validation
│       └── analytics.js        # Vercel Analytics
├── build.sh                    # Custom build script
├── package.json                # Dependencies
├── vercel.json                 # Deployment config
└── README.md                   # This file
```

## 🔐 Authentication

### Demo Accounts

The application includes pre-configured demo accounts for testing:

| Role    | Email                   | Password     |
|---------|-------------------------|--------------|
| Admin   | admin@lumina.com        | admin123     |
| Teacher | teacher@lumina.com      | teacher123   |
| Student | student@lumina.com      | student123   |

**⚠️ Note**: These are demo credentials only. In production, implement proper authentication with secure password hashing.

## 🏗️ Architecture

### Technology Stack

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Styling**: Tailwind CSS (CDN)
- **Database**: IndexedDB (client-side storage)
- **Charts**: Chart.js
- **Build Tool**: Parcel 2
- **Deployment**: Vercel
- **Analytics**: Vercel Analytics
- **AI**: Google Gemini AI API

### Key Design Decisions

1. **Client-Side Storage**: Uses IndexedDB for offline-first functionality
2. **No Backend (Currently)**: All data stored locally in the browser
3. **Multi-Page Application**: Traditional MPA for simplicity and SEO
4. **Progressive Enhancement**: Works without JavaScript for basic content

## 📊 Data Structure

### IndexedDB Stores

- `users` - User profiles and authentication
- `courses` - Course information and content
- `student_progress` - Learning progress tracking
- `assessments` - Quiz and assignment data
- `notes` - Student notes
- `chat_messages` - Community discussion

### Mock Data

On first load, the application initializes with sample data for demonstration purposes. This includes:
- 3 preset users (admin, teacher, student)
- Sample courses
- Progress data
- Assessment templates

## 🎨 Customization

### Theme Colors

The application uses a color scheme defined in Tailwind:

```css
Primary: Amber (#f59e0b, #fbbf24)
Success: Green (#10b981)
Warning: Amber (#fbbf24)
Error: Red (#ef4444)
Neutral: Gray scale (50-900)
```

### Dark Mode

Dark mode is automatically enabled based on:
1. User's system preference
2. Manual toggle (persisted in localStorage)

## 🔧 Configuration

### Environment Variables

For production deployment, set these environment variables:

```bash
# Required for AI features
GEMINI_API_KEY=your_gemini_api_key_here

# Required for content moderation (backend implementation needed)
PERSPECTIVE_API_KEY=your_perspective_api_key_here

# Vercel Analytics (automatic on Vercel)
VERCEL_ANALYTICS_ID=auto
```

**⚠️ Security Note**: Never commit API keys to version control. Use environment variables or secret management.

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production deployment
vercel --prod
```

### Manual Deployment

```bash
# Build the project
npm run build

# Deploy the dist/ folder to any static hosting service
# (Netlify, GitHub Pages, AWS S3, etc.)
```

## 🧪 Testing

**⚠️ Current Status**: No automated tests implemented

### Recommended Testing Setup

```bash
# Install testing dependencies
npm install --save-dev vitest @vitest/ui playwright

# Unit tests (to be implemented)
npm run test:unit

# E2E tests (to be implemented)
npm run test:e2e
```

## 🐛 Known Issues & Limitations

### Critical

1. **No Real Backend**: All data stored in browser (lost on cache clear)
2. **No Authentication**: Demo accounts only, not production-ready
3. **API Key Security**: Content moderation requires backend implementation

### High Priority

1. **No Test Coverage**: Automated tests not implemented
2. **Accessibility**: WCAG AA compliance issues (color contrast, keyboard nav)
3. **Performance**: Large Tailwind CSS loaded from CDN

### Medium Priority

1. **No Component Library**: Code duplication across HTML files
2. **SEO**: Missing meta tags and structured data
3. **Mobile**: Some pages need better mobile optimization

See `.agent/QA_AUDIT_REPORT.md` for comprehensive issues list and fixes.

## 📝 Contributing

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Use ES6+ JavaScript features
- Follow Tailwind CSS conventions
- Comment complex logic
- Use semantic HTML5 elements

## 🔒 Security

### Reporting Vulnerabilities

Please report security vulnerabilities to: [security@lumina.com](mailto:security@lumina.com)

### Security Considerations

1. **XSS Prevention**: All user input must be sanitized
2. **API Keys**: Never expose API keys in client-side code
3. **Authentication**: Implement proper auth when adding backend
4. **CSP**: Add Content-Security-Policy headers
5. **HTTPS**: Always use HTTPS in production

## 📚 Documentation

### Quick References
- **Quick Start Guide**: [`QUICK_START.md`](QUICK_START.md) - Get started in 5 minutes
- **Features Documentation**: [`FEATURES_DOCUMENTATION.md`](FEATURES_DOCUMENTATION.md) - Complete feature list
- **Redesign Summary**: [`REDESIGN_SUMMARY.md`](REDESIGN_SUMMARY.md) - All changes and improvements

### Detailed Guides
- **Architecture**: See `.agent/QA_AUDIT_REPORT.md`
- **Deployment**: See `.agent/VERCEL_DEPLOYMENT_FIX.md`
- **Checkpoints**: See `.agent/CHECKPOINT_3_COMPLETED.md`

## 🗺️ Roadmap

### Version 1.1 (Next Release)

- [ ] Implement backend API (Node.js/Express)
- [ ] Real authentication with JWT
- [ ] Database migration (IndexedDB → PostgreSQL)
- [ ] Automated testing (unit + E2E)
- [ ] Accessibility improvements

### Version 2.0 (Future)

- [ ] Real-time collaboration features
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Multi-language support (i18n)
- [ ] Offline-first PWA

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Hari Kiran** - Initial work - [@harikiran138](https://github.com/harikiran138)

## 🙏 Acknowledgments

- Google Gemini AI for intelligent tutoring
- Tailwind CSS for styling framework
- Chart.js for data visualization
- Vercel for hosting and analytics
- Perspective API for content moderation

## 📞 Support

- **Documentation**: [GitHub Wiki](https://github.com/harikiran138/lumina-ai-learning/wiki)
- **Issues**: [GitHub Issues](https://github.com/harikiran138/lumina-ai-learning/issues)
- **Discussions**: [GitHub Discussions](https://github.com/harikiran138/lumina-ai-learning/discussions)

---

Made with ❤️ by the Lumina AI Learning Team
