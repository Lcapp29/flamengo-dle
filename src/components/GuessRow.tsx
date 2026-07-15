import React from 'react';
import { Player, GuessType } from '../types';
import { comparePlayers, getRegion } from '../utils/gameLogic';
import { Flame, ArrowUp, ArrowDown, Lightbulb } from 'lucide-react';

interface GuessRowProps {
  guess: GuessType;
  secret: Player;
}

export const GuessRow: React.FC<GuessRowProps> = ({ guess, secret }) => {
  const isHint = 'isHint' in guess && guess.isHint;
  const playerGuess = !isHint ? (guess as Player) : secret;
  const diffs = !isHint ? comparePlayers(playerGuess, secret) : null;

  const getTextStyle = (status: string) => {
    if (status === 'close') {
      return {
        label: 'text-zinc-900/60 font-semibold',
        value: 'text-zinc-950 font-black tracking-tight',
        sub: 'text-zinc-900/80 font-medium',
        arrow: 'text-zinc-950'
      };
    }
    if (status === 'correct') {
      return {
        label: 'text-white/60 font-medium',
        value: 'text-white font-black tracking-tight',
        sub: 'text-white/80 font-medium',
        arrow: 'text-white'
      };
    }
    if (status === 'incorrect') {
      return {
        label: 'text-white/50 font-medium',
        value: 'text-white/90 font-bold tracking-tight',
        sub: 'text-white/70',
        arrow: 'text-white'
      };
    }
    return {
      label: 'text-zinc-500 font-medium',
      value: 'text-zinc-100 font-bold tracking-tight',
      sub: 'text-zinc-400',
      arrow: 'text-[#d30000]'
    };
  };

  const renderHintEmpty = (label: string) => (
    <div className="flex flex-col items-center justify-center h-full p-1 text-center">
      <span className="text-[8px] md:text-[10px] uppercase tracking-wider block mb-0.5 text-zinc-500 font-medium">{label}</span>
      <span className="text-xl md:text-2xl font-bold text-zinc-700">?</span>
    </div>
  );

  const cells = [
    // 1. Imagem e Nome
    {
      label: 'Jogador',
      status: 'neutral',
      content: isHint ? (
        <div className="flex flex-col items-center justify-center h-full p-0.5 text-center">
          <div className="relative w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden border-2 border-[#eab308] bg-[#1a1a1a] mb-0.5 flex items-center justify-center">
            <Lightbulb className="w-4 h-4 md:w-5 md:h-5 text-[#eab308]" />
          </div>
          <span className="text-[8px] md:text-xs font-bold leading-tight line-clamp-2 text-[#eab308] w-full uppercase font-sans break-words px-0.5">
            Dica
          </span>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full p-0.5 text-center">
          <div className="relative w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden border-2 border-[#d30000] bg-[#1a1a1a] mb-0.5">
            <img
              src={playerGuess.foto}
              alt={playerGuess.nome}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <span className="text-[8px] md:text-xs font-bold leading-tight line-clamp-2 text-zinc-100 w-full uppercase font-sans break-words px-0.5">
            {playerGuess.nome.split(' (')[0]}
          </span>
        </div>
      ),
      direction: 'equal' as const,
    },
    // 2. Posição
    {
      label: 'Posição',
      status: isHint ? (guess.column === 'posicao' ? 'correct' : 'neutral') : diffs!.position.status,
      content: isHint && guess.column !== 'posicao' ? renderHintEmpty('Posição') : (() => {
        const status = isHint ? 'correct' : diffs!.position.status;
        const styles = getTextStyle(status);
        return (
          <div className="flex flex-col items-center justify-center h-full p-1 text-center">
            <span className={`text-[8px] md:text-[10px] uppercase tracking-wider block mb-0.5 ${styles.label}`}>Posição</span>
            <span className={`text-[10px] md:text-xs uppercase ${styles.value}`}>{playerGuess.posicao}</span>
          </div>
        );
      })(),
      direction: 'equal' as const,
    },
    // 3. Ano de Nascimento
    {
      label: 'Nascimento',
      status: isHint ? (guess.column === 'anoNascimento' ? 'correct' : 'neutral') : diffs!.anoNascimento.status,
      content: isHint && guess.column !== 'anoNascimento' ? renderHintEmpty('Nascimento') : (() => {
        const status = isHint ? 'correct' : diffs!.anoNascimento.status;
        const styles = getTextStyle(status);
        return (
          <div className="flex flex-col items-center justify-center h-full p-1 relative text-center">
            <span className={`text-[8px] md:text-[10px] uppercase tracking-wider block mb-0.5 ${styles.label}`}>Nascimento</span>
            <span className={`text-xs md:text-sm font-mono ${styles.value}`}>{playerGuess.anoNascimento}</span>
            <span className={`text-[8px] md:text-[9px] ${styles.sub}`}>({new Date().getFullYear() - playerGuess.anoNascimento} anos)</span>
            {!isHint && diffs!.anoNascimento.status !== 'correct' && (
              <div className="absolute right-1 top-1">
                {diffs!.anoNascimento.direction === 'up' ? (
                  <ArrowUp className={`w-3 h-3 md:w-3.5 md:h-3.5 ${styles.arrow} animate-bounce`} />
                ) : (
                  <ArrowDown className={`w-3 h-3 md:w-3.5 md:h-3.5 ${styles.arrow} animate-bounce`} />
                )}
              </div>
            )}
          </div>
        );
      })(),
      direction: isHint ? 'equal' : diffs!.anoNascimento.direction,
    },
    // 4. Ano de Estreia
    {
      label: 'Estreia',
      status: isHint ? (guess.column === 'anoEstreia' ? 'correct' : 'neutral') : diffs!.anoEstreia.status,
      content: isHint && guess.column !== 'anoEstreia' ? renderHintEmpty('Estreia') : (() => {
        const status = isHint ? 'correct' : diffs!.anoEstreia.status;
        const styles = getTextStyle(status);
        return (
          <div className="flex flex-col items-center justify-center h-full p-1 relative text-center">
            <span className={`text-[8px] md:text-[10px] uppercase tracking-wider block mb-0.5 ${styles.label}`}>Estreia</span>
            <span className={`text-xs md:text-sm font-mono ${styles.value}`}>{playerGuess.anoEstreia}</span>
            {!isHint && diffs!.anoEstreia.status !== 'correct' && (
              <div className="absolute right-1 top-1">
                {diffs!.anoEstreia.direction === 'up' ? (
                  <ArrowUp className={`w-3 h-3 md:w-3.5 md:h-3.5 ${styles.arrow} animate-bounce`} />
                ) : (
                  <ArrowDown className={`w-3 h-3 md:w-3.5 md:h-3.5 ${styles.arrow} animate-bounce`} />
                )}
              </div>
            )}
          </div>
        );
      })(),
      direction: isHint ? 'equal' : diffs!.anoEstreia.direction,
    },
    // 5. Local de Nascimento
    {
      label: 'Região',
      status: isHint ? (guess.column === 'localNascimento' ? 'correct' : 'neutral') : diffs!.region.status,
      content: isHint && guess.column !== 'localNascimento' ? renderHintEmpty('Região') : (() => {
        const status = isHint ? 'correct' : diffs!.region.status;
        const styles = getTextStyle(status);
        return (
          <div className="flex flex-col items-center justify-center h-full p-1 text-center">
            <span className={`text-[8px] md:text-[10px] uppercase tracking-wider block mb-0.5 ${styles.label}`}>Região</span>
            <span className={`text-xs md:text-sm font-bold uppercase ${styles.value}`}>{getRegion(playerGuess.localNascimento)}</span>
          </div>
        );
      })(),
      direction: 'equal' as const,
    },
    // 6. Partidas
    {
      label: 'Partidas',
      status: isHint ? (guess.column === 'partidas' ? 'correct' : 'neutral') : diffs!.partidas.status,
      content: isHint && guess.column !== 'partidas' ? renderHintEmpty('Partidas') : (() => {
        const status = isHint ? 'correct' : diffs!.partidas.status;
        const styles = getTextStyle(status);
        return (
          <div className="flex flex-col items-center justify-center h-full p-1 relative text-center">
            <span className={`text-[8px] md:text-[10px] uppercase tracking-wider block mb-0.5 ${styles.label}`}>Partidas</span>
            <span className={`text-xs md:text-sm font-mono ${styles.value}`}>{playerGuess.partidas}</span>
            {!isHint && diffs!.partidas.status !== 'correct' && (
              <div className="absolute right-1 top-1">
                {diffs!.partidas.direction === 'up' ? (
                  <ArrowUp className={`w-3 h-3 md:w-3.5 md:h-3.5 ${styles.arrow} animate-bounce`} />
                ) : (
                  <ArrowDown className={`w-3 h-3 md:w-3.5 md:h-3.5 ${styles.arrow} animate-bounce`} />
                )}
              </div>
            )}
          </div>
        );
      })(),
      direction: isHint ? 'equal' : diffs!.partidas.direction,
    },
    // 7. Gols
    {
      label: 'Gols',
      status: isHint ? (guess.column === 'gols' ? 'correct' : 'neutral') : diffs!.gols.status,
      content: isHint && guess.column !== 'gols' ? renderHintEmpty('Gols') : (() => {
        const status = isHint ? 'correct' : diffs!.gols.status;
        const styles = getTextStyle(status);
        return (
          <div className="flex flex-col items-center justify-center h-full p-1 relative text-center">
            <span className={`text-[8px] md:text-[10px] uppercase tracking-wider block mb-0.5 ${styles.label}`}>Gols</span>
            <span className={`text-xs md:text-sm font-mono ${styles.value}`}>{playerGuess.gols}</span>
            {!isHint && diffs!.gols.status !== 'correct' && (
              <div className="absolute right-1 top-1">
                {diffs!.gols.direction === 'up' ? (
                  <ArrowUp className={`w-3 h-3 md:w-3.5 md:h-3.5 ${styles.arrow} animate-bounce`} />
                ) : (
                  <ArrowDown className={`w-3 h-3 md:w-3.5 md:h-3.5 ${styles.arrow} animate-bounce`} />
                )}
              </div>
            )}
          </div>
        );
      })(),
      direction: isHint ? 'equal' : diffs!.gols.direction,
    },
  ];

  const getBgClass = (status: string) => {
    switch (status) {
      case 'correct':
        return 'bg-[#22c55e] border-[#22c55e]/20 text-white shadow-[0_0_15px_rgba(34,197,94,0.15)]';
      case 'close':
        return 'bg-[#eab308] border-[#eab308]/20 text-zinc-950 shadow-[0_0_15px_rgba(234,179,8,0.15)]';
      case 'incorrect':
        return 'bg-[#ef4444] border-[#ef4444]/20 text-white shadow-[0_0_15px_rgba(239,68,68,0.15)]';
      default:
        return 'bg-[#1a1a1a] border-white/10 text-zinc-200';
    }
  };

  return (
    <div className="flex gap-1.5 md:gap-3 w-max md:w-full min-w-full max-w-5xl mx-auto my-2 px-1 relative">
      {cells.map((cell, index) => (
        <div
          key={index}
          className={`perspective-1000 w-[76px] md:w-full md:flex-1 shrink-0 h-[80px] md:h-[90px] ${
            index === 0 ? 'sticky left-0 z-10 before:absolute before:inset-y-0 before:-right-1.5 md:before:hidden before:w-1.5 before:bg-[#050505]' : ''
          }`}
          style={{ left: index === 0 ? 0 : 'auto' }}
        >
          <div
            className="w-full h-full relative transform-style-3d cell-flip border border-white/10 rounded-lg overflow-hidden shadow-[4px_0_12px_rgba(0,0,0,0.3)]"
            style={{
              animationDelay: `${index * 150}ms`,
              transformStyle: 'preserve-3d',
            }}
          >
            {/* Front Side of the Flip (Revealed content) */}
            <div
              className={`absolute inset-0 w-full h-full backface-hidden flex flex-col justify-center items-center rounded-lg ${getBgClass(
                cell.status
              )}`}
              style={{ backfaceVisibility: 'hidden' }}
            >
              {cell.content}
            </div>

            {/* Back Side of the Flip (Face-down view, shows initially) */}
            <div
              className="absolute inset-0 w-full h-full backface-hidden bg-[#121212] border-white/5 border flex flex-col items-center justify-center rounded-lg rotate-y-180"
              style={{
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}
            >
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center border border-white/10 animate-pulse">
                <Flame className="w-4 h-4 md:w-5 md:h-5 text-[#d30000]" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
