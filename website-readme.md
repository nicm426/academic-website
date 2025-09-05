# Academic Website Project Documentation

## Project Overview
This is a Quarto-based academic website for William N. McWilliams, PhD student in Agricultural and Applied Economics at Virginia Tech. The site showcases research on food price inflation forecasting and agricultural economics.

## Technical Setup
- **Framework**: Quarto (R/RStudio)
- **Repository**: https://github.com/nicm426/academic-website
- **Live Site**: https://nicm426.github.io/academic-website/
- **Deployment**: GitHub Pages serving from `/docs` folder on `main` branch
- **Local Path**: `C:\Users\wnm007\Documents\Projects\my-academic-website`

## Project Structure
```
my-academic-website/
├── index.qmd           # Homepage with About Me and Research Interests
├── research.qmd        # Research page with working papers and presentations
├── teaching.qmd        # Teaching experience
├── dashboard.qmd       # Placeholder for future inflation dashboard
├── blog/
│   ├── index.qmd      # Blog listing page
│   └── posts/         # Empty folder for future blog posts
├── CV/
│   └── McWilliams_CV.pdf
├── presentations/     # Folder for presentation PDFs
├── profile.jpg        # Profile photo
├── _quarto.yml       # Site configuration
├── styles.css        # Custom CSS
├── docs/             # Generated HTML output (served by GitHub Pages)
└── WEBSITE_README.md # This documentation file
```

## Key Configuration (_quarto.yml)
```yaml
project:
  type: website
  output-dir: docs

website:
  title: "William N. McWilliams"
  description: "PhD Student - Virginia Tech"
  navbar:
    left:
      - Home, Research, Teaching, Dashboard, Blog
    right:
      - GitHub icon, Email icon

format:
  html:
    theme: cosmo
    css: styles.css
    toc: true
```

## Content Summary

### Homepage (index.qmd)
- About Me section with profile photo
- Research interests (commodity markets, agrifood value chains, forecasting methods, macroeconomic transmission)
- Links to CV, Email, GitHub, LinkedIn

### Research Page (research.qmd)
- Working papers (details temporarily minimal for pre-publication privacy)
- Research interests expanded
- Conference presentations (NCCC-134 2025, AAEA 2024)
- Presentation slides in `/presentations` folder

### Teaching Page (teaching.qmd)
- Instructor of Record: AAEC 2104 (Summer 2025)
- Graduate Teaching Assistant positions at VT and Louisiana Tech
- Complete teaching history from CV

### Dashboard & Blog
- Dashboard: Placeholder for future interactive inflation forecasting dashboard
- Blog: Structure ready, awaiting posts on econometric methods and food economics

## Workflow for Updates

### Basic Update Process
```bash
# 1. Edit the relevant .qmd file
# 2. Regenerate HTML files
quarto render

# 3. Commit and push changes
git add .
git commit -m "Description of changes"
git push
```

### Important Notes
- **Always run `quarto render`** before pushing to regenerate HTML in `/docs`
- Website serves HTML from `/docs`, not `.qmd` files directly
- Changes appear on live site within 2-5 minutes typically
- Check deployment at: https://github.com/nicm426/academic-website/actions

### Troubleshooting
1. **Changes not appearing**: 
   - Clear browser cache (Ctrl+Shift+R)
   - Use incognito/private browsing mode
   - Check if deployment completed (green check in GitHub Actions)

2. **Force rebuild if stuck**:
   ```bash
   echo "" >> docs/index.html
   git add .
   git commit -m "Trigger rebuild"
   git push
   ```

3. **Images not loading**: 
   - Verify exact filename match (case-sensitive)
   - Ensure files are in correct directory

## Current Status & TODO

### Completed
- ✅ Basic site structure and navigation
- ✅ Homepage with profile and research interests
- ✅ Research page with presentations
- ✅ Teaching experience page
- ✅ CV link functional
- ✅ GitHub Pages deployment

### Planned Improvements
- [ ] Add Blue Ridge Mountains background image
- [ ] Build interactive food inflation dashboard
- [ ] Write blog posts on econometric methods
- [ ] Upload all presentation PDFs
- [ ] Expand research details after publication
- [ ] Add Google Scholar and ORCID links
- [ ] Implement responsive design improvements

## File Locations
- **CV**: `/CV/McWilliams_CV.pdf`
- **Profile Photo**: `/profile.jpg`
- **Presentation Slides**: `/presentations/[conference]_[year]_slides.pdf`
- **Custom Styling**: `/styles.css`

## Contact Information
- **Email**: wnm007@vt.edu
- **GitHub**: nicm426
- **Institution**: Virginia Tech, Dept. of Agricultural and Applied Economics

## Last Updated
January 2025

---
*This documentation should be updated whenever significant changes are made to the site structure or deployment process.*