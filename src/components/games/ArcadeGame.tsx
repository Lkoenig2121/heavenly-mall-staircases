"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useGame } from "@/lib/game-state";

interface ArcadeGameProps {
  onComplete: (earned: number) => void;
  onClose: () => void;
}

interface Target {
  id: number;
  x: number;
  y: number;
  life: number;
}

export default function ArcadeGame({ onComplete, onClose }: ArcadeGameProps) {
  const { addMoney, addLoyaltyStamp } = useGame();
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [targets, setTargets] = useState<Target[]>([]);
  const [playing, setPlaying] = useState(false);
  const [finished, setFinished] = useState(false);
  const idRef = useRef(0);
  const areaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!playing || finished) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setFinished(true);
          setPlaying(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [playing, finished]);

  useEffect(() => {
    if (!playing || finished) return;
    const spawner = setInterval(() => {
      const area = areaRef.current;
      if (!area) return;
      const pad = 60;
      const x = pad + Math.random() * (area.clientWidth - pad * 2);
      const y = pad + Math.random() * (area.clientHeight - pad * 2);
      const id = ++idRef.current;
      setTargets((prev) => [...prev, { id, x, y, life: 100 }]);
      setTimeout(() => {
        setTargets((prev) => prev.filter((t) => t.id !== id));
      }, 1500);
    }, 600);
    return () => clearInterval(spawner);
  }, [playing, finished]);

  const popTarget = useCallback((id: number) => {
    setTargets((prev) => prev.filter((t) => t.id !== id));
    setScore((s) => s + 10);
  }, []);

  const startGame = () => {
    setScore(0);
    setTimeLeft(30);
    setTargets([]);
    setFinished(false);
    setPlaying(true);
  };

  const claimReward = () => {
    const earned = Math.floor(score / 2);
    addMoney(earned);
    addLoyaltyStamp("arcade");
    onComplete(earned);
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-pink-400">🕹️ Button Blitz</h3>
        <div className="flex gap-4 text-sm">
          <span className="text-yellow-300">Score: {score}</span>
          <span className="text-cyan-300">Time: {timeLeft}s</span>
        </div>
      </div>

      {!playing && !finished && (
        <div className="flex flex-col items-center justify-center flex-1 gap-4">
          <p className="text-zinc-400 text-center max-w-sm">
            Click the glowing targets before they vanish! Earn AII money based on your score.
          </p>
          <button onClick={startGame} className="px-6 py-3 bg-pink-600 hover:bg-pink-500 rounded-lg font-bold text-white">
            Insert Coin — Play!
          </button>
        </div>
      )}

      {(playing || finished) && (
        <div
          ref={areaRef}
          className="relative flex-1 min-h-[300px] rounded-xl border-2 border-pink-500/30 bg-gradient-to-b from-[#1a0a20] to-[#0d0515] overflow-hidden cursor-crosshair"
        >
          {targets.map((t) => (
            <button
              key={t.id}
              onClick={() => popTarget(t.id)}
              className="absolute w-14 h-14 rounded-full bg-gradient-to-br from-pink-400 to-purple-600 shadow-lg shadow-pink-500/50 animate-pulse border-2 border-white/30 hover:scale-110 transition-transform"
              style={{ left: t.x, top: t.y }}
            />
          ))}
          {finished && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 gap-4">
              <p className="text-2xl font-bold text-white">Game Over!</p>
              <p className="text-yellow-300">Final Score: {score}</p>
              <p className="text-green-400">Earned: {Math.floor(score / 2)} AII</p>
              <div className="flex gap-3">
                <button onClick={claimReward} className="px-5 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-white font-bold">
                  Collect AII
                </button>
                <button onClick={startGame} className="px-5 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-white">
                  Play Again
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <button onClick={onClose} className="text-sm text-zinc-500 hover:text-zinc-300 self-end">
        ← Back to store
      </button>
    </div>
  );
}
