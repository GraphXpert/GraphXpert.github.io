# Assembly Check Site - Backend Connection

## 🔗 Backend Service

**Repository:** https://github.com/GraphXpert/list-check-electron-backend

**URL Production:** https://list-check-electron-backend.onrender.com

**Endpoint:** `POST /api/analyze`

---

## 📡 API Configuration

### URL nel Codice

**File:** `app.js` (linea ~173)

```javascript
const response = await fetch('https://list-check-electron-backend.onrender.com/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        pdfFiles: chunk,
        excelFile: this.excelFileBase64,
        config: config
    })
});
```

---

## 📥 Request Format

### Payload

```json
{
  "pdfFiles": ["base64_pdf_1", "base64_pdf_2", ...],
  "excelFile": "base64_excel",
  "config": {
    "marksColumn": "B",
    "quantityColumn": "C",
    "startRow": 19
  }
}
```

### Headers

```
Content-Type: application/json
```

---

## 📤 Response Format

### Success Response

```json
{
  "success": true,
  "results": {
    "pdfFilesProcessed": 5,
    "totalPdfCodes": 150,
    "totalExcelCodes": 120,
    "pdfFreq": {
      "CODE123": 2,
      "CODE456": 1,
      ...
    },
    "excelFreq": {
      "CODE123": 2,
      "CODE789": 3,
      ...
    },
    "quantityCorrect": [...],
    "quantityMissing": [...],
    "quantityExtra": [...],
    "notFoundInPdf": [...]
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message description"
}
```

---

## 🔧 Troubleshooting

### Error: "Failed to fetch"

**Possibili cause:**
1. Backend in sleep mode (servizi gratuiti Render dormono dopo 15 min)
2. URL backend errato
3. Problemi di rete

**Soluzione:**
1. Attendere 30-60 secondi (backend si risveglia)
2. Verificare URL in `app.js`
3. Controllare stato servizio su [Render Dashboard](https://dashboard.render.com)

### Error: "Endpoint not found"

**Causa:** L'URL del backend è corretto ma l'endpoint non esiste

**Verifica:**
- URL deve essere `list-check-electron-backend.onrender.com`
- Endpoint deve essere `/api/analyze`
- **NON** usare `list-check-backend.onrender.com` (backend diverso!)

### Backend risponde ma dà errori

**Verifica:**
1. Formato payload corretto
2. File PDF/Excel sono base64 validi
3. Config ha i campi corretti
4. Controllare logs backend su Render

---

## ⚙️ Configurazione

### Modificare URL Backend

**Quando:** Se il backend viene spostato su un altro servizio

**Come:**
1. Aprire `app.js`
2. Cercare `fetch('https://list-check-electron-backend.onrender.com/api/analyze'`
3. Sostituire con nuovo URL
4. Commit e push su GitHub
5. Attendere 1-2 minuti per deploy

**Esempio:**
```javascript
// Prima
const response = await fetch('https://list-check-electron-backend.onrender.com/api/analyze', {

// Dopo
const response = await fetch('https://NEW-BACKEND-URL.onrender.com/api/analyze', {
```

---

## 📊 Backend Capabilities

Il backend `list-check-electron-backend`:

✅ **Supporta:**
- Estrazione testo da PDF
- Parsing Excel con configurazione colonne personalizzata
- Estrazione codici alfanumerici con regex
- Confronto quantità
- Elaborazione batch di più PDF
- Statistiche aggregate

❌ **NON supporta:**
- Endpoint `/compare` (usa `list-check-backend` per quello)
- Endpoint `/generate` (usa `assembly-excel-edit-backend` per quello)

---

## 🔐 CORS Configuration

Il backend è configurato per accettare richieste da:
- `https://graphxpert.eu`
- `https://graphxpert.github.io`
- `http://localhost:*` (solo sviluppo)

Se l'app viene hostata su un dominio diverso, il backend deve essere aggiornato.

---

## 📝 Note Importanti

1. **Batching:** Il frontend divide i PDF in batch da 10 per evitare timeout
2. **Sleep Mode:** I backend gratuiti Render dormono dopo 15 min - la prima richiesta può richiedere 30-60 sec
3. **File Size:** Backend ha limiti di dimensione (verificare logs se fallisce con file grandi)
4. **Base64:** File devono essere convertiti in base64 prima dell'invio

---

## 🔗 Collegamenti Correlati

- [Frontend README](./README.md)
- [Backend Repository](https://github.com/GraphXpert/list-check-electron-backend)
- [Render Dashboard](https://dashboard.render.com)
- [Repository Principale Frontend](https://github.com/GraphXpert/GraphXpert.github.io)

---

**Ultima modifica:** 2025-12-01
