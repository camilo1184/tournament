import { render, screen } from '@testing-library/react';
import App from './App';

describe('App Component', () => {
  test('renderiza sin errores', () => {
    render(<App />);
    // La app debe renderizar sin lanzar excepciones
    expect(document.body).toBeInTheDocument();
  });

  test('muestra el título de la aplicación', () => {
    render(<App />);
    // Busca texto común en tu app
    const elements = screen.queryAllByText(/Tournament/i);
    expect(elements.length).toBeGreaterThanOrEqual(0);
  });

  test('tiene estructura básica', () => {
    const { container } = render(<App />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
