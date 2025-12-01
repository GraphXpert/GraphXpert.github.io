# List Check Frontend (Excel Diff Viewer) - Backend Connection

## 🔗 Backend Service

**Repository:** https://github.com/GraphXpert/list-check-backend

**URL Production:** https://list-check-backend.onrender.com

**Endpoint:** `POST /compare`

---

## 📡 API Configuration

### URL nel Codice

**File:** `app.js` (linea ~16)

```javascript
const API_BASE_URL = 'https://list-check-backend.onrender.com';
```

### Chiamata API

```javascript
const formData = new FormData();
formData.append('oldFile', oldFile);
formData.append('newFile', newFile);
formData.append('startRow', startRow);
formData.append('startCol', startCol);

const response = await fetch(`${API_BASE_URL}/compare`, {
    method: 'POST',
    body: formData
});
```

---

## 📥 Request Format

### Endpoint

```
POST https://list-check-backend.onrender.com/compare
```

### Content-Type

```
multipart/form-data
```

### Form Fields

| Campo | Tipo | Descrizione | Default |
|-------|------|-------------|---------|
| `oldFile` | File | File Excel originale | Required |
| `newFile` | File | File Excel revisionato | Required |
| `startRow` | Number | Riga da cui iniziare confronto | 19 |
| `startCol` | Number | Colonna da cui iniziare (A=1, B=2, ...) | 2 |

**Esempio:**
```javascript
const formData = new FormData();
formData.append('oldFile', document.getElementById('oldFile').files[0]);
formData.append('newFile', document.getElementById('newFile').files[0]);
formData.append('startRow', '19');
formData.append('startCol', '2');
```

---

## 📤 Response Format

### Success Response

**Headers:**
```
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="DIFF_*.xlsx"
X-Total-Sheets: 3
X-Added-Rows: 15
X-Modified-Cells: 42
X-Removed-Rows: 8
X-Total-Changes: 65
X-Output-Filename: DIFF_ASSEMBLY_LIST_20251201.xlsx
```

**Body:**
```
[Binary Excel file con differenze evidenziate]
```

### Color Coding nel File

Il file Excel generato contiene:
- 🟢 **Verde** (RGB: 144, 238, 144): Righe aggiunte
- 🟡 **Giallo** (RGB: 255, 255, 0): Celle modificate
- 🔴 **Rosso** (RGB: 255, 192, 203): Righe rimosse

### Error Response

```json
{
  "error": "Error message",
  "details": "Detailed error description"
}
```

**Status Codes:**
- `200` - Success, file generato
- `400` - Bad request (file mancanti o parametri non validi)
- `500` - Server error (errore durante confronto)

---

## 📊 Reading Statistics

Le statistiche vengono inviate tramite custom HTTP headers:

```javascript
const stats = {
    totalSheets: parseInt(response.headers.get('X-Total-Sheets')) || 0,
    addedRows: parseInt(response.headers.get('X-Added-Rows')) || 0,
    modifiedCells: parseInt(response.headers.get('X-Modified-Cells')) || 0,
    removedRows: parseInt(response.headers.get('X-Removed-Rows')) || 0,
    totalChanges: parseInt(response.headers.get('X-Total-Changes')) || 0,
    outputFilename: response.headers.get('X-Output-Filename') || `${fileName}_DIFF.xlsx`
};
```

---

## 🔄 Multi-File Processing

Il frontend supporta l'elaborazione di **multiple coppie di file** contemporaneamente:

```javascript
// Array di file originali
selectedOldFiles = [file1.xlsx, file2.xlsx, file3.xlsx]

// Array di file revisionati (stesso numero!)
selectedNewFiles = [file1_rev.xlsx, file2_rev.xlsx, file3_rev.xlsx]

// Elaborazione sequenziale: coppia 1, poi coppia 2, poi coppia 3
```

**Importante:**
- Numero file originali DEVE essere uguale a numero file revisionati
- File sono appaiati per ordine di selezione: old[0]+new[0], old[1]+new[1], etc.
- Elaborazione è sequenziale (non parallela)
- Statistiche vengono aggregate

---

## 🔧 Troubleshooting

### Error: "Failed to fetch"

**Possibili cause:**
1. Backend in sleep mode (primo avvio richiede 30-60 sec)
2. URL backend errato
3. Problemi di rete

