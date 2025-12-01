/**
 * LIST CHECK FRONTEND - Excel Diff Viewer Client (MULTI-FILE VERSION)
 *
 * This script handles:
 * - Multiple file selection
 * - Form validation (same number of old/new files)
 * - Sequential API communication for each file pair
 * - Progress indication with [N/total]
 * - Aggregated results display
 * - Error handling
 */

// API Configuration
// IMPORTANT: Update this URL when deploying to production
// const API_BASE_URL = 'http://localhost:3000'; // Development
const API_BASE_URL = 'https://list-check-backend.onrender.com'; // Production

// State - Arrays for multiple files
let selectedOldFiles = [];
let selectedNewFiles = [];
let allResults = []; // Array of results for each pair

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

    // File input changes - MULTIPLE FILES
    elements.oldFileInput.addEventListener('change', (e) => {
        handleMultipleFileSelection(e.target.files, 'old');
    });

    elements.newFileInput.addEventListener('change', (e) => {
        handleMultipleFileSelection(e.target.files, 'new');
    });

    // Compare button
    elements.compareBtn.addEventListener('click', handleCompare);

    // Retry button
    elements.retryBtn.addEventListener('click', () => {
        hideError();
        hideResults();
    });

    console.log('App initialized (multi-file mode)');
}

/**
 * Handle multiple file selection
 */
function handleMultipleFileSelection(files, type) {
    if (!files || files.length === 0) return;

    // Convert FileList to Array
    const fileArray = Array.from(files);

    // Validate file types
    const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
    ];

    for (const file of fileArray) {
        if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
            alert(`File non valido: ${file.name}. Solo .xlsx o .xls`);
            return;
        }

        // Validate file size (50MB max per file)
        const maxSize = 50 * 1024 * 1024; // 50MB
        if (file.size > maxSize) {
            alert(`File troppo grande: ${file.name}. Max 50MB`);
            return;
        }
    }

    // Store files and update UI
    if (type === 'old') {
        selectedOldFiles = fileArray;
        const fileNames = fileArray.map(f => f.name).join(', ');
        elements.oldFileName.value = `${fileArray.length} file: ${fileNames}`;
        console.log(`Selected ${fileArray.length} old files:`, fileArray.map(f => f.name));
    } else {
        selectedNewFiles = fileArray;
        const fileNames = fileArray.map(f => f.name).join(', ');
        elements.newFileName.value = `${fileArray.length} file: ${fileNames}`;
        console.log(`Selected ${fileArray.length} new files:`, fileArray.map(f => f.name));
    }

    // Enable compare button if valid selection
    updateCompareButton();
}

/**
 * Update compare button state
 * Enable ONLY if same number of old and new files
 */
function updateCompareButton() {
    const oldCount = selectedOldFiles.length;
    const newCount = selectedNewFiles.length;

    if (oldCount > 0 && newCount > 0 && oldCount === newCount) {
        elements.compareBtn.disabled = false;
        elements.compareBtn.classList.add('enabled');
        console.log(`Compare button enabled: ${oldCount} pairs ready`);
    } else {
        elements.compareBtn.disabled = true;
        elements.compareBtn.classList.remove('enabled');
        if (oldCount !== newCount && oldCount > 0 && newCount > 0) {
            console.warn(`File count mismatch: ${oldCount} old files vs ${newCount} new files`);
        }
    }
}

/**
 * Handle compare button click - Process ALL file pairs
 */
