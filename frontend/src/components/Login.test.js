import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from './Login';

global.fetch = jest.fn();

describe('Login Component', () => {
  const mockOnLogin = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockClear();
    localStorage.clear();
  });

  test('renderiza el formulario de login', () => {
    render(<Login onLogin={mockOnLogin} />);
    
    expect(screen.getByPlaceholderText(/Usuario/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Contraseña/i)).toBeInTheDocument();
    expect(screen.getByText(/Iniciar Sesión/i)).toBeInTheDocument();
  });

  test('permite escribir en los campos', () => {
    render(<Login onLogin={mockOnLogin} />);
    
    const usernameInput = screen.getByPlaceholderText(/Usuario/i);
    const passwordInput = screen.getByPlaceholderText(/Contraseña/i);
    
    fireEvent.change(usernameInput, { target: { value: 'admin' } });
    fireEvent.change(passwordInput, { target: { value: 'admin123' } });

    expect(usernameInput.value).toBe('admin');
    expect(passwordInput.value).toBe('admin123');
  });

  test('login exitoso guarda token y llama onLogin', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        token: 'test-token-123',
        user: { id: '1', username: 'admin', role: 'admin' }
      })
    });

    render(<Login onLogin={mockOnLogin} />);
    
    const usernameInput = screen.getByPlaceholderText(/Usuario/i);
    const passwordInput = screen.getByPlaceholderText(/Contraseña/i);
    const submitButton = screen.getByText(/Iniciar Sesión/i);

    fireEvent.change(usernameInput, { target: { value: 'admin' } });
    fireEvent.change(passwordInput, { target: { value: 'admin123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      // onLogin recibe token y user como parámetros separados
      expect(mockOnLogin).toHaveBeenCalledWith(
        'test-token-123',
        { id: '1', username: 'admin', role: 'admin' }
      );
    });
  });

  test('muestra error cuando las credenciales son incorrectas', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Credenciales inválidas' })
    });

    render(<Login onLogin={mockOnLogin} />);
    
    const usernameInput = screen.getByPlaceholderText(/Usuario/i);
    const passwordInput = screen.getByPlaceholderText(/Contraseña/i);
    const submitButton = screen.getByText(/Iniciar Sesión/i);

    fireEvent.change(usernameInput, { target: { value: 'wrong' } });
    fireEvent.change(passwordInput, { target: { value: 'wrong' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Credenciales inválidas/i)).toBeInTheDocument();
    });
  });

  test('muestra error de red cuando falla la conexión', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));

    render(<Login onLogin={mockOnLogin} />);
    
    const usernameInput = screen.getByPlaceholderText(/Usuario/i);
    const passwordInput = screen.getByPlaceholderText(/Contraseña/i);
    const submitButton = screen.getByText(/Iniciar Sesión/i);

    fireEvent.change(usernameInput, { target: { value: 'admin' } });
    fireEvent.change(passwordInput, { target: { value: 'admin123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Error de conexión/i)).toBeInTheDocument();
    });
  });

  test('deshabilita el botón durante el login', async () => {
    fetch.mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ token: 'test-token', user: {} })
      }), 100))
    );

    render(<Login onLogin={mockOnLogin} />);
    
    const usernameInput = screen.getByPlaceholderText(/Usuario/i);
    const passwordInput = screen.getByPlaceholderText(/Contraseña/i);
    const submitButton = screen.getByText(/Iniciar Sesión/i);

    fireEvent.change(usernameInput, { target: { value: 'admin' } });
    fireEvent.change(passwordInput, { target: { value: 'admin123' } });
    fireEvent.click(submitButton);

    // El botón debe estar deshabilitado durante la carga
    expect(submitButton).toBeDisabled();

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  test('campos son requeridos', () => {
    render(<Login onLogin={mockOnLogin} />);
    
    const usernameInput = screen.getByPlaceholderText(/Usuario/i);
    const passwordInput = screen.getByPlaceholderText(/Contraseña/i);

    expect(usernameInput).toBeRequired();
    expect(passwordInput).toBeRequired();
  });

  test('campo de contraseña es tipo password', () => {
    render(<Login onLogin={mockOnLogin} />);
    
    const passwordInput = screen.getByPlaceholderText(/Contraseña/i);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });
});
