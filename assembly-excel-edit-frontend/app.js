// API Configuration
// Per sviluppo locale: 'http://localhost:3000'
// Per produzione: 'https://assembly-excel-edit-backend.onrender.com'
const API_BASE_URL = 'https://assembly-excel-edit-backend.onrender.com';

// DOM Elements
const uploadForm = document.getElementById('uploadForm');
const assemblyListInput = document.getElementById('assemblyList');
const partListInput = document.getElementById('partList');
const templateInput = document.getElementById('template');
const assemblyListDisplay = document.getElementById('assemblyListDisplay');
const partListDisplay = document.getElementById('partListDisplay');
const templateDisplay = document.getElementById('templateDisplay');
const generateBtn = document.getElementById('generateBtn');
const warningText = document.getElementById('warningText');
const progressSection = document.getElementById('progressSection');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const errorSection = document.getElementById('errorSection');
const errorMessage = document.getElementById('errorMessage');
const resultsSection = document.getElementById('resultsSection');

// File selection state
let selectedFiles = {
    assemblyList: null,
    partList: null,
    template: null
};

// File input change handlers
assemblyListInput.addEventListener('change', (e) => {
    handleFileSelection(e, 'assemblyList', assemblyListDisplay);
});

partListInput.addEventListener('change', (e) => {
    handleFileSelection(e, 'partList', partListDisplay);
});

templateInput.addEventListener('change', (e) => {
    handleFileSelection(e, 'template', templateDisplay);
});

// Handle file selection
function handleFileSelection(event, fileType, displayElement) {
    const file = event.target.files[0];

    if (file) {
        selectedFiles[fileType] = file;
        displayElement.textContent = file.name;
        displayElement.classList.add('selected');
        console.log(`File selezionato per ${fileType}:`, file.name);
    } else {
        selectedFiles[fileType] = null;
        displayElement.textContent = 'Nessun file selezionato';
        displayElement.classList.remove('selected');
    }

    updateGenerateButton();
}

// Update generate button state
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

// Form submit handler
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

        // Send request to server
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

        // Estrai statistiche dagli headers custom
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

// Update progress bar and text
function updateProgress(percentage, message) {
    progressBar.style.width = `${percentage}%`;
    progressText.textContent = message;
}

// Show error message
function showError(message) {
    errorMessage.textContent = message;
    showElement(errorSection);

    // Scroll to error
    errorSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Show results section with stats
function showResults(stats) {
    // Mostra statistiche ricevute dal backend via headers HTTP

    // Update stats con valori reali dal backend
    document.getElementById('totalAssemblies').textContent = stats.totalAssemblies;
    document.getElementById('totalWeight').textContent = stats.totalWeight ?
        parseFloat(stats.totalWeight).toFixed(2) + ' kg' : '-';
    document.getElementById('totalParts').textContent = stats.totalParts;
    document.getElementById('totalFormulas').textContent = stats.totalFormulas;

    // Update details table con valori calcolati
    const assemblyFormulas = stats.totalAssemblies ? stats.totalAssemblies * 2 : 0; // Qty + Weight per ogni assembly
    const partFormulas = stats.totalParts ? stats.totalParts * 5 : 0; // Dimension, Grade, Length, Weight, Area per ogni part

    document.getElementById('detailAssemblies').textContent = stats.totalAssemblies;
    document.getElementById('detailAssemblyFormulas').textContent = `${assemblyFormulas} (Qty + Weight)`;
    document.getElementById('detailParts').textContent = stats.totalParts;
    document.getElementById('detailPartFormulas').textContent = `${partFormulas} (Dimension, Grade, Length, Weight, Area)`;

    showElement(resultsSection);

    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Utility functions
function showElement(element) {
    element.classList.remove('hidden');
}

function hideElement(element) {
    element.classList.add('hidden');
}

// Initialize
console.log('Assembly Excel Editor Web - Ready');
console.log('Server API endpoint: /generate');
