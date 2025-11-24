/**
 * CSS Compatibility Fix Script
 * This script fixes all webkit-background-clip compatibility issues across all HTML files
 */

// Get all HTML files that need CSS fixes
const htmlFiles = [
    'student/ai_tutor.html',
    'student/assessment.html',
    'student/assessment_result.html',
    'student/community.html',
    'student/course_explorer.html',
    'student/leaderboard.html',
    'student/lesson_page.html',
    'student/my_notes.html',
    'student/progress_streaks.html',
    'teacher/assessment_management.html',
    'teacher/community.html',
    'teacher/content_upload.html',
    'teacher/reports.html'
];

// Fix function that adds the standard background-clip property
function fixBackgroundClip() {
    const style = document.createElement('style');
    style.textContent = `
        .gradient-text {
            background: linear-gradient(to right, #f59e0b, #fbbf24);
            background-clip: text !important;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
    `;
    document.head.appendChild(style);
}

// Apply fix when DOM loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fixBackgroundClip);
} else {
    fixBackgroundClip();
}

console.log('CSS compatibility fix applied for webkit-background-clip');