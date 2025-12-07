# GraphXpert Frontend Applications

Repository principale per tutti i frontend delle applicazioni GraphXpert hostati su GitHub Pages.

## 🌐 URL Base

**Sito principale:** https://graphxpert.eu

## 📦 Applicazioni Disponibili

| # | Frontend | Backend | Funzionalità | Stato |
|---|----------|---------|--------------|-------|
| 1 | [assembly-excel-edit-frontend](./assembly-excel-edit-frontend/) | [assembly-excel-edit-backend](https://github.com/GraphXpert/assembly-excel-edit-backend) | Genera file Excel con formule VLOOKUP | ✅ Funzionante |
| 2 | [assembly-check-site](./assembly-check-site/) | [list-check-electron-backend](https://github.com/GraphXpert/list-check-electron-backend) | Confronta codici tra PDF e Excel | ✅ Funzionante |
| 3 | [list-check-frontend](./list-check-frontend/) | [list-check-backend](https://github.com/GraphXpert/list-check-backend) | Confronta differenze tra file Excel | ✅ Funzionante |

---

## 📋 Dettagli Applicazioni

### 1. Assembly Excel Editor

**URL:** https://graphxpert.eu/assembly-excel-edit-frontend/

**Descrizione:**
Applicazione web per generare file Excel con formule VLOOKUP dinamiche. Permette di caricare tre file Excel (Assembly List, Part List, Template) e genera automaticamente un file con le formule che collegano i dati.

**Backend:**
- Repository: https://github.com/GraphXpert/assembly-excel-edit-backend
- URL: https://assembly-excel-edit-backend.onrender.com
- Endpoint principale: `POST /generate`

**Input:**
- Assembly List (Excel)
- Part List (Excel)
- Template Mapping (Excel)

**Output:**
- File Excel con formule VLOOKUP

---

### 2. Assembly Check Site

**URL:** https://graphxpert.eu/assembly-check-site/

**Descrizione:**
Applicazione web per confrontare codici alfanumerici tra disegni PDF e liste Excel. Estrae codici dai PDF e li confronta con quelli presenti nell'Excel, generando un report dettagliato delle corrispondenze, discrepanze e codici mancanti.

**Backend:**
- Repository: https://github.com/GraphXpert/list-check-electron-backend
- URL: https://list-check-electron-backend.onrender.com
- Endpoint principale: `POST /api/analyze`

**Input:**
- File Excel (con colonne marca e quantità configurabili)
- Uno o più file PDF

**Output:**
- Report HTML con:
  - Codici trovati correttamente (OK)
  - Discrepanze di quantità
  - Codici non trovati nei PDF

**Configurazione:**
- Colonna marche (default: B)
- Colonna quantità (default: C)
- Riga di partenza (default: 19)

---

### 3. Excel Diff Viewer (List Check)

**URL:** https://graphxpert.eu/list-check-frontend/

Flusso delle richieste (List Check):

Browser utente
  ↓
Cloudflare Access (login, autorizzazione)
  ↓
GitHub Pages – list-check-frontend (graphxpert.eu)
  ↓
Cloudflare Worker – API Gateway (https://api.graphxpert.eu)
  ↓
list-check-backend (https://list-check-backend.onrender.com su Render.com)

Configurazione frontend

Il frontend di List Check è configurato per usare il Cloudflare Worker come API Gateway:

```js
// list-check-frontend/app.js
const API_BASE_URL = "https://api.graphxpert.eu"; // Production
// Le richieste vengono inviate a: POST ${API_BASE_URL}/compare


**Descrizione:**
Applicazione web per confrontare due versioni di file Excel ed evidenziare le differenze. Supporta il caricamento di più coppie di file contemporaneamente e genera file Excel con le modifiche evidenziate in colore.

Backend:
  * Repository: https://github.com/GraphXpert/list-check-backend
  * API Gateway: https://api.graphxpert.eu (Cloudflare Worker)
  * Origin backend: https://list-check-backend.onrender.com (Render.com)
  * Endpoint principale: `POST /compare`


**Input:**
- File Excel originale(i)
- File Excel revisionato(i)
- Configurazione: riga di partenza, colonna di partenza

**Output:**
- File Excel con differenze evidenziate:
  - 🟢 Verde: Righe aggiunte
  - 🟡 Giallo: Celle modificate
  - 🔴 Rosso: Righe rimosse

**Caratteristiche:**
- Supporto multi-file (elabora più coppie di file)
- Statistiche aggregate
- Download automatico dei file processati

---

## 🏗️ Architettura

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Pages                             │
│              (graphxpert.eu / graphxpert.github.io)         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────┐ │
│  │ assembly-excel-  │  │ assembly-check-  │  │   list-  │ │
│  │  edit-frontend   │  │      site        │  │  check-  │ │
│  │                  │  │                  │  │ frontend │ │
│  └────────┬─────────┘  └────────┬─────────┘  └────┬─────┘ │
│           │                     │                  │       │
└───────────┼─────────────────────┼──────────────────┼───────┘
            │                     │                  │
            │                     │                  │
            ▼                     ▼                  ▼
    ┌───────────────┐    ┌───────────────┐  ┌──────────────┐
    │   assembly-   │    │ list-check-   │  │list-check-   │
    │   excel-edit- │    │   electron-   │  │   backend    │
    │   backend     │    │   backend     │  │              │
    │               │    │               │  │              │
    │ Render.com    │    │ Render.com    │  │ Render.com   │
    └───────────────┘    └───────────────┘  └──────────────┘
```

---

## 🔧 Sviluppo

### Struttura Repository

```
GraphXpert.github.io/
├── assembly-check-site/
│   ├── index.html
│   ├── app.js
│   ├── styles.css
│   └── README.md
│
├── assembly-excel-edit-frontend/
│   ├── index.html
│   ├── app.js
│   ├── styles.css
│   └── README.md
│
├── list-check-frontend/
│   ├── index.html
│   ├── app.js
│   ├── styles.css
│   └── README.md
│
├── index.html          # Homepage principale
├── CNAME              # Dominio personalizzato
└── README.md          # Questo file
```

### Deploy

Ogni modifica pushata su `main` viene automaticamente pubblicata su GitHub Pages entro 1-2 minuti.

```bash
# Modificare i file
git add .
git commit -m "Descrizione modifiche"
git push origin main

# Attendere 1-2 minuti
# Verificare su https://graphxpert.eu
```

---

## ⚙️ Configurazione Backend

Ogni frontend ha una costante `API_BASE_URL` che punta al backend corrispondente:

**assembly-excel-edit-frontend/app.js:**
```javascript
const API_BASE_URL = 'https://assembly-excel-edit-backend.onrender.com';
```

**assembly-check-site/app.js:**
```javascript
const response = await fetch('https://list-check-electron-backend.onrender.com/api/analyze', {
```

**list-check-frontend/app.js:**
```javascript
const API_BASE_URL = 'https://list-check-backend.onrender.com';
```

---

## 🔒 Sicurezza

- Tutti i frontend usano **HTTPS**
- GitHub Pages fornisce certificati SSL automatici
- I backend su Render.com hanno **CORS** configurato per accettare richieste solo da `graphxpert.eu` e `graphxpert.github.io`
- Validazione lato client e server
- Nessun dato viene salvato permanentemente sui server

---

## 📝 Manutenzione

### Aggiornare un Frontend

1. Modificare i file nella cartella corrispondente
2. Testare localmente aprendo `index.html` nel browser
3. Commit e push su GitHub
4. Verificare su `https://graphxpert.eu/{nome-app}/`

### Cambiare Backend URL

1. Aprire `app.js` del frontend
2. Modificare `API_BASE_URL` o l'URL nella chiamata `fetch()`
3. Commit e push
4. Attendere deploy automatico

### Verificare Stato Backend

Visitare la [Dashboard Render](https://dashboard.render.com) e controllare:
- Stato del servizio (Deployed/Running)
- Logs per eventuali errori
- Ultima deploy

---

## 🐛 Troubleshooting

### "Failed to fetch" o "Endpoint not found"

**Causa:** Backend non risponde o URL errato

**Soluzione:**
1. Verificare che il backend sia "Deployed" su Render
2. Controllare l'URL nel codice frontend
3. Verificare i logs del backend su Render
4. I backend gratuiti su Render entrano in sleep mode dopo 15 min di inattività - la prima richiesta può richiedere 30-60 secondi

### App non si aggiorna dopo il push

**Causa:** Cache del browser o GitHub Pages non ancora aggiornato

**Soluzione:**
1. Attendere 2-3 minuti
2. Fare hard refresh (Ctrl+Shift+R o Cmd+Shift+R)
3. Aprire in finestra incognito
4. Verificare su https://github.com/GraphXpert/GraphXpert.github.io/commits/main che il commit sia presente

### CORS Error

**Causa:** Backend non configurato per accettare richieste dal frontend

**Soluzione:**
1. Verificare configurazione CORS nel backend
2. Assicurarsi che il dominio sia in whitelist
3. Controllare i logs del backend

---

## 📞 Supporto

Per problemi o richieste:
1. Verificare questa documentazione
2. Controllare i README specifici di ogni app
3. Verificare i logs su Render
4. Aprire un issue su GitHub

---

## 📚 Risorse

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Render.com Documentation](https://render.com/docs)
- [Repository Backend: assembly-excel-edit-backend](https://github.com/GraphXpert/assembly-excel-edit-backend)
- [Repository Backend: list-check-electron-backend](https://github.com/GraphXpert/list-check-electron-backend)
- [Repository Backend: list-check-backend](https://github.com/GraphXpert/list-check-backend)

---

**GraphXpert** - Suite di applicazioni web per l'analisi e gestione di file Excel e PDF

**Ultima modifica:** 2025-12-01
