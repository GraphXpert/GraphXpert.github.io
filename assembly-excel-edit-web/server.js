require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const ExcelFormulaGenerator = require('./lib/excelFormulaGenerator');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configurazione Multer per upload file
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = process.env.UPLOAD_DIR || './uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE || 52428800) // 50MB default
    },
    fileFilter: (req, file, cb) => {
        const allowedExtensions = ['.xlsx', '.xls'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedExtensions.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Solo file Excel (.xlsx, .xls) sono permessi'));
        }
    }
});

// Cleanup automatico file temporanei
function cleanupFiles(...filePaths) {
    filePaths.forEach(filePath => {
        if (filePath && fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
                console.log(`File eliminato: ${filePath}`);
            } catch (error) {
                console.error(`Errore eliminazione file ${filePath}:`, error);
            }
        }
    });
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Endpoint principale per generazione file Excel
app.post('/generate', upload.fields([
    { name: 'assemblyList', maxCount: 1 },
    { name: 'partList', maxCount: 1 },
    { name: 'template', maxCount: 1 }
]), async (req, res) => {
    let assemblyListPath, partListPath, templatePath, outputPath;

    try {
        // Verifica che tutti i file siano stati caricati
        if (!req.files || !req.files['assemblyList'] || !req.files['partList'] || !req.files['template']) {
            return res.status(400).json({
                error: 'Mancano uno o più file richiesti',
                details: 'Sono necessari 3 file: assemblyList, partList, template'
            });
        }

        assemblyListPath = req.files['assemblyList'][0].path;
        partListPath = req.files['partList'][0].path;
        templatePath = req.files['template'][0].path;

        console.log('File caricati:');
        console.log('  Assembly List:', assemblyListPath);
        console.log('  Part List:', partListPath);
        console.log('  Template:', templatePath);

        // Crea generatore e processa i file
        const generator = new ExcelFormulaGenerator(
            assemblyListPath,
            partListPath,
            templatePath
        );

        // Progress callback (opzionale - per future implementazioni WebSocket)
        const progressCallback = (message, percentage) => {
            console.log(`Progress: ${percentage}% - ${message}`);
            // TODO: Implementare WebSocket per progress real-time
        };

        // Genera file Excel con formule
        const result = await generator.generate(progressCallback);

        outputPath = result.outputPath;

        console.log('File generato con successo:', outputPath);
        console.log('Statistiche:', result.stats);

        // Invia il file come download
        res.download(outputPath, path.basename(outputPath), (err) => {
            if (err) {
                console.error('Errore durante download:', err);
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Errore durante il download del file' });
                }
            }

            // Cleanup file temporanei dopo il download
            setTimeout(() => {
                cleanupFiles(assemblyListPath, partListPath, templatePath, outputPath);
            }, 1000);
        });

    } catch (error) {
        console.error('Errore durante la generazione:', error);

        // Cleanup in caso di errore
        cleanupFiles(assemblyListPath, partListPath, templatePath, outputPath);

        res.status(500).json({
            error: 'Errore durante la generazione del file Excel',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Endpoint per statistiche (opzionale)
app.get('/stats', (req, res) => {
    // TODO: Implementare tracking statistiche in database
    res.json({
        message: 'Statistics endpoint - To be implemented',
        totalFilesProcessed: 0,
        lastProcessed: null
    });
});

// Gestione errori 404
app.use((req, res) => {
    res.status(404).json({
        error: 'Endpoint non trovato',
        path: req.path
    });
});

// Gestione errori globali
app.use((err, req, res, next) => {
    console.error('Errore server:', err);

    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                error: 'File troppo grande',
                details: `Dimensione massima: ${process.env.MAX_FILE_SIZE || '50MB'}`
            });
        }
    }

    res.status(500).json({
        error: 'Errore interno del server',
        details: err.message
    });
});

// Avvio server
app.listen(PORT, () => {
    console.log('='.repeat(60));
    console.log('  Assembly Excel Editor - Web Server');
    console.log('='.repeat(60));
    console.log(`  Server running on port ${PORT}`);
    console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`  URL: http://localhost:${PORT}`);
    console.log('='.repeat(60));
});

// Gestione shutdown graceful
process.on('SIGTERM', () => {
    console.log('SIGTERM ricevuto, chiusura server...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\nSIGINT ricevuto, chiusura server...');
    process.exit(0);
});
