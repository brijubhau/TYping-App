
import React, { useState, useEffect, useCallback, useRef } from 'react';
import GameCanvas from './components/GameCanvas';
import HUD from './components/HUD';
import { Difficulty, GameState, Platform } from './types';
import { fetchThemedWords, FALLBACK_WORDS } from './services/geminiService';
import { sounds } from './services/soundService';

const GAME_DURATION = 300; // 5 minutes in seconds

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    accuracy: 100,
    combo: 0,
    maxCombo: 0,
    totalKeystrokes: 0,
    correctKeystrokes: 0,
    difficulty: Difficulty.BEGINNER,
    isGameOver: false,
    isPlaying: false,
    timeLeft: GAME_DURATION,
    problemWords: [],
    wpm: 0
  });

  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const platformsRef = useRef<Platform[]>([]);
  const wordPoolRef = useRef<string[]>([]);
  const nextWordIndex = useRef(0);
  const canvasRef = useRef<any>(null);
  const timerRef = useRef<number | null>(null);

  const updatePlatforms = (newPlatforms: Platform[]) => {
    platformsRef.current = newPlatforms;
    setPlatforms(newPlatforms);
  };

  const generatePlatforms = (startY: number, count: number, isInitial: boolean = false): Platform[] => {
    const words = wordPoolRef.current;
    if (words.length === 0) return [];
    
    return Array.from({ length: count }).map((_, i) => {
      const word = (words[nextWordIndex.current % words.length] || "JUMP").toUpperCase();
      nextWordIndex.current++;
      const width = Math.max(180, word.length * 28);
      const x = (isInitial && i === 0) 
        ? (window.innerWidth / 2) - (width / 2) 
        : Math.max(50, Math.random() * (window.innerWidth - width - 50));

      return {
        id: Math.random().toString(36).substr(2, 9),
        word,
        x,
        y: startY - (i * 180),
        width,
        height: 65,
        completedChars: 0,
        isCurrent: isInitial && i === 0
      };
    });
  };

  const handleGameOver = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    sounds.playGameOver();
    setGameState(prev => ({ ...prev, isPlaying: false, isGameOver: true }));
  }, []);

  useEffect(() => {
    const init = async () => {
      const freshWords = await fetchThemedWords(gameState.difficulty);
      wordPoolRef.current = freshWords;
      const initial = generatePlatforms(window.innerHeight - 250, 8, true);
      updatePlatforms(initial);
    };
    init();
  }, []);

  // Timer logic
  useEffect(() => {
    if (gameState.isPlaying && !gameState.isGameOver) {
      timerRef.current = window.setInterval(() => {
        setGameState(prev => {
          if (prev.timeLeft <= 1) {
            handleGameOver();
            return { ...prev, timeLeft: 0 };
          }
          const newTimeLeft = prev.timeLeft - 1;
          const elapsedMinutes = (GAME_DURATION - newTimeLeft) / 60;
          const wpm = elapsedMinutes > 0 ? Math.round((prev.correctKeystrokes / 5) / elapsedMinutes) : 0;
          
          return { ...prev, timeLeft: newTimeLeft, wpm };
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [gameState.isPlaying, gameState.isGameOver, handleGameOver]);

  const startGame = async () => {
    nextWordIndex.current = 0;
    // Shuffle pool
    wordPoolRef.current = [...wordPoolRef.current].sort(() => Math.random() - 0.5);
    const initialPlatforms = generatePlatforms(window.innerHeight - 250, 10, true);
    updatePlatforms(initialPlatforms);
    
    setGameState(prev => ({
      ...prev,
      score: 0,
      accuracy: 100,
      combo: 0,
      maxCombo: 0,
      totalKeystrokes: 0,
      correctKeystrokes: 0,
      isPlaying: true,
      isGameOver: false,
      timeLeft: GAME_DURATION,
      problemWords: [],
      wpm: 0
    }));
  };

  const handleDifficultyChange = async (newDiff: Difficulty) => {
    setGameState(prev => ({ ...prev, difficulty: newDiff }));
    const words = await fetchThemedWords(newDiff);
    wordPoolRef.current = words;
  };

  const handleKeystroke = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Enter' && !gameState.isPlaying) {
      startGame();
      return;
    }

    if (!gameState.isPlaying || gameState.isGameOver) return;
    if (e.key === ' ' || e.key === 'Tab') e.preventDefault();
    if (e.key.length !== 1) return;

    const key = e.key.toUpperCase();
    const currentList = [...platformsRef.current];
    const activeIdx = currentList.findIndex(p => p.isCurrent);
    
    if (activeIdx === -1) return;
    const activePlatform = currentList[activeIdx];
    const targetChar = activePlatform.word[activePlatform.completedChars];

    const isCorrect = key === targetChar;

    setGameState(prev => {
      const newTotal = prev.totalKeystrokes + 1;
      const newCorrect = prev.correctKeystrokes + (isCorrect ? 1 : 0);
      const newAccuracy = Math.round((newCorrect / newTotal) * 100);
      const elapsedMinutes = (GAME_DURATION - prev.timeLeft) / 60;
      const wpm = elapsedMinutes > 0 ? Math.round((newCorrect / 5) / elapsedMinutes) : 0;

      if (isCorrect) {
        sounds.playCorrectKey();
        activePlatform.completedChars += 1;
        
        if (canvasRef.current) canvasRef.current.onCorrectKey(key, activePlatform);

        if (activePlatform.completedChars === activePlatform.word.length) {
          activePlatform.isCurrent = false;
          const nextIdx = activeIdx + 1;
          
          if (nextIdx < currentList.length) {
            currentList[nextIdx].isCurrent = true;
            sounds.playWordComplete();
            sounds.playJump();
            if (canvasRef.current) canvasRef.current.onWordComplete();
          }

          if (nextIdx > currentList.length - 4) {
            const lastY = currentList[currentList.length - 1].y;
            const more = generatePlatforms(lastY - 180, 5);
            updatePlatforms([...currentList, ...more]);
          } else {
            updatePlatforms([...currentList]);
          }
        } else {
          updatePlatforms([...currentList]);
        }

        return {
          ...prev,
          totalKeystrokes: newTotal,
          correctKeystrokes: newCorrect,
          accuracy: newAccuracy,
          wpm,
          combo: prev.combo + 1,
          maxCombo: Math.max(prev.maxCombo, prev.combo + 1),
          score: prev.score + (10 * (Math.floor(prev.combo / 5) + 1))
        };
      } else {
        sounds.playWrongKey();
        if (canvasRef.current) canvasRef.current.onWrongKey();
        
        // Track problem words uniquely
        const updatedProblemWords = prev.problemWords.includes(activePlatform.word) 
          ? prev.problemWords 
          : [...prev.problemWords, activePlatform.word];

        return {
          ...prev,
          totalKeystrokes: newTotal,
          accuracy: newAccuracy,
          combo: 0,
          problemWords: updatedProblemWords
        };
      }
    });
  }, [gameState.isPlaying, gameState.isGameOver]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeystroke);
    return () => window.removeEventListener('keydown', handleKeystroke);
  }, [handleKeystroke]);

  return (
    <div className="relative w-screen h-screen bg-[#020617] overflow-hidden">
      <GameCanvas 
        ref={canvasRef}
        platforms={platforms} 
        isPlaying={gameState.isPlaying}
        difficulty={gameState.difficulty}
        onGameOver={handleGameOver}
        combo={gameState.combo}
      />
      <HUD 
        gameState={gameState} 
        onDifficultyChange={handleDifficultyChange}
        onRestart={startGame}
      />
    </div>
  );
};

export default App;
