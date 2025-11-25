# 🛡️ Sanitización y Validación de Datos

## ✅ Implementación Completada - 25 Nov 2025

La aplicación ahora cuenta con **validación y sanitización completa** de todos los inputs del usuario.

---

## 🎯 ¿Qué se implementó?

### 1. Librerías Instaladas

```bash
npm install express-validator express-mongo-sanitize
```

- **express-validator**: Validación y sanitización de datos
- **express-mongo-sanitize**: Protección contra inyecciones NoSQL

### 2. Middleware de Validación

**Archivo:** `middleware/validators.js`

Validadores creados para:
- ✅ Autenticación (login/registro)
- ✅ Torneos (crear/editar)
- ✅ Equipos (crear/editar con jugadores)
- ✅ Partidos (crear/actualizar marcadores)
- ✅ IDs de MongoDB
- ✅ Queries de búsqueda

### 3. Sanitización NoSQL

Protección automática contra inyecciones en MongoDB:

```javascript
app.use(mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`⚠️ Intento de inyección NoSQL detectado en ${key}`);
  }
}));
```

---

## 🔒 Protecciones Implementadas

### Validación de Autenticación

```javascript
// Login
POST /api/auth/login
{
  "username": "admin",    // 3-50 caracteres, alfanumérico
  "password": "admin123"  // Mínimo 6 caracteres
}
```

**Validaciones:**
- Username: 3-50 caracteres, solo letras, números, guiones
- Password: Mínimo 6 caracteres
- Campos requeridos

**Errores de ejemplo:**
```json
{
  "error": "Datos inválidos",
  "details": [
    {"field": "username", "message": "El usuario debe tener entre 3 y 50 caracteres"},
    {"field": "password", "message": "La contraseña es requerida"}
  ]
}
```

### Validación de Torneos

```javascript
// Crear torneo
POST /api/tournaments
{
  "name": "Mi Torneo",           // 3-100 caracteres, sanitizado
  "type": "league",              // Solo valores válidos
  "description": "...",          // Máximo 1000 caracteres
  "registrationFee": "$ 50.000", // Máximo 50 caracteres
  "prizes": "...",               // Máximo 500 caracteres
  "startDate": "2025-12-01"      // Formato ISO8601
}
```

**Validaciones:**
- Nombre: 3-100 caracteres, sanitizado contra XSS
- Tipo: Solo 'league', 'knockout', 'groups', etc.
- Fechas: Formato ISO 8601 válido
- Descripciones: Límites de longitud

### Validación de Equipos

```javascript
// Crear equipo
POST /api/teams
{
  "name": "Real Madrid",
  "logo": "data:image/...",
  "players": [
    {
      "name": "Cristiano",    // 2-100 caracteres
      "number": 7,            // 0-999
      "position": "Delantero" // Máximo 50 caracteres
    }
  ]
}
```

**Validaciones:**
- Nombre del equipo: 2-100 caracteres
- Nombre de jugadores: 2-100 caracteres cada uno
- Número de camiseta: 0-999
- Arrays validados elemento por elemento

### Validación de Partidos

```javascript
// Actualizar marcador
PUT /api/matches/:id
{
  "team1Score": 3,     // 0-99
  "team2Score": 2,     // 0-99
  "status": "completed" // Solo estados válidos
}
```

**Validaciones:**
- IDs: Formato MongoDB válido
- Marcadores: 0-99
- Estados: Solo 'pending', 'in-progress', 'completed', 'finished'
- Goleadores: Arrays válidos

---

## 🚫 Ataques Prevenidos

### 1. Inyección NoSQL ❌

**Ataque intentado:**
```json
POST /api/auth/login
{
  "username": {"$gt": ""},
  "password": {"$gt": ""}
}
```

**Resultado:**
```
⚠️ Intento de inyección NoSQL detectado en username
⚠️ Intento de inyección NoSQL detectado en password
400 Bad Request: "Datos inválidos"
```

### 2. XSS (Cross-Site Scripting) ❌

**Ataque intentado:**
```json
POST /api/tournaments
{
  "name": "<script>alert('XSS')</script>"
}
```

**Resultado:**
```
Sanitizado a: "&lt;script&gt;alert('XSS')&lt;/script&gt;"
```

### 3. IDs Inválidos ❌

**Ataque intentado:**
```
DELETE /api/teams/invalid-id-123
```

**Resultado:**
```json
{
  "error": "Datos inválidos",
  "details": [{"field": "id", "message": "ID inválido"}]
}
```

### 4. Desbordamiento de Buffer ❌

