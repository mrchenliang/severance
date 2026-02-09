# GitHub Pages CSS Fix - Quick Setup

## The Problem
CSS wasn't loading because Next.js needs to be configured for static export on GitHub Pages.

## The Solution
I've configured the app for GitHub Pages static export. Here's what changed:

### 1. Updated `next.config.js`
- Added `output: 'export'` for static HTML generation
- Added `images: { unoptimized: true }` (required for static export)
- Added basePath support for subdirectory deployment

### 2. Created GitHub Actions Workflow
- Automatic build and deployment on push to main
- Properly configured for GitHub Pages

## Quick Deploy Steps

### Option 1: Automatic (Recommended)

1. **Enable GitHub Pages:**
   - Go to your repo → Settings → Pages
   - Source: Select "GitHub Actions"

2. **Push the code:**
   ```bash
   git add .
   git commit -m "Fix GitHub Pages CSS"
   git push origin main
   ```

3. **Wait for deployment** (check Actions tab)
   - Your site will be at: `https://yourusername.github.io/severance-calculator/`

### Option 2: Manual Build

If you want to test locally first:

```bash
# Set environment variables
export GITHUB_PAGES=true
export GITHUB_PAGES_BASE_PATH=/severance-calculator  # Replace with your repo name

# Build
npm run build

# The output will be in ./out directory
# You can test locally with: npx serve out
```

## Important: Base Path

**If your repository name is NOT `severance-calculator`:**

Update the workflow file `.github/workflows/deploy.yml`:
- Change `GITHUB_PAGES_BASE_PATH: /${{ github.event.repository.name }}` 
- To match your actual repository name

Or manually set in `next.config.js`:
```js
basePath: '/your-actual-repo-name',
```

## Verify CSS is Working

After deployment:
1. Open your GitHub Pages URL
2. Right-click → Inspect
3. Check Network tab → Look for CSS files loading (status 200)
4. Check Console → Should be no CSS-related errors

## Troubleshooting

**CSS still not loading?**
1. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. Check browser console for 404 errors
3. Verify basePath matches your repository name exactly
4. Check that `out/_next/static/css/` folder exists after build

**Routes not working?**
- GitHub Pages serves static files only
- All routes must be pre-rendered (which Next.js does automatically)
- Client-side routing works fine with static export

## What Changed

✅ `next.config.js` - Configured for static export  
✅ `.github/workflows/deploy.yml` - Auto-deployment workflow  
✅ `package.json` - Added export script  
✅ CSS will now load correctly with proper asset paths  
