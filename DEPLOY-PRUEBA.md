# 🚀 Guía Rápida: Subir Proyecto a la Web (Versión de Prueba)

## 📌 IMPORTANTE
Esta guía es para **despliegue de prueba/demostración**, NO para producción final.
El código funcionará pero tendrá las vulnerabilidades mencionadas en PRODUCCION.md.

---

## ✅ OPCIÓN 1: Render.com (RECOMENDADA - Más Fácil)

### ✨ Ventajas:
- ✅ **GRATIS** para proyectos pequeños
- ✅ Muy fácil de configurar
- ✅ Deploys automáticos desde Git
- ✅ SSL/HTTPS incluido gratis
- ✅ Base de datos PostgreSQL gratis
- ✅ No necesita tarjeta de crédito

### 📋 Pasos:

#### 1. Preparar el código

**Backend - Crear `package.json` start script:**
```json
// En backend/package.json, asegurar que tenga:
{
  "scripts": {
    "start": "node server.js"
  }
}
```

**Frontend - Crear build script:**
```json
// En frontend/package.json:
{
  "scripts": {
    "build": "react-scripts build",
    "start": "serve -s build"
  }
}
```

#### 2. Crear cuenta en Render.com
1. Ve a https://render.com
2. Haz clic en "Get Started for Free"
3. Conecta con GitHub

#### 3. Subir código a GitHub
```bash
cd e:\Camilo\Proyectos\tournament
git add .
git commit -m "Preparar para deploy en Render"
git push origin main
```

#### 4. Deploy del Backend
1. En Render Dashboard → "New +" → "Web Service"
2. Conecta tu repositorio `tournament`
3. Configuración:
   - **Name:** `tournament-backend`
   - **Root Directory:** `backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** `Free`

4. Variables de entorno (Environment Variables):
   ```
   NODE_ENV=production
   PORT=3001
   ```

5. Click "Create Web Service"
6. **Copia la URL** que te da (ej: `https://tournament-backend.onrender.com`)

#### 5. Deploy del Frontend React
1. En Render Dashboard → "New +" → "Web Service"
2. Selecciona tu repositorio
3. Configuración:
   - **Name:** `tournament-frontend`
   - **Root Directory:** `frontend`
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npx serve -s build -p $PORT`

4. Variables de entorno:
   ```
   REACT_APP_API_URL=https://tournament-backend.onrender.com
   NODE_ENV=production
   ```

5. Click "Create Web Service"

#### 6. Deploy de la Vista Pública
1. En Render Dashboard → "New +" → "Static Site"
2. Selecciona tu repositorio
3. Configuración:
   - **Name:** `tournament-public`
   - **Root Directory:** `public-view`
   - **Build Command:** (dejar vacío)
   - **Publish Directory:** `.`

4. Antes de deployar, actualiza la URL del API en `public-view/js/app.js`:
   ```javascript
   // Buscar línea ~10 donde está la URL del API
   const API_URL = 'https://tournament-backend.onrender.com';
   ```

#### 7. ¡Listo! 🎉
- Frontend Admin: `https://tournament-frontend.onrender.com`
- Vista Pública: `https://tournament-public.onrender.com`
- Backend API: `https://tournament-backend.onrender.com`

**⚠️ NOTA:** El plan gratuito de Render apaga los servicios después de 15 minutos de inactividad. La primera carga puede tardar 30-60 segundos.

---

## ✅ OPCIÓN 2: Vercel (Solo Frontend) + Railway (Backend)

### Para Frontend y Vista Pública (Vercel - GRATIS)

#### 1. Instalar Vercel CLI
```bash
npm install -g vercel
```

#### 2. Deploy Frontend
```bash
cd e:\Camilo\Proyectos\tournament\frontend
vercel login
vercel --prod
```

#### 3. Deploy Vista Pública
```bash
cd e:\Camilo\Proyectos\tournament\public-view
vercel --prod
```

### Para Backend (Railway - GRATIS con $5 de crédito)

#### 1. Crear cuenta en Railway
1. Ve a https://railway.app
2. "Start a New Project"
3. "Deploy from GitHub repo"
4. Selecciona tu repo y carpeta `backend`

#### 2. Configurar variables de entorno
```
NODE_ENV=production
PORT=3001
```

#### 3. Obtener URL del backend
Railway te dará una URL como: `https://tournament-backend.up.railway.app`

#### 4. Actualizar URLs en frontend
Actualiza `REACT_APP_API_URL` en Vercel con la URL de Railway

---

## ✅ OPCIÓN 3: Netlify + Heroku (Clásica)

