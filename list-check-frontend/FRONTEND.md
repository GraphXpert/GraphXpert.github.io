# LIST CHECK FRONTEND

Frontend documentation for Excel Diff Viewer web application.

## 📋 Overview

Static frontend application hosted on GitHub Pages that allows users to upload **multiple Excel files** and receive color-coded comparisons. Identical functionality to the desktop Electron app.

### Key Features

- ✅ **Multi-File Upload** - Select multiple file pairs at once (same as desktop app)
- ✅ **Batch Processing** - Process N file pairs sequentially with [N/total] progress
- ✅ **Configuration** - Customize start row and column
- ✅ **Progress Indication** - Real-time progress bar with per-file status
- ✅ **Statistics Display** - Aggregated statistics from all processed files
- ✅ **Auto Download** - All modified files download automatically
- ✅ **Responsive Design** - Works on desktop, tablet, and mobile
- ✅ **Modern UI** - Purple/blue gradient theme matching desktop app

## 🏗️ Architecture

```
frontend/
├── index.html    # Main HTML structure
├── app.js        # Client-side JavaScript logic
├── styles.css    # CSS styling (purple/blue theme)
└── FRONTEND.md   # This documentation
```

## 📄 Files Description

### index.html

Main HTML structure with:
- **Header**: Title, home button, description
- **File Upload Section**: Two file inputs (old/new)
- **Configuration Section**: Start row/column inputs
- **Action Button**: Compare button
- **Progress Section**: Progress bar (hidden by default)
- **Results Section**: Statistics cards, legend (hidden by default)
- **Error Section**: Error display (hidden by default)
- **Footer**: Copyright and home link

### app.js

Client-side JavaScript handling:
- File selection and validation
- Form state management
- API communication (fetch)
- Progress indication
- Results display
- Error handling
- File download

### styles.css

CSS styling with:
- Purple/blue gradient background (`linear-gradient(135deg, #667eea 0%, #764ba2 100%)`)
- Card-based layout
- Responsive grid system
- Color-coded statistics cards
- Smooth animations
- Mobile-friendly design

## 🎨 Design System

### Colors

**Primary Gradient**:
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

**Statistics Colors**:
- Sheets: Blue (`#2196f3`)
- Added: Green (`#28a745`)
- Modified: Yellow (`#ffc107`)
- Removed: Red (`#dc3545`)

**Neutral Colors**:
- Background: White (`#ffffff`)
- Text: Dark Gray (`#2d3748`)
- Borders: Light Gray (`#e2e8f0`)

### Typography

**Font Family**:
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
```

**Font Sizes**:
- Title: 48px
- Subtitle: 18px
- Section Heading: 1.2em
- Body: 14px
- Stats Value: 32px

### Spacing

**Grid Gaps**: 20px, 25px
**Padding**: 20px, 40px
**Border Radius**: 10px, 15px, 20px, 50px (for buttons)

## 🔌 API Integration

### Configuration

**API Base URL** (in `app.js`):

```javascript
// Development
const API_BASE_URL = 'http://localhost:3000';

// Production (UPDATE THIS)
const API_BASE_URL = 'https://list-check-backend.onrender.com';
```

**Important**: Update this before deploying to production!

### API Endpoint

**POST /compare**

Request:
- Method: `POST`
- Body: `FormData` with `oldFile`, `newFile`, `startRow`, `startCol`

Response:
- Binary Excel file
- Custom headers with statistics

### Reading Statistics

Statistics are sent via custom HTTP headers:

```javascript
const stats = {
    totalSheets: response.headers.get('X-Total-Sheets'),
    addedRows: response.headers.get('X-Added-Rows'),
    modifiedCells: response.headers.get('X-Modified-Cells'),
    removedRows: response.headers.get('X-Removed-Rows'),
    totalChanges: response.headers.get('X-Total-Changes'),
    outputFilename: response.headers.get('X-Output-Filename')
};
```

## 📱 User Flow

### Single File Pair
```
1. User lands on page
   ↓
2. User clicks "SCEGLI FILE" for old file
   ↓
3. User selects 1 original Excel file
   ↓
4. User clicks "SCEGLI FILE" for new file
   ↓
5. User selects 1 revised Excel file
   ↓
6. (Optional) User adjusts start row/column
   ↓
7. Compare button becomes enabled
   ↓
8. User clicks "AVVIA CONFRONTO"
   ↓
9. Progress bar shows (Upload → Compare → Download)
   ↓
10. File downloads automatically
   ↓
11. Statistics display on screen
   ↓
