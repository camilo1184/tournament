# Vista Pública del Torneo

## 📋 Descripción

Vista pública y de solo lectura para que los participantes y espectadores puedan consultar la información del torneo en tiempo real.

## ✨ Características

### 🎯 Información Disponible

1. **📅 Próximos Partidos**
   - Visualización de los próximos 6 partidos
   - Estado del partido (pendiente, en juego, finalizado)
   - Logos y nombres de equipos
   - Resultados para partidos finalizados

2. **📊 Tabla de Posiciones**
   - Posición de cada equipo
   - Partidos jugados, ganados, empatados, perdidos
   - Goles a favor, goles en contra, diferencia de goles
   - Puntos totales
   - Ordenamiento automático

3. **⚽ Tabla de Goleadores**
   - Top 20 goleadores del torneo
   - Foto del jugador (si está disponible)
   - Equipo al que pertenece
   - Total de goles anotados

4. **🟨🟥 Tabla de Tarjetas**
   - Top 20 jugadores con más tarjetas
   - Tarjetas amarillas y rojas
   - Total de tarjetas por jugador

## 🚀 Cómo Usar

### 1. Abrir en Navegador

Simplemente abre el archivo `index.html` en tu navegador:

```
e:\Camilo\Proyectos\tournament\public-view\index.html
```

O usa Live Server si tienes VS Code:
1. Click derecho en `index.html`
2. Selecciona "Open with Live Server"

### 2. Seleccionar Torneo

- Usa el selector en la parte superior para elegir el torneo que deseas visualizar
- Los datos se actualizan automáticamente cada 30 segundos

## 🔧 Configuración

### Cambiar URL del API

Si tu backend está en un puerto diferente, edita `js/app.js`:

```javascript
const API_URL = 'http://localhost:3001/api'; // Cambia el puerto aquí
```

## 📱 Responsive

La vista pública es completamente responsive y se adapta a:
- 💻 Desktop
- 📱 Tablets
- 📲 Móviles

## 🎨 Personalización

### Colores

Los colores se definen en `css/styles.css` usando variables CSS:

```css
:root {
    --primary-color: #667eea;
    --secondary-color: #764ba2;
    --success-color: #10b981;
    --danger-color: #ef4444;
    --warning-color: #f59e0b;
}
```

## 🔄 Actualización Automática

Los datos se actualizan automáticamente cada 30 segundos sin necesidad de recargar la página.

## 📂 Estructura de Archivos

```
public-view/
├── index.html          # Página principal
├── css/
│   └── styles.css      # Estilos
└── js/
    └── app.js          # Lógica de la aplicación
```

## 🔒 Seguridad

- Esta vista es de **solo lectura**
- No requiere autenticación
- No permite modificar datos
- Consume únicamente endpoints GET del backend

## 🌐 Despliegue

Para desplegar en un servidor web:

1. Copia toda la carpeta `public-view` a tu servidor
2. Configura la URL del API en `js/app.js`
3. Asegúrate de que el backend permita CORS desde el dominio público

## 💡 Características Técnicas

- ✅ Vanilla JavaScript (sin frameworks)
- ✅ CSS moderno con gradientes y animaciones
- ✅ Fetch API para consumir datos
- ✅ Actualización automática
- ✅ Manejo de errores
- ✅ Loading states
- ✅ Diseño responsive
