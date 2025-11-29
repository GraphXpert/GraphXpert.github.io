# Frontend Documentation - Assembly Excel Edit

## Overview

Frontend web application per la generazione di file Excel con formule VLOOKUP dinamiche. Interfaccia completamente client-side che comunica con backend privato via API REST.

**Live URL**: https://graphxpert.github.io/assembly-excel-edit-frontend/

## Tech Stack

- **HTML5**: Struttura semantica
- **CSS3**: Styling responsive con gradients e animations
- **Vanilla JavaScript**: Logica client-side, Fetch API
- **GitHub Pages**: Hosting statico gratuito

## Architecture

```
┌─────────────────────────────────────────────────┐
│             Frontend (GitHub Pages)              │
│         assembly-excel-edit-frontend/           │
│                                                  │
│  ├─ index.html (UI Structure)                   │
│  ├─ styles.css (Visual Design)                  │
│  └─ app.js (Client Logic)                       │
│                                                  │
│       ↓ Fetch API (POST /generate)              │
│                                                  │
│  Backend: assembly-excel-edit-backend           │
│  https://assembly-excel-edit-backend            │
│         .onrender.com                           │
└─────────────────────────────────────────────────┘
```

## File Structure

```
assembly-excel-edit-frontend/
├── index.html          # Main HTML page
├── app.js             # Client-side JavaScript
├── styles.css         # All styles and animations
└── FRONTEND.md        # This documentation
```

---

## Core Components

### 1. index.html

**Purpose**: UI structure e layout

**Sections**:

1. **Header**:
   - Home button (navigazione a homepage)
   - Titolo e descrizione applicazione

2. **File Upload Form**:
   - 3 file inputs custom-styled
   - Assembly List input
   - Part List input
   - Template input
   - Generate button (disabled finché tutti file selezionati)

3. **Progress Section**:
   - Progress bar animata
   - Status text dinamico

4. **Error Section**:
   - Error message display
   - Hidden di default

5. **Results Section**:
   - 4 statistics cards (Assemblies, Weight, Parts, Formulas)
   - Detailed breakdown table
   - Hidden di default

**Key Elements**:

```html
<!-- File Input Structure -->
<div class="file-input-group">
    <label class="file-label">
        <span class="icon">🔧</span>
        <span class="label-text">Assembly List</span>
    </label>
    <div class="input-wrapper">
        <div class="file-input-display" id="assemblyListDisplay">
            Nessun file selezionato
        </div>
        <input type="file" id="assemblyList" accept=".xlsx,.xls" required>
        <label for="assemblyList" class="select-btn">SCEGLI FILE</label>
    </div>
</div>
```

---

### 2. app.js

**Purpose**: Client-side logic, API communication, UI updates

#### Configuration

```javascript
// API Base URL - IMPORTANTE: Cambia per sviluppo locale
const API_BASE_URL = 'https://assembly-excel-edit-backend.onrender.com';

// Per sviluppo locale:
// const API_BASE_URL = 'http://localhost:3000';
```

#### State Management

```javascript
let selectedFiles = {
    assemblyList: null,
    partList: null,
    template: null
};
```

#### Key Functions

**1. File Selection Handler**

```javascript
function handleFileSelection(event, fileType, displayElement) {
    const file = event.target.files[0];

    if (file) {
        selectedFiles[fileType] = file;
        displayElement.textContent = file.name;
        displayElement.classList.add('selected');
    } else {
        selectedFiles[fileType] = null;
        displayElement.textContent = 'Nessun file selezionato';
        displayElement.classList.remove('selected');
    }

    updateGenerateButton();
}
```

**2. Generate Button State**

