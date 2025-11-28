# Deployment Guide - Render

Questa guida spiega come fare il deploy dell'applicazione Assembly Excel Editor Web su Render.

## Prerequisiti

1. Account Render (gratuito): https://render.com
2. Repository Git con il codice (GitHub, GitLab, o Bitbucket)
3. File configurati:
   - `package.json` con dependencies corrette
   - `server.js` funzionante
   - `render.yaml` per la configurazione automatica

## Metodo 1: Deploy Automatico con render.yaml

### Passo 1: Preparare il Repository

1. **Inizializza Git** (se non già fatto):
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Assembly Excel Editor Web"
   ```

2. **Crea repository su GitHub**:
   ```bash
   git remote add origin https://github.com/TUO_USERNAME/assembly-excel-edit-web.git
   git branch -M main
   git push -u origin main
   ```

### Passo 2: Deploy su Render

1. **Accedi a Render Dashboard**: https://dashboard.render.com

2. **Crea nuovo Web Service**:
   - Click su "New +"
   - Seleziona "Web Service"

3. **Connetti Repository**:
   - Seleziona il tuo provider Git (GitHub/GitLab/Bitbucket)
   - Autorizza Render ad accedere ai tuoi repository
   - Seleziona il repository `assembly-excel-edit-web`

4. **Configurazione Automatica**:
   Render rileverà il file `render.yaml` e configurerà automaticamente:
   - Nome: `assembly-excel-edit-web`
   - Environment: `node`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment Variables (già configurate)

5. **Deploy**:
   - Click su "Create Web Service"
   - Render inizierà automaticamente il deploy

### Passo 3: Verifica Deploy

1. **Attendi il completamento** (circa 2-5 minuti)

2. **Accedi all'URL fornito** da Render (es: `https://assembly-excel-edit-web.onrender.com`)

3. **Testa l'applicazione**:
   - Carica 3 file Excel
   - Genera il file con formule
   - Verifica il download

## Metodo 2: Deploy Manuale (senza render.yaml)

### Configurazione Manuale

1. **In Render Dashboard**, dopo aver connesso il repository:

2. **Settings**:
   - **Name**: `assembly-excel-edit-web`
   - **Environment**: Node
   - **Branch**: `main`
   - **Root Directory**: (lascia vuoto se il progetto è nella root)

3. **Build & Deploy**:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

4. **Environment Variables**:
   Aggiungi le seguenti variabili:
   ```
   NODE_ENV=production
   MAX_FILE_SIZE=52428800
   PORT=10000
   ```
   (Nota: PORT viene impostato automaticamente da Render, ma puoi specificarlo)

5. **Advanced Settings**:
   - **Health Check Path**: `/health`
   - **Auto-Deploy**: Yes (deploy automatico ad ogni push)

## Configurazione Post-Deploy

### Environment Variables

Puoi aggiungere/modificare variabili d'ambiente in qualsiasi momento:

1. Vai al tuo Web Service su Render Dashboard
2. Click su "Environment"
3. Aggiungi/modifica variabili:
   - `NODE_ENV`: `production`
   - `MAX_FILE_SIZE`: `52428800` (50MB)
   - Altre variabili custom se necessarie

### Custom Domain (Opzionale)

Se hai un dominio personalizzato:

1. In Render Dashboard, vai al tuo Web Service
2. Click su "Settings"
3. Sezione "Custom Domains"
4. Aggiungi il tuo dominio
5. Configura i DNS record come indicato

## Monitoraggio

### Logs

Visualizza i log in tempo reale:
- Dashboard → Seleziona Web Service → Tab "Logs"

### Metrics

Render fornisce metriche gratuite:
- CPU Usage
- Memory Usage
- Request Count
- Response Time

### Health Checks

L'endpoint `/health` viene controllato automaticamente ogni minuto:
```
GET https://tuo-app.onrender.com/health
```

## Troubleshooting

### Deploy Fallisce

**Problema**: Build fallisce durante `npm install`

**Soluzione**:
1. Verifica che `package.json` sia corretto
2. Controlla i log di build su Render
3. Assicurati che Node version >= 16.0.0

**Problema**: Server non parte dopo il deploy

**Soluzione**:
1. Verifica Start Command: `npm start`
2. Controlla che `server.js` esista
3. Verifica environment variables

### File Upload Non Funziona

**Problema**: File troppo grande

**Soluzione**:
Aumenta `MAX_FILE_SIZE` nelle environment variables

**Problema**: 413 Payload Too Large

**Soluzione**:
Render ha limiti sul payload HTTP. Per file > 10MB considera:
- Compressione file
- Upload in chunks
- Storage esterno (AWS S3, Cloudinary)

### App Diventa "Idle"

**Problema**: Con piano gratuito, l'app va in sleep dopo 15 minuti di inattività

**Soluzione**:
- Upgrade a piano paid (7$/mese)
- O accetta il "cold start" (~30 secondi al primo accesso)
- O usa servizio esterno per ping periodico (es: UptimeRobot)

## Free Tier Limits

Render Free Tier include:
- **750 ore/mese** di uptime
- **Bandwidth**: illimitato
- **Sleep dopo 15 minuti** di inattività
- **Cold start**: ~30 secondi
- **Build minutes**: 500/mese

## Scaling

Se necessiti di più performance:

### Piano Starter ($7/mese):
- No sleep/cold starts
- Più risorse CPU/RAM
- Priority support

### Aggiornare Piano:
1. Dashboard → Web Service
2. Settings → Plan
3. Seleziona nuovo piano

## Aggiornamenti Automatici

Con Auto-Deploy abilitato, ogni push al branch `main` triggera un nuovo deploy automatico.

```bash
# Modifica codice localmente
git add .
git commit -m "Update: ..."
git push origin main

# Render fa automaticamente il deploy
```

## Backup & Rollback

### Rollback a Deploy Precedente

1. Dashboard → Web Service
2. Tab "Deploys"
3. Seleziona deploy precedente
4. Click "Redeploy"

## Security Best Practices

1. **HTTPS**: Abilitato di default su Render
2. **Environment Variables**: Mai committare .env nel repository
3. **CORS**: Già configurato nel server.js
4. **File Validation**: Implementata nel server.js
5. **Rate Limiting**: Considera di aggiungere `express-rate-limit`

## Support

- **Render Docs**: https://render.com/docs
- **Community**: https://community.render.com
- **Status**: https://status.render.com

---

## Quick Reference

### Comandi Utili

```bash
# Test locale prima del deploy
npm install
npm start

# Verifica health endpoint
curl http://localhost:3000/health

# Check logs in produzione
# (Via Render Dashboard)
```

### URLs

- **Dashboard**: https://dashboard.render.com
- **Docs**: https://render.com/docs/deploy-node-express-app
- **Support**: support@render.com

---

**Ultima revisione**: 2025-11-28
