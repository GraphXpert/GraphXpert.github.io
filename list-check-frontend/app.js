/**
 * LIST CHECK FRONTEND - Excel Diff Viewer Client
 *
 * This script handles:
 * - File selection
 * - Form validation
 * - API communication with backend
 * - Progress indication
 * - Results display
 * - Error handling
 */

// API Configuration
// IMPORTANT: Update this URL when deploying to production
// const API_BASE_URL = 'http://localhost:3000'; // Development
const API_BASE_URL = 'https://list-check-backend.onrender.com'; // Production

// State
let selectedOldFile = null;
let selectedNewFile = null;

// DOM Elements
const elements = {
    // File inputs
    oldFileInput: document.getElementById('oldFileInput'),
    newFileInput: document.getElementById('newFileInput'),
    oldFileName: document.getElementById('oldFileName'),
    newFileName: document.getElementById('newFileName'),
    selectOldFile: document.getElementById('selectOldFile'),
    selectNewFile: document.getElementById('selectNewFile'),

    // Configuration
    startRow: document.getElementById('startRow'),
    startCol: document.getElementById('startCol'),

    // Action
    compareBtn: document.getElementById('compareBtn'),

    // Progress
    progressSection: document.getElementById('progressSection'),
    progressBar: document.getElementById('progressBar'),
    progressText: document.getElementById('progressText'),

    // Results
    resultsSection: document.getElementById('resultsSection'),
    totalSheets: document.getElementById('totalSheets'),
    addedRows: document.getElementById('addedRows'),
    modifiedCells: document.getElementById('modifiedCells'),
    removedRows: document.getElementById('removedRows'),
    totalChanges: document.getElementById('totalChanges'),
    outputFilename: document.getElementById('outputFilename'),

    // Error
    errorSection: document.getElementById('errorSection'),
    errorMessage: document.getElementById('errorMessage'),
    retryBtn: document.getElementById('retryBtn')
};

/**
 * Initialize event listeners
 */
function init() {
    // File selection buttons
    elements.selectOldFile.addEventListener('click', () => {
        elements.oldFileInput.click();
    });

    elements.selectNewFile.addEventListener('click', () => {
        elements.newFileInput.click();
    });

    // File input changes
    elements.oldFileInput.addEventListener('change', (e) => {
        handleFileSelection(e.target.files[0], 'old');
    });

    elements.newFileInput.addEventListener('change', (e) => {
        handleFileSelection(e.target.files[0], 'new');
    });

    // Compare button
    elements.compareBtn.addEventListener('click', handleCompare);

    // Retry button
    elements.retryBtn.addEventListener('click', () => {
        hideError();
        hideResults();
    });

    console.log('App initialized');
}

/**
 * Handle file selection
 */
function handleFileSelection(file, type) {
    if (!file) return;

    // Validate file type
    const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
    ];

    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
        alert('Per favore seleziona un file Excel valido (.xlsx o .xls)');
        return;
    }

    // Validate file size (50MB max)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
        alert(`Il file è troppo grande. Dimensione massima: 50MB`);
        return;
    }

    // Store file and update UI
    if (type === 'old') {
        selectedOldFile = file;
        elements.oldFileName.value = file.name;
        console.log('Old file selected:', file.name);
    } else {
        selectedNewFile = file;
        elements.newFileName.value = file.name;
        console.log('New file selected:', file.name);
    }

    // Enable compare button if both files selected
    updateCompareButton();
}

/**
 * Update compare button state
 */
function updateCompareButton() {
    const bothFilesSelected = selectedOldFile && selectedNewFile;
    elements.compareBtn.disabled = !bothFilesSelected;

    if (bothFilesSelected) {
        elements.compareBtn.classList.add('enabled');
    } else {
        elements.compareBtn.classList.remove('enabled');
    }
}

/**
 * Handle compare button click
 */
async function handleCompare() {
    if (!selectedOldFile || !selectedNewFile) {
        alert('Per favore seleziona entrambi i file');
        return;
    }

    // Hide previous results/errors
    hideResults();
    hideError();

    // Show progress
    showProgress(true);
    updateProgress(0, 'Preparazione file...');

    try {
        // Create FormData
        const formData = new FormData();
        formData.append('oldFile', selectedOldFile);
        formData.append('newFile', selectedNewFile);
        formData.append('startRow', elements.startRow.value || '19');
        formData.append('startCol', elements.startCol.value || '2');

        console.log('Sending files to backend...');
        updateProgress(20, 'Caricamento file...');

        // API call
        const response = await fetch(`${API_BASE_URL}/compare`, {
            method: 'POST',
            body: formData
        });

        updateProgress(50, 'Confronto in corso...');

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.details || errorData.error || 'Errore durante il confronto');
        }

        updateProgress(70, 'Generazione file...');

        // Read statistics from custom headers
        const stats = {
            totalSheets: parseInt(response.headers.get('X-Total-Sheets')) || 0,
            addedRows: parseInt(response.headers.get('X-Added-Rows')) || 0,
            modifiedCells: parseInt(response.headers.get('X-Modified-Cells')) || 0,
            removedRows: parseInt(response.headers.get('X-Removed-Rows')) || 0,
            totalChanges: parseInt(response.headers.get('X-Total-Changes')) || 0,
            outputFilename: response.headers.get('X-Output-Filename') || 'output.xlsx'
        };

        console.log('Statistics:', stats);

        updateProgress(80, 'Download file...');

        // Download file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = stats.outputFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        console.log('File downloaded:', stats.outputFilename);

        updateProgress(100, 'Completato!');

        // Show results after a delay
        setTimeout(() => {
            hideProgress();
            showResults(stats);
        }, 800);

    } catch (error) {
        console.error('Error during comparison:', error);
        hideProgress();
        showError(error.message);
    }
}

/**
 * Show/hide progress section
 */
function showProgress(show) {
    elements.progressSection.style.display = show ? 'block' : 'none';
    if (show) {
        elements.compareBtn.disabled = true;
    } else {
        updateCompareButton();
    }
}

/**
 * Hide progress section
 */
function hideProgress() {
    showProgress(false);
}

/**
 * Update progress bar
 */
function updateProgress(percentage, text) {
    elements.progressBar.style.width = `${percentage}%`;
    elements.progressText.textContent = text;
}

/**
 * Show results section
 */
function showResults(stats) {
    // Update statistics
    elements.totalSheets.textContent = stats.totalSheets;
    elements.addedRows.textContent = stats.addedRows;
    elements.modifiedCells.textContent = stats.modifiedCells;
    elements.removedRows.textContent = stats.removedRows;
    elements.totalChanges.textContent = stats.totalChanges;
    elements.outputFilename.textContent = stats.outputFilename;

    // Show results section with animation
    elements.resultsSection.style.display = 'block';

    // Scroll to results
    setTimeout(() => {
        elements.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

/**
 * Hide results section
 */
function hideResults() {
    elements.resultsSection.style.display = 'none';
}

/**
 * Show error section
 */
function showError(message) {
    elements.errorMessage.textContent = message;
    elements.errorSection.style.display = 'block';

    // Scroll to error
    setTimeout(() => {
        elements.errorSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

/**
 * Hide error section
 */
function hideError() {
    elements.errorSection.style.display = 'none';
}

/**
 * Format file size
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