```javascript
function updateGenerateButton() {
    const allFilesSelected = selectedFiles.assemblyList &&
                             selectedFiles.partList &&
                             selectedFiles.template;

    generateBtn.disabled = !allFilesSelected;

    if (allFilesSelected) {
        warningText.textContent = 'Tutti i file selezionati. Pronto per generare!';
        warningText.style.color = '#28a745';
    } else {
        warningText.textContent = 'Seleziona tutti e 3 i file per abilitare la generazione';
        warningText.style.color = '#e53e3e';
    }
}
```

**3. Form Submit & API Call**

```javascript
uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Hide previous results/errors
    hideElement(errorSection);
    hideElement(resultsSection);

    // Show progress
    showElement(progressSection);
    updateProgress(0, 'Preparazione file...');

    try {
        // Create FormData
        const formData = new FormData();
        formData.append('assemblyList', selectedFiles.assemblyList);
        formData.append('partList', selectedFiles.partList);
        formData.append('template', selectedFiles.template);

        updateProgress(20, 'Caricamento file al server...');

        // Send request to backend
        const response = await fetch(`${API_BASE_URL}/generate`, {
            method: 'POST',
            body: formData
        });

        updateProgress(50, 'Generazione formule in corso...');

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Errore durante la generazione del file');
        }

        updateProgress(80, 'Download file generato...');

        // Get filename from Content-Disposition header
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = 'ASSEMBLY_PART_LIST.xlsx';

        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
            if (filenameMatch) {
                filename = filenameMatch[1];
            }
        }

        // CRITICAL: Leggi statistiche dagli headers custom
        const stats = {
            totalAssemblies: response.headers.get('X-Total-Assemblies') || '-',
            totalParts: response.headers.get('X-Total-Parts') || '-',
            totalFormulas: response.headers.get('X-Total-Formulas') || '-',
            totalWeight: response.headers.get('X-Total-Weight') || '-',
            outputFilename: response.headers.get('X-Output-Filename') || filename
        };

        // Download file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        updateProgress(100, 'Completato!');

        // Show success message and stats
        setTimeout(() => {
            hideElement(progressSection);
            showResults(stats);
        }, 500);

    } catch (error) {
        console.error('Errore:', error);
        hideElement(progressSection);
        showError(error.message);
    }
});
```

**4. Statistics Display**

```javascript
function showResults(stats) {
    // Update main stats cards
    document.getElementById('totalAssemblies').textContent = stats.totalAssemblies;
    document.getElementById('totalWeight').textContent = stats.totalWeight ?
        parseFloat(stats.totalWeight).toFixed(2) + ' kg' : '-';
    document.getElementById('totalParts').textContent = stats.totalParts;
    document.getElementById('totalFormulas').textContent = stats.totalFormulas;

    // Update detailed breakdown
    const assemblyFormulas = stats.totalAssemblies ? stats.totalAssemblies * 2 : 0;
    const partFormulas = stats.totalParts ? stats.totalParts * 5 : 0;

    document.getElementById('detailAssemblies').textContent = stats.totalAssemblies;
    document.getElementById('detailAssemblyFormulas').textContent =
        `${assemblyFormulas} (Qty + Weight)`;
    document.getElementById('detailParts').textContent = stats.totalParts;
    document.getElementById('detailPartFormulas').textContent =
        `${partFormulas} (Dimension, Grade, Length, Weight, Area)`;

    showElement(resultsSection);
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
```

**5. Progress Updates**

```javascript
function updateProgress(percentage, message) {
    progressBar.style.width = `${percentage}%`;
    progressText.textContent = message;
}
```

**6. Error Handling**

```javascript
function showError(message) {
    errorMessage.textContent = message;
    showElement(errorSection);
    errorSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
```

---

### 3. styles.css

**Purpose**: Visual design, responsive layout, animations

#### Design System

**Colors**:
```css
--primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
--success-color: #28a745;
--error-color: #e53e3e;
--background: #f0f4f8;
--card-background: white;
```

