"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Pause, Volume2, Mic } from "lucide-react";
import { audioManager } from "../lib/audio-manager";

interface VoiceMessageBubbleProps {
  audioUrl?: string;
  durationSeconds?: number;
  isSender?: boolean;
  variant?: "navy" | "teal";
}

export function VoiceMessageBubble({
  audioUrl,
  durationSeconds = 12,
  isSender = true,
  variant = "navy",
}: VoiceMessageBubbleProps) {
  if (!audioUrl) return null;

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState<1 | 1.5 | 2>(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const totalSec = Math.max(1, durationSeconds || 1);
  const currentSec = Math.min(totalSec, Math.floor((progress / 100) * totalSec));
  const formattedTime = `0:${currentSec < 10 ? "0" : ""}${currentSec}`;
  const totalFormatted = `0:${totalSec < 10 ? "0" : ""}${totalSec}`;

  // 16 waveform bar heights
  const bars = [25, 45, 80, 60, 95, 40, 70, 90, 50, 75, 100, 65, 45, 85, 55, 30];

  useEffect(() => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.playbackRate = speed;
      audio.onended = () => {
        setIsPlaying(false);
        setProgress(0);
        audioManager.stop(audio);
      };
      audio.ontimeupdate = () => {
        if (audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
          setProgress((audio.currentTime / audio.duration) * 100);
        }
      };
      audio.onerror = (e) => {
        console.warn("[VoiceMessageBubble] Audio loading/playback error:", e);
        setIsPlaying(false);
        audioManager.stop(audio);
      };
      audioRef.current = audio;
    } else {
      audioRef.current = null;
    }
    return () => {
      if (audioRef.current) {
        audioManager.stop(audioRef.current);
        audioRef.current.pause();
        audioRef.current = null;
      }
      setIsPlaying(false);
    };
  }, [audioUrl, speed]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      audioManager.stop(audioRef.current);
      setIsPlaying(false);
      return;
    }

    audioRef.current.playbackRate = speed;
    audioManager.play(audioRef.current, () => {
      setIsPlaying(false);
    });
    audioRef.current
      .play()
      .then(() => {
        setIsPlaying(true);
      })
      .catch((err) => {
        console.warn("[VoiceMessageBubble] Audio play blocked/failed:", err);
        setIsPlaying(false);
        if (audioRef.current) audioManager.stop(audioRef.current);
      });
  };

  const toggleSpeed = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextSpeed = speed === 1 ? 1.5 : speed === 1.5 ? 2 : 1;
    setSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const isNavy = variant === "navy";

  return (
    <div
      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl min-w-[170px] max-w-[220px] sm:max-w-[250px] shadow-2xs ${
        isSender
          ? isNavy
            ? "bg-[#123B5D] text-white rounded-br-xs"
            : "bg-[#0F8B8D] text-white rounded-br-xs"
          : isNavy
          ? "bg-white text-slate-900 border border-slate-200/90 rounded-bl-xs"
          : "bg-teal-50/90 text-[#0F8B8D] border border-teal-200/80 rounded-bl-xs"
      }`}
    >
      {/* Play/Pause Button */}
      <button
        type="button"
        onClick={togglePlay}
        className={`size-7 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 cursor-pointer shadow-xs ${
          isSender
            ? isNavy
              ? "bg-white text-[#123B5D] hover:bg-slate-100"
              : "bg-white text-[#0F8B8D] hover:bg-slate-100"
            : isNavy
            ? "bg-[#123B5D] text-white hover:bg-[#0E2E49]"
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
                    : isNavy
                    ? isPlayed
                      ? "#123B5D"
                      : "#CBD5E1"
                    : isPlayed
                    ? "#0F8B8D"
                    : "#CBD5E1",
                }}
              />
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[9.5px] font-mono leading-none">
          <span
            className={
              isSender
                ? "text-white font-bold"
                : isNavy
                ? "text-slate-700 font-bold"
                : "text-teal-900 font-bold"
            }
          >
            {isPlaying ? formattedTime : totalFormatted}
          </span>
          <button
            type="button"
            onClick={toggleSpeed}
            className={`px-1 py-0.2 rounded font-bold text-[8.5px] uppercase cursor-pointer transition-colors ${
              isSender
                ? "bg-white/20 hover:bg-white/30 text-white"
                : isNavy
                ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
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
