# Sistema de Gestión de Torneos - Autenticación

## 🔐 Credenciales de Acceso

### Administrador
- **Usuario:** `admin`
- **Contraseña:** `admin123`

## 📝 Características Implementadas

### Backend
✅ Rutas de autenticación:
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/verify` - Verificar token
- `POST /api/auth/logout` - Cerrar sesión

✅ Middleware de autenticación en todas las rutas administrativas:
- Crear/editar/eliminar torneos
- Crear/editar/eliminar equipos
- Gestionar partidos
- Iniciar torneos

### Frontend
✅ Pantalla de login con formulario seguro
✅ Almacenamiento de sesión en localStorage
✅ Verificación automática de token al cargar la app
✅ Botón de cerrar sesión en el header
✅ Protección de todas las rutas administrativas

## 🚀 Uso

1. Al abrir la aplicación, se mostrará la pantalla de login
2. Ingresa las credenciales del administrador
3. Una vez autenticado, tendrás acceso completo al panel de administración
4. La sesión se mantiene incluso al recargar la página
5. Usa el botón "🚪 Salir" para cerrar sesión

## 🔒 Seguridad

- Todas las operaciones de modificación requieren autenticación
- El token se valida en cada petición
- Las sesiones expiran al cerrar sesión
- Las credenciales se almacenan en `backend/data/users.json`

## 📋 Próximos Pasos

Para la **zona pública** (próxima implementación):
- Las rutas GET permanecerán públicas para consultar datos
- Se creará una vista pública sin autenticación para:
  - Ver próximos partidos
  - Tabla de posiciones
  - Tabla de goleadores
  - Tabla de tarjetas
