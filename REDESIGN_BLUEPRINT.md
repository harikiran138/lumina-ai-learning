# 🧡 LUMINA - Professional Redesign Blueprint
## Orange-First Brand Identity | World-Class UX | Deployment-Ready

**Version**: 2.0 Professional  
**Brand Color**: Orange (#FF6B35 Primary)  
**Date**: November 26, 2025  
**Status**: Complete Redesign Specification

---

# 📊 EXECUTIVE SUMMARY

## Vision Statement
> **Lumina is the world's most intelligent workspace that combines AI-powered learning, productivity tools, and knowledge management into one beautifully designed platform.**

## Brand Positioning
- **Industry**: AI-Powered Workspace Platform
- **Target**: Students, educators, knowledge workers, and teams
- **Differentiator**: Unified learning + productivity with AI at the core
- **Personality**: Energetic, Innovative, Empowering, Premium

## Key Metrics Goals
- ⚡ **Performance**: < 2s page load
- 📱 **Mobile**: 100% responsive
- ♿ **Accessibility**: WCAG 2.1 AA
- 🎨 **Design**: Premium, cohesive, modern
- 🚀 **Deployment**: Vercel-ready, zero errors

---

# 🎨 SECTION 1: DESIGN SYSTEM

## 1.1 Color Palette (Orange-First)

### Primary Orange Family
```css
/* Core Brand Colors */
--orange-50:  #FFF4ED;  /* Lightest tint */
--orange-100: #FFE6D5;  /* Light background */
--orange-200: #FFCCAA;  /* Soft accent */
--orange-300: #FFB280;  /* Medium */
--orange-400: #FF9155;  /* Bright */
--orange-500: #FF6B35;  /* PRIMARY BRAND */
--orange-600: #E85A26;  /* Hover state */
--orange-700: #C54817;  /* Active state */
--orange-800: #9E3A12;  /* Dark */
--orange-900: #7A2E0E;  /* Darkest */

/* Gradient Variants */
--gradient-orange: linear-gradient(135deg, #FF6B35 0%, #FF9155 100%);
--gradient-sunset: linear-gradient(135deg, #FF6B35 0%, #FFB280 50%, #FFC947 100%);
--gradient-fire: linear-gradient(135deg, #FF6B35 0%, #E85A26 100%);
```

### Supporting Colors
```css
/* Complementary Blue (for contrast) */
--blue-500: #3B82F6;    /* Info, links */
--cyan-500: #06B6D4;    /* Accents */
--purple-500: #8B5CF6;  /* Premium features */

/* Semantic Colors */
--success: #10B981;     /* Green */
--warning: #F59E0B;     /* Amber */
--error: #EF4444;       /* Red */
--info: #3B82F6;        /* Blue */

/* Neutrals (Blue-Gray Tint) */
--gray-50:  #F8FAFC;
--gray-100: #F1F5F9;
--gray-200: #E2E8F0;
--gray-300: #CBD5E1;
--gray-400: #94A3B8;
--gray-500: #64748B;
--gray-600: #475569;
--gray-700: #334155;
--gray-800: #1E293B;
--gray-900: #0F172A;

/* Dark Mode Backgrounds */
--dark-bg-primary: #0A0E1A;    /* Deep blue-black */
--dark-bg-secondary: #121826;  /* Elevated surfaces */
--dark-bg-tertiary: #1E293B;   /* Cards */
```

### Usage Rules
```
Primary Actions:     --orange-500
Hover:              --orange-600
Active/Pressed:     --orange-700
Backgrounds:        --orange-50 to --orange-200
Text on Orange:     White (#FFFFFF)
Links:              --blue-500
Success States:     --success
Warnings:           --warning
Errors:             --error
```

---

## 1.2 Typography System

### Font Stack
```css
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-display: 'Inter', sans-serif;
--font-mono: 'Fira Code', 'SF Mono', 'Consolas', monospace;
```

### Type Scale (Fluid Responsive)
```css
/* Headings */
--text-hero: clamp(3rem, 5vw, 4.5rem);      /* 48-72px */
--text-h1: clamp(2.25rem, 4vw, 3rem);       /* 36-48px */
--text-h2: clamp(1.875rem, 3vw, 2.25rem);   /* 30-36px */
--text-h3: clamp(1.5rem, 2vw, 1.875rem);    /* 24-30px */
--text-h4: 1.25rem;                         /* 20px */
--text-h5: 1.125rem;                        /* 18px */

/* Body */
--text-body-lg: 1.125rem;    /* 18px */
--text-body: 1rem;           /* 16px (base) */
--text-body-sm: 0.875rem;    /* 14px */
--text-caption: 0.75rem;     /* 12px */
--text-tiny: 0.6875rem;      /* 11px */

/* Font Weights */
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
--font-extrabold: 800;

/* Line Heights */
--leading-none: 1;
--leading-tight: 1.25;
--leading-snug: 1.375;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
--leading-loose: 2;
```

### Typography Rules
```
Headings:
- Font: Inter
- Weight: 600-700
- Line Height: 1.25
- Letter Spacing: -0.02em (tight)

Body:
- Font: Inter
- Weight: 400
- Line Height: 1.5
- Letter Spacing: 0

Buttons:
- Font: Inter
- Weight: 500-600
- Size: 14-16px
- Letter Spacing: 0.01em

Code:
- Font: Fira Code
- Weight: 400
- Ligatures: Enabled
```

---

## 1.3 Spacing System

### Base Unit: 4px (0.25rem)

```css
--space-0: 0;
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px - BASE */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */
--space-32: 8rem;     /* 128px */

/* Semantic Spacing */
--space-section: var(--space-20);  /* Between sections */
--space-component: var(--space-6); /* Between components */
--space-element: var(--space-4);   /* Between elements */
```

---

## 1.4 Borders & Radius

```css
/* Border Widths */
--border-thin: 1px;
--border-medium: 2px;
--border-thick: 4px;

/* Border Radius */
--radius-sm: 0.375rem;   /* 6px */
--radius-md: 0.5rem;     /* 8px */
--radius-lg: 0.75rem;    /* 12px */
--radius-xl: 1rem;       /* 16px */
--radius-2xl: 1.5rem;    /* 24px */
--radius-3xl: 2rem;      /* 32px */
--radius-full: 9999px;   /* Pill shape */

/* Usage */
Buttons: --radius-lg
Cards: --radius-xl to --radius-2xl
Modals: --radius-2xl
Avatars: --radius-full
Images: --radius-lg
```

---

## 1.5 Shadows & Elevation

```css
/* Soft Shadows (Light Mode) */
--shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-sm: 0 2px 4px 0 rgba(0, 0, 0, 0.08);
--shadow-md: 0 4px 8px -2px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 8px 16px -4px rgba(0, 0, 0, 0.12);
--shadow-xl: 0 12px 24px -6px rgba(0, 0, 0, 0.15);
--shadow-2xl: 0 24px 48px -12px rgba(0, 0, 0, 0.18);

/* Colored Shadows */
--shadow-orange: 0 4px 20px rgba(255, 107, 53, 0.3);
--shadow-orange-sm: 0 2px 10px rgba(255, 107, 53, 0.2);

/* Dark Mode Shadows */
--shadow-dark-sm: 0 2px 8px 0 rgba(0, 0, 0, 0.4);
--shadow-dark-md: 0 4px 16px 0 rgba(0, 0, 0, 0.5);
--shadow-dark-lg: 0 8px 24px 0 rgba(0, 0, 0, 0.6);

/* Glass Effect */
--shadow-glass: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
backdrop-filter: blur(12px);
border: 1px solid rgba(255, 255, 255, 0.18);
```

---

## 1.6 Animations & Transitions

```css
/* Durations */
--duration-instant: 100ms;
--duration-fast: 150ms;
--duration-normal: 200ms;
--duration-slow: 300ms;
--duration-slower: 500ms;

/* Easing Functions */
--ease-linear: cubic-bezier(0, 0, 1, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-spring: cubic-bezier(0.68, -0.55, 0.265, 1.55);

/* Common Transitions */
--transition-all: all var(--duration-normal) var(--ease-out);
--transition-color: color var(--duration-fast) var(--ease-out);
--transition-transform: transform var(--duration-normal) var(--ease-spring);
```

### Animation Library
```
Fade In Up:     0.4s ease-out
Scale In:       0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)
Slide In:       0.3s ease-out
Ripple:         0.6s ease-out
Shimmer:        2s infinite
Pulse:          2s cubic-bezier(0.4, 0, 0.6, 1) infinite
```

---

## 1.7 Glass morphism Styles

```css
/* Light Mode Glass */
.glass {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: var(--shadow-glass);
}

/* Dark Mode Glass */
html.dark .glass {
  background: rgba(30, 41, 59, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* Orange Glow Glass */
.glass-orange {
  background: rgba(255, 107, 53, 0.1);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 107, 53, 0.2);
  box-shadow: 0 4px 20px rgba(255, 107, 53, 0.15);
}
```

---

# 🏗️ SECTION 2: INFORMATION ARCHITECTURE

## 2.1 Sitemap (New Structure)

```
LUMINA
│
├── 🏠 HOME (Public Landing)
│   ├── Hero Section
│   ├── Features Showcase
│   ├── Use Cases
│   ├── Pricing
│   ├── Testimonials
│   └── FAQ
│
├── 🔐 AUTH
│   ├── Login
│   ├── Signup
│   ├── Forgot Password
│   ├── Email Verification
│   └── Onboarding Flow
│
├── 📊 WORKSPACE (Main App - Authenticated)
│   │
│   ├── 🏠 Dashboard (Home)
│   │   ├── Overview Stats
│   │   ├── Quick Actions
│   │   ├── Recent Activity
│   │   ├── Tasks Widget
│   │   └── Calendar Widget
│   │
│   ├── 🎓 LEARN
│   │   ├── My Courses
│   │   │   ├── Active Courses
│   │   │   ├── Course Detail
│   │   │   └── Lesson Viewer
│   │   ├── AI Tutor
│   │   │   ├── Chat Interface
│   │   │   ├── Knowledge Base
│   │   │   └── Practice Problems
│   │   ├── Progress
│   │   │   ├── Mastery Dashboard
│   │   │   ├── Streaks & Achievements
│   │   │   └── Learning Path
│   │   ├── Notes
│   │   │   ├── My Notes (List)
│   │   │   ├── Note Editor
│   │   │   └── Tags & Organization
│   │   ├── Leaderboard
│   │   └── Community
│   │       ├── Discussions
│   │       ├── Study Groups
│   │       └── Q&A Forum
│   │
│   ├── 🤖 AI AGENTS
│   │   ├── Console (Main Interface)
│   │   │   ├── Chat Panel
│   │   │   ├── Agent Selector
│   │   │   ├── Context Viewer
│   │   │   └── Output Panel
│   │   ├── My Agents
│   │   │   ├── Active Agents
│   │   │   ├── Agent Templates
│   │   │   └── Create New
│   │   ├── Memory
│   │   │   ├── Conversation History
│   │   │   ├── Knowledge Graph
│   │   │   └── Context Management
│   │   ├── Tools & Plugins
│   │   └── Run History
│   │
│   ├── ⚙️ WORKFLOWS
│   │   ├── Builder (Canvas)
│   │   │   ├── Node Library
│   │   │   ├── Canvas Editor
│   │   │   ├── Properties Panel
│   │   │   └── Test Runner
│   │   ├── My Workflows
│   │   │   ├── Active Workflows
│   │   │   ├── Templates
│   │   │   └── Scheduled Runs
│   │   ├── Execution History
│   │   └── Analytics
│   │
│   ├── 🧩 APPS
│   │   ├── Hub (Marketplace)
│   │   │   ├── Featured Apps
│   │   │   ├── Categories
│   │   │   ├── Search & Filter
│   │   │   └── App Details
│   │   ├── Installed Apps
│   │   └── Settings & Permissions
│   │
│   ├── 📝 KNOWLEDGE
│   │   ├── Board (Homepage)
│   │   │   ├── Page Tree
│   │   │   ├── Recent Pages
│   │   │   └── Templates
│   │   ├── Editor
│   │   │   ├── Block Editor
│   │   │   ├── Formatting Tools
│   │   │   ├── AI Assistant
│   │   │   └── Collaboration
│   │   ├── Search
│   │   │   ├── Full-text Search
│   │   │   ├── AI Semantic Search
│   │   │   └── Filters
│   │   └── Shared Pages
│   │
│   ├── 📁 FILES
│   │   ├── Explorer (File Browser)
│   │   │   ├── Folder Tree
│   │   │   ├── File Grid/List
│   │   │   └── Upload Zone
│   │   ├── Preview
│   │   │   ├── File Viewer
│   │   │   ├── Comments
│   │   │   └── Version History
│   │   ├── AI Actions
│   │   │   ├── Summarize
│   │   │   ├── Extract Data
│   │   │   ├── Convert Format
│   │   │   └── Search Content
│   │   └── Shared Files
│   │
│   └── ⚙️ SETTINGS
│       ├── Profile
│       │   ├── Personal Info
│       │   ├── Avatar & Bio
│       │   └── Account Security
│       ├── Preferences
│       │   ├── Theme (Orange/Blue/Custom)
│       │   ├── Language
│       │   ├── Notifications
│       │   └── Privacy
│       ├── Integrations
│       │   ├── Connected Apps
│       │   ├── API Keys
│       │   └── Webhooks
│       ├── Team (if applicable)
│       │   ├── Members
│       │   ├── Roles & Permissions
│       │   └── Workspace Settings
│       └── Billing
│           ├── Subscription
│           ├── Usage
│           └── Payment Methods
│
└── 👥 ROLE-SPECIFIC PORTALS
    ├── Teacher Portal
    │   ├── Dashboard
    │   ├── Content Management
    │   ├── Assessments
    │   ├── Student Reports
    │   └── Analytics
    │
    └── Admin Portal
        ├── Dashboard
        ├── User Management
        ├── Course Management
        ├── System Health
        └── Analytics
```

---

## 2.2 Navigation Architecture

### Global Navigation (Top Bar)
```
┌─────────────────────────────────────────────────────────────┐
│ [Logo] Learn  Agents  Workflows  Apps  Knowledge  Files     │
│                                     [Search] [👤] [Settings] │
└─────────────────────────────────────────────────────────────┘
```

### Sidebar Navigation (Contextual)
- **Learn Section**: Shows courses, progress, community
- **Agents Section**: Shows consoles, agents, memory
- **Workflows Section**: Shows builder, templates, history
- Collapsible on mobile
- Pinnable favorites

### Breadcrumbs
```
Home / Learn / My Courses / Physics 101 / Lesson 3
```

### Command Palette (⌘K)
- Universal search
- Quick actions
- Recent pages
- Keyboard shortcuts

---

# 🧩 SECTION 3: COMPONENT LIBRARY

## 3.1 Base Components (30+)

### Buttons
```html
<!-- Primary -->
<button class="btn btn-primary">
  Get Started
</button>

<!-- Secondary -->
<button class="btn btn-secondary">
  Learn More
</button>

<!-- Ghost -->
<button class="btn btn-ghost">
  Cancel
</button>

<!-- Icon Button -->
<button class="btn btn-icon">
  <Icon name="settings" />
</button>

<!-- Loading State -->
<button class="btn btn-primary" disabled>
  <Spinner size="sm" />
  Loading...
</button>
```

**Variants**: primary, secondary, ghost, outline, danger, success  
**Sizes**: xs, sm, md, lg, xl  
**States**: default, hover, active, disabled, loading

### Cards
```html
<!-- Standard Card -->
<div class="card">
  <div class="card-header">
    <h3>Card Title</h3>
  </div>
  <div class="card-body">
    Content goes here
  </div>
  <div class="card-footer">
    <button class="btn btn-primary">Action</button>
  </div>
</div>

<!-- Glass Card -->
<div class="card card-glass">
  ...
</div>

<!-- Interactive Card -->
<div class="card card-interactive">
  ...
</div>
```

**Variants**: default, glass, elevated, bordered, interactive  
**Features**: Header, body, footer, image, actions

### Form Inputs
```html
<!-- Text Input -->
<div class="form-group">
  <label>Email</label>
  <input type="email" class="input" placeholder="you@example.com">
  <span class="form-hint">We'll never share your email</span>
</div>

<!-- Textarea -->
<textarea class="textarea" rows="4"></textarea>

<!-- Select -->
<select class="select">
  <option>Choose one</option>
</select>

<!-- Checkbox -->
<label class="checkbox">
  <input type="checkbox">
  <span>Remember me</span>
</label>

<!-- Radio -->
<label class="radio">
  <input type="radio" name="option">
  <span>Option 1</span>
</label>

<!-- Switch/Toggle -->
<label class="switch">
  <input type="checkbox">
  <span class="slider"></span>
</label>
```

**States**: default, focus, error, disabled, success  
**Sizes**: sm, md, lg

### Badges & Tags
```html
<span class="badge badge-primary">New</span>
<span class="badge badge-success">Active</span>
<span class="badge badge-warning">Pending</span>
<span class="badge badge-error">Error</span>

<span class="tag">JavaScript</span>
<span class="tag tag-removable">
  React
  <button class="tag-remove">×</button>
</span>
```

### Tooltips
```html
<button data-tooltip="This is a helpful tip">
  Hover me
</button>
```

**Positions**: top, bottom, left, right  
**Triggers**: hover, click, focus

### Modals & Dialogs
```html
<div class="modal">
  <div class="modal-overlay"></div>
  <div class="modal-content">
    <div class="modal-header">
      <h2>Modal Title</h2>
      <button class="modal-close">×</button>
    </div>
    <div class="modal-body">
      Content
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost">Cancel</button>
      <button class="btn btn-primary">Confirm</button>
    </div>
  </div>
</div>
```

**Sizes**: sm, md, lg, xl, fullscreen  
**Variants**: centered, side-panel, bottom-sheet

### Drawers (Slide-out Panels)
```html
<div class="drawer drawer-right">
  <div class="drawer-content">
    ...
  </div>
</div>
```

**Positions**: left, right, top, bottom

### Tabs
```html
<div class="tabs">
  <button class="tab tab-active">Overview</button>
  <button class="tab">Details</button>
  <button class="tab">Settings</button>
</div>
<div class="tab-content">
  ...
</div>
```

**Variants**: line, pills, segmented

### Accordion
```html
<div class="accordion">
  <div class="accordion-item">
    <button class="accordion-header">
      Section 1
    </button>
    <div class="accordion-content">
      Content
    </div>
  </div>
</div>
```

### Breadcrumbs
```html
<nav class="breadcrumbs">
  <a href="/">Home</a>
  <span>/</span>
  <a href="/learn">Learn</a>
  <span>/</span>
  <span class="current">Courses</span>
</nav>
```

### Avatars
```html
<div class="avatar avatar-md">
  <img src="user.jpg" alt="User">
</div>

<div class="avatar avatar-md">
  <span>AB</span>
</div>

<div class="avatar-group">
  <div class="avatar"><img src="user1.jpg"></div>
  <div class="avatar"><img src="user2.jpg"></div>
  <div class="avatar"><span>+3</span></div>
</div>
```

**Sizes**: xs, sm, md, lg, xl  
**Variants**: circle, rounded, square  
**States**: online, offline, busy

### Progress Bars
```html
<div class="progress">
  <div class="progress-bar" style="width: 75%"></div>
</div>

<div class="progress progress-striped">
  <div class="progress-bar" style="width: 50%"></div>
</div>
```

**Variants**: default, striped, animated, steps  
**Colors**: primary, success, warning, error

### Skeleton Loaders
```html
<div class="skeleton skeleton-text"></div>
<div class="skeleton skeleton-title"></div>
<div class="skeleton skeleton-avatar"></div>
<div class="skeleton skeleton-card"></div>
```

### Spinners
```html
<div class="spinner spinner-md"></div>
<div class="spinner spinner-dots"></div>
```

**Sizes**: xs, sm, md, lg, xl  
**Variants**: circle, dots, bars, pulse

### Toast Notifications
```html
<div class="toast toast-success">
  <div class="toast-icon">✓</div>
  <div class="toast-content">
    <div class="toast-title">Success!</div>
    <div class="toast-message">Your changes have been saved.</div>
  </div>
  <button class="toast-close">×</button>
</div>
```

**Positions**: top-left, top-center, top-right, bottom-left, bottom-center, bottom-right  
**Variants**: success, error, warning, info  
**Duration**: Auto-dismiss after N seconds

### Dropdowns
```html
<div class="dropdown">
  <button class="dropdown-trigger">
    Menu
  </button>
  <div class="dropdown-menu">
    <a class="dropdown-item">Action</a>
    <a class="dropdown-item">Another action</a>
    <div class="dropdown-divider"></div>
    <a class="dropdown-item">Separated link</a>
  </div>
</div>
```

### Pagination
```html
<nav class="pagination">
  <button class="page-item" disabled>Previous</button>
  <button class="page-item page-active">1</button>
  <button class="page-item">2</button>
  <button class="page-item">3</button>
  <button class="page-item">Next</button>
</nav>
```

---

## 3.2 Advanced Components

### AI Response Block
- Markdown rendering
- Code syntax highlighting (Prism.js)
- Copy button
- Streaming text animation
- Citations/sources
- Regenerate button

### Code Renderer
- Syntax highlighting (15+ languages)
- Line numbers
- Copy button
- Language badge
- Theme switching (light/dark)
- Inline code vs blocks

### File Card
- File icon based on type
- File name & size
- Preview thumbnail
- Action menu (download, share, delete)
- Upload progress
- Drag-and-drop zone

### App Card
- App icon/logo
- Name & description
- Rating stars
- Install button
- Category badge
- Screenshots carousel

### Workflow Node Card
- Node type icon
- Input/output ports
- Draggable handle
- Configuration panel
- Status indicator
- Connection lines

### Knowledge Block
- Block type selector
- Inline editing
- Drag handle
- Block actions menu
- Nested blocks
- Collaboration cursors

### Analytics Charts
- Line charts
- Bar charts
- Pie/Donut charts
- Sparklines
- Heatmaps
- Interactive tooltips

### Data Table
- Sortable columns
- Filterable rows
- Pagination
- Row selection
- Bulk actions
- Export to CSV
- Responsive (cards on mobile)

---

## 3.3 Layout Components

### Page Header
```html
<header class="page-header">
  <div class="page-title">
    <h1>Page Title</h1>
    <p class="page-subtitle">Description</p>
  </div>
  <div class="page-actions">
    <button class="btn btn-primary">Primary Action</button>
  </div>
</header>
```

### Sidebar Navigation
```html
<aside class="sidebar">
  <nav class="sidebar-nav">
    <a href="#" class="nav-item active">
      <Icon name="home" />
      <span>Dashboard</span>
    </a>
    <a href="#" class="nav-item">
      <Icon name="book" />
      <span>Courses</span>
    </a>
  </nav>
</aside>
```

### Command Palette (⌘K)
```html
<div class="command-palette">
  <input type="text" placeholder="Type a command or search...">
  <div class="command-results">
    <div class="command-group">
      <div class="command-group-title">Recent</div>
      <button class="command-item">
        <Icon name="file" />
        <span>Project Proposal</span>
        <kbd>↵</kbd>
      </button>
    </div>
  </div>
</div>
```

---

# 📄 SECTION 4: PAGE-BY-PAGE REDESIGN

## 4.1 Landing Page (Home)

### Hero Section
```
┌─────────────────────────────────────────────────┐
│                                                 │
│                                                 │
│          One Workspace. Infinite Potential.     │
│                                                 │
│   Learn smarter, work faster, and create more  │
│        with AI-powered tools built for you.     │
│                                                 │
│   [Get Started Free] [Watch Demo →]             │
│                                                 │
│        Trusted by 10,000+ learners & teams      │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Elements**:
- Gradient headline with orange accent
- Animated background (subtle particles)
- Two CTAs (primary + secondary)
- Social proof numbers
- Hero image/screenshot

### Features Showcase
```
┌─────────────────────────────────────────────────┐
│  Everything you need to learn and create        │
│                                                 │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │   🎓    │  │   🤖    │  │   ⚙️    │        │
│  │ Learn   │  │ AI      │  │ Automate│        │
│  │ Courses │  │ Agents  │  │ Workflow│        │
│  └─────────┘  └─────────┘  └─────────┘        │
│                                                 │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │   📝    │  │   📁    │  │   🧩    │        │
│  │ Knowledge│ │ Files   │  │ Apps    │        │
│  └─────────┘  └─────────┘  └─────────┘        │
└─────────────────────────────────────────────────┘
```

**6 Feature Cards**:
1. **Learn** - AI-powered courses
2. **Agents** - Intelligent assistants
3. **Workflows** - Automation builder
4. **Knowledge** - Note-taking
5. **Files** - Cloud storage
6. **Apps** - Extensible platform

### Use Cases Section
```
┌─────────────────────────────────────────────────┐
│  Built for everyone                             │
│                                                 │
│  [Student] [Teacher] [Developer] [Marketer]     │
│                                                 │
│  Content changes based on selected persona      │
└─────────────────────────────────────────────────┘
```

### Pricing Section
```
┌─────────────────────────────────────────────────┐
│  Simple, transparent pricing                    │
│                                                 │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │ Free    │  │ Pro     │  │ Team    │        │
│  │ $0/mo   │  │ $12/mo  │  │ $49/mo  │        │
│  └─────────┘  └─────────┘  └─────────┘        │
└─────────────────────────────────────────────────┘
```

### Footer
- Logo + tagline
- Product links
- Company links
- Social links
- Newsletter signup
- Copyright

---

## 4.2 Workspace Dashboard (Home)

### Layout
```
┌─────────────────────────────────────────────────┐
│ [NavBar]                                        │
├────────────┬────────────────────────────────────┤
│ [Sidebar]  │                                    │
│            │  Welcome back, Alex! 👋            │
│            │                                    │
│            │  ┌──────┐ ┌──────┐ ┌──────┐       │
│            │  │ Stat │ │ Stat │ │ Stat │       │
│            │  └──────┘ └──────┘ └──────┘       │
│            │                                    │
│            │  ┌──────────────────┐ ┌────────┐  │
│            │  │ Quick Actions    │ │ Tasks  │  │
│            │  └──────────────────┘ └────────┘  │
│            │                                    │
│            │  ┌──────────────────┐ ┌────────┐  │
│            │  │ Recent Activity  │ │Calendar│  │
│            │  └──────────────────┘ └────────┘  │
└────────────┴────────────────────────────────────┘
```

**Widgets**:
1. Quick Stats (4 cards)
2. Quick Launch (app shortcuts)
3. Recent Activity (feed)
4. Tasks (checkbox list)
5. Calendar (upcoming events)
6. AI Suggestions

---

## 4.3 Learn - My Courses

### Course Grid
```
┌─────────────────────────────────────────────────┐
│ My Courses                    [+ New Course]    │
│                                                 │
│ [All] [In Progress] [Completed] [Bookmarked]   │
│                                                 │
│ ┌───────────┐ ┌───────────┐ ┌───────────┐     │
│ │ [Image]   │ │ [Image]   │ │ [Image]   │     │
│ │ Physics   │ │ Math      │ │ CS        │     │
│ │ 75% ████  │ │ 30% █▒▒▒  │ │ 90% ████  │     │
│ └───────────┘ └───────────┘ └───────────┘     │
└─────────────────────────────────────────────────┘
```

**Course Card**:
- Course thumbnail
- Title & instructor
- Progress bar
- Last accessed
- Continue button
- Bookmark star

---

## 4.4 AI Agent Console

### Layout
```
┌─────────────────────────────────────────────────┐
│ AI Console                    [Model: GPT-4]   │
├──────────┬──────────────────────────────────────┤
│ Agents   │ Messages                             │
│ ┌──────┐ │                                      │
│ │Agent1│ │ User: How do I...                    │
│ │Agent2│ │                                      │
│ └──────┘ │ AI: Here's how...                    │
│          │ [Code block]                         │
│ Tools    │                                      │
│ ┌──────┐ │                                      │
│ │Search│ │                                      │
│ │Code  │ │ ┌──────────────────────────────┐    │
│ └──────┘ │ │ Type your message...     [Send│    │
│          │ └──────────────────────────────┘    │
└──────────┴──────────────────────────────────────┘
```

**3-Column Layout**:
1. **Left**: Agent selector, Tools
2. **Center**: Chat messages
3. **Right**: Context panel (collapsible)

**Features**:
- Streaming responses
- Code highlighting
- Markdown support
- File attachments
- Voice input
- Copy/edit/regenerate

---

## 4.5 Workflow Builder

### Canvas Interface
```
┌─────────────────────────────────────────────────┐
│ Workflow Builder              [Save] [Run]      │
├──────────┬────────────────────────┬─────────────┤
│ Nodes    │ Canvas                 │ Properties  │
│ ┌──────┐ │                        │             │
│ │Trigger│ │  ┌──────┐             │ Node: Email │
│ │Action │ │  │Start │             │             │
│ │ AI    │ │  └───┬──┘             │ From: ...   │
│ │Logic  │ │      │                │ Subject:... │
│ └──────┘ │  ┌───▼──┐             │             │
│ Search   │  │Action│             │ [Save]      │
│ ┌──────┐ │  └───┬──┘             │             │
│ [    ]   │      │                │             │
│          │  ┌───▼──┐             │             │
│          │  │ End  │             │             │
└──────────┴────────────────────────┴─────────────┘
```

**Features**:
- Drag & drop nodes
- Visual connections
- Zoom/pan canvas
- Node configuration
- Test execution
- Save as template

---

## 4.6 Knowledge Board

### Editor Interface
```
┌─────────────────────────────────────────────────┐
│ [☰] Meeting Notes - Nov 26    [Share] [•••]    │
├────────┬────────────────────────────────────────┤
│ Pages  │                                        │
│ ┌────┐ │ # Meeting Notes                        │
│ │Page│ │                                        │
│ │Page│ │ ## Agenda                              │
│ └────┘ │ - [ ] Review Q4 goals                  │
│        │ - [ ] Discuss roadmap                  │
│ Recent │                                        │
│ ┌────┐ │ ## Action Items                        │
│ │Doc │ │ @Alex to prepare presentation          │
│ └────┘ │                                        │
│        │ [+ Add block]                          │
└────────┴────────────────────────────────────────┘
```

**Block Types**:
- Text
- Heading (H1-H6)
- Checkbox list
- Bulleted list
- Numbered list
- Quote
- Code
- Table
- Kanban
- Image
- Embed
- AI Block (generate content)

---

## 4.7 Settings Page

### Tabbed Interface
```
┌─────────────────────────────────────────────────┐
│ Settings                                        │
│                                                 │
│ [Profile] [Preferences] [Integrations] [Billing]│
│                                                 │
│ Profile Information                             │
│ ┌───────────────────────────────────────────┐  │
│ │ Name:  [Alex Johnson        ]             │  │
│ │ Email: [alex@example.com    ]             │  │
│ │ Bio:   [                    ]             │  │
│ │                                           │  │
│ │ Avatar: [Upload]                          │  │
│ └───────────────────────────────────────────┘  │
│                                                 │
│ [Save Changes]                                  │
└─────────────────────────────────────────────────┘
```

---

# 📝 SECTION 5: CONTENT GUIDELINES

## 5.1 Voice & Tone

### Brand Voice
- **Friendly**: Approachable, warm, human
- **Empowering**: Confidence-building, supportive
- **Clear**: Simple, direct, jargon-free
- **Energetic**: Enthusiastic, positive, forward-looking

### Tone Variations
- **Marketing**: Inspirational, aspirational, exciting
- **Product**: Helpful, instructional, reassuring
- **Errors**: Apologetic, solution-oriented, calm
- **Success**: Celebratory, encouraging, motivating

---

## 5.2 Microcopy Examples

### Buttons
✅ **Good**: "Get Started Free", "Continue Learning", "Save Changes"  
❌ **Bad**: "Submit", "Click Here", "OK"

### Empty States
✅ **Good**: "No courses yet. Let's find something amazing to learn!"  
❌ **Bad**: "No data"

### Error Messages
✅ **Good**: "Oops! We couldn't save your changes. Please try again."  
❌ **Bad**: "Error 500"

### Success Messages
✅ **Good**: "🎉 Your workflow is now live and running!"  
❌ **Bad**: "Success"

---

## 5.3 Rewritten Key Pages

### Landing Hero
**Before**: "AI-powered learning platform"  
**After**: "One Workspace. Infinite Potential. Learn smarter, work faster, and create more with AI-powered tools built for you."

### Dashboard Welcome
**Before**: "Welcome back"  
**After**: "Welcome back, Alex! 👋 Ready to make today amazing?"

### AI Console
**Before**: "Chat with AI"  
**After**: "Your AI assistant is ready. What would you like to accomplish today?"

---

# 🚀 SECTION 6: TECHNICAL SPECIFICATIONS

## 6.1 File Structure (Recommended)

```
lumina-ai-learning/
├── public/
│   ├── fonts/
│   ├── images/
│   ├── icons/
│   └── videos/
│
├── src/
│   ├── assets/
│   │   ├── icons/
│   │   └── images/
│   │
│   ├── styles/
│   │   ├── tokens.css          (Design tokens)
│   │   ├── reset.css           (CSS reset)
│   │   ├── globals.css         (Global styles)
│   │   ├── components/         (Component styles)
│   │   │   ├── button.css
│   │   │   ├── card.css
│   │   │   └── ...
│   │   └── utilities.css       (Utility classes)
│   │
│   ├── components/
│   │   ├── base/               (30+ base components)
│   │   ├── advanced/           (Advanced components)
│   │   ├── layout/             (Layout components)
│   │   └── icons/              (SVG icons)
│   │
│   ├── pages/
│   │   ├── landing/
│   │   │   └── index.html
│   │   ├── auth/
│   │   │   ├── login.html
│   │   │   └── signup.html
│   │   ├── workspace/
│   │   │   ├── dashboard.html
│   │   │   ├── learn/
│   │   │   ├── agents/
│   │   │   ├── workflows/
│   │   │   ├── apps/
│   │   │   ├── knowledge/
│   │   │   └── files/
│   │   └── settings/
│   │
│   ├── js/
│   │   ├── core/
│   │   │   ├── app.js
│   │   │   ├── router.js
│   │   │   └── theme.js
│   │   ├── utils/
│   │   ├── api/
│   │   └── components/
│   │
│   └── docs/
│       ├── components.md
│       ├── guidelines.md
│       └── deployment.md
│
├── .gitignore
├── README.md
├── package.json
└── vercel.json
```

---

## 6.2 Performance Targets

- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Time to Interactive**: < 3.5s
- **Cumulative Layout Shift**: < 0.1
- **Total Page Weight**: < 500KB initial load
- **Lighthouse Score**: 90+ (all categories)

### Optimization Strategies
- Lazy load images
- Code splitting
- Tree shaking
- Minification
- Gzip compression
- CDN for static assets
- Service worker for offline
- HTTP/2 server push

---

## 6.3 Accessibility (WCAG 2.1 AA)

### Requirements
- ✅ Semantic HTML
- ✅ ARIA labels on interactive elements
- ✅ Keyboard navigation (Tab, Enter, Esc, Arrow keys)
- ✅ Focus indicators (visible outlines)
- ✅ Color contrast ratios:
  - Normal text: 4.5:1 minimum
  - Large text: 3:1 minimum
  - UI components: 3:1 minimum
- ✅ Alt text on images
- ✅ Form labels and error messages
- ✅ Skip to main content link
- ✅ Responsive text sizing (no fixed px)
- ✅ Screen reader compatibility

---

## 6.4 Browser Support

### Target Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile Safari 14+
- Chrome Mobile 90+

### Progressive Enhancement
- Core functionality works without JavaScript
- Enhanced experience with JavaScript enabled
- Fallbacks for unsupported features
- Graceful degradation

---

# 🎯 SECTION 7: IMPLEMENTATION ROADMAP

## Phase 1: Foundation (Week 1)
- [x] Design system tokens (DONE)
- [x] Theme manager (DONE)
- [x] Workspace home (DONE)
- [ ] Component library (30+ components)
- [ ] Navigation system
- [ ] Command palette

## Phase 2: Core Pages (Week 2)
- [ ] Landing page redesign
- [ ] Auth pages (login/signup)
- [ ] Dashboard refinement
- [ ] Learn section pages
- [ ] Settings pages

## Phase 3: Advanced Features (Week 3)
- [ ] AI Agent Console
- [ ] Workflow Builder
- [ ] Knowledge Editor
- [ ] File Explorer
- [ ] Apps Hub

## Phase 4: Polish & Testing (Week 4)
- [ ] Animations & micro-interactions
- [ ] Responsive testing
- [ ] Accessibility audit
- [ ] Performance optimization
- [ ] Content finalization
- [ ] Bug fixes

## Phase 5: Deployment (Week 5)
- [ ] Production build
- [ ] Vercel deployment
- [ ] DNS configuration
- [ ] Analytics setup
- [ ] Monitoring
- [ ] Launch! 🚀

---

# ✅ SECTION 8: IMPROVEMENTS CHECKLIST

## Design
- [ ] Unify orange brand across all pages
- [ ] Consistent spacing (16px grid)
- [ ] Smooth animations (200ms)
- [ ] Glass effects standardized
- [ ] Dark mode perfected
- [ ] Mobile responsive (all pages)
- [ ] Premium aesthetics

## Content
- [ ] Landing page copy rewritten
- [ ] Dashboard messaging improved
- [ ] All CTAs action-oriented
- [ ] Error messages helpful
- [ ] Success states celebratory
- [ ] Empty states encouraging
- [ ] Microcopy polished

## UX
- [ ] Navigation simplified
- [ ] Breadcrumbs added
- [ ] Command palette (⌘K)
- [ ] Keyboard shortcuts
- [ ] Loading states
- [ ] Error states
- [ ] Success feedback
- [ ] Onboarding flow

## Technical
- [ ] File structure reorganized
- [ ] Component library built
- [ ] Code documented
- [ ] Performance optimized
- [ ] Accessibility enhanced
- [ ] Security hardened
- [ ] Tests added

## Missing Features
- [ ] User onboarding
- [ ] In-app notifications
- [ ] Real-time collaboration
- [ ] Advanced search
- [ ] Export/import data
- [ ] Keyboard shortcuts guide
- [ ] Help center
- [ ] Changelog

---

# 🎨 SECTION 9: VISUAL MOCKUP REFERENCES

## Style References
- **Vercel Dashboard**: Clean, minimal, fast
- **Linear App**: Smooth animations, keyboard-first
- **Stripe Dashboard**: Data visualization, clarity
- **Notion**: Block-based editor, flexibility
- **Figma**: Canvas interface, real-time collab

## Orange Brand Examples
- **SoundCloud**: Orange as primary, energetic
- **Headspace**: Warm, friendly, approachable
- **GitLab**: Professional orange, technical

---

# 📦 SECTION 10: DEPLOYMENT

## Vercel Configuration

```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "src/**/*.html",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/",
      "dest": "/src/index.html"
    },
    {
      "src": "/workspace/(.*)",
      "dest": "/src/workspace/$1"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

## Environment Variables
```
VITE_API_URL=https://api.lumina.app
VITE_APP_URL=https://lumina.app
VITE_ENVIRONMENT=production
```

## Build Command
```bash
npm run build
```

## Deploy Command
```bash
vercel --prod
```

---

# 🎯 NEXT IMMEDIATE ACTIONS

**What I recommend we do RIGHT NOW:**

1. ✅ **Update design tokens** - Switch from amber to orange primary
2. ✅ **Build component library** - Create all 30+ base components
3. ✅ **Redesign landing page** - Premium hero, features, pricing
4. ✅ **Refine dashboards** - Apply new orange theme consistently
5. ✅ **Add animations** - Smooth micro-interactions everywhere

**Estimated time**: 12-15 hours of focused work

**Your call!** Should I:
- **A)** Start building components now?
- **B)** Focus on landing page redesign first?
- **C)** Something else?

---

**This is your complete blueprint. Ready to build! 🚀**
