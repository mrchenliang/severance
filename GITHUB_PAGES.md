# GitHub Pages Deployment Guide

## Quick Setup

### Option 1: Using GitHub Actions (Recommended)

1. **Enable GitHub Pages in your repository:**
   - Go to Settings → Pages
   - Source: Select "GitHub Actions"

2. **Push your code:**
   ```bash
   git add .
   git commit -m "Configure GitHub Pages"
   git push origin main
   ```

3. **The workflow will automatically:**
   - Build your Next.js app as static export
   - Deploy to GitHub Pages
   - Your site will be available at `https://yourusername.github.io/severance-calculator/`

### Option 2: Manual Deployment

1. **Build the static export:**
   ```bash
   npm run build
   ```

2. **The build output will be in the `out/` directory**

3. **Configure GitHub Pages:**
   - Go to Settings → Pages
   - Source: Select "Deploy from a branch"
   - Branch: Select `main` (or your default branch)
   - Folder: Select `/out`
   - Click Save

## Important Notes

### Base Path Configuration

If your repository name is NOT `severance-calculator`, or if you're deploying to a subdirectory:

1. **Update `next.config.js`:**
   ```js
   basePath: '/your-repo-name',
   ```

2. **Or use environment variable:**
   ```bash
   GITHUB_PAGES_BASE_PATH=/your-repo-name npm run build
   ```

### Troubleshooting CSS Issues

If CSS is not loading:

1. **Check basePath:** Make sure it matches your repository name
2. **Clear cache:** Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
3. **Check browser console:** Look for 404 errors on CSS files
4. **Verify build output:** Check that `out/_next/static/css/` contains CSS files

### Common Issues

**Issue: CSS not loading**
- **Solution:** Ensure `output: 'export'` is set in `next.config.js`
- **Solution:** Check that `basePath` matches your repository name

**Issue: Routes not working**
- **Solution:** Next.js static export doesn't support dynamic routes. All routes must be pre-rendered.

**Issue: Images not loading**
- **Solution:** Images are set to `unoptimized: true` for static export. Use regular `<img>` tags or ensure images are in the `public` folder.

## Build Output

After running `npm run build`, you'll find:
- `out/` - Static HTML files ready for GitHub Pages
- `out/_next/static/` - CSS, JS, and other assets

## Custom Domain

To use a custom domain:

1. Add `CNAME` file to `public/` folder with your domain
2. Configure DNS settings in your domain provider
3. Enable custom domain in GitHub Pages settings
