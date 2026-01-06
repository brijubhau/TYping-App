
import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Platform, Particle, Projectile, Difficulty } from '../types';

interface GameCanvasProps {
  platforms: Platform[];
  isPlaying: boolean;
  difficulty: Difficulty;
  onGameOver: () => void;
  combo: number;
}

interface FloatingText {
  x: number;
  y: number;
  text: string;
  life: number;
  color: string;
}

const GameCanvas = forwardRef((props: GameCanvasProps, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  
  const player = useRef({ 
    x: window.innerWidth / 2, 
    y: window.innerHeight - 250, 
    width: 45, 
    height: 45,
    startX: window.innerWidth / 2,
    startY: window.innerHeight - 250,
    targetY: window.innerHeight - 250,
    targetX: window.innerWidth / 2,
    jumpProgress: 1,
    isJumping: false,
    vy: 0
  });
  
  const particles = useRef<Particle[]>([]);
  const projectiles = useRef<Projectile[]>([]);
  const floatingTexts = useRef<FloatingText[]>([]);
  const shake = useRef(0);
  const cameraY = useRef(0);
  const lastTime = useRef(0);

  // Initialize camera near player
  useEffect(() => {
    cameraY.current = player.current.y - window.innerHeight * 0.7;
  }, []);

  useImperativeHandle(ref, () => ({
    onCorrectKey: (char: string, platform: Platform) => {
      projectiles.current.push({
        x: player.current.x,
        y: player.current.y,
        targetX: platform.x + (platform.completedChars * 28),
        targetY: platform.y + 32,
        progress: 0,
        color: '#22c55e'
      });
      createParticles(platform.x + (platform.completedChars * 28), platform.y + 32, '#facc15', 3);
    },
    onWordComplete: () => {
      const nextP = props.platforms.find(p => p.isCurrent);
      if (nextP) {
        player.current.startX = player.current.x;
        player.current.startY = player.current.y;
        player.current.targetX = nextP.x + nextP.width / 2;
        player.current.targetY = nextP.y - player.current.height;
        player.current.jumpProgress = 0;
        player.current.isJumping = true;
      }
    },
    onWrongKey: () => {
      shake.current = 12;
      floatingTexts.current.push({
        x: player.current.x,
        y: player.current.y - 50,
        text: "MISS",
        life: 0.6,
        color: '#ef4444'
      });
    }
  }));

  const createParticles = (x: number, y: number, color: string, count: number) => {
    for (let i = 0; i < count; i++) {
      particles.current.push({
        x, y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        size: Math.random() * 3 + 1,
        color, life: 1, maxLife: 0.5
      });
    }
  };

  const update = (time: number) => {
    const deltaTime = (time - lastTime.current) / 1000;
    if (deltaTime > 0.1) { // Prevent huge skips
      lastTime.current = time;
      return;
    }
    lastTime.current = time;

    // Jump Physics
    if (player.current.isJumping) {
      player.current.jumpProgress += deltaTime * 2.5;
      if (player.current.jumpProgress >= 1) {
        player.current.jumpProgress = 1;
        player.current.isJumping = false;
        player.current.x = player.current.targetX;
        player.current.y = player.current.targetY;
      } else {
        const p = player.current.jumpProgress;
        const hEase = 1 - Math.pow(1 - p, 2);
        const arc = Math.max(150, Math.abs(player.current.startX - player.current.targetX) * 0.5) * (1 - Math.pow(Math.abs(2 * p - 1), 2));
        const lastY = player.current.y;
        player.current.x = player.current.startX + (player.current.targetX - player.current.startX) * hEase;
        player.current.y = (player.current.startY + (player.current.targetY - player.current.startY) * p) - arc;
        player.current.vy = player.current.y - lastY;
      }
    }

    // Camera
    const targetCamY = player.current.y - window.innerHeight * 0.65;
    cameraY.current += (targetCamY - cameraY.current) * 0.1;

    // Auto-scroll logic
    if (props.isPlaying) {
      const scrollSpeeds = { [Difficulty.BEGINNER]: 0.4, [Difficulty.INTERMEDIATE]: 0.8, [Difficulty.EXPERT]: 1.3 };
      cameraY.current -= scrollSpeeds[props.difficulty];
      
      const activeP = props.platforms.find(p => p.isCurrent);
      if (activeP && activeP.y > cameraY.current + window.innerHeight + 100) {
        props.onGameOver();
      }
    }

    // Update arrays
    particles.current.forEach(p => { p.x += p.vx; p.y += p.vy; p.life -= deltaTime; });
    particles.current = particles.current.filter(p => p.life > 0);
    projectiles.current.forEach(p => { p.progress += deltaTime * 12; });
    projectiles.current = projectiles.current.filter(p => p.progress < 1);
    floatingTexts.current.forEach(t => { t.y -= deltaTime * 40; t.life -= deltaTime; });
    floatingTexts.current = floatingTexts.current.filter(t => t.life > 0);
    if (shake.current > 0) shake.current *= 0.9;
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // Static Background
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    ctx.save();
    const sx = (Math.random() - 0.5) * shake.current;
    const sy = (Math.random() - 0.5) * shake.current;
    ctx.translate(sx, sy - cameraY.current);

    // World Stars/Snow
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    for(let i=0; i<50; i++) {
        const x = (i * 137.5) % ctx.canvas.width;
        const y = (i * 250) % (ctx.canvas.height * 5); // Spread across virtual height
        ctx.beginPath(); ctx.arc(x, y, 1.5, 0, Math.PI*2); ctx.fill();
    }

    // 1. DRAW PLATFORMS (Solid High Contrast)
    props.platforms.forEach(p => {
      const isVisible = p.y > cameraY.current - 300 && p.y < cameraY.current + window.innerHeight + 300;
      if (!isVisible) return;

      // Platform Box
      ctx.fillStyle = p.isCurrent ? '#ffffff' : '#334155';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(p.x, p.y, p.width, p.height, 8);
      ctx.fill();
      ctx.stroke();

      // 2. DRAW TEXT (Directly on top, after platform)
      ctx.font = 'bold 32px "JetBrains Mono", monospace';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      
      const textX = p.x + p.width / 2;
      const textY = p.y + p.height / 2;
      
      // Measure for coloring
      const fullWidth = ctx.measureText(p.word).width;
      const startX = textX - fullWidth / 2;
      
      ctx.textAlign = 'left';
      
      // Completed (Vibrant Green)
      const completed = p.word.slice(0, p.completedChars);
      ctx.fillStyle = '#16a34a';
      ctx.fillText(completed, startX, textY);
      
      // Remaining (Solid Black for contrast)
      const remaining = p.word.slice(p.completedChars);
      const compW = ctx.measureText(completed).width;
      ctx.fillStyle = p.isCurrent ? '#000000' : '#94a3b8';
      ctx.fillText(remaining, startX + compW, textY);
    });

    // 3. DRAW PLAYER
    ctx.save();
    ctx.translate(player.current.x, player.current.y);
    ctx.fillStyle = '#3b82f6';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(-22, -22, 44, 44, 10);
    ctx.fill();
    ctx.stroke();
    // Eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(-10, -8, 6, 0, Math.PI*2); ctx.arc(10, -8, 6, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(-10, -8, 2, 0, Math.PI*2); ctx.arc(10, -8, 2, 0, Math.PI*2); ctx.fill();
    ctx.restore();

    // 4. DRAW FX
    particles.current.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
    });
    ctx.globalAlpha = 1;

    projectiles.current.forEach(p => {
      const x = p.x + (p.targetX - p.x) * p.progress;
      const y = p.y + (p.targetY - p.y) * p.progress;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(x-10, y-10); ctx.lineTo(x, y); ctx.stroke();
    });

    floatingTexts.current.forEach(t => {
      ctx.font = 'bold 30px "Orbitron"';
      ctx.fillStyle = t.color;
      ctx.globalAlpha = t.life;
      ctx.textAlign = 'center';
      ctx.fillText(t.text, t.x, t.y);
    });

    ctx.restore();
  };

  const loop = (time: number) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      update(time);
      draw(ctx);
    }
    requestRef.current = requestAnimationFrame(loop);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [props.platforms, props.isPlaying]); // Re-sync loop with props

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return <canvas ref={canvasRef} className="block w-full h-full" />;
});

GameCanvas.displayName = 'GameCanvas';
export default GameCanvas;
