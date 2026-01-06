
import React, { useState } from 'react';
import { Difficulty, GameState } from '../types';
import { sounds } from '../services/soundService';

interface HUDProps {
  gameState: GameState;
  onDifficultyChange: (diff: Difficulty) => void;
  onRestart: () => void;
}

const HUD: React.FC<HUDProps> = ({ gameState, onDifficultyChange, onRestart }) => {
  const [isMuted, setIsMuted] = useState(false);

  const toggleMute = () => {
    const newMute = !isMuted;
    setIsMuted(newMute);
    sounds.setMute(newMute);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-10 p-6 flex flex-col justify-between">
      {/* Top HUD */}
      <div className="flex justify-between items-start pointer-events-auto">
        <div className="flex flex-col gap-4">
          <div className="glass-panel p-4 rounded-xl flex flex-col gap-1 min-w-[150px]">
            <div className="text-xs text-blue-300 uppercase tracking-widest font-bold">Score</div>
            <div className="text-3xl font-bold text-white tabular-nums">{gameState.score.toLocaleString()}</div>
            <div className="text-xs text-purple-400 font-bold mt-1">
              WPM <span className="text-lg text-white">{gameState.wpm}</span>
            </div>
          </div>
          
          <button 
            onClick={toggleMute}
            className="glass-panel p-2 rounded-lg flex items-center justify-center w-12 h-12 hover:bg-white/10 transition-colors"
          >
            {isMuted ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400"><path d="M11 5L6 9H2v6h4l5 4V5z"></path><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><path d="M11 5L6 9H2v6h4l5 4V5z"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
            )}
          </button>
        </div>

        {/* Center Timer */}
        {gameState.isPlaying && (
          <div className="glass-panel px-8 py-3 rounded-full flex flex-col items-center">
             <div className="text-[10px] text-blue-300 uppercase font-black tracking-[0.2em]">Time Remaining</div>
             <div className={`text-4xl font-black tabular-nums ${gameState.timeLeft < 30 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                {formatTime(gameState.timeLeft)}
             </div>
          </div>
        )}

        <div className="flex gap-4 items-start">
          <div className="glass-panel p-4 rounded-xl flex flex-col items-center">
            <div className="text-xs text-blue-300 uppercase tracking-widest font-bold mb-2">Difficulty</div>
            <select
              value={gameState.difficulty}
              onChange={(e) => onDifficultyChange(e.target.value as Difficulty)}
              className="bg-slate-900/50 text-white border border-white/20 rounded px-2 py-1 outline-none cursor-pointer focus:border-blue-400 transition-colors"
            >
              {Object.values(Difficulty).map(d => (
                <option key={d} value={d} className="bg-slate-900">{d}</option>
              ))}
            </select>
          </div>

          <div className="glass-panel p-4 rounded-xl flex flex-col items-center min-w-[100px]">
            <div className="text-xs text-blue-300 uppercase tracking-widest font-bold">Accuracy</div>
            <div className="text-2xl font-bold text-white tabular-nums">{gameState.accuracy}%</div>
          </div>
        </div>
      </div>

      {/* Combo Indicator */}
      {gameState.isPlaying && gameState.combo > 1 && (
        <div className="fixed bottom-10 left-10 animate-bounce">
            <div className="text-purple-400 font-black text-6xl italic drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]">
                x{gameState.combo}
            </div>
            <div className="text-white text-xs uppercase tracking-widest font-bold">Combo Meter</div>
        </div>
      )}

      {/* Start Screen Overlay */}
      {!gameState.isPlaying && !gameState.isGameOver && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-auto">
          <div className="text-center space-y-8 animate-in fade-in zoom-in duration-500">
            <h1 className="text-8xl font-black text-white tracking-tighter drop-shadow-[0_0_20px_rgba(59,130,246,0.5)]">TYPEMASTER</h1>
            <p className="text-blue-300 text-xl tracking-widest uppercase font-bold">5-Minute Cyber-Winter Trial</p>
            
            <button 
              onClick={onRestart}
              className="group relative px-16 py-8 rounded-2xl overflow-hidden transition-all hover:scale-105 active:scale-95"
            >
              <div className="absolute inset-0 bg-blue-600 animate-pulse"></div>
              <div className="relative z-10 text-3xl font-black text-white uppercase italic">Enter the Ascent</div>
            </button>
            
            <div className="flex flex-col gap-2 mt-8">
              <div className="text-white/40 text-sm font-bold uppercase tracking-[0.3em] animate-bounce">
                Press <span className="text-blue-400">ENTER</span> to start practice
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Game Over Report Card */}
      {gameState.isGameOver && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-2xl flex flex-col items-center justify-center pointer-events-auto p-4">
          <div className="text-center max-w-2xl w-full p-10 glass-panel rounded-[2.5rem] border-white/10 shadow-2xl">
            <h2 className="text-5xl font-black text-white mb-2 italic tracking-tighter uppercase">Trial Complete</h2>
            <p className="text-blue-400 text-lg mb-10 tracking-widest font-bold">ASCENT PERFORMANCE ANALYTICS</p>
            
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
                <div className="text-[10px] text-blue-300 font-bold mb-2 uppercase tracking-widest">WPM Speed</div>
                <div className="text-5xl font-black text-white">{gameState.wpm}</div>
              </div>
              <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
                <div className="text-[10px] text-blue-300 font-bold mb-2 uppercase tracking-widest">Accuracy</div>
                <div className="text-5xl font-black text-white">{gameState.accuracy}%</div>
              </div>
              <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
                <div className="text-[10px] text-blue-300 font-bold mb-2 uppercase tracking-widest">Final Score</div>
                <div className="text-4xl font-black text-blue-400">{gameState.score.toLocaleString()}</div>
              </div>
            </div>

            {/* Focus Areas / Problem Words */}
            <div className="bg-slate-900/80 p-6 rounded-3xl border border-white/5 mb-10 text-left">
              <div className="text-xs text-red-400 font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                Focus Areas (Words to Practice)
              </div>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                {gameState.problemWords.length > 0 ? (
                  gameState.problemWords.map(word => (
                    <span key={word} className="px-3 py-1 bg-red-500/10 border border-red-500/30 rounded-lg text-sm font-mono text-red-200">
                      {word}
                    </span>
                  ))
                ) : (
                  <div className="text-green-400 font-bold text-sm italic py-2">Perfect performance! No problem words detected.</div>
                )}
              </div>
            </div>
            
            <div className="flex gap-4">
               <button 
                onClick={onRestart}
                className="flex-1 bg-white text-slate-950 px-8 py-5 rounded-2xl text-xl font-black hover:bg-blue-400 transition-all hover:scale-105 active:scale-95 uppercase tracking-tighter"
              >
                Start New Session
              </button>
            </div>
          </div>
          
          <style dangerouslySetInnerHTML={{ __html: `
            .custom-scrollbar::-webkit-scrollbar { width: 4px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
          `}} />
        </div>
      )}
    </div>
  );
};

export default HUD;
