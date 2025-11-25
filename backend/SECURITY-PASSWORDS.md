# 🔐 Hasheo de Contraseñas con bcrypt

## ✅ Implementación Completada

Las contraseñas ahora están **hasheadas de forma segura** usando bcrypt con salt de 10 rondas.

---

## 🎯 ¿Qué se hizo?

### 1. Instalación de bcryptjs
```bash
npm install bcryptjs
```

### 2. Actualización del Modelo User

**Archivo:** `models/User.js`

Se agregaron:
- **Hook pre-save**: Hashea automáticamente la contraseña antes de guardar
- **Método comparePassword**: Verifica contraseñas de forma segura

```javascript
// Hash automático antes de guardar
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Método para comparar contraseñas
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};
```

### 3. Actualización del Endpoint de Login

**Archivo:** `server.js`

Cambió de:
```javascript
// ❌ INSEGURO - Antes
const user = await User.findOne({ username, password });
```

A:
```javascript
// ✅ SEGURO - Ahora
const user = await User.findOne({ username });
const isValidPassword = await user.comparePassword(password);
```

### 4. Script de Migración

**Archivo:** `migrate-passwords.js`

Script para convertir contraseñas existentes en texto plano a hasheadas.

**Ejecutar UNA SOLA VEZ:**
```bash
node migrate-passwords.js
```

---

## 🔒 Beneficios de Seguridad

### Antes (INSEGURO) ❌
- Contraseñas en texto plano en la base de datos
- Si alguien accede a la DB, ve todas las contraseñas
- Imposible cumplir con regulaciones de seguridad (GDPR, etc.)

**Ejemplo en DB:**
```javascript
{ username: 'admin', password: 'admin123' }  // ❌ Visible
```

### Ahora (SEGURO) ✅
- Contraseñas hasheadas con bcrypt (algoritmo de una vía)
- Salt único por usuario (previene rainbow tables)
- Imposible recuperar la contraseña original

**Ejemplo en DB:**
```javascript
{ 
  username: 'admin', 
  password: '$2a$10$XYZ123...' // ✅ Hash irreversible
}
```

---

## 🧪 Pruebas

### Test Manual de Login

```bash
# Debe devolver token y datos del usuario
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Respuesta esperada:
# {
#   "token": "69209554923c7744ad31e469-1764106350735-abc123",
#   "user": {
#     "id": "69209554923c7744ad31e469",
#     "username": "admin",
#     "role": "admin"
#   }
# }
```

### PowerShell:
```powershell
$body = @{username='admin'; password='admin123'} | ConvertTo-Json
Invoke-RestMethod -Uri 'http://localhost:3001/api/auth/login' `
  -Method Post -Body $body -ContentType 'application/json'
```

---

## 📋 Verificación en MongoDB

### Antes de migración:
```javascript
db.users.findOne({username: 'admin'})
// { username: 'admin', password: 'admin123' }
```

### Después de migración:
```javascript
db.users.findOne({username: 'admin'})
// { 
//   username: 'admin', 
//   password: '$2a$10$eKQ8Xc8YFTjKLN8qzO.v5.yFz2vBqY...'
// }
```

---

## ⚠️ IMPORTANTE para Usuarios Existentes

### ¿Los usuarios pueden seguir usando sus contraseñas?
**SÍ** ✅ - Las contraseñas originales siguen funcionando.

- La contraseña `admin123` sigue siendo válida
- bcrypt compara la contraseña ingresada con el hash
- **No es necesario** resetear contraseñas

### ¿Qué pasa con nuevos usuarios?
- Se registran con `POST /api/auth/register`
- La contraseña se hashea automáticamente
- Todo funciona transparente para el usuario

---

## 🔄 Migración en Producción

### Paso 1: Backup de Base de Datos
```bash
mongodump --uri="mongodb+srv://..." --out=./backup-antes-passwords
```

### Paso 2: Desplegar Nuevo Código
```bash
git pull
npm install  # Instala bcryptjs
```

### Paso 3: Ejecutar Migración
```bash
node migrate-passwords.js
```

### Paso 4: Verificar
```bash
# Probar login con contraseña original
curl -X POST https://tu-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### Paso 5: Reiniciar Servidor
```bash
# En Render/Railway se hace automáticamente
# Localmente:
npm start
```

---

## 🐛 Troubleshooting

### Error: "Credenciales inválidas" después de migración

**Posible causa:** La migración se ejecutó múltiples veces

**Solución:**
1. Restaurar backup:
   ```bash
   mongorestore --uri="mongodb+srv://..." ./backup-antes-passwords
   ```
2. Ejecutar migración **una sola vez**:
   ```bash
   node migrate-passwords.js
   ```

### Error: Las contraseñas se hashean dos veces

**Causa:** El hook pre-save se ejecuta en usuarios ya migrados

**Prevención:** El script de migración detecta contraseñas ya hasheadas:
```javascript
if (user.password.startsWith('$2')) {
  // Saltar, ya está hasheada
}
```

---

## 📊 Rendimiento

### Impacto en Login
- **Antes:** ~1-5ms (comparación directa)
- **Ahora:** ~50-100ms (bcrypt con 10 rondas)

**Nota:** El incremento es **intencional** y necesario para seguridad. 
bcrypt es deliberadamente lento para prevenir ataques de fuerza bruta.

### Rondas de Salt
```javascript
const salt = await bcrypt.genSalt(10);  // 10 rondas (recomendado)
```

- **10 rondas:** ~100ms, seguridad estándar ✅
- **12 rondas:** ~400ms, mayor seguridad
- **8 rondas:** ~25ms, menos seguro (no recomendado)

---

## 🎓 Conceptos Clave

### ¿Qué es un Hash?
Función de una sola vía que convierte texto en una cadena irreversible.
```
'admin123' → bcrypt → '$2a$10$eKQ8...' (imposible revertir)
```

### ¿Qué es un Salt?
Valor aleatorio único que se agrega antes de hashear.
Previene que dos usuarios con la misma contraseña tengan el mismo hash.

```javascript
Usuario 1: 'password' + 'salt1' → hash1
Usuario 2: 'password' + 'salt2' → hash2  // Diferente!
```

### ¿Qué es bcrypt?
Algoritmo diseñado específicamente para hashear contraseñas:
- Lento por diseño (previene fuerza bruta)
- Incluye salt automáticamente
- Resistente a hardware especializado (GPU/ASIC)

---

## ✅ Checklist de Seguridad

- [x] Contraseñas hasheadas con bcrypt
- [x] Salt único por usuario (10 rondas)
- [x] Comparación segura en login
- [x] Hook automático en registro de nuevos usuarios
- [x] Script de migración para usuarios existentes
- [x] Contraseñas originales siguen funcionando
- [x] Imposible ver contraseñas en la base de datos

---

## 📅 Historial

- **25 Nov 2025:** ✅ Implementación inicial completada
- **Usuarios migrados:** 2 (admin, user)
- **Estado:** PRODUCCIÓN READY 🚀

---

## 🔗 Referencias

- [bcrypt NPM](https://www.npmjs.com/package/bcryptjs)
- [OWASP Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [bcrypt vs PBKDF2 vs scrypt](https://security.stackexchange.com/questions/4781/)

---

**Estado de Seguridad:** ✅ **LISTO PARA PRODUCCIÓN**
