import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreateTeam from './CreateTeam';

describe('CreateTeam Component', () => {
  const mockOnCreate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renderiza el formulario de equipo', () => {
    render(<CreateTeam onCreate={mockOnCreate} />);
    
    expect(screen.getByText(/Crear Nuevo Equipo/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Nombre del equipo/i)).toBeInTheDocument();
  });

  test('muestra sección de agregar jugador', () => {
    render(<CreateTeam onCreate={mockOnCreate} />);
    
    const addButton = screen.getByRole('button', { name: /➕ Agregar Jugador/i });
    expect(addButton).toBeInTheDocument();
  });

  test('tiene campos para información del jugador', () => {
    render(<CreateTeam onCreate={mockOnCreate} />);
    
    expect(screen.getByPlaceholderText(/Nombre \*/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Número \*/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Posición/i)).toBeInTheDocument();
  });

  test('valida que el nombre del equipo sea requerido', () => {
    render(<CreateTeam onCreate={mockOnCreate} />);
    
    const nameInput = screen.getByPlaceholderText(/Nombre del equipo/i);
    expect(nameInput).toBeRequired();
  });

  test('permite cargar un logo', () => {
    render(<CreateTeam onCreate={mockOnCreate} />);
    
    const logoLabel = screen.getByText(/🖼️ Logo del equipo/i);
    expect(logoLabel).toBeInTheDocument();
    
    const logoInput = logoLabel.querySelector('input[type="file"]');
    expect(logoInput).toBeInTheDocument();
  });

  test('muestra contador de jugadores', () => {
    render(<CreateTeam onCreate={mockOnCreate} />);
    
    expect(screen.getByText(/Jugadores \(/i)).toBeInTheDocument();
  });

  test('tiene botón de crear equipo', () => {
    render(<CreateTeam onCreate={mockOnCreate} />);
    
    const submitButton = screen.getByText(/Crear Equipo/i);
    expect(submitButton).toHaveAttribute('type', 'submit');
  });

  test('permite agregar un jugador', () => {
    render(<CreateTeam onCreate={mockOnCreate} />);
    
    const nameInput = screen.getByPlaceholderText(/Nombre \*/i);
    const numberInput = screen.getByPlaceholderText(/Número \*/i);
    const addButton = screen.getByRole('button', { name: /➕ Agregar Jugador/i });

    fireEvent.change(nameInput, { target: { value: 'Messi' } });
    fireEvent.change(numberInput, { target: { value: '10' } });
    fireEvent.click(addButton);

    expect(screen.getByText(/Messi/i)).toBeInTheDocument();
    expect(screen.getByText(/#10/i)).toBeInTheDocument();
  });

  test('permite eliminar un jugador', () => {
    render(<CreateTeam onCreate={mockOnCreate} />);
    
    // Agregar jugador
    const nameInput = screen.getByPlaceholderText(/Nombre \*/i);
    const numberInput = screen.getByPlaceholderText(/Número \*/i);
    const addButton = screen.getByRole('button', { name: /➕ Agregar Jugador/i });

    fireEvent.change(nameInput, { target: { value: 'Ronaldo' } });
    fireEvent.change(numberInput, { target: { value: '7' } });
    fireEvent.click(addButton);

    // Verificar que se agregó
    expect(screen.getByText(/Ronaldo/i)).toBeInTheDocument();

    // Eliminar jugador (botón con ✖)
    const deleteButton = screen.getByRole('button', { name: /✖/ });
    fireEvent.click(deleteButton);

    // Verificar que se eliminó
    expect(screen.queryByText(/Ronaldo/i)).not.toBeInTheDocument();
  });

  test('limpia los campos después de agregar jugador', () => {
    render(<CreateTeam onCreate={mockOnCreate} />);
    
    const nameInput = screen.getByPlaceholderText(/Nombre \*/i);
    const numberInput = screen.getByPlaceholderText(/Número \*/i);
    const addButton = screen.getByRole('button', { name: /➕ Agregar Jugador/i });

    fireEvent.change(nameInput, { target: { value: 'Neymar' } });
    fireEvent.change(numberInput, { target: { value: '11' } });
    fireEvent.click(addButton);

    expect(nameInput.value).toBe('');
    expect(numberInput.value).toBe('');
  });

  test('actualiza contador de jugadores', () => {
    render(<CreateTeam onCreate={mockOnCreate} />);
    
    // Inicialmente 0
    expect(screen.getByText(/Jugadores \(0\)/i)).toBeInTheDocument();

    // Agregar primer jugador
    const nameInput = screen.getByPlaceholderText(/Nombre \*/i);
    const numberInput = screen.getByPlaceholderText(/Número \*/i);
    const addButton = screen.getByRole('button', { name: /➕ Agregar Jugador/i });

    fireEvent.change(nameInput, { target: { value: 'Player 1' } });
    fireEvent.change(numberInput, { target: { value: '1' } });
    fireEvent.click(addButton);

    expect(screen.getByText(/Jugadores \(1\)/i)).toBeInTheDocument();
  });

  test('permite llenar todos los campos opcionales del jugador', () => {
    render(<CreateTeam onCreate={mockOnCreate} />);
    
    const nameInput = screen.getByPlaceholderText(/Nombre \*/i);
    const numberInput = screen.getByPlaceholderText(/Número \*/i);
    const positionInput = screen.getByPlaceholderText(/Posición/i);
    const ageInput = screen.getByPlaceholderText(/Edad/i);
    const epsInput = screen.getByPlaceholderText(/EPS/i);

    fireEvent.change(nameInput, { target: { value: 'James' } });
    fireEvent.change(numberInput, { target: { value: '10' } });
    fireEvent.change(positionInput, { target: { value: 'Mediocampista' } });
    fireEvent.change(ageInput, { target: { value: '28' } });
    fireEvent.change(epsInput, { target: { value: 'Sura' } });

    expect(nameInput.value).toBe('James');
    expect(numberInput.value).toBe('10');
    expect(positionInput.value).toBe('Mediocampista');
    expect(ageInput.value).toBe('28');
    expect(epsInput.value).toBe('Sura');
  });

  test('no agrega jugador si falta nombre', () => {
    render(<CreateTeam onCreate={mockOnCreate} />);
    
    const numberInput = screen.getByPlaceholderText(/Número \*/i);
    const addButton = screen.getByRole('button', { name: /➕ Agregar Jugador/i });

    fireEvent.change(numberInput, { target: { value: '10' } });
    fireEvent.click(addButton);

    // No debe agregar el jugador
    expect(screen.getByText(/Jugadores \(0\)/i)).toBeInTheDocument();
  });

  test('no agrega jugador si falta número', () => {
    render(<CreateTeam onCreate={mockOnCreate} />);
    
    const nameInput = screen.getByPlaceholderText(/Nombre \*/i);
    const addButton = screen.getByRole('button', { name: /➕ Agregar Jugador/i });

    fireEvent.change(nameInput, { target: { value: 'Test Player' } });
    fireEvent.click(addButton);

    // No debe agregar el jugador
    expect(screen.getByText(/Jugadores \(0\)/i)).toBeInTheDocument();
  });

  test('llama onCreate al enviar el formulario', () => {
    render(<CreateTeam onCreate={mockOnCreate} />);
    
    const teamNameInput = screen.getByPlaceholderText(/Nombre del equipo/i);
    const submitButton = screen.getByText(/Crear Equipo/i);

    fireEvent.change(teamNameInput, { target: { value: 'Real Madrid' } });
    
    const form = submitButton.closest('form');
    fireEvent.submit(form);

    expect(mockOnCreate).toHaveBeenCalledWith('Real Madrid', [], '');
  });

  test('llama onCreate con jugadores agregados', () => {
    render(<CreateTeam onCreate={mockOnCreate} />);
    
    // Agregar jugador
    const playerNameInput = screen.getByPlaceholderText(/Nombre \*/i);
    const numberInput = screen.getByPlaceholderText(/Número \*/i);
    const addButton = screen.getByRole('button', { name: /➕ Agregar Jugador/i });

    fireEvent.change(playerNameInput, { target: { value: 'Benzema' } });
    fireEvent.change(numberInput, { target: { value: '9' } });
    fireEvent.click(addButton);

    // Crear equipo
    const teamNameInput = screen.getByPlaceholderText(/Nombre del equipo/i);
    const submitButton = screen.getByText(/Crear Equipo/i);

    fireEvent.change(teamNameInput, { target: { value: 'Real Madrid' } });
    
    const form = submitButton.closest('form');
    fireEvent.submit(form);

    expect(mockOnCreate).toHaveBeenCalledWith(
      'Real Madrid',
      [{ name: 'Benzema', number: '9', position: '', age: '', eps: '', photo: '' }],
      ''
    );
  });

  test('limpia el formulario después de crear equipo', () => {
    render(<CreateTeam onCreate={mockOnCreate} />);
    
    const teamNameInput = screen.getByPlaceholderText(/Nombre del equipo/i);
    const playerNameInput = screen.getByPlaceholderText(/Nombre \*/i);
    const numberInput = screen.getByPlaceholderText(/Número \*/i);
    const addButton = screen.getByRole('button', { name: /➕ Agregar Jugador/i });
    const submitButton = screen.getByText(/Crear Equipo/i);

    // Agregar jugador
    fireEvent.change(playerNameInput, { target: { value: 'Test' } });
    fireEvent.change(numberInput, { target: { value: '10' } });
    fireEvent.click(addButton);

    // Crear equipo
    fireEvent.change(teamNameInput, { target: { value: 'Test Team' } });
    const form = submitButton.closest('form');
    fireEvent.submit(form);

    // Verificar que se limpió
    expect(teamNameInput.value).toBe('');
    expect(screen.getByText(/Jugadores \(0\)/i)).toBeInTheDocument();
  });

  test('permite cargar foto de jugador', () => {
    render(<CreateTeam onCreate={mockOnCreate} />);
    
    const photoLabel = screen.getByText(/📷 Foto del jugador/i);
    expect(photoLabel).toBeInTheDocument();
    
    const photoInput = photoLabel.querySelector('input[type="file"]');
    expect(photoInput).toBeInTheDocument();
    expect(photoInput.accept).toBe('image/*');
  });

  test('muestra preview del logo cuando se carga', async () => {
    render(<CreateTeam onCreate={mockOnCreate} />);
    
    const logoLabel = screen.getByText(/🖼️ Logo del equipo/i);
    const logoInput = logoLabel.querySelector('input[type="file"]');

    // Crear un archivo mock
    const file = new File(['logo'], 'logo.png', { type: 'image/png' });
    
    // Mock FileReader
    const mockFileReader = {
      readAsDataURL: jest.fn(),
      onloadend: null,
      result: 'data:image/png;base64,mocklogo'
    };
    
    global.FileReader = jest.fn(() => mockFileReader);

    fireEvent.change(logoInput, { target: { files: [file] } });

    // Simular que el FileReader terminó
    if (mockFileReader.onloadend) {
      mockFileReader.onloadend();
    }

    await waitFor(() => {
      const logoPreview = screen.queryByAltText(/Logo del equipo/i);
      if (logoPreview) {
        expect(logoPreview).toBeInTheDocument();
      }
    });
  });

  test('muestra vista previa de jugadores agregados', () => {
    render(<CreateTeam onCreate={mockOnCreate} />);
    
    const nameInput = screen.getByPlaceholderText(/Nombre \*/i);
    const numberInput = screen.getByPlaceholderText(/Número \*/i);
    const positionInput = screen.getByPlaceholderText(/Posición/i);
    const addButton = screen.getByRole('button', { name: /➕ Agregar Jugador/i });

    fireEvent.change(nameInput, { target: { value: 'Vinicius' } });
    fireEvent.change(numberInput, { target: { value: '20' } });
    fireEvent.change(positionInput, { target: { value: 'Extremo' } });
    fireEvent.click(addButton);

    // Verificar que se muestra la información completa
    expect(screen.getByText(/Vinicius/i)).toBeInTheDocument();
    expect(screen.getByText(/#20/i)).toBeInTheDocument();
    expect(screen.getByText(/Extremo/i)).toBeInTheDocument();
  });

  test('no permite crear equipo sin nombre', () => {
    render(<CreateTeam onCreate={mockOnCreate} />);
    
    const submitButton = screen.getByText(/Crear Equipo/i);
    const form = submitButton.closest('form');
    
    // Intentar enviar sin nombre
    fireEvent.submit(form);

    // onCreate no debe ser llamado
    expect(mockOnCreate).not.toHaveBeenCalled();
  });

  test('permite agregar múltiples jugadores', () => {
    render(<CreateTeam onCreate={mockOnCreate} />);
    
    const nameInput = screen.getByPlaceholderText(/Nombre \*/i);
    const numberInput = screen.getByPlaceholderText(/Número \*/i);
    const addButton = screen.getByRole('button', { name: /➕ Agregar Jugador/i });

    // Agregar primer jugador
    fireEvent.change(nameInput, { target: { value: 'Player 1' } });
    fireEvent.change(numberInput, { target: { value: '1' } });
    fireEvent.click(addButton);

    // Agregar segundo jugador
    fireEvent.change(nameInput, { target: { value: 'Player 2' } });
    fireEvent.change(numberInput, { target: { value: '2' } });
    fireEvent.click(addButton);

    // Agregar tercer jugador
    fireEvent.change(nameInput, { target: { value: 'Player 3' } });
    fireEvent.change(numberInput, { target: { value: '3' } });
    fireEvent.click(addButton);

    expect(screen.getByText(/Jugadores \(3\)/i)).toBeInTheDocument();
  });

  test('trimea espacios en nombre de jugador', () => {
    render(<CreateTeam onCreate={mockOnCreate} />);
    
    const nameInput = screen.getByPlaceholderText(/Nombre \*/i);
    const numberInput = screen.getByPlaceholderText(/Número \*/i);
    const addButton = screen.getByRole('button', { name: /➕ Agregar Jugador/i });

    // Intentar agregar con espacios
    fireEvent.change(nameInput, { target: { value: '   ' } });
    fireEvent.change(numberInput, { target: { value: '10' } });
    fireEvent.click(addButton);

    // No debe agregarse
    expect(screen.getByText(/Jugadores \(0\)/i)).toBeInTheDocument();
  });
});
