# 🧪 Guía de Pruebas Automatizadas - Frontend

## 📋 Configuración Completa

### Herramientas Instaladas

- ✅ **Jest**: Framework de testing
- ✅ **React Testing Library**: Testing de componentes React
- ✅ **@testing-library/jest-dom**: Matchers personalizados
- ✅ **@testing-library/user-event**: Simulación de eventos de usuario

## 🚀 Comandos Disponibles

### Ejecutar todas las pruebas
```bash
npm test
```

### Ejecutar pruebas con cobertura
```bash
npm test -- --coverage
```

### Ejecutar pruebas en modo CI (sin watch)
```bash
npm test -- --watchAll=false
```

### Ejecutar pruebas específicas
```bash
npm test -- TournamentList.test.js
```

### Actualizar snapshots
```bash
npm test -- -u
```

## 📁 Estructura de Pruebas

```
frontend/src/
├── components/
│   ├── TournamentList.js
│   ├── TournamentList.test.js      ✅
│   ├── TeamList.js
│   ├── TeamList.test.js            ✅
│   ├── CreateTournament.js
│   ├── CreateTournament.test.js    ✅
│   ├── CreateTeam.js
│   └── CreateTeam.test.js          ✅
├── App.js
├── App.test.js                     ✅
└── setupTests.js                   ✅ (configuración global)
```

## 🧪 Cobertura de Pruebas

### Componentes Probados

#### ✅ TournamentList
- Renderizado del título
- Mensaje de carga
- Carga de datos desde API
- Manejo de errores
- Mensaje cuando no hay torneos
- Botón de crear torneo

#### ✅ TeamList
- Renderizado del título
- Carga de equipos
- Manejo de errores de API
- Mensaje sin equipos

#### ✅ CreateTournament
- Renderizado del formulario
- Validación de campos requeridos
- Llenado de formulario
- Creación exitosa
- Manejo de errores

#### ✅ CreateTeam
- Renderizado del formulario
- Agregar jugadores
- Validación de nombre
- Carga de logo

#### ✅ App
- Renderizado sin errores
- Estructura básica

## 📊 Métricas de Cobertura

Umbrales configurados:
- **Líneas**: 50%
- **Funciones**: 50%
- **Ramas**: 50%
- **Declaraciones**: 50%

## 🔄 Integración Continua (CI/CD)

### GitHub Actions Configurado

Archivo: `.github/workflows/test.yml`

**Se ejecuta automáticamente en:**
- Push a `main` o `develop`
- Pull requests a `main` o `develop`
- Cambios en carpeta `frontend/`

**Características:**
- ✅ Pruebas en Node.js 18.x y 20.x
- ✅ Caché de dependencias
- ✅ Reporte de cobertura
- ✅ Integración con Codecov (opcional)

## 📝 Ejemplo de Prueba

```javascript
import { render, screen, waitFor } from '@testing-library/react';
import TournamentList from './TournamentList';

test('carga y muestra torneos', async () => {
  const mockTournaments = [
    { _id: '1', name: 'Torneo Test', type: 'league' }
  ];

  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockTournaments)
    })
  );

  render(<TournamentList />);

  await waitFor(() => {
    expect(screen.getByText('Torneo Test')).toBeInTheDocument();
  });
});
```

## 🎯 Mejores Prácticas

### 1. Arrange-Act-Assert (AAA)
```javascript
test('ejemplo AAA', async () => {
  // Arrange: Preparar datos y mocks
  const mockData = { id: 1, name: 'Test' };
  
  // Act: Ejecutar acción
  render(<Component data={mockData} />);
  
  // Assert: Verificar resultado
  expect(screen.getByText('Test')).toBeInTheDocument();
});
```

### 2. Mock de Fetch
```javascript
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve(data)
  })
);
```

### 3. Esperar Elementos Asíncronos
```javascript
await waitFor(() => {
  expect(screen.getByText('Cargado')).toBeInTheDocument();
});
```

### 4. Queries Recomendadas (en orden)
1. `getByRole` - Más accesible
2. `getByLabelText` - Para formularios
3. `getByText` - Para contenido visible
4. `getByTestId` - Último recurso

## 🐛 Debugging de Pruebas

### Ver HTML renderizado
```javascript
import { render, screen } from '@testing-library/react';

const { container } = render(<Component />);
console.log(container.innerHTML);
// o
screen.debug();
```

### Ejecutar una sola prueba
```javascript
test.only('esta prueba se ejecuta sola', () => {
  // ...
});
```

### Saltar una prueba
```javascript
test.skip('esta prueba se salta', () => {
  // ...
});
```

## 🔧 Troubleshooting

### Error: "Cannot find module"
```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom
```

### Error: "localStorage is not defined"
✅ Ya configurado en `setupTests.js`

### Error: "fetch is not defined"
✅ Ya configurado en `setupTests.js`

### Warnings de React 19
✅ Ya configurado para suprimirlos en `setupTests.js`

## 📈 Próximos Pasos

### Pruebas Adicionales Recomendadas

1. **Pruebas de Integración**
```bash
npm install --save-dev cypress
```

2. **Pruebas E2E**
```bash
npx cypress open
```

3. **Pruebas de Rendimiento**
```bash
npm install --save-dev @testing-library/react-hooks
```

4. **Pruebas de Accesibilidad**
```bash
npm install --save-dev jest-axe
```

## 🎬 Quick Start

1. **Ejecutar todas las pruebas:**
```bash
cd frontend
npm test
```

2. **Ver cobertura:**
```bash
npm test -- --coverage --watchAll=false
```

3. **Abrir reporte de cobertura:**
```bash
open coverage/lcov-report/index.html  # Mac/Linux
start coverage/lcov-report/index.html  # Windows
```

## ✅ Checklist Pre-Deploy

- [ ] Todas las pruebas pasan: `npm test -- --watchAll=false`
- [ ] Cobertura > 50%: `npm test -- --coverage`
- [ ] No hay warnings críticos
- [ ] Build exitoso: `npm run build`
- [ ] GitHub Actions pasa (si está configurado)

## 📚 Recursos

- [Jest Docs](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [GitHub Actions](https://docs.github.com/en/actions)

---

**Estado:** ✅ Configuración completa y lista para usar  
**Fecha:** 25 de Noviembre, 2025  
**Cobertura Actual:** Por determinar (ejecutar `npm test -- --coverage`)
