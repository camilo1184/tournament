# Migración a MongoDB Atlas

## Pasos para configurar MongoDB Atlas

### 1. Crear cuenta en MongoDB Atlas
1. Ve a [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Crea una cuenta gratuita o inicia sesión
3. Crea un nuevo proyecto (nombre: "Tournament")

### 2. Crear Cluster
1. Click en "Build a Database"
2. Selecciona **FREE tier** (M0 Sandbox)
3. Selecciona región más cercana (ej: us-east-1)
4. Nombre del cluster: `Cluster0` (default)
5. Click "Create"

### 3. Configurar Acceso
1. **Crear usuario de base de datos**:
   - Username: `tournament_user` 2025
   - Password: Genera una contraseña segura y guárdala
   - Click "Create User"

2. **Configurar IP Whitelist**:
   - Click "Add IP Address"
   - Selecciona "Allow Access from Anywhere" (0.0.0.0/0)
   - Click "Confirm"

### 4. Obtener Connection String
1. Click en "Connect" en tu cluster
2. Selecciona "Connect your application"
3. Driver: Node.js, Version: 4.1 or later
4. Copia el connection string que se ve así:
   ```
   mongodb+srv://tournament_user:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

### 5. Configurar `.env`
1. Abre el archivo `backend/.env`
2. Reemplaza la línea `MONGODB_URI` con tu connection string:
   ```
   MONGODB_URI=mongodb+srv://tournament_user:TU_PASSWORD@cluster0.xxxxx.mongodb.net/tournament?retryWrites=true&w=majority
   ```
   - Reemplaza `<password>` con tu contraseña
   - Reemplaza `xxxxx` con tu cluster ID
   - Agrega `/tournament` antes del `?` para especificar el nombre de la base de datos

### 6. Probar localmente
```bash
cd backend
npm start
```

Deberías ver:
```
✓ Conectado a MongoDB
✓ Usuarios por defecto creados: admin/admin123 y user/user123
Servidor corriendo en puerto 3001
```

### 7. Desplegar en Render
1. Ve a tu servicio en Render.com
2. Agrega variable de entorno:
   - Key: `MONGODB_URI`
   - Value: Tu connection string completo
3. Click "Save Changes"
4. El servicio se redesplegará automáticamente

## Cambios realizados

### Archivos nuevos:
- `backend/models/User.js` - Modelo de usuarios
- `backend/models/Team.js` - Modelo de equipos
- `backend/models/Tournament.js` - Modelo de torneos
- `backend/models/Match.js` - Modelo de partidos
- `backend/utils/tournamentHelpers.js` - Funciones auxiliares
- `backend/.env` - Variables de entorno

### Archivos modificados:
- `backend/server.js` - Migrado a MongoDB con Mongoose
- `backend/package.json` - Agregadas dependencias (mongoose, dotenv)

### Datos eliminados:
- ❌ `backend/data/*.json` - Ya no se usan archivos JSON
- Los datos ahora se almacenan en MongoDB

## Migrar datos existentes (opcional)

Si tienes datos en archivos JSON que quieres migrar a MongoDB:

1. Asegúrate de que MongoDB esté conectado
2. Ejecuta:
   ```bash
   node backend/migrate-data.js
   ```

Este script leerá los archivos JSON y los importará a MongoDB.

## Ventajas de MongoDB

✓ **512 MB gratis** permanentemente (suficiente para ~10,000 partidos)
✓ **Sin expiración** del tier gratuito
✓ **Backups automáticos**
✓ **Escalable** si necesitas más en el futuro
✓ **Hosting global** con baja latencia
✓ **No requiere servidor** de base de datos propio

## Solución de problemas

### Error: "MongoServerError: bad auth"
- Verifica que el usuario y contraseña sean correctos en `.env`
- Asegúrate de no tener caracteres especiales sin escapar en la contraseña

### Error: "connect ECONNREFUSED"
- Verifica que hayas agregado `0.0.0.0/0` a la whitelist en Atlas
- Revisa que el connection string sea correcto

### Error: "MONGODB_URI not defined"
- Asegúrate de tener el archivo `.env` en la carpeta `backend/`
- Verifica que la primera línea de `server.js` sea `require('dotenv').config();`