### Frontend en Netlify (GRATIS)
```bash
cd frontend
npm run build
# Arrastra la carpeta build/ a https://app.netlify.com/drop
```

### Backend en Heroku (GRATIS por tiempo limitado)
```bash
# Instalar Heroku CLI
heroku login
cd backend
heroku create tournament-backend
git push heroku main
```

---

## ✅ OPCIÓN 4: Todo en un VPS (DigitalOcean, Linode)

### Más control pero requiere más conocimiento

**Costo:** ~$5/mes

#### Setup rápido:
```bash
# En el servidor
sudo apt update
sudo apt install nodejs npm nginx

# Clonar repo
git clone https://github.com/camilo1184/tournament.git
cd tournament

# Backend
cd backend
npm install
npm install -g pm2
pm2 start server.js
pm2 save

# Frontend
cd ../frontend
npm install
npm run build

# Configurar Nginx para servir todo
```

---

## 🔧 CAMBIOS MÍNIMOS NECESARIOS ANTES DE SUBIR

### 1. Actualizar URL del API en public-view

**Archivo:** `public-view/js/app.js`
```javascript
// Línea ~1-10, agregar al inicio:
const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3001'
  : 'https://tu-backend-url.com'; // Reemplazar con tu URL de backend

// Luego en todas las llamadas fetch, usar:
fetch(`${API_URL}/api/tournaments`)
```

### 2. Configurar CORS en Backend

**Archivo:** `backend/server.js`
```javascript
// Reemplazar línea ~48:
const cors = require('cors');

// Opción para desarrollo/prueba (permite todos):
app.use(cors());

// O mejor, especificar tus dominios:
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://tu-frontend.vercel.app',
    'https://tu-public-view.vercel.app'
  ],
  credentials: true
}));
```

### 3. Crear archivo `.env` en backend

```bash
cd backend
echo "PORT=3001" > .env
echo "NODE_ENV=production" >> .env
```

### 4. Agregar scripts de build si no existen

**frontend/package.json:**
```json
{
  "scripts": {
    "build": "react-scripts build",
    "start": "react-scripts start"
  }
}
```

---

## 📊 COMPARACIÓN RÁPIDA

| Plataforma | Costo | Facilidad | Tiempo Setup | Mejor Para |
|------------|-------|-----------|--------------|------------|
| **Render.com** | Gratis | ⭐⭐⭐⭐⭐ | 15 min | Principiantes |
| **Vercel + Railway** | Gratis | ⭐⭐⭐⭐ | 20 min | Proyectos separados |
| **Netlify + Heroku** | Gratis* | ⭐⭐⭐ | 30 min | Familiar |
| **VPS Propio** | $5/mes | ⭐⭐ | 2 horas | Expertos |

*Heroku ya no es gratis desde Nov 2022

---

## 🎯 MI RECOMENDACIÓN PARA TI

### Para subir TODO rápido y fácil:

**Usa Render.com** (Opción 1)

**Tiempo total: 30-45 minutos**

1. ✅ Sube tu código a GitHub (5 min)
2. ✅ Crea cuenta en Render.com (2 min)
3. ✅ Deploy backend en Render (10 min)
4. ✅ Deploy frontend en Render (10 min)
5. ✅ Deploy public-view en Render (10 min)
6. ✅ Prueba que todo funcione (5 min)

---

## ⚠️ RECORDATORIOS IMPORTANTES

1. **NO uses esta configuración para producción real con usuarios reales**
2. **Las contraseñas están en texto plano** - solo para pruebas
3. **Los datos están en JSON** - se pueden perder fácilmente
4. **Cambia las contraseñas** del admin antes de subir
5. **No compartas las URLs públicamente** si tiene datos sensibles
6. **Haz backups** de los archivos JSON regularmente

---

## 🆘 SOPORTE

Si tienes problemas durante el deploy:

1. **Error de CORS:** Actualiza los origins en backend/server.js
2. **Frontend no conecta:** Verifica REACT_APP_API_URL
3. **Backend crashea:** Revisa logs en el dashboard de la plataforma
4. **Datos no persisten:** Los archivos JSON pueden no persistir en algunos servicios gratuitos

---

## 📝 PRÓXIMOS PASOS DESPUÉS DEL DEPLOY

Una vez que esté funcionando en la web:

1. ✅ Prueba todas las funcionalidades
2. ✅ Comparte la URL con las personas que necesitan verlo
3. ✅ Anota cualquier bug o mejora necesaria
4. ✅ Cuando estés listo para producción real, sigue PRODUCCION.md

---

**¿Listo para empezar? Te recomiendo la Opción 1 (Render.com)**

¿Necesitas ayuda con algún paso específico? ¡Pregúntame!
