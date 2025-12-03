# Redesign Home Page GraphXpert

## Obiettivi
- Modernizzare l'interfaccia rispettando brand e palette esistente
- Migliorare gerarchia visiva e leggibilità
- Rendere chiara la navigazione verso i tool principali

## Modifiche principali
- Nuova struttura semantica: `header` con brand, `main` con griglia dei tool
- Sezione dedicata per ogni tool con: titolo (H2), descrizione (<150 caratteri), pulsante di azione
- Layout responsive: griglia 3 colonne su desktop (≥1024px), singola colonna su mobile (≤767px)
- Conservati tutti gli URL e i collegamenti: `/assembly-check-site/`, `/assembly-excel-edit-frontend/`, `/list-check-frontend/`
- Palette e font invariati (`Poppins`, gradienti `--primary-color` e `--secondary-color`)

## File interessati
- `index.html`: nuova struttura della home
- `styles.css`: nuovi stili per header, griglia, card dei tool e pulsante
- `docs/mockups.html`: mockup desktop + mobile

## Requisiti rispettati
- Struttura a sezioni per ogni tool con H2, descrizione breve, pulsante
- Design più moderno con spaziatura, card e gradienti coerenti col brand
- Responsive ottimizzato per desktop/mobile
- Nessuna modifica agli URL o all'architettura informativa
- Funzionalità e link preservati

## Note di implementazione
- Classi nuove e isolanti (`site-header`, `tools`, `tool-card`, `tool-action`) per evitare impatti sulle pagine interne
- Stili legacy (`.btn`) mantenuti per compatibilità

## Prossimi passi
- Verifica cross-browser e dispositivi secondo il piano di test (`docs/test-plan.md`)
- Raccolta feedback e micro-tuning di copy e spaziatura
