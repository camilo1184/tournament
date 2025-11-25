import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TeamList from './TeamList';

describe('TeamList Component', () => {
  const mockTeams = [
    {
      _id: '1',
      name: 'Equipo Test',
      logo: 'data:image/png;base64,test',
      players: [
        { name: 'Jugador 1', number: 10, position: 'Delantero' }
      ]
    },
    {
      _id: '2',
      name: 'Equipo Test 2',
      logo: '',
      players: [
        { name: 'Jugador A', number: 5, position: 'Defensa' },
        { name: 'Jugador B', number: 7, position: 'Mediocampista' }
      ]
    }
  ];

  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnCreateNew = jest.fn();
  const mockAuthenticatedFetch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renderiza con equipos correctamente', () => {
    render(
      <TeamList 
        teams={mockTeams}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onCreateNew={mockOnCreateNew}
        authenticatedFetch={mockAuthenticatedFetch}
      />
    );
    
    expect(screen.getByText('Equipo Test')).toBeInTheDocument();
    expect(screen.getByText(/1 jugador/i)).toBeInTheDocument();
  });

  test('muestra mensaje cuando no hay equipos', () => {
    render(
      <TeamList 
        teams={[]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onCreateNew={mockOnCreateNew}
        authenticatedFetch={mockAuthenticatedFetch}
      />
    );

    expect(screen.getByText(/No hay equipos creados/i)).toBeInTheDocument();
  });

  test('muestra botones de editar y eliminar', () => {
    render(
      <TeamList 
        teams={mockTeams}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onCreateNew={mockOnCreateNew}
        authenticatedFetch={mockAuthenticatedFetch}
      />
    );
    
    const editButtons = screen.getAllByRole('button', { name: /✏️/ });
    const deleteButtons = screen.getAllByRole('button', { name: /🗑️/ });
    
    expect(editButtons.length).toBeGreaterThan(0);
    expect(deleteButtons.length).toBeGreaterThan(0);
  });

  test('muestra información de jugadores', () => {
    render(
      <TeamList 
        teams={mockTeams}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onCreateNew={mockOnCreateNew}
        authenticatedFetch={mockAuthenticatedFetch}
      />
    );
    
    expect(screen.getByText(/Jugador 1/i)).toBeInTheDocument();
    expect(screen.getByText(/#10/i)).toBeInTheDocument();
  });

  test('muestra botón de crear equipo', () => {
    render(
      <TeamList 
        teams={[]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onCreateNew={mockOnCreateNew}
        authenticatedFetch={mockAuthenticatedFetch}
      />
    );
    
    const createButton = screen.getByText(/Crear Equipo/i);
    expect(createButton).toBeInTheDocument();
  });

  test('llama onCreateNew al hacer click en crear', () => {
    render(
      <TeamList 
        teams={[]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onCreateNew={mockOnCreateNew}
        authenticatedFetch={mockAuthenticatedFetch}
      />
    );
    
    const createButton = screen.getByText(/Crear Equipo/i);
    fireEvent.click(createButton);
    
    expect(mockOnCreateNew).toHaveBeenCalled();
  });

  test('botones de editar son clicables', () => {
    render(
      <TeamList 
        teams={mockTeams}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onCreateNew={mockOnCreateNew}
        authenticatedFetch={mockAuthenticatedFetch}
      />
    );
    
    const editButtons = screen.getAllByRole('button', { name: /✏️/ });
    expect(editButtons.length).toBeGreaterThan(0);
    expect(editButtons[0]).toBeEnabled();
  });

  test('botones de eliminar son clicables', () => {
    render(
      <TeamList 
        teams={mockTeams}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onCreateNew={mockOnCreateNew}
        authenticatedFetch={mockAuthenticatedFetch}
      />
    );
    
    const deleteButtons = screen.getAllByRole('button', { name: /🗑️/ });
    expect(deleteButtons[0]).toBeEnabled();
    fireEvent.click(deleteButtons[0]);
    
    // Verifica que window.confirm fue llamado
    expect(global.confirm).toHaveBeenCalled();
  });

  test('permite buscar equipos', () => {
    render(
      <TeamList 
        teams={mockTeams}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onCreateNew={mockOnCreateNew}
        authenticatedFetch={mockAuthenticatedFetch}
      />
    );
    
    const searchInput = screen.getByPlaceholderText(/Buscar equipo/i);
    expect(searchInput).toBeInTheDocument();
    
    fireEvent.change(searchInput, { target: { value: 'Test' } });
    expect(searchInput.value).toBe('Test');
  });

  test('muestra múltiples equipos', () => {
    render(
      <TeamList 
        teams={mockTeams}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onCreateNew={mockOnCreateNew}
        authenticatedFetch={mockAuthenticatedFetch}
      />
    );
    
    expect(screen.getByText('Equipo Test')).toBeInTheDocument();
    expect(screen.getByText('Equipo Test 2')).toBeInTheDocument();
  });

  test('muestra conteo correcto de jugadores', () => {
    render(
      <TeamList 
        teams={mockTeams}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onCreateNew={mockOnCreateNew}
        authenticatedFetch={mockAuthenticatedFetch}
      />
    );
    
    expect(screen.getByText(/1 jugador/i)).toBeInTheDocument();
    expect(screen.getByText(/2 jugadores/i)).toBeInTheDocument();
  });

  test('abre modal de edición al hacer click en editar', () => {
    render(
      <TeamList 
        teams={mockTeams}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onCreateNew={mockOnCreateNew}
        authenticatedFetch={mockAuthenticatedFetch}
      />
    );
    
    const editButtons = screen.getAllByRole('button', { name: /✏️/ });
    fireEvent.click(editButtons[0]);
    
    // Debe mostrar el formulario de edición
    expect(screen.getByText(/✏️ Editar Equipo/i)).toBeInTheDocument();
  });

  test('permite editar nombre del equipo', () => {
    render(
      <TeamList 
        teams={mockTeams}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onCreateNew={mockOnCreateNew}
        authenticatedFetch={mockAuthenticatedFetch}
      />
    );
    
    // Abrir modal de edición
    const editButtons = screen.getAllByRole('button', { name: /✏️/ });
    fireEvent.click(editButtons[0]);
    
    // Cambiar nombre
    const nameInput = screen.getByPlaceholderText(/Nombre del equipo/i);
    fireEvent.change(nameInput, { target: { value: 'Nuevo Nombre' } });
    
    expect(nameInput.value).toBe('Nuevo Nombre');
  });

  test('permite cancelar edición', () => {
    render(
      <TeamList 
        teams={mockTeams}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onCreateNew={mockOnCreateNew}
        authenticatedFetch={mockAuthenticatedFetch}
      />
    );
    
    // Abrir modal de edición
    const editButtons = screen.getAllByRole('button', { name: /✏️/ });
    fireEvent.click(editButtons[0]);
    
    // Debe haber botón de cancelar
    const cancelButton = screen.getByText(/Cancelar/i);
    expect(cancelButton).toBeInTheDocument();
    
    fireEvent.click(cancelButton);
    
    // Debe volver a la lista
    expect(screen.queryByText(/✏️ Editar Equipo/i)).not.toBeInTheDocument();
  });

  test('permite guardar cambios del equipo', async () => {
    mockAuthenticatedFetch.mockResolvedValueOnce({ ok: true });
    
    render(
      <TeamList 
        teams={mockTeams}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onCreateNew={mockOnCreateNew}
        authenticatedFetch={mockAuthenticatedFetch}
      />
    );
    
    // Abrir modal de edición
    const editButtons = screen.getAllByRole('button', { name: /✏️/ });
    fireEvent.click(editButtons[0]);
    
    // Cambiar nombre
    const nameInput = screen.getByPlaceholderText(/Nombre del equipo/i);
    fireEvent.change(nameInput, { target: { value: 'Nuevo Nombre' } });
    
    // Guardar
    const saveButton = screen.getByText(/💾 Guardar Cambios/i);
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(mockAuthenticatedFetch).toHaveBeenCalled();
      expect(mockOnEdit).toHaveBeenCalled();
    });
  });

  test('filtra equipos por búsqueda', () => {
    render(
      <TeamList 
        teams={mockTeams}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onCreateNew={mockOnCreateNew}
        authenticatedFetch={mockAuthenticatedFetch}
      />
    );
    
    const searchInput = screen.getByPlaceholderText(/Buscar equipo/i);
    
    // Buscar "Equipo Test 2"
    fireEvent.change(searchInput, { target: { value: 'Test 2' } });
    
    // Solo debe mostrar Equipo Test 2
    expect(screen.getByText('Equipo Test 2')).toBeInTheDocument();
    expect(screen.queryByText('Equipo Test')).not.toBeInTheDocument();
  });

  test('muestra todos los equipos cuando búsqueda está vacía', () => {
    render(
      <TeamList 
        teams={mockTeams}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onCreateNew={mockOnCreateNew}
        authenticatedFetch={mockAuthenticatedFetch}
      />
    );
    
    const searchInput = screen.getByPlaceholderText(/Buscar equipo/i);
    
    // Buscar algo
    fireEvent.change(searchInput, { target: { value: 'Test 2' } });
    
    // Limpiar búsqueda
    fireEvent.change(searchInput, { target: { value: '' } });
    
    // Debe mostrar todos
    expect(screen.getByText('Equipo Test')).toBeInTheDocument();
    expect(screen.getByText('Equipo Test 2')).toBeInTheDocument();
  });

  test('permite agregar nuevo jugador al equipo', () => {
    render(
      <TeamList 
        teams={mockTeams}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onCreateNew={mockOnCreateNew}
        authenticatedFetch={mockAuthenticatedFetch}
      />
    );
    
    // Abrir modal de edición
    const editButtons = screen.getAllByRole('button', { name: /✏️/ });
    fireEvent.click(editButtons[0]);
    
    // Debe haber botón para agregar jugador
    const addPlayerButton = screen.getByRole('button', { name: /➕ Agregar Jugador/i });
    expect(addPlayerButton).toBeInTheDocument();
  });

  test('muestra logo del equipo si existe', () => {
    render(
      <TeamList 
        teams={mockTeams}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onCreateNew={mockOnCreateNew}
        authenticatedFetch={mockAuthenticatedFetch}
      />
    );
    
    // Abrir modal de edición para ver logo
    const editButtons = screen.getAllByRole('button', { name: /✏️/ });
    fireEvent.click(editButtons[0]);
    
    // El logo debe aparecer en el formulario de edición
    const logoImage = screen.getByAltText('Logo del equipo');
    expect(logoImage).toBeInTheDocument();
    expect(logoImage.src).toBe('data:image/png;base64,test');
  });

  test('maneja error al guardar equipo', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    mockAuthenticatedFetch.mockRejectedValueOnce(new Error('Network error'));
    
    render(
      <TeamList 
        teams={mockTeams}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onCreateNew={mockOnCreateNew}
        authenticatedFetch={mockAuthenticatedFetch}
      />
    );
    
    // Abrir modal de edición
    const editButtons = screen.getAllByRole('button', { name: /✏️/ });
    fireEvent.click(editButtons[0]);
    
    // Guardar
    const saveButton = screen.getByText(/💾 Guardar Cambios/i);
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith('Error updating team:', expect.any(Error));
    });
    
    consoleError.mockRestore();
  });

  test('maneja error al eliminar equipo', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    mockAuthenticatedFetch.mockRejectedValueOnce(new Error('Network error'));
    global.confirm.mockReturnValueOnce(true);
    
    render(
      <TeamList 
        teams={mockTeams}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onCreateNew={mockOnCreateNew}
        authenticatedFetch={mockAuthenticatedFetch}
      />
    );
    
    const deleteButtons = screen.getAllByRole('button', { name: /🗑️/ });
    fireEvent.click(deleteButtons[0]);
    
    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith('Error deleting team:', expect.any(Error));
    });
    
    consoleError.mockRestore();
  });

  test('no elimina equipo si se cancela confirmación', () => {
    global.confirm.mockReturnValueOnce(false);
    
    render(
      <TeamList 
        teams={mockTeams}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onCreateNew={mockOnCreateNew}
        authenticatedFetch={mockAuthenticatedFetch}
      />
    );
    
    const deleteButtons = screen.getAllByRole('button', { name: /🗑️/ });
    fireEvent.click(deleteButtons[0]);
    
    // No debe llamar a authenticatedFetch
    expect(mockAuthenticatedFetch).not.toHaveBeenCalled();
  });

  test('muestra jugadores del equipo en lista principal', () => {
    render(
      <TeamList 
        teams={mockTeams}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onCreateNew={mockOnCreateNew}
        authenticatedFetch={mockAuthenticatedFetch}
      />
    );
    
    // Debe mostrar nombres de jugadores
    expect(screen.getByText(/Jugador 1/i)).toBeInTheDocument();
    expect(screen.getByText(/Jugador A/i)).toBeInTheDocument();
    expect(screen.getByText(/Jugador B/i)).toBeInTheDocument();
  });

  test('permite agregar un jugador con nombre y número', () => {
    render(
      <TeamList 
        teams={mockTeams}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onCreateNew={mockOnCreateNew}
        authenticatedFetch={mockAuthenticatedFetch}
      />
    );
    
    // Abrir modal de edición
    const editButtons = screen.getAllByRole('button', { name: /✏️/ });
    fireEvent.click(editButtons[0]);
    
    // Llenar datos del nuevo jugador
    const nameInput = screen.getByPlaceholderText(/Nombre del jugador \*/i);
    const numberInput = screen.getByPlaceholderText(/Número \*/i);
    
    fireEvent.change(nameInput, { target: { value: 'Nuevo Jugador' } });
    fireEvent.change(numberInput, { target: { value: '99' } });
    
    // Hacer click en agregar jugador
    const addPlayerButton = screen.getByRole('button', { name: /➕ Agregar Jugador/i });
    fireEvent.click(addPlayerButton);
    
    // Debe aparecer el nuevo jugador en la lista
    expect(screen.getByText(/Nuevo Jugador/i)).toBeInTheDocument();
  });

  test('no permite agregar jugador sin nombre', () => {
    render(
      <TeamList 
        teams={mockTeams}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onCreateNew={mockOnCreateNew}
        authenticatedFetch={mockAuthenticatedFetch}
      />
    );
    
    // Abrir modal de edición
    const editButtons = screen.getAllByRole('button', { name: /✏️/ });
    fireEvent.click(editButtons[0]);
    
    // Solo llenar número, dejar nombre vacío
    const numberInput = screen.getByPlaceholderText(/Número \*/i);
    fireEvent.change(numberInput, { target: { value: '99' } });
    
    // Hacer click en agregar jugador
    const addPlayerButton = screen.getByRole('button', { name: /➕ Agregar Jugador/i });
    fireEvent.click(addPlayerButton);
    
    // Debe seguir mostrando solo 1 jugador
    const playersList = screen.getByText(/Jugadores \(1\)/i);
    expect(playersList).toBeInTheDocument();
  });

  test('permite eliminar un jugador', () => {
    global.confirm.mockReturnValueOnce(true); // Confirmar eliminación
    
    render(
      <TeamList 
        teams={mockTeams}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onCreateNew={mockOnCreateNew}
        authenticatedFetch={mockAuthenticatedFetch}
      />
    );
    
    // Abrir modal de edición del equipo con 2 jugadores
    const editButtons = screen.getAllByRole('button', { name: /✏️/ });
    fireEvent.click(editButtons[1]); // Equipo Test 2
    
    // Verificar que hay 2 jugadores en la lista
    const jugadorA = screen.getByText(/Jugador A/i);
    const jugadorB = screen.getByText(/Jugador B/i);
    expect(jugadorA).toBeInTheDocument();
    expect(jugadorB).toBeInTheDocument();
    
    // Hacer click en eliminar primer jugador usando title
    const removeButtons = screen.getAllByTitle('Eliminar jugador');
    fireEvent.click(removeButtons[0]);
    
    // Después de eliminar, Jugador A no debe estar pero Jugador B sí
    expect(screen.queryByText(/Jugador A/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Jugador B/i)).toBeInTheDocument();
  });

  test('permite editar un jugador existente', () => {
    render(
      <TeamList 
        teams={mockTeams}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onCreateNew={mockOnCreateNew}
        authenticatedFetch={mockAuthenticatedFetch}
      />
    );
    
    // Abrir modal de edición
    const editButtons = screen.getAllByRole('button', { name: /✏️/ });
    fireEvent.click(editButtons[0]);
    
    // Hacer click en editar jugador usando title
    const editPlayerButton = screen.getByTitle('Editar jugador');
    fireEvent.click(editPlayerButton);
    
    // Debe aparecer modal de edición de jugador
    expect(screen.getByText(/✏️ Editar Jugador/i)).toBeInTheDocument();
  });

  test('permite cancelar edición de jugador', () => {
    render(
      <TeamList 
        teams={mockTeams}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onCreateNew={mockOnCreateNew}
        authenticatedFetch={mockAuthenticatedFetch}
      />
    );
    
    // Abrir modal de edición
    const editButtons = screen.getAllByRole('button', { name: /✏️/ });
    fireEvent.click(editButtons[0]);
    
    // Hacer click en editar jugador usando title
    const editPlayerButton = screen.getByTitle('Editar jugador');
    fireEvent.click(editPlayerButton);
    
    // Debe aparecer modal de edición de jugador
    expect(screen.getByText(/✏️ Editar Jugador/i)).toBeInTheDocument();
    
    // Cancelar
    const cancelButton = screen.getAllByText(/Cancelar/i)[0];
    fireEvent.click(cancelButton);
    
    // No debe mostrar el modal de edición de jugador
    expect(screen.queryByText(/✏️ Editar Jugador/i)).not.toBeInTheDocument();
  });

  test('llama a onEdit después de guardar exitosamente', async () => {
    mockAuthenticatedFetch.mockResolvedValueOnce({ ok: true });
    
    render(
      <TeamList 
        teams={mockTeams}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onCreateNew={mockOnCreateNew}
        authenticatedFetch={mockAuthenticatedFetch}
      />
    );
    
    // Abrir modal de edición
    const editButtons = screen.getAllByRole('button', { name: /✏️/ });
    fireEvent.click(editButtons[0]);
    
    // Guardar
    const saveButton = screen.getByText(/💾 Guardar Cambios/i);
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(mockOnEdit).toHaveBeenCalled();
    });
  });

  test('llama a authenticatedFetch después de eliminar exitosamente', async () => {
    mockAuthenticatedFetch.mockResolvedValueOnce({ ok: true });
    global.confirm.mockReturnValueOnce(true);
    
    render(
      <TeamList 
        teams={mockTeams}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onCreateNew={mockOnCreateNew}
        authenticatedFetch={mockAuthenticatedFetch}
      />
    );
    
    const deleteButtons = screen.getAllByRole('button', { name: /🗑️/ });
    fireEvent.click(deleteButtons[0]);
    
    await waitFor(() => {
      expect(mockAuthenticatedFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/teams/'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  test('búsqueda distingue entre mayúsculas y minúsculas correctamente', () => {
    render(
      <TeamList 
        teams={mockTeams}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onCreateNew={mockOnCreateNew}
        authenticatedFetch={mockAuthenticatedFetch}
      />
    );
    
    const searchInput = screen.getByPlaceholderText(/Buscar equipo/i);
    
    // Buscar con minúsculas
    fireEvent.change(searchInput, { target: { value: 'test' } });
    
    // Debe encontrar ambos equipos
    expect(screen.getByText('Equipo Test')).toBeInTheDocument();
    expect(screen.getByText('Equipo Test 2')).toBeInTheDocument();
  });

  test('permite agregar campos opcionales al jugador', () => {
    render(
      <TeamList 
        teams={mockTeams}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onCreateNew={mockOnCreateNew}
        authenticatedFetch={mockAuthenticatedFetch}
      />
    );
    
    // Abrir modal de edición
    const editButtons = screen.getAllByRole('button', { name: /✏️/ });
    fireEvent.click(editButtons[0]);
    
    // Llenar todos los campos del jugador
    const nameInput = screen.getByPlaceholderText(/Nombre del jugador \*/i);
    const numberInput = screen.getByPlaceholderText(/Número \*/i);
    const ageInput = screen.getByPlaceholderText(/Edad/i);
    const epsInput = screen.getByPlaceholderText(/EPS/i);
    const positionInput = screen.getByPlaceholderText(/Posición/i);
    
    fireEvent.change(nameInput, { target: { value: 'Jugador Completo' } });
    fireEvent.change(numberInput, { target: { value: '99' } });
    fireEvent.change(ageInput, { target: { value: '25' } });
    fireEvent.change(epsInput, { target: { value: 'Sura' } });
    fireEvent.change(positionInput, { target: { value: 'Portero' } });
    
    // Todos los campos deben tener los valores
    expect(nameInput.value).toBe('Jugador Completo');
    expect(numberInput.value).toBe('99');
    expect(ageInput.value).toBe('25');
    expect(epsInput.value).toBe('Sura');
    expect(positionInput.value).toBe('Portero');
  });

  test('limpia el formulario después de agregar jugador', () => {
    render(
      <TeamList 
        teams={mockTeams}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onCreateNew={mockOnCreateNew}
        authenticatedFetch={mockAuthenticatedFetch}
      />
    );
    
    // Abrir modal de edición
    const editButtons = screen.getAllByRole('button', { name: /✏️/ });
    fireEvent.click(editButtons[0]);
    
    // Llenar datos del nuevo jugador
    const nameInput = screen.getByPlaceholderText(/Nombre del jugador \*/i);
    const numberInput = screen.getByPlaceholderText(/Número \*/i);
    
    fireEvent.change(nameInput, { target: { value: 'Nuevo Jugador' } });
    fireEvent.change(numberInput, { target: { value: '99' } });
    
    // Hacer click en agregar jugador
    const addPlayerButton = screen.getByRole('button', { name: /➕ Agregar Jugador/i });
    fireEvent.click(addPlayerButton);
    
    // Los campos deben estar vacíos
    expect(nameInput.value).toBe('');
    expect(numberInput.value).toBe('');
  });

  test('permite subir logo del equipo', () => {
    render(
      <TeamList 
        teams={mockTeams}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onCreateNew={mockOnCreateNew}
        authenticatedFetch={mockAuthenticatedFetch}
      />
    );
    
    // Abrir modal de edición
    const editButtons = screen.getAllByRole('button', { name: /✏️/ });
    fireEvent.click(editButtons[0]);
    
    // Simular subida de logo
    const logoInput = screen.getByLabelText(/🖼️ Logo del equipo/i);
    const file = new File(['logo'], 'logo.png', { type: 'image/png' });
    
    // Mock FileReader
    const mockFileReader = {
      readAsDataURL: jest.fn(),
      onloadend: null,
      result: 'data:image/png;base64,mocklogo'
    };
    
    global.FileReader = jest.fn(() => mockFileReader);
    
    fireEvent.change(logoInput, { target: { files: [file] } });
    
    // Simular que FileReader terminó
    mockFileReader.onloadend();
    
    expect(mockFileReader.readAsDataURL).toHaveBeenCalledWith(file);
  });

  test('permite subir foto de jugador nuevo', () => {
    render(
      <TeamList 
        teams={mockTeams}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onCreateNew={mockOnCreateNew}
        authenticatedFetch={mockAuthenticatedFetch}
      />
    );
    
    // Abrir modal de edición
    const editButtons = screen.getAllByRole('button', { name: /✏️/ });
    fireEvent.click(editButtons[0]);
    
    // Simular subida de foto para jugador nuevo
    const photoLabel = screen.getByText(/📷 Foto del jugador/i);
    const photoInput = photoLabel.querySelector('input[type="file"]');
    const file = new File(['photo'], 'photo.png', { type: 'image/png' });
    
    // Mock FileReader
    const mockFileReader = {
      readAsDataURL: jest.fn(),
      onloadend: null,
      result: 'data:image/png;base64,mockphoto'
    };
    
    global.FileReader = jest.fn(() => mockFileReader);
    
    fireEvent.change(photoInput, { target: { files: [file] } });
    
    // Simular que FileReader terminó
    mockFileReader.onloadend();
    
    expect(mockFileReader.readAsDataURL).toHaveBeenCalledWith(file);
  });

  test('permite guardar cambios de jugador editado', () => {
    render(
      <TeamList 
        teams={mockTeams}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onCreateNew={mockOnCreateNew}
        authenticatedFetch={mockAuthenticatedFetch}
      />
    );
    
    // Abrir modal de edición
    const editButtons = screen.getAllByRole('button', { name: /✏️/ });
    fireEvent.click(editButtons[0]);
    
    // Hacer click en editar jugador
    const editPlayerButton = screen.getByTitle('Editar jugador');
    fireEvent.click(editPlayerButton);
    
    // Debe aparecer modal de edición
    expect(screen.getByText(/✏️ Editar Jugador/i)).toBeInTheDocument();
    
    // Guardar cambios (el jugador ya tiene nombre y número)
    const saveButtons = screen.getAllByRole('button', { name: /💾 Guardar/i });
    // El último botón es del modal de jugador
    fireEvent.click(saveButtons[saveButtons.length - 1]);
    
    // El modal debe cerrarse
    expect(screen.queryByText(/✏️ Editar Jugador/i)).not.toBeInTheDocument();
  });

  test('valida que jugador editado tenga nombre y número', () => {
    const teamWithEmptyPlayer = [
      {
        _id: '1',
        name: 'Equipo Test',
        logo: 'data:image/png;base64,test',
        players: [
          { name: '', number: 10, position: 'Delantero' } // Jugador sin nombre
        ]
      }
    ];
    
    render(
      <TeamList 
        teams={teamWithEmptyPlayer}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onCreateNew={mockOnCreateNew}
        authenticatedFetch={mockAuthenticatedFetch}
      />
    );
    
    // Abrir modal de edición
    const editButtons = screen.getAllByRole('button', { name: /✏️/ });
    fireEvent.click(editButtons[0]);
    
    // Hacer click en editar jugador
    const editPlayerButton = screen.getByTitle('Editar jugador');
    fireEvent.click(editPlayerButton);
    
    // Debe aparecer modal de edición
    expect(screen.getByText(/✏️ Editar Jugador/i)).toBeInTheDocument();
    
    // Intentar guardar sin nombre (el jugador ya no tiene nombre)
    const saveButtons = screen.getAllByRole('button', { name: /💾 Guardar/i });
    fireEvent.click(saveButtons[saveButtons.length - 1]);
    
    // El modal debe seguir abierto porque no hay nombre
    expect(screen.getByText(/✏️ Editar Jugador/i)).toBeInTheDocument();
  });
});
