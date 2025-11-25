import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreateTournament from './CreateTournament';

describe('CreateTournament Component', () => {
  const mockOnCreate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renderiza el formulario correctamente', () => {
    render(<CreateTournament onCreate={mockOnCreate} />);
    
    expect(screen.getByText(/Crear Nuevo Torneo/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Nombre del torneo/i)).toBeInTheDocument();
    expect(screen.getByText(/Crear Torneo/i)).toBeInTheDocument();
  });

  test('campos tienen atributo required', () => {
    render(<CreateTournament onCreate={mockOnCreate} />);
    
    const nameInput = screen.getByPlaceholderText(/Nombre del torneo/i);
    expect(nameInput).toBeRequired();
  });

  test('permite llenar el formulario', () => {
    render(<CreateTournament onCreate={mockOnCreate} />);
    
    const nameInput = screen.getByPlaceholderText(/Nombre del torneo/i);
    const typeSelect = screen.getByRole('combobox');
    
    fireEvent.change(nameInput, { target: { value: 'Mi Torneo' } });
    fireEvent.change(typeSelect, { target: { value: 'round-robin' } });

    expect(nameInput.value).toBe('Mi Torneo');
    expect(typeSelect.value).toBe('round-robin');
  });

  test('muestra opciones de tipo de torneo', () => {
    render(<CreateTournament onCreate={mockOnCreate} />);
    
    expect(screen.getByText(/Eliminación Directa/i)).toBeInTheDocument();
    expect(screen.getByText(/Todos contra Todos/i)).toBeInTheDocument();
  });

  test('tiene botón de submit', () => {
    render(<CreateTournament onCreate={mockOnCreate} />);
    
    const submitButton = screen.getByText(/Crear Torneo/i);
    expect(submitButton).toHaveAttribute('type', 'submit');
  });

  test('llama onCreate al enviar el formulario', async () => {
    render(<CreateTournament onCreate={mockOnCreate} />);
    
    const nameInput = screen.getByPlaceholderText(/Nombre del torneo/i);
    const typeSelect = screen.getByRole('combobox');
    const submitButton = screen.getByText(/Crear Torneo/i);

    fireEvent.change(nameInput, { target: { value: 'Copa América' } });
    fireEvent.change(typeSelect, { target: { value: 'single-elimination' } });
    
    const form = submitButton.closest('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockOnCreate).toHaveBeenCalled();
    });
  });

  test('limpia el formulario después de crear', async () => {
    render(<CreateTournament onCreate={mockOnCreate} />);
    
    const nameInput = screen.getByPlaceholderText(/Nombre del torneo/i);
    const submitButton = screen.getByText(/Crear Torneo/i);

    fireEvent.change(nameInput, { target: { value: 'Test Torneo' } });
    
    const form = submitButton.closest('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(nameInput.value).toBe('');
    });
  });

  test('select tiene valor por defecto', () => {
    render(<CreateTournament onCreate={mockOnCreate} />);
    
    const typeSelect = screen.getByRole('combobox');
    expect(typeSelect.value).toBe('single-elimination');
  });

  test('permite cambiar entre tipos de torneo', () => {
    render(<CreateTournament onCreate={mockOnCreate} />);
    
    const typeSelect = screen.getByRole('combobox');
    
    fireEvent.change(typeSelect, { target: { value: 'round-robin' } });
    expect(typeSelect.value).toBe('round-robin');
    
    fireEvent.change(typeSelect, { target: { value: 'single-elimination' } });
    expect(typeSelect.value).toBe('single-elimination');
  });
});