12. User opens downloaded file in Excel
```

### Multiple File Pairs (NEW - Same as Desktop!)
```
1. User lands on page
   ↓
2. User clicks "SCEGLI FILE" for old files
   ↓
3. User selects MULTIPLE original Excel files (Ctrl+Click or Shift+Click)
   ↓
4. Label shows: "N file: file1.xlsx, file2.xlsx, ..."
   ↓
5. User clicks "SCEGLI FILE" for new files
   ↓
6. User selects SAME NUMBER of revised Excel files
   ↓
7. Label shows: "N file: file1_rev.xlsx, file2_rev.xlsx, ..."
   ↓
8. Compare button becomes enabled (ONLY if same number!)
   ↓
9. User clicks "AVVIA CONFRONTO"
   ↓
10. Confirmation dialog: "Elaborazione di N coppia/e di file"
   ↓
11. Progress bar shows [1/N], [2/N], ... for each pair
   ↓
12. ALL N files download automatically (one by one)
   ↓
13. Aggregated statistics display (sum of all files)
   ↓
14. User opens all downloaded files in Excel
```

**Important**:
- Number of OLD files MUST equal number of NEW files
- Files are paired by selection order: old[0]+new[0], old[1]+new[1], etc.
- Each pair is processed sequentially (not in parallel)

## 🎯 UI Components

### File Input Component

```html
<div class="file-input-group">
    <label class="file-label">
        <span class="icon">📄</span>
        <span class="label-text">File Originale</span>
    </label>
    <div class="input-wrapper">
        <input type="file" id="oldFileInput" accept=".xlsx,.xls" style="display: none;">
        <input type="text" id="oldFileName" class="file-path-input" placeholder="Nessun file selezionato..." readonly>
        <button id="selectOldFile" class="select-btn">SCEGLI FILE</button>
    </div>
</div>
```

**Behavior**:
- Clicking button triggers file input
- Selected filename displays in text input
- Only `.xlsx` and `.xls` files accepted

### Progress Bar Component

```html
<div class="progress-section">
    <div class="progress-bar">
        <div class="progress-fill"></div>
    </div>
    <p class="progress-text">Elaborazione in corso...</p>
</div>
```

**States**:
- 0%: "Preparazione file..."
- 20%: "Caricamento file..."
- 50%: "Confronto in corso..."
- 70%: "Generazione file..."
- 80%: "Download file..."
- 100%: "Completato!"

### Statistics Card Component

```html
<div class="stat-card stat-added">
    <div class="stat-icon">🟢</div>
    <div class="stat-content">
        <div class="stat-label">Righe Aggiunte</div>
        <div class="stat-value">15</div>
    </div>
