"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useGame } from "@/lib/game-state";

interface RhythmGameProps {
  onComplete: (earned: number) => void;
  onClose: () => void;
}

const LANES = ["A", "S", "D", "F"] as const;
const LANE_KEYS = ["KeyA", "KeyS", "KeyD", "KeyF"];

interface Note {
  id: number;
  lane: number;
  y: number;
}

export default function RhythmGame({ onComplete, onClose }: RhythmGameProps) {
  const { addMoney, addLoyaltyStamp } = useGame();
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [notes, setNotes] = useState<Note[]>([]);
  const [playing, setPlaying] = useState(false);
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(45);
  const [hitFlash, setHitFlash] = useState<number | null>(null);
  const idRef = useRef(0);
  const scoreRef = useRef(0);
  const comboRef = useRef(0);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    comboRef.current = combo;
  }, [combo]);

  const hitNote = useCallback((lane: number) => {
    setNotes((prev) => {
      const hitZone = 520;
      const tolerance = 40;
      const match = prev.find((n) => n.lane === lane && Math.abs(n.y - hitZone) < tolerance);
      if (!match) {
        setCombo(0);
        return prev;
      }
      setScore((s) => s + 10 + comboRef.current * 2);
      setCombo((c) => c + 1);
      setHitFlash(lane);
      setTimeout(() => setHitFlash(null), 150);
      return prev.filter((n) => n.id !== match.id);
    });
  }, []);

  useEffect(() => {
    if (!playing || finished) return;
    const onKey = (e: KeyboardEvent) => {
      const lane = LANE_KEYS.indexOf(e.code);
      if (lane >= 0) hitNote(lane);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [playing, finished, hitNote]);

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
      const lane = Math.floor(Math.random() * 4);
      const id = ++idRef.current;
      setNotes((prev) => [...prev, { id, lane, y: -20 }]);
    }, 500);
    return () => clearInterval(spawner);
  }, [playing, finished]);

  useEffect(() => {
    if (!playing || finished) return;
    const mover = setInterval(() => {
      setNotes((prev) =>
        prev
          .map((n) => ({ ...n, y: n.y + 8 }))
          .filter((n) => {
            if (n.y > 600) {
              setCombo(0);
              return false;
            }
            return true;
          }),
      );
    }, 30);
    return () => clearInterval(mover);
  }, [playing, finished]);

  const startGame = () => {
    setScore(0);
    setCombo(0);
    setNotes([]);
    setTimeLeft(45);
    setFinished(false);
    setPlaying(true);
  };

  const claimReward = () => {
    const earned = Math.floor(score / 3);
    addMoney(earned);
    addLoyaltyStamp("music");
    onComplete(earned);
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-purple-400">🎸 Mall Rocker</h3>
        <div className="flex gap-4 text-sm">
          <span className="text-yellow-300">Score: {score}</span>
          <span className="text-orange-400">Combo: {combo}x</span>
          <span className="text-cyan-300">Time: {timeLeft}s</span>
        </div>
      </div>

      {!playing && !finished && (
        <div className="flex flex-col items-center justify-center flex-1 gap-4">
          <p className="text-zinc-400 text-center max-w-sm">
            Hit A S D F when notes reach the line! Guitar Hero meets the food court.
          </p>
          <button onClick={startGame} className="px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-lg font-bold text-white">
            Drop the Needle — Play!
          </button>
        </div>
      )}

      {(playing || finished) && (
        <div className="relative flex-1 min-h-[400px] rounded-xl border-2 border-purple-500/30 bg-gradient-to-b from-[#0f0520] to-[#050210] overflow-hidden">
          <div className="absolute inset-0 flex justify-center gap-2 px-8 pt-4">
            {LANES.map((key, i) => (
              <div key={key} className="flex-1 max-w-[80px] relative">
                <div className="absolute inset-x-0 top-[500px] h-1 bg-white/60 rounded" />
                <div
                  className={`absolute inset-x-0 top-[490px] h-12 rounded border-2 transition-colors ${
                    hitFlash === i ? "border-yellow-400 bg-yellow-400/20" : "border-white/20 bg-white/5"
                  }`}
                />
                {notes
                  .filter((n) => n.lane === i)
                  .map((n) => (
                    <div
                      key={n.id}
                      className="absolute left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 shadow-lg shadow-purple-500/50"
                      style={{ top: n.y }}
                    />
                  ))}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-12 h-12 rounded-lg bg-zinc-800 border border-zinc-600 flex items-center justify-center font-bold text-white text-lg">
                  {key}
                </div>
              </div>
            ))}
          </div>
          {finished && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 gap-4 z-10">
              <p className="text-2xl font-bold text-white">Encore!</p>
              <p className="text-yellow-300">Final Score: {score}</p>
              <p className="text-green-400">Earned: {Math.floor(score / 3)} AII</p>
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
