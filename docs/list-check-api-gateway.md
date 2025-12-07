List Check – Cloudflare Worker API Gateway

Questo servizio utilizza un Cloudflare Worker come API Gateway per gestire le richieste provenienti dal frontend e inoltrarle al backend su Render.com.

Perché esiste il Worker

Permette di usare https://api.graphxpert.eu come endpoint stabile.

Aggiunge CORS corretti per il dominio graphxpert.eu.

Nasconde l’URL reale del backend (list-check-backend.onrender.com).

Consente eventuali controlli futuri (rate limiting, logging, filtri, ecc.).

Flusso delle richieste

Browser → Cloudflare Access → list-check-frontend (GitHub Pages)
→ Cloudflare Worker (api.graphxpert.eu)
→ list-check-backend (Render.com, /compare)

Configurazione essenziale

Il Worker espone l’endpoint:

POST https://api.graphxpert.eu/compare

e inoltra la richiesta al backend:

POST https://list-check-backend.onrender.com/compare

Supporta:

upload di file multipli tramite FormData

gestione CORS

richieste preflight OPTIONS

Stato del Worker

Chiamando:

GET https://api.graphxpert.eu

la risposta attesa è:

{"status":"ok","source":"cloudflare-worker"}