</div>
```

**Variants**:
- `.stat-sheets` - Blue (total sheets)
- `.stat-added` - Green (added rows)
- `.stat-modified` - Yellow (modified cells)
- `.stat-removed` - Red (removed rows)

## 🔧 Customization

### Change Colors

**Primary Gradient**:
```css
/* In styles.css */
body {
    background: linear-gradient(135deg, #NEW_COLOR_1 0%, #NEW_COLOR_2 100%);
}
```

**Statistics Colors**:
```css
.stat-added {
    background: linear-gradient(135deg, #NEW_GREEN_LIGHT 0%, #NEW_GREEN_DARK 100%);
    border: 2px solid #NEW_GREEN_BORDER;
}
```

### Change Configuration Defaults

**In index.html**:
```html
<input type="number" id="startRow" value="19">  <!-- Change 19 -->
<input type="number" id="startCol" value="2">   <!-- Change 2 -->
```

### Change File Size Limit

**In app.js**:
```javascript
const maxSize = 50 * 1024 * 1024; // Change 50 to desired MB
if (file.size > maxSize) {
    alert(`File troppo grande. Dimensione massima: ${maxSize / 1024 / 1024}MB`);
    return;
}
```

### Add New Statistics

**1. Read from header** (in app.js):
```javascript
const stats = {
    // ... existing stats
    newStat: response.headers.get('X-New-Stat')
};
```

**2. Add HTML element**:
```html
<div class="stat-card">
    <div class="stat-label">New Statistic</div>
    <div class="stat-value" id="newStat">0</div>
</div>
```

**3. Update display**:
```javascript
document.getElementById('newStat').textContent = stats.newStat;
```

## 🚀 Deployment

### Deploy to GitHub Pages

**1. Copy files to GraphXpert.github.io**:

```bash
# From project root
cd ../../../GraphXpert.github.io
mkdir -p list-check-frontend
cp ../GraphXpert-Plans/LIST_CHECK_ELECTRON/LIST_CHECK_ELECTRON_WEB/frontend/* list-check-frontend/
```

**2. Update API URL** (in `app.js`):

```javascript
const API_BASE_URL = 'https://list-check-backend.onrender.com';
```

**3. Commit and push**:

```bash
git add list-check-frontend/
git commit -m "Add LIST CHECK frontend"
git push origin main
```

**4. Access**:

```
https://graphxpert.github.io/list-check-frontend/
```

### Add to Homepage

**In GraphXpert.github.io/index.html**:

```html
<a href="/list-check-frontend/" class="project-card">
    <h3>📊 Excel Diff Viewer</h3>
    <p>Confronta file Excel con evidenziazione differenze</p>
</a>
```

## 🧪 Testing

### Manual Testing Checklist

- [ ] Page loads without errors
- [ ] Home button navigates to homepage
- [ ] Old file selection works
- [ ] New file selection works
- [ ] Invalid file types rejected
- [ ] Large files (>50MB) rejected
- [ ] Compare button disabled when files missing
- [ ] Compare button enabled when both files selected
- [ ] Start row/column inputs accept numbers
- [ ] Progress bar shows during processing
- [ ] File downloads automatically
- [ ] Statistics display correctly
- [ ] Error messages show for API failures
- [ ] Retry button works
- [ ] Mobile view is responsive
- [ ] Works on Chrome, Firefox, Safari, Edge

### Browser Compatibility

**Tested On**:
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

**Required Features**:
- Fetch API
- FormData
- Blob
- File API
- ES6 (arrow functions, async/await, template literals)

### Mobile Testing

**Test On**:
- iOS Safari (iPhone, iPad)
- Chrome for Android
- Samsung Internet

**Known Issues**:
- File download may open directly instead of saving (expected mobile behavior)
- Large files may be slow on mobile networks

## 🐛 Troubleshooting

### Issue: API URL not working

**Check**:
1. Backend is deployed and running
2. API_BASE_URL is correct in `app.js`
3. No typos in URL
4. HTTPS used (not HTTP) for production

### Issue: Headers are null

**Check**:
1. Backend CORS exposedHeaders configured
2. Network tab shows headers in response
3. No browser extensions blocking headers

### Issue: File not downloading

**Check**:
1. Browser allows downloads
2. Popup blocker disabled
3. Console for download errors
4. Network tab shows successful response

### Issue: Statistics show 0

**Check**:
1. Response headers contain values
2. parseInt() not failing
3. Correct header names used
4. CORS exposedHeaders includes all stats headers

## 📊 Analytics (Optional)

### Add Google Analytics

**In index.html** (before `</head>`):

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### Track Events

**In app.js**:

```javascript
// Track file upload
gtag('event', 'file_upload', {
    'event_category': 'engagement',
    'event_label': 'old_file'
});

// Track comparison
gtag('event', 'compare_files', {
    'event_category': 'engagement',
    'event_label': 'success'
});

// Track errors
gtag('event', 'error', {
    'event_category': 'errors',
    'event_label': error.message
});
```

## 🔐 Security

### Client-Side Validation

**Always validate**:
- File type (.xlsx, .xls only)
- File size (< 50MB)
- Number inputs (positive integers)

**Never trust user input** - Backend must also validate!

### XSS Prevention

**Avoid `innerHTML`** - Use `textContent`:

```javascript
// Good
element.textContent = userInput;

// Bad
element.innerHTML = userInput;
```

### HTTPS

**Always use HTTPS** in production:
- GitHub Pages provides HTTPS automatically
- Backend should use HTTPS (Render.com provides)

## 📈 Performance

### Optimization Tips

**1. Minimize JS/CSS**:
```bash
# Use tools like terser, cssnano
npx terser app.js -o app.min.js
npx cssnano styles.css styles.min.css
```

**2. Lazy Load**:
- Only load what's needed initially
- Defer non-critical JS

**3. Cache API Responses** (if appropriate):
```javascript
// Cache results for identical files
const cacheKey = oldFile.name + newFile.name + startRow + startCol;
if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
}
```

### Lighthouse Score Targets

- Performance: > 90
- Accessibility: > 95
- Best Practices: > 95
- SEO: > 90

## 📚 Resources

### Documentation

- [Backend API](../backend/API.md)
- [Integration Guide](../backend/INTEGRATION.md)
- [Deployment Guide](../backend/DEPLOYMENT.md)

### External Resources

- [MDN Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [MDN FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData)
- [GitHub Pages Docs](https://docs.github.com/en/pages)

---

**GraphXpert - Excel Diff Viewer Frontend v1.0.0**
