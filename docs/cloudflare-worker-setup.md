
Cloudflare Worker – Configurazione API Gateway

Documentazione tecnica per la configurazione del Cloudflare Worker utilizzato come proxy per List Check.

1. Scopo del Worker

Il Worker api.graphxpert.eu funge da API Gateway tra il frontend (list-check-frontend) e il backend su Render (list-check-backend.onrender.com).

Funzioni principali:

Espone un endpoint stabile: https://api.graphxpert.eu/compare

Inoltra la richiesta al backend originale su Render

Gestisce CORS per il dominio graphxpert.eu

Nasconde l’URL reale del backend

Permette aggiunte future (rate limiting, logging, filtri)

2. Dominio e Routing

Dominio del Worker: api.graphxpert.eu

Deploy Cloudflare: Worker definito in Cloudflare Dashboard

URL workers.dev (fallback): fornito automaticamente da Cloudflare

Routing impostato su:
api.graphxpert.eu/* → Worker api-proxy

3. Endpoint esposto

Il Worker espone:

GET / → ritorna JSON di diagnostica
{"status":"ok","source":"cloudflare-worker"}

POST /compare → inoltra l’upload dei file al backend

Backend origin:

https://list-check-backend.onrender.com/compare

4. Comportamento del Worker
In sintesi il Worker fa:

Riceve la richiesta dal browser

Applica CORS per https://graphxpert.eu

Se necessario risponde alle richieste OPTIONS (preflight)

Re-invia la richiesta al backend Render

Restituisce al browser:

body della risposta

headers custom (es. statistiche come X-Total-Sheets)

5. Verifica del corretto funzionamento
Test 1 — Worker attivo

Visitare:
https://api.graphxpert.eu
La risposta deve essere:
{"status":"ok","source":"cloudflare-worker"}

Test 2 — Proxy funzionante

Dal frontend, avviare una richiesta /compare.
Se il Worker è configurato correttamente:

il backend elabora il file

il risultato viene scaricato

non ci devono essere errori CORS

6. Errori comuni
Errore CORS

Controllare che l’header Access-Control-Allow-Origin includa:
https://graphxpert.eu

Verificare che le richieste OPTIONS siano gestite.

Errore 5xx dal Worker

Possibili cause:

backend offline su Render

timeout di Render (soprattutto se file Excel molto grandi)

risposta non valida del backend

Errore 403

Il dominio chiamante non è tra quelli permessi

È stata attivata per errore una policy Access sul dominio API

7. Manutenzione futura

Le modifiche al Worker si fanno da Cloudflare Dashboard o via Wrangler CLI

Dopo ogni modifica, verificare:

https://api.graphxpert.eu

una richiesta di test /compare dal frontend

In caso di migrazione del backend, basta aggiornare l’URL nel Worker, non nel frontend

8. File correlati

Documentazione test: docs/list-check-test-plan.md

Documentazione frontend List Check: sezione dedicata nel README

Documentazione API Gateway: docs/list-check-api-gateway.md

Fine documento
