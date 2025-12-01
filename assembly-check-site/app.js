// Assembly Check Web Application - Frontend with Backend API
// Now uses backend API for secure processing

class AssemblyCheckApp {
    constructor() {
        this.pdfFilesBase64 = [];
        this.excelFileBase64 = null;
        this.results = null;
        this.pdfFilesCount = 0;
        this.initializeEventListeners();
    }

    /**
     * Divide array di PDF in chunks più piccoli
     * @param {Array} array - Array da dividere
     * @param {number} chunkSize - Dimensione di ogni chunk (default: 10)
     * @returns {Array} Array di chunks
     */
    chunkArray(array, chunkSize = 10) {
        const chunks = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    }

    initializeEventListeners() {
        const pdfDropZone = document.getElementById('pdf-drop-zone');
        const pdfInput = document.getElementById('pdf-input');
        if (pdfInput) pdfInput.multiple = true;

        const excelDropZone = document.getElementById('excel-drop-zone');
        const excelInput = document.getElementById('excel-input');

        const processButton = document.getElementById('generate-report');
        const downloadButton = document.getElementById('download-report');

        this.pdfSelector = new FileSelectionController({
            type: 'pdf',
            dropZone: pdfDropZone,
            input: pdfInput,
            multiple: true,
            onSelected: (files) => this.processFile(files.length > 1 ? files : files[0], 'pdf'),
        });

        this.excelSelector = new FileSelectionController({
            type: 'excel',
            dropZone: excelDropZone,
            input: excelInput,
            multiple: false,
            onSelected: (files) => this.processFile(files[0], 'excel'),
        });

        processButton.addEventListener('click', () => this.processFiles());
        downloadButton.addEventListener('click', () => this.downloadReport());
    }

