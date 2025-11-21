# Configurar Vista Pública para un Usuario Específico

## 📋 Instrucciones Paso a Paso

### 1. Obtener tu USER_ID

Para mostrar solo **tus torneos** en la vista pública, necesitas tu `userId`:

#### Opción A: Desde la Consola del Navegador (Panel Admin)
1. Abre el panel de administración (http://localhost:3000)
2. Inicia sesión con tu cuenta
3. Abre la consola del navegador (F12 → Consola)
4. Escribe: `localStorage.getItem('token')`
5. Copia el valor del token
6. El `userId` es la primera parte del token (antes del primer guión)

#### Opción B: Desde la Base de Datos
1. Conéctate a tu MongoDB
2. Ve a la colección `users`
3. Busca tu usuario por username
4. Copia el valor del campo `_id`

### 2. Configurar public-view

1. Abre el archivo: `public-view/config.js`
2. Edita la línea `USER_ID`:

```javascript
const CONFIG = {
    // Reemplaza con tu userId
    USER_ID: '673ec891461ab0d73e395870',  // <- Pega tu userId aquí
    
    API_BASE_URL: null
};
```

3. Guarda el archivo

### 3. Probar la Vista Pública

1. Asegúrate de que el backend esté corriendo: `http://localhost:3001`
2. Abre la vista pública: `http://localhost:5500`
3. Ahora solo verás **tus torneos** en el selector

## 🔧 Opciones de Configuración

### Mostrar TODOS los torneos (por defecto)
```javascript
const CONFIG = {
    USER_ID: '',  // Vacío = todos los torneos
    API_BASE_URL: null
};
```

### Mostrar solo torneos de un usuario
```javascript
const CONFIG = {
    USER_ID: '673ec891461ab0d73e395870',  // ID del usuario
    API_BASE_URL: null
};
```

### Usar un backend diferente
```javascript
const CONFIG = {
    USER_ID: '673ec891461ab0d73e395870',
    API_BASE_URL: 'https://mi-backend.com/api/public'
};
```

## 🚀 Deploy en Producción

Para producción, crea múltiples versiones del sitio:

1. **Sitio General** (todos los torneos):
   - `config.js` con `USER_ID: ''`

2. **Sitio Personal** (tus torneos):
   - `config.js` con tu `USER_ID`

3. **Sitio de Cliente** (torneos del cliente):
   - `config.js` con el `USER_ID` del cliente

## 📝 Ejemplo Completo

```javascript
// config.js para Juan Pérez
const CONFIG = {
    USER_ID: '673ec891461ab0d73e395870',
    API_BASE_URL: null
};
```

Ahora cuando abras `index.html`, solo verás los torneos creados por Juan Pérez.

## ❓ Preguntas Frecuentes

**P: ¿Cómo obtengo el userId de un cliente?**
R: Desde el panel admin, ve a la base de datos o pídele al cliente que te proporcione su token de sesión.

**P: ¿Puedo tener múltiples vistas públicas?**
R: Sí, copia la carpeta `public-view` con diferentes nombres y configura cada una con diferente `USER_ID`.

**P: ¿Funciona sin configurar USER_ID?**
R: Sí, mostrará TODOS los torneos de todos los usuarios.
