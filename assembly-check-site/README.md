# Assembly Check Web (Browser)

Applicazione web client‑side per confrontare i codici alfanumerici tra Disegni PDF e Lista Excel. Funziona interamente nel browser, senza server né installazione.

## Funzionalità

- **Elaborazione lato client** – nessun server, tutto nel browser
- **Drag & drop** – carica rapidamente Excel e più PDF
- **Estrazione testo PDF** – con `pdf.js` (CDN)
- **Lettura Excel** – con `SheetJS (xlsx)` (CDN)
- **Confronto quantità** – categorie `OK`, `NON TROVATO`, `DISCREPANZA`
- **Report PDF compatto** – esportazione con sfondo bianco tramite `html2pdf`
- **Selezione robusta** – controller dedicato evita richieste ripetute

## Uso

1. Apri `index.html` nel browser
2. Carica l’Excel (singolo) e seleziona più PDF
3. Imposta i parametri (B/C/19 di default)
4. Clicca `Generate Report`
5. Clicca `Download PDF` per il report compatto

## Riconoscimento codici

La webapp identifica codici alfanumerici con queste regole:
- Devono contenere lettere e numeri (es. "ABC123")
- Lunghezza minima 3 caratteri
- Ignora numeri puri (es. 12345) e solo lettere (es. ABC)

## Requisiti browser

- Browser moderno con JavaScript abilitato
- Supporto File API e Drag & Drop
- Connessione Internet (librerie da CDN)

## Struttura

```
Assembly_Check_Web/
├── index.html          # Interfaccia principale
├── styles.css          # Stili
├── app.js              # Logica applicativa
├── test.html           # Pagina di test
└── README.md           # Questa guida
```

## Dettagli tecnici

### Librerie
- **pdf.js** – estrazione testo dai PDF (CDN)
- **SheetJS (xlsx)** – lettura Excel (CDN)
- **html2pdf** – generazione PDF compatto

### Flusso di elaborazione
1. Lettura file con FileReader API
2. Estrazione testo PDF pagina per pagina (pdf.js)
3. Lettura righe Excel secondo colonne impostate (SheetJS)
4. Estrazione codici con regex `/\b[A-Z0-9]{2,}\b/g` e filtri
5. Aggregazione quantità (PDF vs Excel) e categorizzazione
6. Visualizzazione tabellare e riepilogo
7. Export in PDF compatto con sfondo bianco

### Report
- Riepilogo sintetico (card counts)
- Tabella dettagli con colonne: Riga, Codice, Quantità Attesa, Quantità Trovata, Risultato, Stato
- Evidenziazione `OK`, `DISCREPANZA`, `NON TROVATO`
- Impaginazione compatta, sfondo bianco, senza ombre

#### Aggiornamenti (Versione stabile)

- Allineamento contenuto dall’angolo in alto a sinistra del PDF.
- Sfondo completamente bianco del PDF (container e `html2canvas.backgroundColor`).
- Rimosse sezioni non essenziali dal PDF: "Solo PDF", "Solo Excel", "Quantità Mancanti", "Quantità in Eccesso".
- Margini pagina affidabili con `html2pdf` (`margin: 8mm`) e contenuto adattato ai margini laterali.
- Margine destro regolato via margini del container (`margin: 0 20px 0 10px`) senza tagliare il contenuto.
- Larghezza contenitore `100%`, tabella `table-layout: fixed` e `word-break: break-word` per evitare overflow.
- Righe tabella compattate: `height ~16px`, `line-height ~0.85`, `padding 0–2px`.
- Font celle e header aumentato a `13px` per leggibilità con righe compatte.
- Pill di stato compattate (padding ridotto, font più piccolo) per ridurre l’altezza delle righe.
- Aggiunto `html2canvas: { scrollY: 0, useCORS: true, backgroundColor: '#ffffff' }` per stabilità di cattura.

## Troubleshooting

### I file non si caricano
- Usa un browser moderno
- Verifica JavaScript attivo
- Controlla formati: PDF/Excel

### Nessun codice trovato
- I codici devono essere alfanumerici e ≥ 3 caratteri
- I PDF devono contenere testo ricercabile

### L’app non funziona
- Apri `test.html` per diagnosi
- Controlla gli errori in console
- Verifica connessione Internet (CDN)

## Privacy & Sicurezza

Tutti i file sono processati localmente nel browser. Nessun dato viene inviato a server: massima privacy di disegni e liste.

## Compatibilità

- **Desktop**: Chrome, Firefox, Edge, Safari (ultime versioni)
- **Mobile**: iOS Safari, Chrome per Android (multi‑selezione limitata)
- **Tablet**: Browser moderni

Nessuna installazione: apri l’HTML e usa l’app.
