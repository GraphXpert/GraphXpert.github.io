# Piano di test Home Page

## Obiettivi
- Verificare layout responsive e navigazione
- Confermare integrità URL e collegamenti
- Garantire buona UX e performance base

## Dispositivi
- Desktop: 1366×768, 1920×1080, ≥2560×1440
- Tablet: 768×1024 (portrait), 1024×768 (landscape)
- Mobile: 360×640, 390×844, 414×896

## Browser
- Chrome (ultimo), Firefox (ultimo), Edge (ultimo), Safari (ultimo su macOS/iOS)

## Casi di test
- Render: brand visibile, tre card dei tool con H2, descrizione, pulsante
- Responsive: 1 colonna <768px, 3 colonne ≥1024px, spaziature corrette
- Navigazione: pulsanti puntano a `/assembly-check-site/`, `/assembly-excel-edit-frontend/`, `/list-check-frontend/`
- Accessibilità: contrasto testo sfondo, focus visibile sui pulsanti, zoom 200%
- Performance: tempo di caricamento iniziale accettabile, nessun errore console
- Regressioni: pagine interne non alterate, stili legacy `.btn` funzionanti

## Esiti attesi
- Nessuna rottura di URL o funzionalità
- Layout leggibile su tutti i device
- Interazione fluida e coerente con brand