**Soluzione:**
1. Attendere e riprovare
2. Verificare URL in `app.js`: deve essere `list-check-backend.onrender.com`
3. **NON** `list-check-electron-backend.onrender.com` (backend diverso!)
4. Verificare stato servizio su [Render Dashboard](https://dashboard.render.com)

### Error: "Endpoint not found"

**Causa:** URL del backend è sbagliato o endpoint non esiste

**Verifica:**
- URL deve essere `list-check-backend.onrender.com`
- Endpoint deve essere `/compare`
- **NON** usare `/api/analyze` (endpoint diverso!)

### Headers sono null

**Possibili cause:**
1. Backend non ha configurato CORS exposedHeaders
2. Browser blocca headers
3. Errore durante elaborazione

**Soluzione:**
1. Verificare configurazione CORS backend
2. Controllare Network tab in DevTools
3. Verificare logs backend su Render

### File non scarica

**Possibili cause:**
1. Popup blocker attivo
2. Errore durante generazione file
3. Browser non supporta download programmatici

**Soluzione:**
1. Disabilitare popup blocker
2. Controllare console per errori JavaScript
3. Verificare Network tab per vedere se risposta arriva
4. Provare browser diverso

### Statistiche mostrano 0

**Possibili cause:**
1. Headers non vengono letti correttamente
2. CORS exposedHeaders non configurato
3. parseInt/parseFloat fallisce

**Soluzione:**
1. Verificare che response.headers.get() non sia null
2. Controllare configurazione CORS backend
3. Verificare logs JavaScript console

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
const API_BASE_URL = 'https://list-check-backend.onrender.com';

// Dopo
const API_BASE_URL = 'https://NEW-BACKEND-URL.onrender.com';
```

### Cambiare Valori Default

**In index.html:**
```html
<!-- Riga di partenza (default 19) -->
<input type="number" id="startRow" value="19">

<!-- Colonna di partenza (default 2 = B) -->
<input type="number" id="startCol" value="2">
```

---

## 📊 Backend Capabilities

Il backend `list-check-backend`:

✅ **Supporta:**
- Confronto file Excel (.xlsx, .xls)
- Multi-sheet comparison
- Evidenziazione differenze con colori
- Statistiche dettagliate (righe aggiunte/modificate/rimosse)
- Configurazione riga/colonna di partenza
- Processing batch multipli file
- Health check endpoint

✅ **Algoritmo di confronto:**
- Confronta foglio per foglio
- Identifica righe aggiunte/rimosse/modificate
- Confronta celle individualmente
- Mantiene formattazione originale dove possibile

❌ **NON supporta:**
- Endpoint `/api/analyze` (usa `list-check-electron-backend`)
- Endpoint `/generate` (usa `assembly-excel-edit-backend`)
- File PDF

---

## 🎨 Color Legend

### Nel file Excel generato:

| Colore | RGB | Significato |
|--------|-----|-------------|
| 🟢 Verde Chiaro | (144, 238, 144) | Riga aggiunta nel nuovo file |
| 🟡 Giallo | (255, 255, 0) | Cella modificata |
| 🔴 Rosa | (255, 192, 203) | Riga rimossa dal vecchio file |
| ⚪ Bianco | (255, 255, 255) | Nessuna modifica |

### Nel frontend UI:

| Colore | CSS | Elemento |
|--------|-----|----------|
| Blu | `#2196f3` | Total Sheets |
| Verde | `#28a745` | Added Rows |
| Giallo | `#ffc107` | Modified Cells |
| Rosso | `#dc3545` | Removed Rows |

---

## 🔐 CORS Configuration

Il backend è configurato per accettare richieste da:
- `https://graphxpert.eu`
- `https://graphxpert.github.io`
- `http://localhost:*` (solo sviluppo)

Exposed headers per statistiche:
```javascript
exposedHeaders: [
    'X-Total-Sheets',
    'X-Added-Rows',
    'X-Modified-Cells',
    'X-Removed-Rows',
    'X-Total-Changes',
    'X-Output-Filename'
]
```

---

## 🚀 Performance

### Tempi Tipici

- **File piccoli** (< 1MB, < 500 righe): 1-3 secondi
- **File medi** (1-5MB, 500-2000 righe): 3-10 secondi
- **File grandi** (5-50MB, 2000+ righe): 10-30 secondi

### Batch Processing

Quando si elaborano N coppie di file:
- Tempo totale ≈ N × tempo singolo file
- Elaborazione sequenziale (non parallela)
- Progress bar mostra [X/N] per ogni coppia

---

## 📝 Note Importanti

1. **File Order:** L'ordine di selezione dei file è importante per l'appaiamento
2. **Same Count:** Numero file old DEVE essere uguale a numero file new
3. **Sleep Mode:** Backend gratuito Render dorme dopo 15 min - prima richiesta può richiedere 30-60 sec
4. **File Size:** Limite backend (default 50MB per file)
5. **Browser Compatibility:** Richiede Fetch API, FormData, Blob, File API

---

## 🔗 Collegamenti Correlati

- [Frontend README](./FRONTEND.md)
- [Backend Repository](https://github.com/GraphXpert/list-check-backend)
- [Render Dashboard](https://dashboard.render.com)
- [Repository Principale Frontend](https://github.com/GraphXpert/GraphXpert.github.io)

---

**Ultima modifica:** 2025-12-01
