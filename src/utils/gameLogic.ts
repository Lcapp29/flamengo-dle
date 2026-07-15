import { Player } from '../types';

/**
 * Extracts the state code or country code after the '/' in localNascimento.
 * E.g., "Catanduva/SP" -> "SP", "Buenos Aires/ARG" -> "ARG"
 */
export function getRegion(localNascimento: string): string {
  if (!localNascimento) return '';
  const parts = localNascimento.split('/');
  if (parts.length > 1) {
    return parts[parts.length - 1].trim().toUpperCase();
  }
  return localNascimento.trim().toUpperCase();
}

/**
 * Deterministic hash function to get the daily player index based on date string (DD/MM/YYYY)
 */
export function getDailyPlayer(players: Player[], dateStr: string): Player {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = dateStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % players.length;
  return players[index];
}

export interface ComparisonResult {
  isCorrect: boolean;
  position: { status: 'correct' | 'incorrect' };
  anoNascimento: {
    status: 'correct' | 'close' | 'incorrect';
    direction: 'up' | 'down' | 'equal';
    diff: number;
  };
  anoEstreia: {
    status: 'correct' | 'close' | 'incorrect';
    direction: 'up' | 'down' | 'equal';
    diff: number;
  };
  region: {
    status: 'correct' | 'incorrect';
    guessRegion: string;
  };
  partidas: {
    status: 'correct' | 'close' | 'incorrect';
    direction: 'up' | 'down' | 'equal';
    diff: number;
  };
  gols: {
    status: 'correct' | 'close' | 'incorrect';
    direction: 'up' | 'down' | 'equal';
    diff: number;
  };
}

/**
 * Compares guessed player with the target secret player
 */
export function comparePlayers(guess: Player, secret: Player): ComparisonResult {
  const parseNum = (val: any) => parseInt(String(val), 10) || 0;

  const guessNasc = parseNum(guess.anoNascimento);
  const secretNasc = parseNum(secret.anoNascimento);

  const guessEstreia = parseNum(guess.anoEstreia);
  const secretEstreia = parseNum(secret.anoEstreia);

  const guessPartidas = parseNum(guess.partidas);
  const secretPartidas = parseNum(secret.partidas);

  const guessGols = parseNum(guess.gols);
  const secretGols = parseNum(secret.gols);

  const regionGuess = getRegion(guess.localNascimento);
  const regionSecret = getRegion(secret.localNascimento);

  const diffNasc = Math.abs(guessNasc - secretNasc);
  const diffEstreia = Math.abs(guessEstreia - secretEstreia);
  const diffPartidas = Math.abs(guessPartidas - secretPartidas);
  const diffGols = Math.abs(guessGols - secretGols);

  return {
    isCorrect: guess.id === secret.id,
    position: {
      status: guess.posicao === secret.posicao ? 'correct' : 'incorrect',
    },
    anoNascimento: {
      status: guessNasc === secretNasc ? 'correct' : diffNasc <= 5 ? 'close' : 'incorrect',
      direction: secretNasc > guessNasc ? 'up' : secretNasc < guessNasc ? 'down' : 'equal',
      diff: diffNasc,
    },
    anoEstreia: {
      status: guessEstreia === secretEstreia ? 'correct' : diffEstreia <= 5 ? 'close' : 'incorrect',
      direction: secretEstreia > guessEstreia ? 'up' : secretEstreia < guessEstreia ? 'down' : 'equal',
      diff: diffEstreia,
    },
    region: {
      status: regionGuess === regionSecret ? 'correct' : 'incorrect',
      guessRegion: regionGuess,
    },
    partidas: {
      status: guessPartidas === secretPartidas ? 'correct' : diffPartidas <= 10 ? 'close' : 'incorrect',
      direction: secretPartidas > guessPartidas ? 'up' : secretPartidas < guessPartidas ? 'down' : 'equal',
      diff: diffPartidas,
    },
    gols: {
      status: guessGols === secretGols ? 'correct' : diffGols <= 10 ? 'close' : 'incorrect',
      direction: secretGols > guessGols ? 'up' : secretGols < guessGols ? 'down' : 'equal',
      diff: diffGols,
    },
  };
}
