"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Pause, Volume2 } from "lucide-react";
import type { VoiceNote } from "../types";

function formatSeconds(secs: number): string {
  if (isNaN(secs) || !isFinite(secs) || secs < 0) return "0:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

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
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [actualDuration, setActualDuration] = useState<number>(voiceNote.durationSeconds || 0);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 1.5 | 2>(1);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const audioUrl = voiceNote?.audioUrl?.trim();
  const defaultPattern = [30, 60, 45, 80, 95, 65, 40, 75, 90, 85, 50, 70, 40, 60, 30];
  const waveform = voiceNote.waveformPattern || defaultPattern;

  const currentFormatted = formatSeconds(currentTime);
  const totalSeconds = Math.round(actualDuration > 0 ? actualDuration : (voiceNote.durationSeconds || 0));
  const totalFormatted = totalSeconds > 0 ? formatSeconds(totalSeconds) : formatSeconds(currentTime);

  useEffect(() => {
    if (audioRef.current && audioUrl) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed, audioUrl]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const handleLoadedMetadata = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!isNaN(audio.duration) && isFinite(audio.duration) && audio.duration > 0) {
      setActualDuration(audio.duration);
    } else if (audio.duration === Infinity) {
      // Chrome MediaRecorder WebM bug: seeking near the end resolves true duration
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
    const audio = audioRef.current;
    if (!audio) return;

    const ct = audio.currentTime;
    setCurrentTime(ct);

    const dur = audio.duration;
    if (!isNaN(dur) && isFinite(dur) && dur > 0) {
      if (actualDuration !== dur) {
        setActualDuration(dur);
      }
      setProgress((ct / dur) * 100);
    } else {
      // If duration is Infinity or unknown, dynamically track current time as minimum duration
      setActualDuration((prev) => Math.max(prev, ct));
      if (actualDuration > 0) {
        setProgress((ct / actualDuration) * 100);
      }
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    if (audioRef.current) {
      const finalTime = audioRef.current.currentTime;
      if (finalTime > 0) {
        setActualDuration(finalTime);
      }
    }
  };

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!audioRef.current || !audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    if (progress >= 100) {
      setProgress(0);
      setCurrentTime(0);
      audioRef.current.currentTime = 0;
    }

    audioRef.current.playbackRate = playbackSpeed;
    audioRef.current
      .play()
      .then(() => {
        setIsPlaying(true);
      })
      .catch((err) => {
        console.warn("Audio playback failed:", err);
        setIsPlaying(false);
      });
  };

  const handleScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newProgress = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
    setProgress(newProgress);

    if (audioRef.current && !isNaN(audioRef.current.duration) && audioRef.current.duration > 0) {
      const targetTime = (newProgress / 100) * audioRef.current.duration;
      audioRef.current.currentTime = targetTime;
      setCurrentTime(targetTime);
    }
  };

  const toggleSpeed = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextSpeed = playbackSpeed === 1 ? 1.5 : playbackSpeed === 1.5 ? 2 : 1;
    setPlaybackSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  if (!audioUrl) {
    return null;
  }

  if (variant === "compact") {
    return (
      <div
        onClick={(e) => e.stopPropagation()}
        className={`inline-flex items-center gap-2 rounded-xl border border-teal-200/80 bg-teal/5 px-2.5 py-1.5 transition-colors hover:bg-teal/10 ${className}`}
        title="Play Customer Voice Note"
      >
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="metadata"
          playsInline
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
        />
        <button
          type="button"
          onClick={togglePlay}
          className="flex size-7 items-center justify-center rounded-full bg-teal text-white shadow-2xs transition-transform active:scale-95 hover:bg-teal/90 cursor-pointer"
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
          className="flex cursor-pointer items-center gap-0.5 py-1 select-none"
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
                    ? "bg-teal/40 animate-pulse"
                    : "bg-slate-300"
                }`}
              />
            );
          })}
        </div>

        {/* Time duration */}
        <span className="text-[11px] font-bold text-navy tabular-nums select-none">
          {isPlaying ? currentFormatted : totalFormatted}
        </span>
      </div>
    );
  }

  // Full detailed variant for Modal
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={`rounded-2xl bg-gradient-to-r from-teal-50/90 via-slate-50 to-teal-50/70 border border-teal-200/80 p-3.5 shadow-2xs ${className}`}
    >
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        playsInline
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
      />
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold text-navy">
          <Volume2 className="size-4 text-teal" />
          <span>Customer Voice Note</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleSpeed}
            className="rounded-md bg-white px-2 py-0.5 text-[11px] font-bold text-teal hover:bg-teal/10 shadow-2xs cursor-pointer"
          >
            {playbackSpeed}x
          </button>
          <span className="text-xs font-semibold text-slate-500 tabular-nums">
            {currentFormatted} / {totalFormatted}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={togglePlay}
          className="flex size-10 items-center justify-center rounded-full bg-teal text-white shadow-xs transition-transform active:scale-95 hover:bg-teal/90 cursor-pointer"
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
          className="relative flex flex-1 cursor-pointer items-center gap-1 py-3 select-none"
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
                    ? "bg-teal/35 animate-pulse"
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
