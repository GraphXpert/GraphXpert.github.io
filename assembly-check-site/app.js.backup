// Assembly Check Web Application
// Client-side PDF and Excel processing for quantitative string checking

class AssemblyCheckApp {
    constructor() {
        this.pdfText = '';
        this.excelData = [];
        this.results = [];
        this.pdfFilesCount = 0;
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // PDF selectors
        const pdfDropZone = document.getElementById('pdf-drop-zone');
        const pdfInput = document.getElementById('pdf-input');
        if (pdfInput) pdfInput.multiple = true;

        // Excel selectors
        const excelDropZone = document.getElementById('excel-drop-zone');
        const excelInput = document.getElementById('excel-input');

        // Buttons
        const processButton = document.getElementById('generate-report');
        const downloadButton = document.getElementById('download-report');

        // Build controllers to avoid repeated prompts and loops
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

        // Wire up buttons
        processButton.addEventListener('click', () => this.processFiles());
        downloadButton.addEventListener('click', () => this.downloadReport());
    }

    handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('drag-over');
    }

    async processFile(file, type) {
        const dropZone = document.getElementById(`${type}-drop-zone`);
        const infoElement = document.getElementById(`${type}-info`);
        
        try {
            dropZone.classList.add('processing');
            if (infoElement) infoElement.textContent = 'Elaborazione...';

            if (type === 'pdf') {
                // Support array of PDFs
                if (Array.isArray(file)) {
                    this.pdfFilesCount += file.length;
                    for (const f of file) {
                        await this.processPDFFile(f);
                    }
                } else {
                    this.pdfFilesCount += 1;
                    await this.processPDFFile(file);
                }
            } else if (type === 'excel') {
                await this.processExcelFile(file);
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

    async processPDFFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (e) => {
                try {
                    // Load PDF.js
                    const pdfjsLib = window['pdfjs-dist/build/pdf'];
                    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                    
                    const typedarray = new Uint8Array(e.target.result);
                    const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
                    
                    let fullText = '';
                    
                    // Extract text from all pages
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const textContent = await page.getTextContent();
                        const pageText = textContent.items.map(item => item.str).join(' ');
                        fullText += pageText + ' ';
                    }
                    
                    this.pdfText += fullText;
                    resolve();
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(new Error('Failed to read PDF file'));
            reader.readAsArrayBuffer(file);
        });
    }

    async processExcelFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    // Use SheetJS to read Excel file
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    
                    // Get the first worksheet
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    
                    // Convert to array of rows
                    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                    // Read parameters from UI
                    const colMarks = (document.getElementById('colonne-marche')?.value || 'B').toUpperCase();
                    const colQty = (document.getElementById('colonne-quantita')?.value || 'C').toUpperCase();
                    const startRow = parseInt(document.getElementById('riga-partenza')?.value || '1', 10);

                    const markIdx = this.letterToIndex(colMarks);
                    const qtyIdx = this.letterToIndex(colQty);

                    const excelRows = [];
                    const codePattern = /\b[A-Z0-9]{2,}\b/;
                    for (let r = Math.max(0, startRow - 1); r < rows.length; r++) {
                        const row = rows[r] || [];
                        const markCell = row[markIdx];
                        const qtyCell = row[qtyIdx];
                        if (markCell && markCell.toString().trim() !== '') {
                            const code = markCell.toString().trim().toUpperCase();
                            if (codePattern.test(code) && !/^\d+$/.test(code) && !/^[A-Z]+$/.test(code)) {
                                const qty = parseInt((qtyCell ?? '1').toString().trim(), 10);
                                excelRows.push({ code, qty: Number.isFinite(qty) && qty > 0 ? qty : 1, row: r + 1 });
                            }
                        }
                    }

                    this.excelData = excelRows;
                    
                    resolve();
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(new Error('Failed to read Excel file'));
            reader.readAsArrayBuffer(file);
        });
    }

    letterToIndex(letter) {
        const aCode = 'A'.charCodeAt(0);
        const str = letter.replace(/[^A-Z]/gi, '').toUpperCase();
        // Support columns beyond Z (e.g., AA, AB)
        let idx = 0;
        for (let i = 0; i < str.length; i++) {
            idx = idx * 26 + (str.charCodeAt(i) - aCode + 1);
        }
        return Math.max(0, idx - 1);
    }

    extractCodes(text) {
        // Pattern to match alphanumeric codes with at least 2 characters
        const pattern = /\b[A-Z0-9]{2,}\b/g;
        const matches = text.match(pattern) || [];
        
        // Filter out common false positives
        return matches.filter(code => {
            // Skip if it's just numbers or just letters
            if (/^\d+$/.test(code) || /^[A-Z]+$/.test(code)) return false;
            // Skip if it's too short (less than 3 characters)
            if (code.length < 3) return false;
            return true;
        });
    }

    async processFiles() {
        if (!this.pdfText || !this.excelData.length) {
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
            resultsDiv.innerHTML = '<div class="processing-message">Analyzing files...</div>';

            // Extract codes from PDF
            const pdfCodes = this.extractCodes(this.pdfText);
            
            // Excel data already aggregated in this.excelData as {code, qty}

            // Find matches and differences
        const pdfFreq = this.countMap(pdfCodes);
        const excelFreq = this.countExcelMap(this.excelData);

        const allCodes = new Set([...Object.keys(pdfFreq), ...Object.keys(excelFreq)]);
        const matches = [];
        const pdfOnly = [];
        const excelOnly = [];
        const quantityCorrect = [];
        const quantityMissing = [];
        const quantityExtra = [];

        allCodes.forEach(code => {
            const p = pdfFreq[code] || 0;
            const e = excelFreq[code] || 0;
            if (p > 0 && e > 0) {
                matches.push(code);
                if (p === e) {
                    quantityCorrect.push({ code, pdf: p, excel: e });
                } else if (p < e) {
                    quantityMissing.push({ code, pdf: p, excel: e, missing: e - p });
                } else {
                    quantityExtra.push({ code, pdf: p, excel: e, extra: p - e });
                }
            } else if (p > 0 && e === 0) {
                pdfOnly.push(code);
            } else if (e > 0 && p === 0) {
                excelOnly.push(code);
            }
        });

        const totalPdfOccurrences = Object.values(pdfFreq).reduce((a, b) => a + b, 0);
        const totalExcelOccurrences = Object.values(excelFreq).reduce((a, b) => a + b, 0);

        this.results = {
            totalPdfCodes: totalPdfOccurrences,
            totalExcelCodes: totalExcelOccurrences,
            totalPdfUnique: Object.keys(pdfFreq).length,
            totalExcelUnique: Object.keys(excelFreq).length,
            excelRowsProcessed: this.excelData.length,
            pdfFilesProcessed: this.pdfFilesCount,
            matches,
            pdfOnly,
            excelOnly,
            quantityCorrect,
            quantityMissing,
            quantityExtra,
            pdfFreq,
            excelFreq
        };

            this.displayResults();
            
        } catch (error) {
            resultsDiv.innerHTML = `<div class="error-message">Error: ${error.message}</div>`;
            console.error('Processing error:', error);
        } finally {
            processButton.disabled = false;
            processButton.textContent = 'Generate Report';
        }
    }

    displayResults() {
        const resultsDiv = document.getElementById('results-content');
        
        const summaryHtml = '';

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
        
        // Nessuna sezione espandibile richiesta
    }

    createCollapsibleSection(title, items, className, showCounts = false) {
        if (items.length === 0) {
            return `<div class="result-section ${className}">
                <h4>${title} (0)</h4>
                <div class="section-content">Nessun elemento trovato</div>
            </div>`;
        }

        return `
            <div class="result-section ${className}">
                <h4 class="collapsible-header">
                    ${title} (${items.length})
                    <span class="toggle-icon">▼</span>
                </h4>
                <div class="section-content collapsible">
                    ${items.map(item => typeof item === 'string' ? `<div class="code-item">${item}</div>` : `<div class="code-item">${item.code}${showCounts ? ` — PDF: ${item.pdf} · Excel: ${item.excel}${item.missing ? ` · Mancano: ${item.missing}` : ''}${item.extra ? ` · Eccesso: ${item.extra}` : ''}` : ''}</div>`).join('')}
                </div>
            </div>
        `;
    }

    initializeCollapsibleSections() {
        const headers = document.querySelectorAll('.collapsible-header');
        headers.forEach(header => {
            header.addEventListener('click', () => {
                const content = header.nextElementSibling;
                const icon = header.querySelector('.toggle-icon');
                
                if (content.style.display === 'none') {
                    content.style.display = 'block';
                    icon.textContent = '▼';
                } else {
                    content.style.display = 'none';
                    icon.textContent = '▶';
                }
            });
        });
    }

    updateProcessButton() {
        const processButton = document.getElementById('generate-report');
        if (this.pdfText && this.excelData.length) {
            processButton.disabled = false;
            processButton.classList.add('ready');
        } else {
            processButton.disabled = true;
            processButton.classList.remove('ready');
        }
    }

    downloadReport() {
        if (!this.results || !this.excelData.length) {
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

    generateReportHTML() {
        const timestamp = new Date().toLocaleString();
        
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Assembly Check Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .section { margin-bottom: 20px; }
        .code-list { display: flex; flex-wrap: wrap; gap: 10px; }
        .code-item { background: #e3f2fd; padding: 5px 10px; border-radius: 4px; font-family: monospace; }
        .pdf-only .code-item { background: #ffebee; }
        .excel-only .code-item { background: #f3e5f5; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
        table { width:100%; border-collapse:collapse; margin-top:10px; }
        thead tr { background:#2563eb; color:white; }
        th, td { padding:10px 14px; border-bottom:1px solid #e5e7eb; text-align:left; }
        .num { color:#d97706; font-weight:600; }
        .table-ok { background:#e8f5e9; }
        .table-error { background:#fff0f0; }
        .pill { display:inline-block; padding:6px 10px; border-radius:16px; font-size:12px; font-weight:700; color:white; }
        .pill.ok { background:#22c55e; }
        .pill.warn { background:#f59e0b; }
        @media print { body { margin: 10mm; } .no-print { display: none; } }
    </style>
</head>
<body>
    <div class="header">
        <h1>Assembly Check Report</h1>
        <p>Generated on ${timestamp}</p>
    </div>
    
    <div class="summary">
        <h2>Riepilogo</h2>
        <p><strong>Occorrenze PDF:</strong> ${this.results.totalPdfCodes} (unici: ${this.results.totalPdfUnique})</p>
        <p><strong>Occorrenze Excel:</strong> ${this.results.totalExcelCodes} (unici: ${this.results.totalExcelUnique})</p>
        <p><strong>Corrispondenze:</strong> ${this.results.matches.length}</p>
        <p><strong>Solo PDF:</strong> ${this.results.pdfOnly.length}</p>
        <p><strong>Solo Excel:</strong> ${this.results.excelOnly.length}</p>
        <p><strong>Quantità OK:</strong> ${this.results.quantityCorrect.length}</p>
        <p><strong>Quantità Mancanti:</strong> ${this.results.quantityMissing.length}</p>
        <p><strong>Quantità in Eccesso:</strong> ${this.results.quantityExtra.length}</p>
    </div>
    
    <div class="section">
        <h2>Dettaglio Risultati per Elemento</h2>
        ${this.createResultsTable(true)}
    </div>

    
    
    <div class="section pdf-only">
        <h2>Solo PDF (${this.results.pdfOnly.length})</h2>
        <div class="code-list">
            ${this.results.pdfOnly.map(code => `<div class="code-item">${code} — PDF: ${this.results.pdfFreq[code]}</div>`).join('')}
        </div>
    </div>
    
    <div class="section excel-only">
        <h2>Solo Excel (${this.results.excelOnly.length})</h2>
        <div class="code-list">
            ${this.results.excelOnly.map(code => `<div class="code-item">${code} — Excel: ${this.results.excelFreq[code]}</div>`).join('')}
        </div>
    </div>

    <div class="section">
        <h2>Quantità Mancanti (${this.results.quantityMissing.length})</h2>
        <div class="code-list">
            ${this.results.quantityMissing.map(item => `<div class="code-item">${item.code} — PDF: ${item.pdf} · Excel: ${item.excel} · Mancano: ${item.missing}</div>`).join('')}
        </div>
    </div>

    <div class="section">
        <h2>Quantità in Eccesso (${this.results.quantityExtra.length})</h2>
        <div class="code-list">
            ${this.results.quantityExtra.map(item => `<div class="code-item">${item.code} — PDF: ${item.pdf} · Excel: ${item.excel} · Eccesso: ${item.extra}</div>`).join('')}
        </div>
    </div>
    
    <div class="footer">
        <p>Assembly Check Web Application</p>
    </div>
</body>
</html>`;
    }

    createResultsTable(isReport = false) {
        const headers = ['Riga Excel', 'Codice', 'Quantità Attesa', 'Quantità Trovata', 'Risultato', 'Stato'];
        const rowsHtml = this.excelData.map(row => {
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

        const tableCss = isReport ? '' : '';
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
                .chips { display:flex; flex-wrap:wrap; gap:6px; margin-top:6px; }
                .chip { background:#ffffff; color:#1f2937; border:1px solid #e5e7eb; border-radius:999px; padding:4px 8px; font-size:10px; }
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
    countMap(arr) {
        const m = {};
        for (const v of arr) m[v] = (m[v] || 0) + 1;
        return m;
    }

    countExcelMap(rows) {
        const m = {};
        for (const r of rows) m[r.code] = (m[r.code] || 0) + (r.qty || 1);
        return m;
    }
}

// Robust controller to manage file selection without repeated prompts
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

    // Attach all event handlers in one place
    attachEvents() {
        if (!this.dropZone || !this.input) return;

        // Click on drop zone opens the file picker exactly once
        this.dropZone.addEventListener('click', (e) => {
            // Avoid re-entry while native dialog is open
            if (this.isSelecting) return;
            // If user clicked directly the input, let browser handle it
            if (e.target === this.input) return;
            this.requestSelect();
        });

        // Drag over styling only
        this.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.dropZone.classList.add('drag-over');
        });

        // Drop files from OS
        this.dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.dropZone.classList.remove('drag-over');
            const list = Array.from(e.dataTransfer?.files || []);
            const files = this.filterFiles(list);
            if (files.length) this.finishSelection(files);
        });

        // Native file input change
        this.input.addEventListener('change', (e) => {
            const list = Array.from(e.target.files || []);
            const files = this.filterFiles(list);
            // Even if user cancels (length=0), ensure state resets
            if (!files.length) {
                this.isSelecting = false;
                this.dropZone.classList.remove('processing');
                return;
            }
            this.finishSelection(files);
        });
    }

    // Start native selection if not already in progress
    requestSelect() {
        if (this.isSelecting) return;
        this.isSelecting = true;
        this.dropZone.classList.add('processing');
        // Ensure attribute multiple is set for PDF case
        if (this.multiple) this.input.setAttribute('multiple', '');
        else this.input.removeAttribute('multiple');
        // Trigger the picker
        this.input.click();
    }

    // Filter by type and apply multi-selection rules
    filterFiles(list) {
        const isPdf = (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf');
        const isExcel = (f) => /xlsx|xls/.test(f.name.toLowerCase());
        const pick = this.type === 'pdf' ? isPdf : isExcel;
        const filtered = list.filter(pick);
        if (!this.multiple && filtered.length > 1) return [filtered[0]];
        return filtered;
    }

    // Finalize selection, reset flags and call app callback once
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
});