**Typography**:
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu;
```

#### Key Components

**1. Container & Layout**

```css
.container {
    max-width: 1000px;
    margin: 0 auto;
    padding: 30px 20px;
}
```

**2. File Input Custom Styling**

```css
.file-input-group {
    background: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.file-input-display {
    flex: 1;
    padding: 12px 16px;
    background: #f8f9fa;
    border: 2px dashed #cbd5e0;
    border-radius: 8px;
}

.file-input-display.selected {
    background: #e6f7ed;
    border-color: #28a745;
    color: #28a745;
}
```

**3. Generate Button**

```css
.generate-btn {
    width: 100%;
    padding: 18px;
    font-size: 18px;
    font-weight: 700;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.generate-btn:disabled {
    background: #cbd5e0;
    cursor: not-allowed;
}
```

**4. Progress Bar**

```css
.progress-bar {
    height: 100%;
    background: linear-gradient(90deg, #667eea, #764ba2);
    border-radius: 10px;
    transition: width 0.3s ease;
    box-shadow: 0 0 10px rgba(102, 126, 234, 0.5);
}
```

**5. Statistics Cards**

```css
.stat-card {
    background: white;
    padding: 20px;
    border-radius: 12px;
    text-align: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    transition: transform 0.2s ease;
}

.stat-card:hover {
    transform: translateY(-5px);
}
```

**6. Responsive Design**

```css
@media (max-width: 768px) {
    .stats-grid {
        grid-template-columns: 1fr;
    }

    .file-input-group {
        padding: 15px;
    }
}
```

---

## User Flow

### 1. Page Load

```
User visits → index.html loads → app.js initializes
                              → All buttons disabled
                              → Warning text shows
```

### 2. File Selection

```
User selects file → handleFileSelection() called
                  → selectedFiles state updated
                  → UI display updated (filename shown, green color)
                  → updateGenerateButton() called
                  → If all 3 files: Enable button, green warning
```

### 3. Generate File

```
User clicks Generate → Form submit handler fires
                    → Hide previous results/errors
                    → Show progress bar (0%)
                    → Create FormData with 3 files
                    → Update progress (20%)
                    → POST to /generate endpoint
                    → Update progress (50%)
                    → Wait for response
                    → Update progress (80%)
                    → Read headers (stats)
                    → Download blob as file
                    → Update progress (100%)
                    → Show results section with stats
                    → Smooth scroll to results
```

### 4. View Results

```
Results section shown → 4 stat cards display:
                       - Total Assemblies
                       - Total Weight (kg)
                       - Total Parts
                       - Total Formulas
                     → Detailed breakdown table:
                       - Assembly formulas: qty + weight
                       - Part formulas: dimension, grade, length, weight, area
```

### 5. Error Handling

```
If error occurs → Catch block executes
               → Hide progress bar
               → Show error section
               → Display error message
               → Smooth scroll to error
```

---

## Critical Implementation Details

### 1. CORS Headers

**IMPORTANTE**: Il backend deve esporre custom headers:

```javascript
// Backend (server.js)
app.use(cors({
    exposedHeaders: [
        'X-Total-Assemblies',
        'X-Total-Parts',
        'X-Total-Formulas',
        'X-Total-Weight',
        'X-Output-Filename'
    ]
}));
```

Senza questa configurazione, `response.headers.get('X-Total-Assemblies')` restituisce `null`!

### 2. File Download

```javascript
// Create blob URL
const blob = await response.blob();
const url = window.URL.createObjectURL(blob);

// Create temporary anchor
const a = document.createElement('a');
a.href = url;
a.download = filename;
document.body.appendChild(a);

// Trigger download
a.click();

// Cleanup
window.URL.revokeObjectURL(url);
document.body.removeChild(a);
```

### 3. Progress Updates

Progress è simulato (non real-time dal backend):
- 0%: Preparation
- 20%: Upload starting
- 50%: Processing (dopo response iniziata)
- 80%: Download
- 100%: Complete

**Future Enhancement**: WebSocket per progress real-time dal backend.

---

## Customization Guide

### Change API Endpoint

**File**: [app.js](app.js:4)

```javascript
// Production
const API_BASE_URL = 'https://assembly-excel-edit-backend.onrender.com';

// Development
const API_BASE_URL = 'http://localhost:3000';

// Custom endpoint
const API_BASE_URL = 'https://your-custom-backend.com';
```

### Change Colors

**File**: [styles.css](styles.css)

```css
/* Primary gradient */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* Success color */
color: #28a745;

/* Error color */
color: #e53e3e;
```

### Change Text/Language

**File**: [index.html](index.html)

Tutta la UI è in italiano. Per cambiare lingua:

1. Modifica testi in HTML:
   - Header title/description
   - File labels
   - Button text
   - Error messages

2. Modifica testi in JavaScript:
   - Warning messages
   - Progress messages
   - Error messages

### Add New Statistic

**1. Backend**: Aggiungi nuovo header in `server.js`:

```javascript
res.setHeader('X-New-Stat', result.stats.newStat);
```

**2. Backend**: Esponi header in CORS:

```javascript
exposedHeaders: [
    'X-Total-Assemblies',
    'X-Total-Parts',
    'X-Total-Formulas',
    'X-Total-Weight',
    'X-Output-Filename',
    'X-New-Stat'  // ← Add here
]
```

**3. Frontend**: Leggi header in `app.js`:

```javascript
const stats = {
    // ... existing stats
    newStat: response.headers.get('X-New-Stat') || '-'
};
```

**4. Frontend**: Mostra in UI (`index.html`):

```html
<div class="stat-card">
    <div class="stat-value" id="newStat">-</div>
    <div class="stat-label">New Statistic</div>
</div>
```

**5. Frontend**: Update in `showResults()`:

```javascript
document.getElementById('newStat').textContent = stats.newStat;
```

---

## Error Handling

### Common Errors

**1. CORS Error**

```
Access to fetch at '...' from origin '...' has been blocked by CORS policy
```

**Solution**: Verifica backend CORS configuration:
```javascript
app.use(cors({
    exposedHeaders: [...]
}));
```

**2. Network Error**

```
Failed to fetch
```

**Causes**:
- Backend offline
- Wrong API_BASE_URL
- Network issues
- Render cold start (wait 30s)

**Solution**:
- Check backend health: `/health` endpoint
- Verify API_BASE_URL
- Wait for Render wake up

**3. Headers Return Null**

```
stats.totalAssemblies = null
```

**Cause**: Headers not exposed in CORS

**Solution**: Add header to `exposedHeaders` array in backend

**4. File Too Large**

```
400 Bad Request: File troppo grande
```

**Solution**: Backend MAX_FILE_SIZE = 50MB. Riduci dimensione file o aumenta limit.

---

## Performance Optimization

### Current Performance

| Metric | Value |
|--------|-------|
| First Load | ~500ms |
| File Upload | Depends on file size |
| Processing | Backend-dependent |
| Download | Instant (browser) |

### Optimization Tips

**1. Reduce Bundle Size**:
- ✅ No external dependencies
- ✅ Vanilla JS (no framework overhead)
- ✅ Single CSS file (no preprocessor)

**2. Lazy Loading**:
- Consider lazy loading results section
- Defer non-critical CSS

**3. Compression**:
- GitHub Pages automatically serves gzipped files

**4. Caching**:
```html
<meta http-equiv="Cache-Control" content="max-age=31536000">
```

**5. CDN**:
- GitHub Pages already uses CDN globally

---

## Testing

### Manual Testing Checklist

- [ ] Load page (no errors in console)
- [ ] All 3 file inputs work
- [ ] Generate button disabled initially
- [ ] Select 1 file → Display updates, button still disabled
- [ ] Select 2 files → Display updates, button still disabled
- [ ] Select 3 files → Display updates, button enabled, green warning
- [ ] Click Generate → Progress bar shows
- [ ] Wait for processing → Download starts automatically
- [ ] Results section appears with correct stats
- [ ] Home button navigates to homepage

### Error Testing

- [ ] Select invalid file type → Error shown
- [ ] Upload file > 50MB → Error shown
- [ ] Backend offline → Network error shown
- [ ] Invalid file content → Backend error shown

### Browser Testing

Testato su:
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)

---

## Deployment

### GitHub Pages

**Repository**: https://github.com/GraphXpert/GraphXpert.github.io

**Branch**: `main`

**Directory**: `/assembly-excel-edit-frontend/`

**URL**: https://graphxpert.github.io/assembly-excel-edit-frontend/

### Deploy Process

```bash
# 1. Make changes locally
git add assembly-excel-edit-frontend/
git commit -m "Update: frontend changes"

# 2. Push to GitHub
git push origin main

# 3. Wait 1-2 minutes for GitHub Pages to rebuild
# No build step required (static files)
```

### Configuration

**GitHub Repository Settings**:
- Settings → Pages
- Source: Deploy from branch
- Branch: main
- Folder: / (root)
- Custom domain: (optional)

---

## Integration with Backend

### API Contract

**Endpoint**: `POST /generate`

**Request**:
```
Content-Type: multipart/form-data

Files:
- assemblyList: Excel file
- partList: Excel file
- template: Excel file
```

**Response**:
```
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="ASSEMBLY_PART_LIST_*.xlsx"

Headers:
- X-Total-Assemblies: number
- X-Total-Parts: number
- X-Total-Formulas: number
- X-Total-Weight: number
- X-Output-Filename: string

Body: Excel file (binary)
```

### Error Response:
```json
{
  "error": "Error message",
  "details": "Additional info"
}
```

---

## Future Enhancements

### Priority High
- [ ] Real-time progress via WebSocket
- [ ] File validation before upload (client-side)
- [ ] Drag & drop file upload
- [ ] Preview file before generate

### Priority Medium
- [ ] User authentication
- [ ] File history
- [ ] Download history
- [ ] Excel preview in browser

### Priority Low
- [ ] Dark mode
- [ ] Multi-language support
- [ ] Advanced statistics charts
- [ ] Export stats as PDF

---

## Troubleshooting

### Statistics Show "-" Instead of Numbers

**Cause**: Backend headers not exposed or frontend not reading them

**Check**:
1. Backend CORS configuration has `exposedHeaders`
2. Frontend reads headers: `response.headers.get('X-Total-Assemblies')`
3. Open DevTools → Network → Check response headers

### Download Doesn't Start

**Cause**: Response not ok or blob creation failed

**Check**:
1. Backend returns 200 status
2. Content-Type is correct
3. Response has blob data
4. Browser allows downloads

### Button Stays Disabled

**Cause**: File selection not updating state

**Check**:
1. Event listeners attached correctly
2. `selectedFiles` object updates
3. All 3 files are selected
4. `updateGenerateButton()` is called

---

## Support

- **Frontend Repository**: https://github.com/GraphXpert/GraphXpert.github.io
- **Backend Repository**: https://github.com/GraphXpert/assembly-excel-edit-backend (Private)
- **Live App**: https://graphxpert.github.io/assembly-excel-edit-frontend/
- **Issues**: Contact repository maintainer

---

## Related Documentation

- [Backend API Documentation](https://github.com/GraphXpert/assembly-excel-edit-backend/blob/main/API.md)
- [Backend Architecture](https://github.com/GraphXpert/assembly-excel-edit-backend/blob/main/ARCHITECTURE.md)
- [Deployment Guide](https://github.com/GraphXpert/assembly-excel-edit-backend/blob/main/DEPLOYMENT.md)

---

**Last Updated**: 2025-11-29
**Version**: 1.0.0
**Maintainer**: GraphXpert