**Ataque intentado:**
```json
POST /api/tournaments
{
  "name": "A".repeat(10000)
}
```

**Resultado:**
```json
{
  "error": "Datos inválidos",
  "details": [{
    "field": "name",
    "message": "El nombre debe tener entre 3 y 100 caracteres"
  }]
}
```

---

## 🧪 Pruebas de Seguridad

### Test 1: Login con datos vacíos
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"","password":""}'

# Respuesta esperada: 400 Bad Request
```

### Test 2: Crear torneo con nombre muy largo
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"name":"'$(python -c "print('A'*200)")'"}'

# Respuesta esperada: 400 Bad Request
```

### Test 3: ID inválido
```bash
curl -X DELETE http://localhost:3001/api/teams/123 \
  -H "Authorization: Bearer TOKEN"

# Respuesta esperada: 400 Bad Request
```

### Test 4: Inyección NoSQL
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":{"$gt":""},"password":{"$gt":""}}'

# Respuesta esperada: 400 Bad Request + Warning en logs
```

---

## 📊 Endpoints Protegidos

### Autenticación
- ✅ POST `/api/auth/login` - validateLogin
- ✅ POST `/api/auth/register` - validateRegister

### Torneos
- ✅ POST `/api/tournaments` - validateTournament
- ✅ PUT `/api/tournaments/:id` - validateMongoId + validateTournament
- ✅ DELETE `/api/tournaments/:id` - validateMongoId

### Equipos
- ✅ POST `/api/teams` - validateTeam
- ✅ PUT `/api/teams/:id` - validateMongoId + validateTeam
- ✅ DELETE `/api/teams/:id` - validateMongoId

### Partidos
- ✅ POST `/api/matches` - validateMatch
- ✅ PUT `/api/matches/:id` - validateMongoId + validateMatchUpdate
- ✅ DELETE `/api/matches/:id` - validateMongoId

### Públicos
- ✅ GET `/api/public/tournaments` - validateSearchQuery

---

## 🔍 Logs de Seguridad

El sistema ahora registra:

```
⚠️ Intento de inyección NoSQL detectado en username
⚠️ Intento de inyección NoSQL detectado en password
```

**Recomendación para producción:**
- Enviar estos logs a un servicio como Sentry o LogRocket
- Configurar alertas para múltiples intentos desde la misma IP
- Implementar rate limiting con express-rate-limit

---

## 📈 Mejoras de Seguridad Implementadas

| Vulnerabilidad | Antes | Ahora |
|----------------|-------|-------|
| **Inyección NoSQL** | ❌ Vulnerable | ✅ Protegido |
| **XSS** | ❌ Vulnerable | ✅ Sanitizado |
| **IDs inválidos** | ⚠️ Crash | ✅ Validado |
| **Datos maliciosos** | ❌ Acepta todo | ✅ Rechaza |
| **Desbordamiento** | ❌ Vulnerable | ✅ Límites |
| **Campos requeridos** | ⚠️ Opcional | ✅ Obligatorio |

---

## 🚀 Próximos Pasos (Opcional)

### Rate Limiting
Limitar requests por IP para prevenir ataques de fuerza bruta:

```bash
npm install express-rate-limit
```

```javascript
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos
  message: 'Demasiados intentos de login, intenta más tarde'
});

app.post('/api/auth/login', loginLimiter, validateLogin, ...);
```

### Helmet.js
Headers de seguridad adicionales:

```bash
npm install helmet
```

```javascript
const helmet = require('helmet');
app.use(helmet());
```

### CSRF Protection
Para formularios:

```bash
npm install csurf
```

---

## ✅ Checklist de Seguridad

- [x] Contraseñas hasheadas con bcrypt
- [x] JWT tokens implementados
- [x] MongoDB como base de datos
- [x] Validación de todos los inputs
- [x] Sanitización contra NoSQL injection
- [x] Sanitización contra XSS
- [x] Límites de longitud en strings
- [x] Validación de tipos de datos
- [x] Validación de IDs de MongoDB
- [x] Mensajes de error informativos
- [x] Logs de intentos de inyección
- [ ] Rate limiting (opcional)
- [ ] Helmet.js (opcional)
- [ ] CSRF tokens (opcional)

---

## 📚 Referencias

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [express-validator Docs](https://express-validator.github.io/docs/)
- [NoSQL Injection](https://owasp.org/www-community/attacks/NoSQL_injection)
- [XSS Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)

---

**Estado:** ✅ **PRODUCCIÓN READY**  
**Fecha:** 25 de Noviembre, 2025  
**Nivel de Seguridad:** 🟢 Alto