    async processFile(file, type) {
        const dropZone = document.getElementById(`${type}-drop-zone`);
        const infoElement = document.getElementById(`${type}-info`);
        
        try {
            dropZone.classList.add('processing');
            if (infoElement) infoElement.textContent = 'Converting to base64...';

            if (type === 'pdf') {
                if (Array.isArray(file)) {
                    this.pdfFilesCount += file.length;
                    for (const f of file) {
                        const base64 = await this.fileToBase64(f);
                        this.pdfFilesBase64.push(base64);
                    }
                } else {
                    this.pdfFilesCount += 1;
                    const base64 = await this.fileToBase64(file);
                    this.pdfFilesBase64.push(base64);
                }
            } else if (type === 'excel') {
                this.excelFileBase64 = await this.fileToBase64(file);
            }

            dropZone.classList.remove('processing');
            dropZone.classList.add('success');
            if (infoElement) infoElement.textContent = Array.isArray(file) ? `Caricati ${file.length} PDF` : `Caricato: ${file.name}`;
            
            this.updateProcessButton();
        } catch (error) {
            dropZone.classList.remove('processing');
            dropZone.classList.add('error');
            if (infoElement) infoElement.textContent = `Errore: ${error.message}`;
            console.error(`Error processing ${type} file:`, error);
        }
    }

    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }

    async processFiles() {
        if (!this.pdfFilesBase64 || !this.pdfFilesBase64.length || !this.excelFileBase64) {
            alert('Please load both PDF and Excel files first.');
            return;
        }

        const processButton = document.getElementById('generate-report');
        const resultsSection = document.getElementById('results-section');
        const resultsDiv = document.getElementById('results-content');
        
        try {
            processButton.disabled = true;
            processButton.textContent = 'Processing...';
            resultsSection.style.display = 'block';

            // Prepara config
            const config = {
                colMarks: (document.getElementById('colonne-marche')?.value || 'B').toUpperCase(),
                colQty: (document.getElementById('colonne-quantita')?.value || 'C').toUpperCase(),
                startRow: parseInt(document.getElementById('riga-partenza')?.value || '1', 10)
            };

            // *** CHUNKING: Dividi PDF in gruppi da 2 (massima compatibilità con Vercel Free tier) ***
            const pdfChunks = this.chunkArray(this.pdfFilesBase64, 2);
            const totalChunks = pdfChunks.length;
            
            resultsDiv.innerHTML = `
                <div class="processing-message">
                    🔄 Processing ${this.pdfFilesBase64.length} PDFs in ${totalChunks} batch${totalChunks > 1 ? 'es' : ''}...
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: 0%"></div>
                    </div>
                    <div class="progress-text">Batch 0 of ${totalChunks}</div>
                </div>
            `;

            // Array per raccogliere tutti i risultati
            let allResults = {
                pdfFreq: {},
                excelFreq: {},
                excelData: [],
                matches: [],
                pdfOnly: [],
                excelOnly: [],
                quantityCorrect: [],
                quantityMissing: [],
                quantityExtra: [],
                totalPdfCodes: 0,
                totalExcelCodes: 0,
                pdfFilesProcessed: 0,
                excelRowsProcessed: 0
            };

            // *** PROCESSA OGNI CHUNK ***
            for (let i = 0; i < pdfChunks.length; i++) {
                const chunk = pdfChunks[i];
                
                console.log(`\n📦 Processing Batch ${i + 1}/${totalChunks} with ${chunk.length} PDFs`);
                
                // Update progress
                const progress = ((i + 1) / totalChunks) * 100;
                document.querySelector('.progress-fill').style.width = `${progress}%`;
                document.querySelector('.progress-text').textContent = 
                    `Batch ${i + 1} of ${totalChunks} (${chunk.length} PDF${chunk.length > 1 ? 's' : ''})`;

                // Chiamata API per questo chunk
                const response = await fetch('https://list-check-electron-backend.onrender.com/api/analyze', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        pdfFiles: chunk,
                        excelFile: this.excelFileBase64,
                        config: config
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(`Batch ${i + 1} failed: ${errorData.error || response.status}`);
                }

                const apiResponse = await response.json();
                
                if (!apiResponse.success) {
                    throw new Error(`Batch ${i + 1}: ${apiResponse.error}`);
                }

                console.log(`✅ Batch ${i + 1} response:`, {
                    success: apiResponse.success,
                    pdfFilesProcessed: apiResponse.results.pdfFilesProcessed,
                    totalPdfCodes: apiResponse.results.totalPdfCodes,
                    pdfFreqKeys: Object.keys(apiResponse.results.pdfFreq || {}).length
                });

                // *** MERGE RISULTATI ***
                this.mergeResults(allResults, apiResponse.results);
            }

            // *** FINALIZZA RISULTATI ***
            console.log('\n🎯 FINALIZE RESULTS');
            console.log('Total pdfFreq before finalize:', JSON.parse(JSON.stringify(allResults.pdfFreq)));
            console.log('Sample codes:', {
                MG2001: allResults.pdfFreq['MG2001'],
                MG2002: allResults.pdfFreq['MG2002'],
                MG2003: allResults.pdfFreq['MG2003'],
                MG2004: allResults.pdfFreq['MG2004']
            });
            
            this.finalizeResults(allResults);
            this.results = allResults;
            
            console.log('✅ Final results ready');
            this.displayResults();
            
        } catch (error) {
            resultsDiv.innerHTML = `<div class="error-message">❌ Error: ${error.message}</div>`;
            console.error('Processing error:', error);
        } finally {
            processButton.disabled = false;
            processButton.textContent = 'Generate Report';
        }
    }

    /**
     * Merge risultati parziali da un chunk nei risultati totali
     * @param {Object} allResults - Oggetto con tutti i risultati accumulati
     * @param {Object} chunkResults - Risultati dal chunk corrente
     */
    mergeResults(allResults, chunkResults) {
        console.log('=== MERGE RESULTS DEBUG ===');
        console.log('Chunk pdfFreq:', chunkResults.pdfFreq);
        console.log('Current allResults.pdfFreq BEFORE merge:', JSON.parse(JSON.stringify(allResults.pdfFreq)));
        
        // Merge pdfFreq (frequenze codici nei PDF)
        for (const [code, count] of Object.entries(chunkResults.pdfFreq || {})) {
            const oldValue = allResults.pdfFreq[code] || 0;
            allResults.pdfFreq[code] = oldValue + count;
            console.log(`Code ${code}: ${oldValue} + ${count} = ${allResults.pdfFreq[code]}`);
        }
        
        console.log('Current allResults.pdfFreq AFTER merge:', JSON.parse(JSON.stringify(allResults.pdfFreq)));
        console.log('=== END MERGE ===\n');

        // ExcelFreq e excelData: prendi dal primo chunk (è sempre uguale)
        if (Object.keys(allResults.excelFreq).length === 0) {
            allResults.excelFreq = chunkResults.excelFreq;
            allResults.excelData = chunkResults.excelData;
            allResults.excelRowsProcessed = chunkResults.excelRowsProcessed;
            allResults.totalExcelCodes = chunkResults.totalExcelCodes;
        }

        // Accumula totali PDF
        allResults.totalPdfCodes += chunkResults.totalPdfCodes || 0;
        allResults.pdfFilesProcessed += chunkResults.pdfFilesProcessed || 0;
    }

    /**
     * Ricalcola matches, discrepanze, ecc. dopo merge
     * @param {Object} allResults - Oggetto con tutti i risultati da finalizzare
     */
    finalizeResults(allResults) {
        // Ricalcola matches e discrepanze
        const allCodes = new Set([
            ...Object.keys(allResults.pdfFreq),
            ...Object.keys(allResults.excelFreq)
        ]);

        allResults.matches = [];
        allResults.pdfOnly = [];
        allResults.excelOnly = [];
        allResults.quantityCorrect = [];
        allResults.quantityMissing = [];
        allResults.quantityExtra = [];

        allCodes.forEach(code => {
            const pdfCount = allResults.pdfFreq[code] || 0;
            const excelCount = allResults.excelFreq[code] || 0;

            if (pdfCount > 0 && excelCount > 0) {
                allResults.matches.push(code);
                
                if (pdfCount === excelCount) {
                    allResults.quantityCorrect.push({
                        code, pdf: pdfCount, excel: excelCount
                    });
                } else if (pdfCount < excelCount) {
                    allResults.quantityMissing.push({
                        code, pdf: pdfCount, excel: excelCount, missing: excelCount - pdfCount
                    });
                } else {
                    allResults.quantityExtra.push({
                        code, pdf: pdfCount, excel: excelCount, extra: pdfCount - excelCount
                    });
                }
            } else if (pdfCount > 0 && excelCount === 0) {
                allResults.pdfOnly.push(code);
            } else if (excelCount > 0 && pdfCount === 0) {
                allResults.excelOnly.push(code);
            }
        });

        // Conta codici unici
        allResults.totalPdfUnique = Object.keys(allResults.pdfFreq).length;
        allResults.totalExcelUnique = Object.keys(allResults.excelFreq).length;
    }

    updateProcessButton() {
        const processButton = document.getElementById('generate-report');
        if (this.pdfFilesBase64.length && this.excelFileBase64) {
            processButton.disabled = false;
            processButton.classList.add('ready');
        } else {
            processButton.disabled = true;
            processButton.classList.remove('ready');
        }
    }

    displayResults() {
        const resultsDiv = document.getElementById('results-content');
        
        const summaryCards = `
            <div class="summary-stats">
                <div class="stat-card">
                    <span class="stat-number">${this.results.totalExcelUnique}</span>
                    <div class="stat-label">Codici Excel Processati</div>
                </div>
                <div class="stat-card">
                    <span class="stat-number">${this.results.quantityCorrect.length}</span>
                    <div class="stat-label">Corrispondenze OK</div>
                </div>
                <div class="stat-card">
                    <span class="stat-number">${this.results.quantityMissing.length + this.results.quantityExtra.length}</span>
                    <div class="stat-label">Discrepanze</div>
                </div>
                <div class="stat-card">
                    <span class="stat-number">${this.results.pdfFilesProcessed}</span>
                    <div class="stat-label">File PDF Processati</div>
                </div>
            </div>
        `;

        const detailsHtml = `
            <div class="results-details">
                ${summaryCards}
                <h4 style="margin-top:20px;margin-bottom:10px;">Detailed Results per Item:</h4>
                ${this.createResultsTable()}
            </div>
        `;

        resultsDiv.innerHTML = detailsHtml;
    }

    createResultsTable(isReport = false) {
        const headers = ['Riga Excel', 'Codice', 'Quantità Attesa', 'Quantità Trovata', 'Risultato', 'Stato'];
        const rowsHtml = this.results.excelData.map(row => {
            const found = this.results.pdfFreq[row.code] || 0;
            const notFound = row.qty > 0 && found === 0;
            const status = notFound ? 'NON TROVATO' : (found === row.qty ? 'OK' : 'DISCREPANZA');
            const trClass = found === row.qty ? 'table-ok' : 'table-error';
            const resultText = notFound ? 'NON TROVATO' : (found === row.qty ? 'OK' : found);
            const pillClass = notFound ? 'error' : (found === row.qty ? 'ok' : 'warn');
            return `<tr class="${trClass}">
                <td>${row.row}</td>
                <td><strong>${row.code}</strong></td>
                <td class="num">${row.qty}</td>
                <td class="num${notFound ? ' notfound' : ''}">${found}</td>
                <td class="${notFound ? 'notfound-text' : ''}">${resultText}</td>
                <td><span class="pill ${pillClass}">${status}</span></td>
            </tr>`;
        }).join('');

        return `
            <table class="results-table">
                <thead>
                    <tr>
                        ${headers.map(h => `<th>${h}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                </tbody>
            </table>
        `;
    }

    downloadReport() {
        if (!this.results || !this.results.excelData || !this.results.excelData.length) {
            alert('No results to export. Generate the report first.');
            return;
        }

        this.ensureHtml2PdfLoaded().then(() => {
            const elem = this.buildPdfElement();
            document.body.appendChild(elem);
            const opt = {
                margin: 8,
                filename: 'assembly-check-report.pdf',
                image: { type: 'jpeg', quality: 0.95 },
                html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff', scrollY: 0 },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                pagebreak: { mode: ['css', 'legacy'], avoid: ['tr'] }
            };
            window.html2pdf().set(opt).from(elem).save().then(() => {
                document.body.removeChild(elem);
            }).catch(() => {
                document.body.removeChild(elem);
            });
        });
    }

    ensureHtml2PdfLoaded() {
        return new Promise((resolve) => {
            if (window.html2pdf) return resolve();
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
            script.onload = () => resolve();
            document.body.appendChild(script);
        });
    }

    buildPdfElement() {
        const container = document.createElement('div');
        const timestamp = new Date().toLocaleString();
        container.style.background = '#ffffff';
        container.style.color = '#111827';
        container.style.padding = '10px';
        container.style.paddingTop = '36px';
        container.style.paddingBottom = '36px';
        container.style.width = '100%';
        container.style.fontFamily = 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';
        container.style.margin = '0 20px 0 10px';
        container.style.boxSizing = 'border-box';
        container.style.position = 'static';
        container.style.display = 'block';
        container.innerHTML = `
            <style>
                * { box-shadow: none !important; }
                h1 { font-size: 20px; margin: 0 0 4px 0; color:#111827; }
                .subtitle { font-size: 12px; color:#6b7280; margin:0 0 12px 0; }
                .cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 12px; }
                .card { background:#ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px; text-align: center; }
                .card .n { font-size: 18px; font-weight: 700; color:#111827; }
                .card .l { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: .02em; }
                table { width: 100%; border-collapse: collapse; table-layout: fixed; }
                thead tr { background: #ffffff; color:#111827; }
                th, td { border: 1px solid #e5e7eb; padding: 0 2px; font-size: 13px; line-height: 0.85; height: 16px; word-break: break-word; vertical-align: middle; }
                .results-table tr { height: 16px; }
                tbody tr:nth-child(even) { background:#ffffff; }
                tr.table-ok td { background:#ffffff; }
                tr.table-error td { background:#ffffff; }
                td.num { color: #b45309; font-weight: 600; text-align:right; font-size: 13px; }
                td.num.notfound { color: #b91c1c; font-weight: 700; }
                td.notfound-text { color: #b91c1c; font-weight: 700; }
                .pill { display:inline-block; padding:1px 5px; border-radius:999px; font-size:8px; font-weight:700; color:white; }
                .pill.ok { background:#16a34a; }
                .pill.warn { background:#f59e0b; }
                .pill.error { background:#dc2626; }
                .section { margin-top: 12px; }
                .section h2 { font-size: 14px; margin: 0 0 6px; color:#111827; }
            </style>
            <div>
                <h1>Report Controllo Assemblaggi</h1>
                <div class="subtitle">Generato il ${timestamp}</div>
                <div class="cards">
                    <div class="card"><div class="n">${this.results.totalExcelUnique}</div><div class="l">Codici Excel Elaborati</div></div>
                    <div class="card"><div class="n">${this.results.quantityCorrect.length}</div><div class="l">Corrispondenze OK</div></div>
                    <div class="card"><div class="n">${this.results.quantityMissing.length + this.results.quantityExtra.length}</div><div class="l">Discrepanze</div></div>
                    <div class="card"><div class="n">${this.results.pdfFilesProcessed}</div><div class="l">File PDF Processati</div></div>
                </div>
                <div class="section">
                    <h2>Dettaglio Risultati per Elemento</h2>
                    ${this.createResultsTable(true)}
                </div>
            </div>
        `;
        return container;
    }
}

// File Selection Controller - unchanged from original
class FileSelectionController {
    constructor({ type, dropZone, input, multiple, onSelected }) {
        this.type = type;
        this.dropZone = dropZone;
        this.input = input;
        this.multiple = !!multiple;
        this.onSelected = onSelected;
        this.isSelecting = false;
        this.attachEvents();
    }

    attachEvents() {
        if (!this.dropZone || !this.input) return;

        this.dropZone.addEventListener('click', (e) => {
            if (this.isSelecting) return;
            if (e.target === this.input) return;
            this.requestSelect();
        });

        this.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.dropZone.classList.add('drag-over');
        });

        this.dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.dropZone.classList.remove('drag-over');
            const list = Array.from(e.dataTransfer?.files || []);
            const files = this.filterFiles(list);
            if (files.length) this.finishSelection(files);
        });

        this.input.addEventListener('change', (e) => {
            const list = Array.from(e.target.files || []);
            const files = this.filterFiles(list);
            if (!files.length) {
                this.isSelecting = false;
                this.dropZone.classList.remove('processing');
                return;
            }
            this.finishSelection(files);
        });
    }

    requestSelect() {
        if (this.isSelecting) return;
        this.isSelecting = true;
        this.dropZone.classList.add('processing');
        if (this.multiple) this.input.setAttribute('multiple', '');
        else this.input.removeAttribute('multiple');
        this.input.click();
    }

    filterFiles(list) {
        const isPdf = (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf');
        const isExcel = (f) => /xlsx|xls/.test(f.name.toLowerCase());
        const pick = this.type === 'pdf' ? isPdf : isExcel;
        const filtered = list.filter(pick);
        if (!this.multiple && filtered.length > 1) return [filtered[0]];
        return filtered;
    }

    finishSelection(files) {
        this.isSelecting = false;
        this.dropZone.classList.remove('processing');
        try {
            this.onSelected(files);
        } catch (err) {
            console.error('File selection callback error:', err);
        }
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.AssemblyCheckApp = AssemblyCheckApp;
    new AssemblyCheckApp();
    console.log('✅ Assembly Check App loaded - Now using secure backend API!');
});
