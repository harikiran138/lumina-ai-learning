# Testing Guide for Lumina AI Learning

This guide will help you test the application locally before deploying to ensure everything works correctly.

## Prerequisites

- Node.js installed
- Development server running (`npm run dev`)

## Local Testing Checklist

### 1. Home Page Test
**URL**: `http://localhost:3000`

- [ ] Page loads without errors
- [ ] No console errors in browser DevTools (F12 → Console)
- [ ] Layout renders correctly

### 2. Dashboard Test
**URL**: `http://localhost:3000/dashboard`

- [ ] Page loads without errors
- [ ] Dashboard UI displays
- [ ] No "Module not found" errors
- [ ] Check console for any warnings

### 3. Courses List Test
**URL**: `http://localhost:3000/dashboard/courses`

- [ ] Page loads successfully
- [ ] Mock courses display (2 courses should appear)
- [ ] Course cards show: name, description, status, created date
- [ ] "View Course" buttons are clickable

### 4. Individual Course Test
**URL**: `http://localhost:3000/dashboard/courses/1`

- [ ] Course details page loads
- [ ] Course information displays correctly
- [ ] Mock lessons appear (2 lessons)
- [ ] No TypeScript errors in console

### 5. 404 Page Test
**URL**: `http://localhost:3000/nonexistent-page`

- [ ] Custom 404 page displays
- [ ] "Go back home" button works
- [ ] No console errors

### 6. Error Boundary Test

To test the error boundary:

1. Temporarily add this code to any page component:
   ```tsx
   if (typeof window !== 'undefined') {
     throw new Error('Test error boundary');
   }
   ```
2. Reload the page
3. [ ] Error boundary UI should display
4. [ ] "Try again" and "Go home" buttons work
5. Remove the test code

### 7. Build Test

Run production build:
```bash
npm run build
```

- [ ] Build completes successfully
- [ ] No TypeScript errors
- [ ] All routes generated correctly

### 8. Production Mode Test

After building, test production mode:
```bash
npm start
```

- [ ] Application runs in production mode
- [ ] Navigate to all pages
- [ ] No console errors
- [ ] Error handling works correctly

## Common Issues & Solutions

### Issue: Port 3000 already in use
**Solution**: 
```bash
# Find and kill the process
lsof -ti:3000 | xargs kill -9
# Or use a different port
npm run dev -- -p 3001
```

### Issue: Module not found errors
**Solution**: 
```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
```

### Issue: Build fails
**Solution**: 
1. Check TypeScript errors: `npm run build`
2. Fix any type errors
3. Ensure all imports are correct

## Testing Error Scenarios

### Network Error Simulation
1. Open DevTools → Network tab
2. Set throttling to "Offline"
3. Try to perform actions
4. [ ] Error messages display correctly
5. [ ] Application doesn't crash

### Invalid Data Test
1. Open browser console
2. Try to trigger API calls with invalid data
3. [ ] Errors are logged
4. [ ] User-friendly error messages display

## Deployment Readiness Checklist

Before deploying to Vercel:

- [ ] All local tests pass
- [ ] Production build succeeds
- [ ] No console errors in production mode
- [ ] Error pages work correctly
- [ ] Error boundary catches errors
- [ ] Auth module loads without issues

## Next Steps

Once all tests pass:
1. Commit your changes
2. Push to your repository
3. Deploy to Vercel
4. Test the deployed application
5. Monitor for any production errors

## Monitoring in Production

After deployment, monitor:
- Vercel deployment logs
- Browser console errors (if accessible)
- User-reported issues

The error logging system will help track issues in production.