async function handleCompare() {
    const numPairs = selectedOldFiles.length;

    if (numPairs === 0) {
        alert('Seleziona i file da confrontare');
        return;
    }

    // Confirm action
    const confirmed = confirm(
        `Elaborazione di ${numPairs} coppia/e di file.\n\n` +
        `Verranno scaricati ${numPairs} file modificati.\n\n` +
        `Vuoi continuare?`
    );

    if (!confirmed) return;

    // Hide previous results/errors
    hideResults();
    hideError();

    // Show progress
    showProgress(true);
    allResults = []; // Reset results

    try {
        // Process each pair sequentially
        for (let i = 0; i < numPairs; i++) {
            const oldFile = selectedOldFiles[i];
            const newFile = selectedNewFiles[i];

            // Calculate progress for this pair
            const baseProgress = (i / numPairs) * 100;
            const stepProgress = 100 / numPairs;

            console.log(`Processing pair ${i + 1}/${numPairs}: ${newFile.name}`);

            // Process this pair
            const result = await processSinglePair(
                oldFile,
                newFile,
                i + 1,
                numPairs,
                baseProgress,
                stepProgress
            );

            allResults.push(result);
        }

        // All pairs processed successfully
        updateProgress(100, `Completato! ${numPairs} file processati.`);

        // Show aggregated results
        setTimeout(() => {
            hideProgress();
            showAggregatedResults();
        }, 800);

    } catch (error) {
        console.error('Error during comparison:', error);
        hideProgress();
        showError(error.message);
    }
}

/**
 * Process a single file pair
 */
async function processSinglePair(oldFile, newFile, pairIndex, totalPairs, baseProgress, stepProgress) {
    const fileName = newFile.name;

    try {
        // Create FormData
        const formData = new FormData();
        formData.append('oldFile', oldFile);
        formData.append('newFile', newFile);
        formData.append('startRow', elements.startRow.value || '19');
        formData.append('startCol', elements.startCol.value || '2');

        updateProgress(baseProgress + stepProgress * 0.2, `[${pairIndex}/${totalPairs}] Caricamento ${fileName}...`);

        // API call
        const response = await fetch(`${API_BASE_URL}/compare`, {
            method: 'POST',
            body: formData
        });

        updateProgress(baseProgress + stepProgress * 0.6, `[${pairIndex}/${totalPairs}] Confronto ${fileName}...`);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`${fileName}: ${errorData.details || errorData.error}`);
        }

        // Read statistics from headers
        const stats = {
            totalSheets: parseInt(response.headers.get('X-Total-Sheets')) || 0,
            addedRows: parseInt(response.headers.get('X-Added-Rows')) || 0,
            modifiedCells: parseInt(response.headers.get('X-Modified-Cells')) || 0,
            removedRows: parseInt(response.headers.get('X-Removed-Rows')) || 0,
            totalChanges: parseInt(response.headers.get('X-Total-Changes')) || 0,
            outputFilename: response.headers.get('X-Output-Filename') || `${fileName}_DIFF.xlsx`
        };

        console.log(`Stats for ${fileName}:`, stats);

        updateProgress(baseProgress + stepProgress * 0.8, `[${pairIndex}/${totalPairs}] Download ${fileName}...`);

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

        console.log(`File downloaded: ${stats.outputFilename}`);

        updateProgress(baseProgress + stepProgress, `[${pairIndex}/${totalPairs}] Completato!`);

        return stats;

    } catch (error) {
        throw new Error(`Errore file ${fileName}: ${error.message}`);
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
 * Show aggregated results from all file pairs
 */
function showAggregatedResults() {
    if (allResults.length === 0) return;

    // Aggregate statistics from all pairs
    let totalSheets = 0;
    let totalAddedRows = 0;
    let totalModifiedCells = 0;
    let totalRemovedRows = 0;
    let totalChanges = 0;

    allResults.forEach(stats => {
        totalSheets += stats.totalSheets;
        totalAddedRows += stats.addedRows;
        totalModifiedCells += stats.modifiedCells;
        totalRemovedRows += stats.removedRows;
        totalChanges += stats.totalChanges;
    });

    // Update statistics display
    elements.totalSheets.textContent = totalSheets;
    elements.addedRows.textContent = totalAddedRows;
    elements.modifiedCells.textContent = totalModifiedCells;
    elements.removedRows.textContent = totalRemovedRows;
    elements.totalChanges.textContent = totalChanges;

    // Update output filename text
    const numFiles = allResults.length;
    elements.outputFilename.textContent = `${numFiles} file scaricati`;

    console.log('Aggregated stats:', {
        totalSheets,
        totalAddedRows,
        totalModifiedCells,
        totalRemovedRows,
        totalChanges,
        filesProcessed: numFiles
    });

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

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
