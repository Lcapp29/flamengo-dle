import React, { useState, useEffect } from 'react';
import { Player, Stats, GuessType } from '../types';
import { comparePlayers } from '../utils/gameLogic';
import { Share2, Check, Trophy, Flame, Calendar } from 'lucide-react';
import { trackEvent } from '../analytics';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  secretPlayer: Player;
  guesses: GuessType[];
  attempts: number;
  stats: Stats;
}

export const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  onClose,
  secretPlayer,
  guesses,
  attempts,
  stats,
}) => {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');

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

  if (!isOpen) return null;

  const handleShare = () => {
    const today = new Date();
    const dateStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

    const grid = guesses
      .map((g) => {
        if ('isHint' in g) {
          return '💡'; // Represent hint in the share grid
        }
        
        const c = comparePlayers(g, secretPlayer);
        const emo1 = g.id === secretPlayer.id ? '🟩' : '⬛';
        const emo2 = c.position.status === 'correct' ? '🟩' : '🟥';

        const emo3 = c.anoNascimento.status === 'correct' ? '🟩' : c.anoNascimento.status === 'close' ? '🟨' : '🟥';
        const arrow3 = c.anoNascimento.status === 'correct' ? '' : c.anoNascimento.direction === 'up' ? '⬆️' : '⬇️';
        const disp3 = arrow3 ? arrow3 : emo3;

        const emo4 = c.anoEstreia.status === 'correct' ? '🟩' : c.anoEstreia.status === 'close' ? '🟨' : '🟥';
        const realArrow4 = c.anoEstreia.status === 'correct' ? '' : c.anoEstreia.direction === 'up' ? '⬆️' : '⬇️';
        const disp4 = realArrow4 ? realArrow4 : emo4;

        const emo5 = c.region.status === 'correct' ? '🟩' : '🟥';

        const emo6 = c.partidas.status === 'correct' ? '🟩' : c.partidas.status === 'close' ? '🟨' : '🟥';
        const arrow6 = c.partidas.status === 'correct' ? '' : c.partidas.direction === 'up' ? '⬆️' : '⬇️';
        const disp6 = arrow6 ? arrow6 : emo6;

        const emo7 = c.gols.status === 'correct' ? '🟩' : c.gols.status === 'close' ? '🟨' : '🟥';
        const arrow7 = c.gols.status === 'correct' ? '' : c.gols.direction === 'up' ? '⬆️' : '⬇️';
        const disp7 = arrow7 ? arrow7 : emo7;

        return `${emo1}${emo2}${disp3}${disp4}${emo5}${disp6}${disp7}`;
      })
      .join('\n');

    const text = `Flamengodle diário 🔴⚫\n📅 Data: ${dateStr}\n🏆 Consegui em ${attempts} ${attempts === 1 ? 'tentativa' : 'tentativas'}!\n\n${grid}\n\nJogue aqui: ${window.location.href}`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      trackEvent('Social', 'Share', 'StatsModal');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const winPercentage = stats.gamesPlayed > 0 ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fade-in">
      {/* Pure CSS Confetti Overlay */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 40 }).map((_, i) => {
          const left = `${Math.random() * 100}%`;
          const delay = `${Math.random() * 5}s`;
          const duration = `${3 + Math.random() * 3}s`;
          const colors = ['#d30000', '#1a1a1a', '#eab308', '#ffffff'];
          const bg = colors[Math.floor(Math.random() * colors.length)];
          return (
            <div
              key={i}
              className="confetti-piece"
              style={{
                left,
                animationDelay: delay,
                animationDuration: duration,
                backgroundColor: bg,
              }}
            />
          );
        })}
      </div>

      <div className="relative w-full max-w-md bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 shadow-2xl text-center victory-card-pulse">
        <Trophy className="w-16 h-16 text-[#eab308] mx-auto mb-2 animate-bounce" />

        <h2 className="text-3xl font-black tracking-tighter text-white mb-1 uppercase italic">
          Parabéns!
        </h2>
        <p className="text-zinc-400 text-xs mb-6 font-medium">Você adivinhou o jogador secreto do Flamengo!</p>

        {/* Revealed Player Details */}
        <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-4 mb-6 flex flex-col items-center justify-center">
          <div className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-[#d30000] mb-3 shadow-lg shadow-[#d30000]/20">
            <img
              src={secretPlayer.foto}
              alt={secretPlayer.nome}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(secretPlayer.nome)}&backgroundColor=b91c1c,18181b&textColor=ffffff`;
              }}
            />
          </div>
          <h3 className="text-xl font-bold text-white uppercase tracking-tight">{secretPlayer.nome.split(' (')[0]}</h3>
          <p className="text-xs text-[#d30000] font-black uppercase tracking-widest">{secretPlayer.posicao}</p>

          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/5 w-full text-zinc-300 text-xs">
            <div>
              <span className="block text-zinc-500 uppercase text-[9px] tracking-wider font-bold mb-0.5">Estreia</span>
              <span className="font-extrabold text-sm font-mono text-white">{secretPlayer.anoEstreia}</span>
            </div>
            <div>
              <span className="block text-zinc-500 uppercase text-[9px] tracking-wider font-bold mb-0.5">Partidas</span>
              <span className="font-extrabold text-sm font-mono text-white">{secretPlayer.partidas}</span>
            </div>
            <div>
              <span className="block text-zinc-500 uppercase text-[9px] tracking-wider font-bold mb-0.5">Gols</span>
              <span className="font-extrabold text-sm font-mono text-white">{secretPlayer.gols}</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-2 mb-6 bg-[#0a0a0a]/40 p-3 rounded-lg border border-white/5">
          <div className="text-center">
            <span className="text-lg md:text-xl font-black text-white font-mono">{stats.gamesPlayed}</span>
            <span className="block text-[9px] text-zinc-500 uppercase font-bold tracking-tight">Jogos</span>
          </div>
          <div className="text-center">
            <span className="text-lg md:text-xl font-black text-white font-mono">{winPercentage}%</span>
            <span className="block text-[9px] text-zinc-500 uppercase font-bold tracking-tight">Vitórias</span>
          </div>
          <div className="text-center">
            <span className="text-lg md:text-xl font-black text-[#d30000] flex items-center justify-center gap-0.5 font-mono">
              <Flame className="w-4 h-4 fill-[#d30000] text-[#d30000]" />
              {stats.currentStreak}
            </span>
            <span className="block text-[9px] text-zinc-500 uppercase font-bold tracking-tight">Streak</span>
          </div>
          <div className="text-center">
            <span className="text-lg md:text-xl font-black text-[#eab308] font-mono">{stats.maxStreak}</span>
            <span className="block text-[9px] text-zinc-500 uppercase font-bold tracking-tight">Máximo</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col gap-4 items-center justify-between pt-4 border-t border-white/5">
          <div className="flex items-center gap-2 justify-center w-full">
            <Calendar className="w-4 h-4 text-zinc-400" />
            <span className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Próximo Jogador em</span>
            <span className="text-sm font-mono font-bold text-white">{timeLeft}</span>
          </div>

          <button
            onClick={handleShare}
            className={`w-full px-6 py-3.5 rounded-xl font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg text-sm uppercase tracking-wide ${
              copied
                ? 'bg-[#22c55e] text-white scale-95'
                : 'bg-[#d30000] hover:bg-[#b00000] active:scale-95 text-white shadow-[0_4px_15px_rgba(211,0,0,0.3)]'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4.5 h-4.5" /> Copiado!
              </>
            ) : (
              <>
                <Share2 className="w-4.5 h-4.5" /> Compartilhar Resultado
              </>
            )}
          </button>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors cursor-pointer text-sm font-bold p-1 hover:bg-white/5 rounded-full"
        >
          ✕
        </button>
      </div>
    </div>
  );
};
