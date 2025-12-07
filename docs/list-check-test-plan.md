
List Check – Piano di test

Piano di test manuale per verificare il corretto funzionamento di List Check
(Cloudflare Access → frontend → Cloudflare Worker → backend Render).

1. Accesso protetto (Cloudflare Access)

Aprire una finestra in incognito.

Visitare: https://graphxpert.eu/list-check-frontend/

Verificare che compaia la schermata di login Cloudflare Access (Google / codice email).

Confermare che senza login non si accede al frontend.

2. Login utente autorizzato

Sempre da incognito, effettuare il login con un utente autorizzato.

Verificare che, dopo il login, venga caricata la pagina di List Check (form con upload file).

Verificare che l’URL sia: https://graphxpert.eu/list-check-frontend/.

3. Verifica Cloudflare Worker

Visitare: https://api.graphxpert.eu

Verificare che la risposta sia un JSON del tipo:

{"status":"ok","source":"cloudflare-worker"}

Conferma che il Worker è attivo e raggiungibile.

4. Test end-to-end (singola coppia di file)

Aprire https://graphxpert.eu/list-check-frontend/ (sessione già loggata).

Selezionare 1 file old e 1 file new in formato Excel valido.

Lasciare i valori di default per riga e colonna di partenza.

Cliccare Confronta.

Verificare che:

compaiano i messaggi di elaborazione,

al termine venga scaricato un file Excel risultato,

il file contenga le differenze evidenziate.

5. Test errore (file non valido)

Nel frontend, selezionare:

come old file: un Excel valido,

come new file: un file NON Excel (es. .txt o .pdf).

Cliccare Confronta.

Verificare che compaia un messaggio di errore chiaro (es. “File non valido”) e che l’elaborazione non proceda.

6. Test multi-file

Selezionare 2 file old e 2 file new validi (2 coppie di Excel).

Cliccare Confronta.

Verificare che:

il frontend mostri il progresso per 2 coppie,

vengano scaricati 2 file Excel risultato,

le statistiche aggregate siano coerenti.

7. Risultato del test

Per ogni esecuzione del piano di test, annotare:

Data del test

Utente che ha eseguito il test

Esito (OK / KO)

Note o errori riscontrati
