export interface Player {
  id: string;
  nome: string;
  posicao: 'Goleiro' | 'Defensor' | 'Meio Campo' | 'Atacante';
  anoNascimento: number;
  localNascimento: string;
  anoEstreia: number;
  partidas: number;
  gols: number;
  foto: string;
}

export interface AutocompletePlayer {
  id: string;
  nome: string;
  foto: string;
}

export interface Hint {
  isHint: true;
  column: keyof Player;
}

export type GuessType = Player | Hint;

export interface GameState {
  date: string;
  guesses: string[]; // List of player IDs or 'hint:columnName'
  won: boolean;
}

export interface Stats {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  maxStreak: number;
  lastWonDate?: string;
}
