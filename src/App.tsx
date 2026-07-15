import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Player, GameState, Stats } from './types';
import { getDailyPlayer } from './utils/gameLogic';
import { GuessRow } from './components/GuessRow';
import { StatsModal } from './components/StatsModal';
import {
  Search,
  Flame,
  Trophy,
  HelpCircle,
  X,
  Info,
  Calendar,
  AlertCircle
} from 'lucide-react';

export default function App() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [secretPlayer, setSecretPlayer] = useState<Player | null>(null);
  const [guesses, setGuesses] = useState<Player[]>([]);
  const [won, setWon] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeOptionIndex, setActiveOptionIndex] = useState(0);

  // Modals state
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Stats State
  const [stats, setStats] = useState<Stats>({
    gamesPlayed: 0,
    gamesWon: 0,
    currentStreak: 0,
    maxStreak: 0,
  });

  // Countdown State
  const [timeLeft, setTimeLeft] = useState('00:00:00');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get current date string formatted as DD/MM/YYYY
  const todayStr = useMemo(() => {
    const today = new Date();
    return `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
  }, []);

  const [gameDateStr, setGameDateStr] = useState<string>(todayStr);

  // Countdown timer effect
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(now.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const diff = tomorrow.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      );
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Local storage keys based on selected date
  const keys = useMemo(() => {
    const safeDate = gameDateStr.replace(/\//g, '_');
    return {
      stateKey: `flamengodle_state_${safeDate}`,
      statsKey: `flamengodle_stats_v2`
    };
  }, [gameDateStr]);

  // Load database and initialize game state
  useEffect(() => {
    if (!gameDateStr) return;

    // Reset game state for the newly selected date to prevent flashes of previous games
    setGuesses([]);
    setWon(false);

    fetch('./database_flamengodle.json')
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to load database_flamengodle.json');
        }
        return res.json();
      })
      .then((data: Player[]) => {
        setPlayers(data);

        // Select the daily secret player deterministically based on selected date
        const secret = getDailyPlayer(data, gameDateStr);
        setSecretPlayer(secret);

        // Load that day's progress from LocalStorage
        const savedState = localStorage.getItem(keys.stateKey);
        if (savedState) {
          const parsedState: GameState = JSON.parse(savedState);
          // Restore guesses objects from IDs
          const restoredGuesses = parsedState.guesses
            .map((id) => data.find((p) => p.id === id))
            .filter((p): p is Player => !!p);

          setGuesses(restoredGuesses);
          setWon(parsedState.won);
          if (parsedState.won) {
            // Delay showing the stats modal slightly so the user sees the table first
            setTimeout(() => {
              setShowStatsModal(true);
            }, 800);
          }
        }
      })
      .catch((err) => {
        console.error('Error loading players:', err);
      });

    // Load overall statistics
    const savedStats = localStorage.getItem(keys.statsKey);
    if (savedStats) {
      setStats(JSON.parse(savedStats));
    }
  }, [keys, gameDateStr]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter players for autocomplete: matches name, is not already guessed
  const filteredPlayers = useMemo(() => {
    if (!inputValue.trim()) return [];
    const search = inputValue.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    return players
      .filter((player) => {
        const isAlreadyGuessed = guesses.some((g) => g.id === player.id);
        if (isAlreadyGuessed) return false;

        const normalName = player.nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return normalName.includes(search);
      })
      .slice(0, 8); // Limit autocomplete options to 8 to keep it clean
  }, [players, guesses, inputValue]);

  // Handle a new guess submission
  const handleGuess = (player: Player) => {
    if (won) return;

    const newGuesses = [...guesses, player];
    const isCorrect = player.id === secretPlayer?.id;

    setGuesses(newGuesses);

    // Save state to the selected date's localStorage
    const newState: GameState = {
      date: gameDateStr,
      guesses: newGuesses.map((g) => g.id),
      won: isCorrect,
    };
    localStorage.setItem(keys.stateKey, JSON.stringify(newState));

    if (isCorrect) {
      setWon(true);
      // Update and save general game statistics
      const updatedStats = updateStatsOnWin();
      setStats(updatedStats);

      // Trigger victory modal
      setTimeout(() => {
        setShowStatsModal(true);
      }, 1500);
    }
  };

  const updateStatsOnWin = (): Stats => {
    const savedStats = localStorage.getItem(keys.statsKey);
    const currentStats: Stats = savedStats
      ? JSON.parse(savedStats)
      : { gamesPlayed: 0, gamesWon: 0, currentStreak: 0, maxStreak: 0 };

    if (currentStats.lastWonDate === gameDateStr) {
      return currentStats; // Already recorded today
    }

    // Determine streak
    let yesterdayStr = '';
    try {
      const [d, m, y] = gameDateStr.split('/');
      const dateObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
      dateObj.setDate(dateObj.getDate() - 1);
      yesterdayStr = `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${dateObj.getFullYear()}`;
    } catch (e) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterdayStr = `${String(yesterday.getDate()).padStart(2, '0')}/${String(yesterday.getMonth() + 1).padStart(2, '0')}/${yesterday.getFullYear()}`;
    }

    let newStreak = 1;
    if (currentStats.lastWonDate === yesterdayStr) {
      newStreak = currentStats.currentStreak + 1;
    } else if (currentStats.lastWonDate === gameDateStr) {
      newStreak = currentStats.currentStreak;
    }

    const newMaxStreak = Math.max(currentStats.maxStreak, newStreak);

    const updated: Stats = {
      gamesPlayed: currentStats.gamesPlayed + 1,
      gamesWon: currentStats.gamesWon + 1,
      currentStreak: newStreak,
      maxStreak: newMaxStreak,
      lastWonDate: gameDateStr,
    };

    localStorage.setItem(keys.statsKey, JSON.stringify(updated));
    return updated;
  };

  // Keyboard navigation for dropdown
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || filteredPlayers.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveOptionIndex((prev) => (prev + 1) % filteredPlayers.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveOptionIndex((prev) => (prev - 1 + filteredPlayers.length) % filteredPlayers.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSelectPlayer(filteredPlayers[activeOptionIndex]);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  const handleSelectPlayer = (player: Player) => {
    handleGuess(player);
    setInputValue('');
    setShowDropdown(false);
    setActiveOptionIndex(0);
    inputRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f3f4f6] flex flex-col relative overflow-hidden">
      {/* Decorative subtle ambient glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#d30000]/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-[#d30000]/3 rounded-full blur-[120px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="flex items-center justify-between px-6 md:px-10 py-5 border-b border-white/10 bg-[#0a0a0a]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <img src="./assets/logo.png" alt="Logo Flamengodle" className="h-10 w-auto object-contain" />
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tighter uppercase italic">
              Flamengo<span className="text-[#d30000]">dle</span>
            </h1>
            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest block -mt-0.5">
              Adivinhe o jogador do CRF
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 md:gap-8">
          <div className="text-right hidden sm:block">
            <p className="text-[9px] uppercase tracking-widest text-white/40 font-bold">Próximo Jogador</p>
            <p className="text-sm md:text-base font-mono font-bold text-[#f3f4f6]">{timeLeft}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowInfoModal(true)}
              className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center cursor-pointer hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
              title="Como Jogar"
            >
              <HelpCircle className="w-4.5 h-4.5" />
            </button>

            {won && (
              <button
                onClick={() => setShowStatsModal(true)}
                className="px-3 py-1.5 bg-[#d30000]/10 hover:bg-[#d30000]/20 text-[#d30000] border border-[#d30000]/20 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_15px_rgba(211,0,0,0.15)]"
              >
                <Trophy className="w-3.5 h-3.5" /> Estatísticas
              </button>
            )}

            <div className="bg-[#1a1a1a] px-3 py-1.5 rounded-lg border border-white/5 text-xs text-zinc-400 font-mono flex items-center gap-1.5 relative hover:border-white/20 transition-all cursor-pointer">
              <Calendar className="w-3.5 h-3.5 text-[#d30000] shrink-0" />
              <span className="font-bold text-zinc-300">{gameDateStr}</span>
              <input
                type="date"
                min="2026-07-01"
                max={new Date().toISOString().split('T')[0]}
                value={gameDateStr.split('/').reverse().join('-')}
                onChange={(e) => {
                  if (e.target.value) {
                    const [year, month, day] = e.target.value.split('-');
                    const selectedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                    const minDate = new Date(2026, 6, 1); // 01/07/2026 (month is 0-indexed)
                    const maxDate = new Date();
                    
                    if (selectedDate >= minDate && selectedDate <= maxDate) {
                      setGameDateStr(`${day}/${month}/${year}`);
                    }
                  }
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                onClick={(e) => {
                  try {
                    (e.target as HTMLInputElement).showPicker();
                  } catch (err) {
                    // Fallback for browsers that do not support showPicker
                  }
                }}
              />
            </div>

            {gameDateStr !== todayStr && (
              <button
                onClick={() => setGameDateStr(todayStr)}
                className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/10 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0"
                title="Voltar para o dia de hoje"
              >
                Voltar para Hoje
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-8 flex flex-col items-center">
        {/* Banner Hero */}
        <div className="text-center mb-8 max-w-lg">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white mb-2 uppercase">
            Quem é o <span className="text-[#d30000]">Jogador Secreto</span>?
          </h2>
          <p className="text-zinc-400 text-xs md:text-sm mb-3">
            Digite um jogador histórico ou recente do Flamengo para começar. Use as pistas de cores e setas para acertar!
          </p>
          <div className="inline-block bg-[#1a1a1a] px-3.5 py-1 rounded-full border border-white/5 text-[10px] text-zinc-500 font-bold tracking-wider uppercase">
            Base de jogadores atualizada até 15/07/2026
          </div>
        </div>

        {/* Input & Custom Autocomplete search bar */}
        {!won ? (
          <div
            ref={dropdownRef}
            className="w-full max-w-xl relative mb-10 z-30"
          >
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#d30000] ml-1">
                Faça o seu palpite
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    setShowDropdown(true);
                    setActiveOptionIndex(0);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  onKeyDown={handleKeyDown}
                  placeholder="Insira o nome do jogador do Flamengo..."
                  className="w-full bg-[#1a1a1a] border-2 border-white/5 border-b-[#d30000] focus:border-b-[#d30000] focus:shadow-[0_0_20px_rgba(211,0,0,0.15)] text-white pl-12 pr-12 py-4 rounded-xl outline-none text-base transition-all font-semibold placeholder-zinc-500 shadow-xl"
                />
                {inputValue && (
                  <button
                    onClick={() => setInputValue('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-white rounded-full hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Dropdown Options */}
            {showDropdown && filteredPlayers.length > 0 && (
              <div className="absolute top-full left-0 w-full mt-2 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 divide-y divide-white/5 max-h-72 overflow-y-auto">
                {filteredPlayers.map((player, index) => (
                  <button
                    key={player.id}
                    onClick={() => handleSelectPlayer(player)}
                    onMouseEnter={() => setActiveOptionIndex(index)}
                    className={`w-full text-left px-5 py-3.5 flex items-center justify-between transition-colors cursor-pointer ${
                      index === activeOptionIndex ? 'bg-[#d30000] text-white font-bold' : 'text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full overflow-hidden border border-[#d30000] bg-[#0a0a0a] shrink-0">
                        <img
                          src={player.foto}
                          alt={player.nome}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(player.nome)}&backgroundColor=b91c1c,18181b&textColor=ffffff`;
                          }}
                        />
                      </div>
                      <span className="text-sm">
                        {player.nome}
                      </span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      index === activeOptionIndex ? 'bg-black/30 text-white' : 'bg-black/50 text-zinc-400'
                    }`}>
                      {player.posicao}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Input Alert for no results */}
            {showDropdown && inputValue.trim() && filteredPlayers.length === 0 && (
              <div className="absolute top-full left-0 w-full mt-2 bg-[#1a1a1a] border border-white/10 rounded-xl p-4 text-center shadow-2xl z-50 text-xs text-zinc-500">
                <AlertCircle className="w-5 h-5 text-[#d30000] mx-auto mb-1 animate-pulse" />
                Jogador não encontrado ou já palpitado!
              </div>
            )}
          </div>
        ) : (
          <div className="w-full max-w-xl mb-10 bg-[#1a1a1a] border border-[#22c55e]/30 rounded-xl p-4 text-center shadow-lg flex items-center justify-center gap-3 animate-pulse">
            <Trophy className="w-6 h-6 text-[#eab308]" />
            <span className="text-[#22c55e] text-sm md:text-base font-bold uppercase tracking-tight">
              Parabéns! Você desvendou o jogador secreto em {guesses.length} {guesses.length === 1 ? 'tentativa' : 'tentativas'}!
            </span>
          </div>
        )}

        {/* Guesses Table container */}
        {guesses.length > 0 ? (
          <div className="w-full select-none overflow-x-auto">
            {/* Table Header Grid */}
            <div className="flex gap-1.5 md:gap-3 w-max md:w-full min-w-full max-w-5xl mx-auto px-1 pb-2 border-b border-white/5 text-center font-bold text-[8px] md:text-[10px] text-white/40 uppercase tracking-widest relative">
              <div className="w-[76px] md:w-full md:flex-1 shrink-0 sticky left-0 z-20 bg-[#050505] before:absolute before:inset-y-0 before:-right-1.5 md:before:hidden before:w-1.5 before:bg-[#050505]">Jogador</div>
              <div className="w-[76px] md:w-full md:flex-1 shrink-0">Posição</div>
              <div className="w-[76px] md:w-full md:flex-1 shrink-0">Nascimento</div>
              <div className="w-[76px] md:w-full md:flex-1 shrink-0">Estreia</div>
              <div className="w-[76px] md:w-full md:flex-1 shrink-0">Região</div>
              <div className="w-[76px] md:w-full md:flex-1 shrink-0">Partidas</div>
              <div className="w-[76px] md:w-full md:flex-1 shrink-0">Gols</div>
            </div>

            {/* Guess Rows (Reversed to show newest guess on top) */}
            <div className="flex flex-col">
              {[...guesses].reverse().map((guess) => (
                <GuessRow
                  key={guess.id}
                  guess={guess}
                  secret={secretPlayer!}
                />
              ))}
            </div>
          </div>
        ) : (
          /* Empty state */
          <div className="w-full max-w-md bg-[#1a1a1a] border border-white/5 rounded-2xl p-8 text-center text-zinc-500 my-8 shadow-inner">
            <Flame className="w-12 h-12 text-[#d30000]/20 mx-auto mb-3" />
            <p className="text-sm font-bold text-white/80 uppercase tracking-wide">Nenhum palpite feito hoje</p>
            <p className="text-xs text-zinc-500 mt-1">Insira um jogador acima para começar a trilhar suas pistas!</p>
          </div>
        )}
      </main>

      {/* Bottom Bar Stats & Disclaimer Footer */}
      <footer className="mt-auto bg-[#050505] border-t border-white/5 flex flex-col items-center w-full shrink-0 select-none py-6">
        {/* Stats Row */}
        <div className="flex justify-center gap-8 md:gap-12 items-center mb-4">
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-white/40 uppercase tracking-tighter font-semibold">Tentativas</span>
            <span className="text-xl md:text-2xl font-black italic">{String(guesses.length).padStart(2, '0')}</span>
          </div>
          <div className="h-8 w-[1px] bg-white/10"></div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-white/40 uppercase tracking-tighter font-semibold">Taxa de Vitória</span>
            <span className="text-xl md:text-2xl font-black italic text-[#d30000]">
              {stats.gamesPlayed > 0 ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) : 0}%
            </span>
          </div>
          <div className="h-8 w-[1px] bg-white/10"></div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-white/40 uppercase tracking-tighter font-semibold">Sequência</span>
            <span className="text-xl md:text-2xl font-black italic">{String(stats.currentStreak).padStart(2, '0')}</span>
          </div>
        </div>

        {/* Disclaimer Text */}
        <div className="text-center px-4 max-w-2xl border-t border-white/5 pt-4 w-full">
          <p className="text-xs text-zinc-500 md:text-sm font-medium leading-relaxed">
            Projeto independente feito de fã para fã. Este jogo não possui nenhum vínculo oficial com o Clube de Regatas do Flamengo.
          </p>
        </div>
      </footer>

      {/* Info Modal / Rules of the game */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 shadow-2xl">
            <button
              onClick={() => setShowInfoModal(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white cursor-pointer text-sm"
            >
              ✕
            </button>

            <h3 className="text-lg font-black text-white mb-4 uppercase tracking-tight flex items-center gap-2">
              <Info className="w-5 h-5 text-[#d30000]" /> Como Jogar o Flamengodle?
            </h3>

            <div className="space-y-4 text-xs md:text-sm text-zinc-300 leading-relaxed">
              <p>
                Adivinhe o jogador diário secreto do Flamengo! A cada tentativa, as propriedades revelam pistas:
              </p>

              <div className="bg-[#d30000]/10 border border-[#d30000]/30 rounded-lg p-3 text-zinc-300 text-xs flex gap-2">
                <AlertCircle className="w-5 h-5 text-[#d30000] shrink-0 mt-0.5" />
                <span>
                  <strong>Atenção:</strong> A nossa base de dados é restrita a jogadores que estrearam no Flamengo a partir do ano 2000 (neste século) e que tenham completado mais de 10 partidas oficiais pelo clube.
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-start gap-2.5">
                  <div className="w-4 h-4 bg-[#22c55e] border border-white/5 rounded shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-bold">Verde (Correto)</strong>
                    A propriedade do palpite coincide exatamente com a do jogador secreto.
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-4 h-4 bg-[#eab308] border border-white/5 rounded shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-bold">Amarelo (Próximo)</strong>
                    Aplicável apenas a números e anos. Indica que o valor está próximo:
                    <ul className="list-disc pl-4 text-xs text-zinc-400 mt-0.5">
                      <li>Nascimento e Estreia: até 5 anos de diferença.</li>
                      <li>Partidas e Gols: até 10 unidades de diferença.</li>
                    </ul>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-4 h-4 bg-[#ef4444] border border-white/5 rounded shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-bold">Vermelho (Incorreto)</strong>
                    A propriedade está fora da margem correta/próxima.
                  </div>
                </div>

                <div className="flex items-start gap-2.5 pt-2 border-t border-white/5">
                  <div className="w-5 h-5 bg-[#121212] border border-white/10 rounded flex items-center justify-center shrink-0 text-xs font-bold text-white">
                    ⬆️
                  </div>
                  <div>
                    <strong className="text-white block font-bold">Setas Indicativas (⬆️ / ⬇️)</strong>
                    Exibidas em propriedades numéricas/anos. Indica se o valor correto é MAIOR (⬆️) ou MENOR (⬇️) que o seu palpite.
                  </div>
                </div>

                <div className="flex items-start gap-2.5 pt-2 border-t border-white/5">
                  <div className="w-5 h-5 bg-[#22c55e] rounded flex items-center justify-center shrink-0 text-xs font-bold text-white uppercase">
                    SP
                  </div>
                  <div>
                    <strong className="text-white block font-bold">Local de Nascimento</strong>
                    Isonomia de estado/país. Ex: Palpitar "Catanduva/SP" confere com "São Paulo/SP" porque a região após a barra ("SP") é idêntica!
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowInfoModal(false)}
              className="w-full mt-6 bg-[#d30000] hover:bg-[#b00000] text-white font-bold py-3 rounded-xl transition-colors cursor-pointer uppercase tracking-wider text-xs"
            >
              Entendido! Jogar
            </button>
          </div>
        </div>
      )}

      {/* Victory Statistics Modal */}
      {secretPlayer && (
        <StatsModal
          isOpen={showStatsModal}
          onClose={() => setShowStatsModal(false)}
          secretPlayer={secretPlayer}
          guesses={guesses}
          attempts={guesses.length}
          stats={stats}
        />
      )}
    </div>
  );
}
