"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Pause, Volume2 } from "lucide-react";
import type { VoiceNote } from "../types";

export function VoicePlayer({
  voiceNote,
  variant = "compact",
  className = "",
}: {
  voiceNote: VoiceNote;
  variant?: "compact" | "full";
  className?: string;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 100%
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 1.5 | 2>(1);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const durationSec = voiceNote.durationSeconds || 30;
  const currentSeconds = Math.floor((progress / 100) * durationSec);
  const currentFormatted = `0:${currentSeconds < 10 ? "0" : ""}${currentSeconds}`;

  const defaultPattern = [30, 60, 45, 80, 95, 65, 40, 75, 90, 85, 50, 70, 40, 60, 30];
  const waveform = voiceNote.waveformPattern || defaultPattern;

  useEffect(() => {
    if (isPlaying) {
      const stepMs = 100;
      const totalSteps = (durationSec * 1000) / (stepMs * playbackSpeed);
      const increment = 100 / totalSteps;

      timerRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 0;
          }
          return Math.min(100, prev + increment);
        });
      }, stepMs);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, durationSec, playbackSpeed]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (progress >= 100) {
      setProgress(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newProgress = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
    setProgress(newProgress);
  };

  const toggleSpeed = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (playbackSpeed === 1) setPlaybackSpeed(1.5);
    else if (playbackSpeed === 1.5) setPlaybackSpeed(2);
    else setPlaybackSpeed(1);
  };

  if (variant === "compact") {
    return (
      <div
        onClick={(e) => e.stopPropagation()}
        className={`inline-flex items-center gap-2 rounded-xl border border-teal-200/80 bg-teal/5 px-2.5 py-1.5 transition-colors hover:bg-teal/10 ${className}`}
        title="Play Customer Voice Note"
      >
        <button
          type="button"
          onClick={togglePlay}
          className="flex size-7 items-center justify-center rounded-full bg-teal text-white shadow-2xs transition-transform active:scale-95 hover:bg-teal/90"
          aria-label={isPlaying ? "Pause voice message" : "Play voice message"}
        >
          {isPlaying ? (
            <Pause className="size-3.5 fill-white stroke-none" />
          ) : (
            <Play className="ml-0.5 size-3.5 fill-white stroke-none" />
          )}
        </button>

        {/* Compact Waveform Visualizer */}
        <div
          onClick={handleScrub}
          className="flex cursor-pointer items-center gap-0.5 py-1"
          title="Click to seek"
        >
          {waveform.slice(0, 10).map((barHeight, idx) => {
            const barProgress = (idx / 10) * 100;
            const isFilled = progress >= barProgress;
            return (
              <span
                key={idx}
                style={{ height: `${Math.max(6, Math.round(barHeight * 0.2))}px` }}
                className={`w-0.75 rounded-full transition-all duration-150 ${
                  isFilled
                    ? "bg-teal"
                    : isPlaying
                    ? "bg-teal/30 animate-pulse"
                    : "bg-slate-300"
                }`}
              />
            );
          })}
        </div>

        {/* Time duration */}
        <span className="text-[11px] font-bold text-navy tabular-nums select-none">
          {isPlaying ? currentFormatted : voiceNote.durationFormatted}
        </span>
      </div>
    );
  }

  // Full detailed variant for Modal
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={`rounded-2xl bg-teal/5 p-3.5 ${className}`}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold text-navy">
          <Volume2 className="size-4 text-teal" />
          <span>Customer Voice Note</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleSpeed}
            className="rounded-md bg-white px-2 py-0.5 text-[11px] font-bold text-teal hover:bg-teal/10 shadow-2xs"
          >
            {playbackSpeed}x
          </button>
          <span className="text-xs font-semibold text-slate-500 tabular-nums">
            {currentFormatted} / {voiceNote.durationFormatted}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={togglePlay}
          className="flex size-10 items-center justify-center rounded-full bg-teal text-white shadow-xs transition-transform active:scale-95 hover:bg-teal/90"
          aria-label={isPlaying ? "Pause voice message" : "Play voice message"}
        >
          {isPlaying ? (
            <Pause className="size-5 fill-white stroke-none" />
          ) : (
            <Play className="ml-0.5 size-5 fill-white stroke-none" />
          )}
        </button>

        {/* Full Waveform Scrubber */}
        <div
          onClick={handleScrub}
          className="relative flex flex-1 cursor-pointer items-center gap-1 py-3"
          title="Click or drag to seek"
        >
          {waveform.map((barHeight, idx) => {
            const barProgress = (idx / waveform.length) * 100;
            const isFilled = progress >= barProgress;
            return (
              <span
                key={idx}
                style={{ height: `${Math.max(8, Math.round(barHeight * 0.32))}px` }}
                className={`flex-1 rounded-full transition-all duration-150 ${
                  isFilled
                    ? "bg-teal"
                    : isPlaying
                    ? "bg-teal/25 animate-pulse"
                    : "bg-slate-300"
                }`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
