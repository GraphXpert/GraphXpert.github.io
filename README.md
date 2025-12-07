# GraphXpert Frontend Applications

Repository principale per tutti i frontend delle applicazioni GraphXpert hostati su GitHub Pages.

## 🌐 URL Base

Sito principale: https://graphxpert.eu

---

## 📦 Applicazioni Disponibili

| # | Frontend                               | Backend                                      | Funzionalità                                    | Stato          |
|---|----------------------------------------|----------------------------------------------|-------------------------------------------------|----------------|
| 1 | [assembly-excel-edit-frontend](./assembly-excel-edit-frontend) | [assembly-excel-edit-backend](https://github.com/GraphXpert/assembly-excel-edit-backend) | Genera file Excel con formule VLOOKUP           | ✅ Funzionante |
| 2 | [assembly-check-site](./assembly-check-site) | [list-check-electron-backend](https://github.com/GraphXpert/list-check-electron-backend) | Confronta codici tra PDF e Excel                | ✅ Funzionante |
| 3 | [list-check-frontend](./list-check-frontend) | [list-check-backend](https://github.com/GraphXpert/list-check-backend) | Confronta differenze tra file Excel             | ✅ Funzionante |

---

## 🔎 Dettagli Applicazioni

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

**Descrizione:**  
Applicazione web per confrontare due versioni di file Excel ed evidenziare le differenze. Supporta il caricamento di più coppie di file contemporaneamente e genera file Excel con le modifiche evidenziate in colore.

**Backend:**

Il backend di List Check non è accessibile direttamente dal browser.  
Tutte le richieste passano attraverso il Cloudflare Worker (`https://api.graphxpert.eu`), che inoltra le chiamate al backend su Render.

- API Gateway (Cloudflare Worker): https://api.graphxpert.eu  
- Backend origin: https://list-check-backend.onrender.com/compare  
- Endpoint principale: `POST /compare`  
- Repository backend: https://github.com/GraphXpert/list-check-backend

**Flusso delle richieste (List Check):**

Browser utente  
→ Cloudflare Access (login, autorizzazione)  
→ GitHub Pages – list-check-frontend (`https://graphxpert.eu/list-check-frontend/`)  
→ Cloudflare Worker – API Gateway (`https://api.graphxpert.eu`)  
→ list-check-backend su Render (`https://list-check-backend.onrender.com/compare`)

**Configurazione frontend:**

Nel file `list-check-frontend/app.js` il frontend è configurato per usare il Worker come API Gateway:

```js
const API_BASE_URL = "https://api.graphxpert.eu"; // Production
// Le richieste vengono inviate a: POST `${API_BASE_URL}/compare`
```

In questo modo il browser parla solo con `https://api.graphxpert.eu`, e il Worker inoltra le richieste al backend su Render (`https://list-check-backend.onrender.com/compare`).

**Input:**

- File Excel originale(i)
- File Excel revisionato(i)
- Configurazione: riga di partenza, colonna di partenza

**Output:**

- File Excel con differenze evidenziate:
  - Verde: Righe aggiunte
  - Giallo: Celle modificate
  - Rosso: Righe rimosse

**Caratteristiche:**

- Supporto multi-file (elabora più coppie di file)
- Statistiche aggregate
- Download automatico dei file processati

**Sicurezza (List Check):**

- L’accesso al frontend `https://graphxpert.eu/list-check-frontend/` è protetto da **Cloudflare Access** (login con Google o codice via email).
- Solo gli utenti autorizzati nelle policy Cloudflare possono utilizzare l’interfaccia.
- Il backend non è esposto direttamente: il browser comunica solo con `https://api.graphxpert.eu` (Cloudflare Worker), che a sua volta inoltra al backend su Render.

Per ulteriori dettagli tecnici sul Worker, vedere: `docs/list-check-api-gateway.md`.

---

## 🧱 Architettura

```text
                     ┌─────────────────────────────────────────────┐
                     │                 GitHub Pages                │
                     │       (graphxpert.eu / graphxpert.github.io)│
                     ├─────────────────────────────────────────────┤
                     │                                             │
                     │  ┌──────────────────┐  ┌──────────────────┐ │
                     │  │ assembly-excel-  │  │ assembly-check-  │ │
                     │  │  edit-frontend   │  │      site        │ │
                     │  └────────┬─────────┘  └────────┬─────────┘ │
                     │           │                     │           │
                     │           │                     │           │
                     │           │   ┌──────────────┐  │           │
                     │           │   │ list-check-  │  │           │
                     │           │   │  frontend    │  │           │
                     │           │   └──────┬───────┘  │           │
                     └───────────┼──────────┼──────────┼───────────┘
                                 │          │          │
                                 │          │          │
                                 ▼          ▼          ▼
                         ┌───────────────┐  ┌───────────────┐
                         │ assembly-     │  │ list-check-   │
                         │ excel-edit-   │  │ electron-     │
                         │ backend       │  │ backend       │
                         │ (Render.com)  │  │ (Render.com)  │
                         └───────────────┘  └───────────────┘

                                                ▼
                                        ┌───────────────┐
                                        │ Cloudflare    │
                                        │ Worker API    │
                                        │ api.graphxpert│
                                        │ .eu           │
                                        └──────┬────────┘
                                               ▼
                                        ┌───────────────┐
                                        │ list-check-   │
                                        │ backend       │
                                        │ (Render.com)  │
                                        └───────────────┘
```

---

## 🛠️ Sviluppo

### Struttura Repository

```text
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
├── docs/
│   └── list-check-api-gateway.md
│
├── index.html          # Homepage principale
├── CNAME               # Dominio personalizzato
└── README.md           # Questo file
```

### Deploy

Ogni modifica pushata su `main` viene automaticamente pubblicata su GitHub Pages entro pochi minuti.

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

Ogni frontend ha una costante o un URL che punta al backend corrispondente.

**assembly-excel-edit-frontend/app.js**

```js
const API_BASE_URL = "https://assembly-excel-edit-backend.onrender.com";
```

**assembly-check-site/app.js**

```js
const response = await fetch("https://list-check-electron-backend.onrender.com/api/analyze", {
  method: "POST",
  body: formData,
});
```

**list-check-frontend/app.js**

```js
// Sviluppo
// const API_BASE_URL = "http://localhost:3000";

// Produzione
const API_BASE_URL = "https://api.graphxpert.eu"; // Cloudflare Worker API Gateway
// Il Worker inoltra a: https://list-check-backend.onrender.com/compare
```

Per dettagli aggiuntivi sul comportamento del Worker vedere `docs/list-check-api-gateway.md`.

---

## 🔐 Sicurezza

- Tutti i frontend usano HTTPS (GitHub Pages con certificati SSL automatici).
- L’accesso a `https://graphxpert.eu/list-check-frontend/` è protetto da **Cloudflare Access** (login con Google o codice email).
- Solo gli utenti autorizzati in Cloudflare possono usare l’interfaccia di List Check.
- Il backend di List Check non è esposto direttamente: il browser chiama solo `https://api.graphxpert.eu`, che è un Cloudflare Worker che inoltra le richieste a `https://list-check-backend.onrender.com/compare`.
- I backend su Render.com non salvano in modo persistente i file caricati: gli Excel vengono elaborati in memoria e i risultati restituiti direttamente al client.
- CORS sui backend sono configurati per accettare richieste dai domini GraphXpert (es. `https://graphxpert.eu`).
- Tutte le applicazioni interne (Assembly Check, Assembly Excel Edit, List Check) sono protette da Cloudflare Access.
- La homepage principale https://graphxpert.eu è pubblica, ma l’accesso alle applicazioni avviene solo dopo autenticazione tramite Cloudflare.
- Cloudflare Access controlla gli utenti autorizzati tramite regole configurate nella dashboard Zero Trust.


---

## 🧰 Manutenzione

### Aggiornare un frontend

1. Modificare i file nella cartella corrispondente.
2. Testare localmente aprendo `index.html` nel browser.
3. Commit e push su GitHub.
4. Verificare su `https://graphxpert.eu/{nome-app}/`.

### Cambiare Backend URL

1. Aprire `app.js` del frontend.
2. Modificare `API_BASE_URL` o l’URL nella `fetch()`.
3. Commit e push.
4. Attendere deploy automatico.

### Verificare stato backend

Controllare la dashboard di Render per:

- Stato del servizio (Deployed/Running)
- Logs per eventuali errori
- Ultima deploy

---

## 🧪 Troubleshooting

### "Failed to fetch" o "Endpoint not found"

**Possibili cause:**

- Backend non risponde o URL errato
- Backend in sleep mode su Render (piani gratuiti)

**Soluzioni:**

1. Verificare che il backend sia "Deployed" su Render.
2. Controllare l’URL nel codice frontend.
3. Verificare i logs del backend su Render.
4. Ricordare che i piani gratuiti su Render entrano in sleep dopo un periodo di inattività: la prima richiesta può richiedere 30–60 secondi.

### App non si aggiorna dopo il push

**Possibili cause:**

- Cache del browser
- GitHub Pages non ancora aggiornato

**Soluzioni:**

1. Attendere 2–3 minuti.
2. Fare hard refresh (Ctrl+Shift+R o Cmd+Shift+R).
3. Aprire il sito in finestra anonima.
4. Verificare su https://github.com/GraphXpert/GraphXpert.github.io/commits/main che il commit sia presente.

### Errori CORS

**Possibili cause:**

- Backend non configurato per accettare richieste dal dominio corrente.

**Soluzioni:**

1. Verificare configurazione CORS nel backend.
2. Assicurarsi che il dominio frontend sia in whitelist.
3. Controllare i logs del backend.

---

## 📚 Risorse

- Documentazione GitHub Pages: https://docs.github.com/pages
- Documentazione Render.com: https://render.com/docs
- Repository backend: https://github.com/GraphXpert/assembly-excel-edit-backend
- Repository backend: https://github.com/GraphXpert/list-check-electron-backend
- Repository backend: https://github.com/GraphXpert/list-check-backend
- Documentazione: List Check – Cloudflare Worker API Gateway: `docs/list-check-api-gateway.md`

---

GraphXpert – Suite di applicazioni web per l’analisi e la gestione di file Excel e PDF.

Ultima modifica: 2025-12-07
