import { render, screen, fireEvent } from '@testing-library/react';
import TournamentList from './TournamentList';

describe('TournamentList Component', () => {
  const mockTournaments = [
    {
      _id: '1',
      name: 'Torneo Test',
      type: 'league',
      status: 'active',
      teams: []
    }
  ];

  const mockOnSelect = jest.fn();
  const mockOnCreateNew = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renderiza con torneos correctamente', () => {
    render(
      <TournamentList 
        tournaments={mockTournaments}
        onSelectTournament={mockOnSelect}
        onCreateNew={mockOnCreateNew}
      />
    );
    
    expect(screen.getByText('Torneo Test')).toBeInTheDocument();
  });

  test('muestra mensaje cuando no hay torneos', () => {
    render(
      <TournamentList 
        tournaments={[]}
        onSelectTournament={mockOnSelect}
        onCreateNew={mockOnCreateNew}
      />
    );

    expect(screen.getByText(/No hay torneos creados/i)).toBeInTheDocument();
  });

  test('botón de crear torneo está presente', () => {
    render(
      <TournamentList 
        tournaments={[]}
        onSelectTournament={mockOnSelect}
        onCreateNew={mockOnCreateNew}
      />
    );
    
    const createButton = screen.getByText(/Crear Torneo/i);
    expect(createButton).toBeInTheDocument();
  });

  test('llama onSelectTournament al hacer click en un torneo', () => {
    render(
      <TournamentList 
        tournaments={mockTournaments}
        onSelectTournament={mockOnSelect}
        onCreateNew={mockOnCreateNew}
      />
    );
    
    const tournamentCard = screen.getByText('Torneo Test').closest('.tournament-card');
    fireEvent.click(tournamentCard);
    
    expect(mockOnSelect).toHaveBeenCalledWith(mockTournaments[0]);
  });

  test('llama onCreateNew al hacer click en crear torneo', () => {
    render(
      <TournamentList 
        tournaments={[]}
        onSelectTournament={mockOnSelect}
        onCreateNew={mockOnCreateNew}
      />
    );
    
    const createButton = screen.getByText(/Crear Torneo/i);
    fireEvent.click(createButton);
    
    expect(mockOnCreateNew).toHaveBeenCalled();
  });
});
