# 🚀 Deploy Rápido - 3 Pasos

## Opción más rápida: Render.com (15 minutos)

### Paso 1: Subir a GitHub
```bash
git add .
git commit -m "Preparar para deploy"
git push origin main
```

### Paso 2: Deploy Backend
1. Ve a [render.com](https://render.com) y crea cuenta
2. New → Web Service → Conecta GitHub repo `tournament`
3. Configuración:
   - Root Directory: `backend`
   - Build: `npm install`
   - Start: `npm start`
4. **Copia la URL** que te da (ej: `https://tournament-backend-abc123.onrender.com`)

### Paso 3: Actualizar URL y Deploy Frontend
1. Edita `public-view/js/app.js` línea 2:
   ```javascript
   const API_URL = window.location.hostname === 'localhost' 
     ? 'http://localhost:3001/api'
     : 'https://TU-URL-DEL-BACKEND.onrender.com/api'; // ← Pega aquí la URL del paso 2
   ```

2. Deploy Frontend en Render:
   - New → Web Service
   - Root Directory: `frontend`
   - Build: `npm install && npm run build`
   - Start: `npx serve -s build -p $PORT`
   - Variable: `REACT_APP_API_URL` = URL del backend

3. Deploy Vista Pública:
   - New → Static Site
   - Root Directory: `public-view`
   - Publish: `.`

### ¡Listo! 🎉

Tu app estará en:
- Admin: `https://tu-nombre-frontend.onrender.com`
- Pública: `https://tu-nombre-public.onrender.com`

---

## ⚠️ Recordatorios
- Primera carga tarda ~30 seg (plan gratuito)
- Cambia la contraseña admin antes de compartir
- Esto es para PRUEBAS, no producción real
- Lee `PRODUCCION.md` para versión final

---

## 📚 Más información
- Guía detallada: `DEPLOY-PRUEBA.md`
- Mejoras para producción: `PRODUCCION.md`
- Configuración: `backend/.env.example`
