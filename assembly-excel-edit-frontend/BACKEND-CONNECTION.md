# Assembly Excel Edit Frontend - Backend Connection

## 🔗 Backend Service

**Repository:** https://github.com/GraphXpert/assembly-excel-edit-backend

**URL Production:** https://assembly-excel-edit-backend.onrender.com

**Endpoint:** `POST /generate`

---

## 📡 API Configuration

### URL nel Codice

**File:** `app.js` (linea ~4)

```javascript
const API_BASE_URL = 'https://assembly-excel-edit-backend.onrender.com';
```

### Chiamata API

```javascript
const formData = new FormData();
formData.append('assemblyList', assemblyListFile);
formData.append('partList', partListFile);
formData.append('template', templateFile);

const response = await fetch(`${API_BASE_URL}/generate`, {
    method: 'POST',
    body: formData
});
```

---

## 📥 Request Format

### Endpoint

```
POST https://assembly-excel-edit-backend.onrender.com/generate
```

### Content-Type

```
multipart/form-data
```

### Form Fields

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `assemblyList` | File | File Excel con lista assiemi |
| `partList` | File | File Excel con lista parti |
| `template` | File | File Excel template per mapping |

**Esempio:**
```javascript
const formData = new FormData();
formData.append('assemblyList', fileInput1.files[0]);
formData.append('partList', fileInput2.files[0]);
formData.append('template', fileInput3.files[0]);
```

---

## 📤 Response Format

### Success Response

**Headers:**
```
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="ASSEMBLY_PART_LIST_*.xlsx"
X-Total-Assemblies: 50
X-Total-Parts: 200
X-Total-Formulas: 150
X-Total-Weight: 1234.56
X-Output-Filename: ASSEMBLY_PART_LIST_20251201_123456.xlsx
```

**Body:**
```
[Binary Excel file data]
```

### Error Response

```json
{
  "error": "Error message",
  "details": "Detailed error description"
}
```

**Status Codes:**
- `200` - Success, file generato
- `400` - Bad request (file mancanti o formato errato)
- `500` - Server error (errore durante generazione)

---

## 📊 Reading Statistics

Le statistiche vengono inviate tramite custom HTTP headers:

```javascript
const stats = {
    totalAssemblies: parseInt(response.headers.get('X-Total-Assemblies')) || 0,
    totalParts: parseInt(response.headers.get('X-Total-Parts')) || 0,
    totalFormulas: parseInt(response.headers.get('X-Total-Formulas')) || 0,
    totalWeight: parseFloat(response.headers.get('X-Total-Weight')) || 0,
    outputFilename: response.headers.get('X-Output-Filename') || 'output.xlsx'
};
```

---

## 🔧 Troubleshooting

### Error: "Failed to fetch"

**Possibili cause:**
1. Backend in sleep mode (primo avvio richiede 30-60 sec)
2. URL backend errato
3. Problemi di rete

**Soluzione:**
1. Attendere qualche secondo e riprovare
2. Verificare URL in `app.js`: deve essere `assembly-excel-edit-backend.onrender.com`
3. Verificare stato servizio su [Render Dashboard](https://dashboard.render.com)

### Error: "Mancano uno o più file richiesti"

**Causa:** Non tutti e tre i file sono stati caricati

**Soluzione:**
1. Assicurarsi di caricare Assembly List, Part List E Template
2. Verificare che i file siano `.xlsx` o `.xls`

### Error: "File troppo grande"

**Causa:** File supera il limite di 50MB

**Soluzione:**
1. Ridurre dimensione file
2. Rimuovere fogli/dati non necessari
3. Contattare amministratore per aumentare limite

### File generato ha errori

**Possibili cause:**
1. Struttura file input non corretta
2. Nomi colonne non corrispondono
3. Fogli mancanti

**Verifica:**
1. Assembly List deve avere struttura attesa
2. Part List deve avere colonne corrette
3. Template deve avere foglio "Data"
4. Controllare logs backend su Render

---

## ⚙️ Configurazione

### Modificare URL Backend

**Quando:** Se il backend viene spostato su un altro servizio

**Come:**
1. Aprire `app.js`
2. Cercare `const API_BASE_URL =`
3. Sostituire con nuovo URL
4. Commit e push su GitHub
5. Attendere 1-2 minuti per deploy

**Esempio:**
```javascript
// Prima
const API_BASE_URL = 'https://assembly-excel-edit-backend.onrender.com';

// Dopo
const API_BASE_URL = 'https://NEW-BACKEND-URL.onrender.com';
```

### File Size Limit

Il limite di dimensione file è configurato nel backend (default 50MB).

Per aumentarlo, modificare la variabile d'ambiente `MAX_FILE_SIZE` nel backend su Render.

---

## 📊 Backend Capabilities

Il backend `assembly-excel-edit-backend`:

✅ **Supporta:**
- Upload multipli file Excel via multipart/form-data
- Generazione formule VLOOKUP dinamiche
- Calcolo statistiche (assiemi, parti, formule, peso)
- Cleanup automatico file temporanei
- Health check endpoint `/health`

✅ **Formule Generate:**
- VLOOKUP con percorsi assoluti
- Riferimenti tra fogli multipli
- Gestione errori (#N/D, #VALUE, etc.)

❌ **NON supporta:**
- Endpoint `/api/analyze` (usa `list-check-electron-backend`)
- Endpoint `/compare` (usa `list-check-backend`)
- File PDF

---

## 📝 File Structure Requirements

### Assembly List
```
Colonne richieste:
- Assembly Code
- Description
- Quantity
- ...
```

### Part List
```
Colonne richieste:
- Part Number
- Description
- Weight
- ...
```

### Template
```
Fogli richiesti:
- "Data" (foglio dove verranno inserite le formule)

Colonne configurabili tramite mapping
```

---

## 🔐 CORS Configuration

Il backend è configurato per accettare richieste da:
- `https://graphxpert.eu`
- `https://graphxpert.github.io`
- `http://localhost:*` (solo sviluppo)

I seguenti headers sono esposti al client:
```javascript
exposedHeaders: [
    'X-Total-Assemblies',
    'X-Total-Parts',
    'X-Total-Formulas',
    'X-Total-Weight',
    'X-Output-Filename'
]
```

---

## 🚀 Performance

### Tempi Tipici

- **File piccoli** (< 1MB, < 100 righe): 2-5 secondi
- **File medi** (1-10MB, 100-1000 righe): 5-15 secondi
- **File grandi** (10-50MB, 1000+ righe): 15-60 secondi

### Ottimizzazioni

Il backend:
- Processa i file in streaming dove possibile
- Usa ExcelJS per manipolazione efficiente
- Cleanup automatico file temporanei
- Gestione memoria ottimizzata

---

## 🔗 Collegamenti Correlati

- [Frontend README](./README.md)
- [Backend Repository](https://github.com/GraphXpert/assembly-excel-edit-backend)
- [Backend README](https://github.com/GraphXpert/assembly-excel-edit-backend/blob/main/README.md)
- [Render Dashboard](https://dashboard.render.com)
- [Repository Principale Frontend](https://github.com/GraphXpert/GraphXpert.github.io)

---

**Ultima modifica:** 2025-12-01
