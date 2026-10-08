"use client";

import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, Mic } from "lucide-react";

interface VoiceNotePlayerProps {
  url: string;
  durationSeconds: number;
  waveform?: number[];
}

export function VoiceNotePlayer({
  url,
  durationSeconds,
  waveform = [25, 45, 65, 85, 95, 75, 40, 60, 90, 100, 80, 50, 70, 85, 60, 30, 20],
}: VoiceNotePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [actualDuration, setActualDuration] = useState<number>(durationSeconds || 0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      if (!isNaN(audio.duration) && isFinite(audio.duration) && audio.duration > 0) {
        setActualDuration(audio.duration);
      } else if (audio.duration === Infinity) {
        const onSeeked = () => {
          audio.removeEventListener("seeked", onSeeked);
          if (!isNaN(audio.duration) && isFinite(audio.duration) && audio.duration > 0) {
            setActualDuration(audio.duration);
          }
          audio.currentTime = 0;
        };
        audio.addEventListener("seeked", onSeeked, { once: true });
        audio.currentTime = 1e101;
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (!isNaN(audio.duration) && isFinite(audio.duration) && audio.duration > 0) {
        if (actualDuration !== audio.duration) {
          setActualDuration(audio.duration);
        }
      } else if (audio.currentTime > 0) {
        setActualDuration((prev) => Math.max(prev, audio.currentTime));
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      if (audio.currentTime > 0) {
        setActualDuration(audio.currentTime);
      }
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [actualDuration]);

  const effectiveDuration = Math.round(actualDuration > 0 ? actualDuration : (durationSeconds || 0));

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          setIsPlaying(true);
          const interval = setInterval(() => {
            setCurrentTime((prev) => {
              if (prev >= effectiveDuration) {
                clearInterval(interval);
                setIsPlaying(false);
                return 0;
              }
              return prev + 1;
            });
          }, 1000);
        });
    }
  };

  const progressPercent = effectiveDuration > 0 ? (currentTime / effectiveDuration) * 100 : 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="bg-teal-50/60 border border-teal-100 rounded-2xl p-3 flex items-center gap-3">
      <audio ref={audioRef} src={url} preload="metadata" />

      {/* Play/Pause Button */}
      <button
        type="button"
        onClick={togglePlay}
        className="w-10 h-10 rounded-xl bg-[#0F8B8D] hover:bg-[#0B7F74] text-white flex items-center justify-center shrink-0 shadow-xs transition-all"
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4 fill-current" />
        ) : (
          <Play className="w-4 h-4 fill-current ml-0.5" />
        )}
      </button>

      {/* Waveform Visualization & Progress */}
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-1 h-7 px-1">
          {waveform.map((height, i) => {
            const barProgress = (i / waveform.length) * 100;
            const isPlayed = barProgress <= progressPercent;

            return (
              <div
                key={i}
                style={{ height: `${Math.max(18, height)}%` }}
                className={`w-1 rounded-full transition-all duration-150 ${
                  isPlayed ? "bg-[#0F8B8D]" : "bg-teal-200"
                }`}
              />
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[11px] font-semibold text-[#0F8B8D]">
          <span className="flex items-center gap-1">
            <Mic className="w-3 h-3" />
            <span>Voice Note</span>
          </span>
          <span>
            {formatTime(currentTime)} / {formatTime(effectiveDuration)}
          </span>
        </div>
      </div>
    </div>
  );
}
