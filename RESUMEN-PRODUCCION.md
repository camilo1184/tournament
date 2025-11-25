# 🚀 Guía de Despliegue a Producción - Tournament Manager

## 📋 Checklist Pre-Despliegue

### ✅ Completado
- [x] Código limpio sin console.log de debug
- [x] Autenticación JWT implementada
- [x] **Contraseñas hasheadas con bcrypt (25 Nov 2025)**
- [x] **Validación y sanitización de inputs (25 Nov 2025)**
- [x] Base de datos MongoDB configurada
- [x] CORS configurado
- [x] Variables de entorno implementadas
- [x] Backend y Frontend funcionando localmente

### ⚠️ Pendiente Antes de Producción
- [ ] Configurar MongoDB Atlas (producción)
- [ ] Configurar variables de entorno en servidor
- [ ] Desplegar backend en Render/Railway
- [ ] Desplegar frontend en Vercel/Netlify
- [ ] Configurar dominio personalizado (opcional)
- [ ] Pruebas de integración

---

## 🗄️ 1. Configuración de MongoDB Atlas (Base de Datos)

### Crear Cluster en MongoDB Atlas

1. **Ir a** [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. **Crear cuenta** o iniciar sesión
3. **Crear nuevo proyecto** → Tournament Manager
4. **Build a Database** → FREE (M0) → AWS
5. **Región:** Seleccionar la más cercana a usuarios
6. **Crear Cluster**

### Configurar Acceso

1. **Database Access** → Add New Database User
   - Username: `tournamentadmin`
   - Password: Generar contraseña fuerte (guardar en lugar seguro)
   - Database User Privileges: `Atlas admin`

2. **Network Access** → Add IP Address
   - **Opción 1 (Desarrollo):** Allow Access from Anywhere (0.0.0.0/0)
   - **Opción 2 (Producción):** Agregar IPs específicas de Render/Railway

### Obtener Connection String

1. **Databases** → Connect → Connect your application
2. **Driver:** Node.js
3. **Copiar connection string:**
   ```
   mongodb+srv://tournamentadmin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
4. **Reemplazar** `<password>` con la contraseña del usuario

---

## 🖥️ 2. Despliegue del Backend

### Opción A: Render (Recomendado - Gratis)

1. **Crear cuenta** en [https://render.com](https://render.com)

2. **New +** → Web Service

3. **Conectar repositorio GitHub**
   - Autorizar Render
   - Seleccionar repositorio `tournament`

4. **Configuración:**
   - Name: `tournament-backend`
   - Environment: `Node`
   - Region: Oregon (o más cercana)
   - Branch: `main`
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `node server.js`
   - Instance Type: **Free**

5. **Variables de entorno** (Environment):
   ```
   NODE_ENV=production
   PORT=3001
   MONGODB_URI=mongodb+srv://tournamentadmin:<password>@cluster0.xxxxx.mongodb.net/tournament?retryWrites=true&w=majority
   JWT_SECRET=tu_jwt_secreto_muy_seguro_y_largo_minimo_32_caracteres
   ```

6. **Deploy** → Esperar 5-10 minutos

7. **Copiar URL** del backend (ej: `https://tournament-backend.onrender.com`)

### Opción B: Railway

1. **Crear cuenta** en [https://railway.app](https://railway.app)
2. **New Project** → Deploy from GitHub repo
3. **Seleccionar** repositorio `tournament`
4. **Add variables:**
   - Mismo formato que Render
5. **Settings** → Generate Domain

---

## 🌐 3. Despliegue del Frontend

### Opción A: Vercel (Recomendado)

1. **Crear cuenta** en [https://vercel.com](https://vercel.com)

2. **Import Project** → Import Git Repository

3. **Seleccionar** repositorio `tournament`

4. **Configuración:**
   - Framework Preset: `Create React App`
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `build`

5. **Variables de entorno:**
   ```
   REACT_APP_API_URL=https://tournament-backend.onrender.com
   ```
   ⚠️ **Importante:** Usar la URL del backend desplegado (sin `/api` al final)

6. **Deploy** → Esperar 3-5 minutos

7. **Copiar URL** del frontend (ej: `https://tournament-manager.vercel.app`)

### Opción B: Netlify

1. **Crear cuenta** en [https://netlify.com](https://netlify.com)
2. **Add new site** → Import from Git
3. **Configuración:**
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `frontend/build`
4. **Environment variables:**
   - Agregar `REACT_APP_API_URL`
5. **Deploy site**

---

## 🔧 4. Configuración Post-Despliegue

### Actualizar CORS en Backend

Una vez tengas la URL del frontend, **actualizar** `backend/server.js`:

```javascript
const corsOptions = {
  origin: [
    'https://tournament-manager.vercel.app',  // Tu URL de Vercel
    'http://localhost:3000'  // Para desarrollo local
  ],
  credentials: true
};

app.use(cors(corsOptions));
```

**Commit y push** para que Render redesplegue automáticamente.

### Verificar Variables de Entorno

**Backend (Render):**
- ✅ `MONGODB_URI` apunta a MongoDB Atlas
- ✅ `JWT_SECRET` es seguro y largo
- ✅ `NODE_ENV=production`

**Frontend (Vercel):**
- ✅ `REACT_APP_API_URL` apunta al backend de Render

---

## 🧪 5. Pruebas de Producción

### Checklist de Funcionalidades

- [ ] **Registro de usuario** funciona
- [ ] **Login** funciona y genera token
- [ ] **Crear torneo** guarda en MongoDB
- [ ] **Agregar equipos** funciona
- [ ] **Crear partidos** funciona
- [ ] **Actualizar marcadores** se guarda correctamente
- [ ] **Estadísticas** se calculan bien
- [ ] **Vista pública** muestra torneos sin login
- [ ] **Imágenes/logos** cargan correctamente
- [ ] **Responsive** funciona en móvil

### Herramientas de Prueba

- **Chrome DevTools** → Network tab (verificar llamadas API)
- **MongoDB Compass** → Conectar a Atlas y verificar datos
- **Postman** → Probar endpoints del backend

---

## 📊 6. Monitoreo y Mantenimiento

### Logs y Errores

**Render:**
- Dashboard → Logs → Ver errores en tiempo real
- Configurar alertas por email

**MongoDB Atlas:**
- Monitoring → Ver uso de base de datos
- Alerts → Configurar alertas de capacidad

### Backups

**MongoDB Atlas (Configuración automática):**
1. Atlas Dashboard → Backup
2. Enable Cloud Backups (Gratis en tier free con limitaciones)
3. Configurar snapshot schedule

**Manual (Recomendado adicional):**
```bash
# Exportar toda la base de datos
mongodump --uri="mongodb+srv://..." --out=./backup-$(date +%Y%m%d)

# Importar backup
mongorestore --uri="mongodb+srv://..." ./backup-20250125
```

---

## 🚨 7. Problemas Comunes y Soluciones

### Error: "Network Error" o CORS

**Causa:** Frontend no puede conectar con backend

**Solución:**
1. Verificar `REACT_APP_API_URL` en Vercel
2. Verificar CORS en `backend/server.js` incluye URL de Vercel
3. Verificar backend está corriendo en Render (Logs)

### Error: "MongoNetworkError"

**Causa:** Backend no puede conectar a MongoDB Atlas

**Solución:**
1. Verificar `MONGODB_URI` en variables de entorno de Render
2. MongoDB Atlas → Network Access → Allow Render IPs o 0.0.0.0/0
3. Verificar contraseña no tiene caracteres especiales (usar URL encoding)

### Backend se duerme (Render Free Tier)

**Problema:** Render apaga el servicio después de 15 minutos sin uso

**Solución:**
- Usar cron job para hacer ping cada 10 minutos: [https://cron-job.org](https://cron-job.org)
- URL a llamar: `https://tournament-backend.onrender.com/api/public/tournaments`

### Imágenes muy grandes / Lentitud

**Solución:**
1. Implementar compresión de imágenes en frontend
2. Usar servicio CDN como Cloudinary (gratis hasta 25GB)

---

## 💰 8. Costos Mensuales

### Plan Gratuito (Recomendado para empezar)

| Servicio | Límites | Costo |
|----------|---------|-------|
| **Render** (Backend) | Se duerme tras 15 min inactividad | **GRATIS** |
| **Vercel** (Frontend) | 100GB bandwidth/mes | **GRATIS** |
| **MongoDB Atlas** | 512MB storage | **GRATIS** |
| **Total** | | **$0/mes** |

### Plan Pagado (Para producción seria)

| Servicio | Beneficios | Costo |
|----------|-----------|-------|
| **Render** (Starter) | Siempre activo, más recursos | **$7/mes** |
| **Vercel** (Pro) | Sin límites, analytics | **$20/mes** |
| **MongoDB Atlas** (M10) | 10GB storage, backups | **$57/mes** |
| **Total** | | **~$84/mes** |

---

## 📝 9. Siguiente Paso: Dominio Personalizado (Opcional)

### Comprar Dominio

1. **Registrar dominio** en:
   - Namecheap (~$12/año)
   - GoDaddy (~$15/año)
   - Google Domains (~$12/año)

### Configurar DNS

**Para Frontend (Vercel):**
1. Vercel Dashboard → Settings → Domains
2. Agregar dominio: `tudominio.com`
3. Copiar registros DNS
4. En tu registrador (Namecheap): agregar registros
   - Type: `A` → Value: Vercel IP
   - Type: `CNAME` → Value: `cname.vercel-dns.com`

**Para Backend (Render):**
1. Render Dashboard → Settings → Custom Domain
2. Agregar: `api.tudominio.com`
3. En registrador: agregar `CNAME` apuntando a Render

---

## ✅ 10. Checklist Final Pre-Lanzamiento

### Configuración
- [ ] MongoDB Atlas configurado y funcionando
- [ ] Backend desplegado en Render
- [ ] Frontend desplegado en Vercel
- [ ] Variables de entorno configuradas correctamente
- [ ] CORS actualizado con URL de producción

### Seguridad
- [ ] JWT_SECRET es único y seguro (mínimo 32 caracteres)
- [ ] Contraseñas de MongoDB Atlas son fuertes
- [ ] HTTPS habilitado (automático en Render/Vercel)
- [ ] CORS limitado solo a dominios permitidos

### Funcionalidad
- [ ] Login/Registro funciona
- [ ] Crear torneos funciona
- [ ] CRUD de equipos funciona
- [ ] CRUD de partidos funciona
- [ ] Estadísticas calculan correctamente
- [ ] Vista pública accesible

### Monitoreo
- [ ] Logs configurados en Render
- [ ] Backups de MongoDB configurados
- [ ] Cron job para mantener backend activo (opcional)

---

## 🎯 Resumen del Flujo de Despliegue

```
1. MongoDB Atlas
   ├─ Crear cluster
   ├─ Configurar usuario
   └─ Obtener connection string
   
2. Backend (Render)
   ├─ Conectar repo GitHub
   ├─ Configurar variables de entorno
   │  ├─ MONGODB_URI
   │  ├─ JWT_SECRET
   │  └─ NODE_ENV=production
   └─ Deploy
   
3. Frontend (Vercel)
   ├─ Conectar repo GitHub
   ├─ Configurar REACT_APP_API_URL
   └─ Deploy
   
4. Configurar CORS
   └─ Actualizar backend con URL de Vercel
   
5. Probar todas las funcionalidades
```

---

## 📞 Soporte y Recursos

### Documentación Oficial
- [Render Docs](https://render.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com)

### Comunidades
- [Stack Overflow](https://stackoverflow.com)
- Discord de Render
- Vercel Community

---

## 🚀 ¡Listo para Producción!

Si seguiste todos los pasos, tu aplicación debería estar corriendo en:
- **Frontend:** `https://tu-app.vercel.app`
- **Backend:** `https://tu-backend.onrender.com`

**Tiempo estimado total:** 2-3 horas

**¡Buena suerte con el lanzamiento! 🎉**

---

## ⚡ ACCIÓN INMEDIATA RECOMENDADA

**Progreso de Seguridad:**

1. ✅ **Hashear las contraseñas (COMPLETADO 25 Nov 2025)**
   - bcrypt con 10 rondas implementado
   - 2 usuarios migrados exitosamente
   - Ver: `backend/SECURITY-PASSWORDS.md`

2. ✅ **Implementar JWT (COMPLETADO)**
   - Tokens con expiración implementados
   - Sistema de sesiones activas funcionando

3. ✅ **Migrar a base de datos real (COMPLETADO)**
   - MongoDB con Mongoose implementado
   - Modelos creados para User, Team, Tournament, Match

4. ⏸️ **Configurar HTTPS (Automático en Render/Vercel)**
   - Se configura automáticamente al desplegar
   - No requiere acción manual

5. ✅ **Validar todos los inputs (COMPLETADO 25 Nov 2025)**
   - express-validator: 9 validadores implementados
   - express-mongo-sanitize: Protección NoSQL
   - Todos los endpoints protegidos
   - Ver: `backend/SECURITY-SANITIZATION.md`

**Estado actual:** ✅ **100% LISTO PARA PRODUCCIÓN** 🎉

**Tiempo restante estimado:** 0 días - **LISTO PARA DESPLEGAR**


---

## 📋 SIGUIENTE PASO

1. Revisa el archivo `PRODUCCION.md` para detalles completos
2. Decide entre Opción A (rápido) u Opción B (completo)
3. Configura archivo `.env` usando `.env.example`
4. Implementa mejoras críticas en orden de prioridad

---

## ❓ PREGUNTAS FRECUENTES

**P: ¿Puedo subir el código así como está?**
R: NO. Hay vulnerabilidades de seguridad críticas.

**P: ¿Cuánto tiempo necesito antes de producción?**
R: Mínimo 10-14 días para arreglar lo crítico.

**P: ¿Qué es lo más urgente?**
R: Hashear contraseñas y migrar de JSON a base de datos real.

**P: ¿Funciona bien para pocos usuarios?**
R: Localmente sí, pero en internet es vulnerable a ataques.

**P: ¿Qué pasa si subo sin estas mejoras?**
R: Riesgo de:
- Robo de contraseñas
- Pérdida de datos
- Caídas del sistema
- Ataques maliciosos
- Problemas legales (GDPR, protección de datos)

---

**Fecha:** 18 de Noviembre, 2025  
**Estado:** ⚠️ NO LISTO PARA PRODUCCIÓN  
**Tiempo estimado hasta producción:** 10-14 días (mínimo) o 6-8 semanas (completo)
