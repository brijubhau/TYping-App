
export enum Difficulty {
  BEGINNER = 'Beginner',
  INTERMEDIATE = 'Intermediate',
  EXPERT = 'Expert'
}

export interface Platform {
  id: string;
  word: string;
  x: number;
  y: number;
  width: number;
  height: number;
  completedChars: number;
  isCurrent: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
}

export interface Projectile {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  progress: number;
  color: string;
}

export interface GameState {
  score: number;
  accuracy: number;
  combo: number;
  maxCombo: number;
  totalKeystrokes: number;
  correctKeystrokes: number;
  difficulty: Difficulty;
  isGameOver: boolean;
  isPlaying: boolean;
  timeLeft: number;
  problemWords: string[];
  wpm: number;
}
