"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Pause, Volume2, Mic } from "lucide-react";

interface VoiceMessageBubbleProps {
  audioUrl?: string;
  durationSeconds?: number;
  isSender?: boolean;
}

export function VoiceMessageBubble({
  audioUrl,
  durationSeconds = 12,
  isSender = true,
}: VoiceMessageBubbleProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState<1 | 1.5 | 2>(1);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const totalSec = durationSeconds || 12;
  const currentSec = Math.floor((progress / 100) * totalSec);
  const formattedTime = `0:${currentSec < 10 ? "0" : ""}${currentSec}`;
  const totalFormatted = `0:${totalSec < 10 ? "0" : ""}${totalSec}`;

  // 16 waveform bar heights
  const bars = [25, 45, 80, 60, 95, 40, 70, 90, 50, 75, 100, 65, 45, 85, 55, 30];

  useEffect(() => {
    if (audioUrl) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.playbackRate = speed;
      audioRef.current.onended = () => {
        setIsPlaying(false);
        setProgress(0);
      };
      audioRef.current.ontimeupdate = () => {
        if (audioRef.current && audioRef.current.duration) {
          setProgress(
            (audioRef.current.currentTime / audioRef.current.duration) * 100
          );
        }
      };
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [audioUrl, speed]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.playbackRate = speed;
        audioRef.current.play().catch(() => {
          simulatePlayback();
        });
        setIsPlaying(true);
      }
    } else {
      simulatePlayback();
    }
  };

  const simulatePlayback = () => {
    if (isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      const stepMs = 100;
      const totalSteps = (totalSec * 1000) / (stepMs * speed);
      const increment = 100 / totalSteps;

      timerRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            if (timerRef.current) clearInterval(timerRef.current);
            setIsPlaying(false);
            return 0;
          }
          return Math.min(100, prev + increment);
        });
      }, stepMs);
    }
  };

  const toggleSpeed = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextSpeed = speed === 1 ? 1.5 : speed === 1.5 ? 2 : 1;
    setSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  return (
    <div
      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl min-w-[170px] max-w-[220px] sm:max-w-[250px] shadow-2xs ${
        isSender
          ? "bg-[#0F8B8D] text-white rounded-br-xs"
          : "bg-teal-50/90 text-[#0F8B8D] border border-teal-200/80 rounded-bl-xs"
      }`}
    >
      {/* Play/Pause Button */}
      <button
        type="button"
        onClick={togglePlay}
        className={`size-7 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 cursor-pointer shadow-xs ${
          isSender
            ? "bg-white text-[#0F8B8D] hover:bg-slate-100"
            : "bg-[#0F8B8D] text-white hover:bg-[#0F8B8D]/90"
        }`}
      >
        {isPlaying ? (
          <Pause className="size-3 fill-current stroke-none" />
        ) : (
          <Play className="size-3 fill-current stroke-none ml-0.5" />
        )}
      </button>

      {/* Waveform & Timeline */}
      <div className="flex-1 flex flex-col gap-0.5 min-w-0">
        <div className="flex items-center gap-0.5 h-4">
          {bars.map((height, i) => {
            const barProgress = (i / bars.length) * 100;
            const isPlayed = progress >= barProgress;
            return (
              <div
                key={i}
                className="flex-1 rounded-full transition-all duration-150"
                style={{
                  height: `${height}%`,
                  backgroundColor: isSender
                    ? isPlayed
                      ? "#FFFFFF"
                      : "rgba(255, 255, 255, 0.4)"
                    : isPlayed
                    ? "#0F8B8D"
                    : "#CBD5E1",
                }}
              />
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[9.5px] font-mono leading-none">
          <span className={isSender ? "text-white font-bold" : "text-teal-900 font-bold"}>
            {isPlaying ? formattedTime : totalFormatted}
          </span>
          <button
            type="button"
            onClick={toggleSpeed}
            className={`px-1 py-0.2 rounded font-bold text-[8.5px] uppercase cursor-pointer transition-colors ${
              isSender
                ? "bg-white/20 hover:bg-white/30 text-white"
                : "bg-teal-100 hover:bg-teal-200 text-teal-900"
            }`}
          >
            {speed}x
          </button>
        </div>
      </div>
    </div>
  );
}
