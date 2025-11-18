# Deploy Manual del Backend en Render

## Si no quieres conectar GitHub, usa este método:

### 1. Crear Web Service manualmente

1. En Render Dashboard → "New +" → "Web Service"
2. En lugar de GitHub, selecciona "Public Git Repository"
3. Pega esta URL: `https://github.com/camilo1184/tournament.git`
4. Configuración:
   - **Name:** tournament-backend
   - **Root Directory:** backend
   - **Environment:** Node
   - **Build Command:** npm install
   - **Start Command:** node server.js
   - **Branch:** main

5. Variables de entorno:
   ```
   NODE_ENV=production
   PORT=10000
   ```

6. Click "Create Web Service"

### 2. Después del deploy

Copia la URL que te da Render, ejemplo:
```
https://tournament-backend-xyz.onrender.com
```

### 3. Actualizar la URL en public-view

Edita `public-view/js/app.js` línea 1-4:
```javascript
const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3001/api'
  : 'https://tournament-backend-xyz.onrender.com/api'; // ← Tu URL aquí
```

Luego haz commit y push de este cambio:
```bash
git add public-view/js/app.js
git commit -m "Actualizar URL del backend"
git push origin main
```

### 4. Deploy del Frontend

1. New → Web Service → Public Git Repository
2. URL: `https://github.com/camilo1184/tournament.git`
3. Configuración:
   - **Root Directory:** frontend
   - **Build:** `npm install && npm run build`
   - **Start:** `npx serve -s build -p $PORT`

4. Variables:
   ```
   REACT_APP_API_URL=https://tournament-backend-xyz.onrender.com
   NODE_ENV=production
   ```

### 5. Deploy de Public View

1. New → Static Site → Public Git Repository
2. URL: `https://github.com/camilo1184/tournament.git`
3. Configuración:
   - **Root Directory:** public-view
   - **Publish Directory:** .

---

## ⚠️ Nota Importante

Si el repositorio es privado, Render NO podrá acceder usando "Public Git Repository".
Debes hacer el repo público O conectar tu cuenta de GitHub con Render.
