# Deployment Guide

## Quick Deploy to Vercel

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js settings
   - Click "Deploy"

3. **That's it!** Your app will be live in minutes.

## Manual Deployment

### Build for Production

```bash
# Install dependencies
npm install

# Build the application
npm run build

# Test production build locally
npm start
```

### Environment Setup

No environment variables are required. The application runs entirely client-side.

### Build Output

The build creates:
- `.next/` - Optimized production build
- `public/` - Static assets (if any)

### Deployment Checklist

- [x] All dependencies installed (`npm install`)
- [x] Build succeeds (`npm run build`)
- [x] No TypeScript errors (`npm run type-check`)
- [x] No linting errors (`npm run lint`)
- [x] All routes tested
- [x] Responsive design verified
- [x] Browser compatibility checked

## Platform-Specific Notes

### Vercel
- Automatic Next.js detection
- Zero configuration needed
- Edge functions supported
- Automatic HTTPS

### Netlify
- Use build command: `npm run build`
- Publish directory: `.next`
- Add `netlify.toml` if needed

### Railway
- Automatic Next.js detection
- Uses `package.json` scripts
- Environment variables via dashboard

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Troubleshooting

### Build Fails
- Check Node.js version (requires 18+)
- Clear `.next` folder: `rm -rf .next`
- Clear node_modules: `rm -rf node_modules && npm install`

### Font Loading Issues
- Google Fonts are loaded automatically by Next.js
- No configuration needed

### TypeScript Errors
- Run `npm run type-check` to see all errors
- Ensure all types are properly imported

## Performance Optimization

The app is already optimized with:
- Next.js App Router for optimal performance
- Client-side calculations (no server load)
- Static generation where possible
- Optimized bundle size

## Monitoring

After deployment:
- Monitor build logs in your platform dashboard
- Check browser console for runtime errors
- Test all calculator flows
- Verify demand letter generation
