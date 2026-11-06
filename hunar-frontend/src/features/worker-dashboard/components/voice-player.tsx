"use client";

import { useState, useEffect, useRef, useMemo } from "react";
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
  title = "Customer Voice Note",
  className = "",
}: {
  voiceNote: VoiceNote;
  variant?: "compact" | "full";
  title?: string;
  className?: string;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 100%
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [actualDuration, setActualDuration] = useState<number>(voiceNote.durationSeconds || 0);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 1.5 | 2>(1);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const audioUrl = voiceNote?.audioUrl?.trim();
  const defaultPattern = [
    25, 45, 60, 40, 75, 90, 65, 50, 85, 100, 70, 45, 80, 95, 85, 60, 40, 70, 90, 75, 55, 80, 65, 45, 60, 40, 55, 70, 40, 25
  ];
  const waveform: number[] = useMemo(() => {
    const raw = voiceNote?.waveformPattern && voiceNote.waveformPattern.length > 0
      ? voiceNote.waveformPattern
      : defaultPattern;
    if (raw.length >= 25) return raw;
    const result: number[] = [];
    const targetCount = 30;
    for (let i = 0; i < targetCount; i++) {
      const idx = (i / targetCount) * raw.length;
      const lower = Math.floor(idx);
      const upper = Math.min(raw.length - 1, Math.ceil(idx));
      const weight = idx - lower;
      const val = Math.round((raw[lower] || 30) * (1 - weight) + (raw[upper] || 30) * weight);
      result.push(val);
    }
    return result;
  }, [voiceNote?.waveformPattern]);

  // Sync state whenever audioUrl or voiceNote.durationSeconds changes
  useEffect(() => {
    setCurrentTime(0);
    setProgress(0);
    setIsPlaying(false);
    if (voiceNote?.durationSeconds && voiceNote.durationSeconds > 0) {
      setActualDuration(voiceNote.durationSeconds);
    } else {
      setActualDuration(0);
    }
  }, [audioUrl, voiceNote?.durationSeconds]);

  // Decode audio duration via Web Audio API as an instant, foolproof duration resolver
  // (Works seamlessly for WebM/Opus data URIs, blobs, and server URLs without duration headers)
  useEffect(() => {
    if (!audioUrl) return;
    if (actualDuration > 0) return;

    let cancelled = false;

    const decodeAudioDuration = async () => {
      try {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextClass) return;

        const res = await fetch(audioUrl);
        const arrayBuffer = await res.arrayBuffer();
        if (cancelled) return;

        const ctx = new AudioContextClass();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        ctx.close().catch(() => {});

        if (!cancelled && audioBuffer && audioBuffer.duration > 0 && isFinite(audioBuffer.duration)) {
          setActualDuration((prev) => (prev > 0 ? prev : audioBuffer.duration));
        }
      } catch {
        // Fallback handled by HTML5 audio element
      }
    };

    decodeAudioDuration();

    return () => {
      cancelled = true;
    };
  }, [audioUrl, actualDuration]);

  // Check if audio element already loaded metadata before React attached listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (audio && audio.readyState >= 1) {
      handleLoadedMetadata();
    }
  }, [audioUrl]);

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
      // Chrome MediaRecorder WebM bug: seeking near the end clamps currentTime to the true duration
      const onSeeked = () => {
        audio.removeEventListener("seeked", onSeeked);
        const resolved =
          !isNaN(audio.duration) && isFinite(audio.duration) && audio.duration > 0
            ? audio.duration
            : audio.currentTime;
        if (!isNaN(resolved) && isFinite(resolved) && resolved > 0) {
          setActualDuration(resolved);
        }
        audio.currentTime = 0;
      };
      audio.addEventListener("seeked", onSeeked, { once: true });
      try {
        audio.currentTime = 1e101;
      } catch {
        // Ignored; Web Audio API handles duration resolution
      }
    }
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;

    const ct = audio.currentTime;
    setCurrentTime(ct);

    const dur =
      actualDuration > 0
        ? actualDuration
        : !isNaN(audio.duration) && isFinite(audio.duration) && audio.duration > 0
        ? audio.duration
        : 0;

    if (dur > 0) {
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
      if (finalTime > 0 && actualDuration <= 0) {
        setActualDuration(finalTime);
      }
      audioRef.current.currentTime = 0;
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

    const dur =
      actualDuration > 0
        ? actualDuration
        : audioRef.current && !isNaN(audioRef.current.duration) && isFinite(audioRef.current.duration)
        ? audioRef.current.duration
        : 0;

    if (audioRef.current && dur > 0) {
      const targetTime = (newProgress / 100) * dur;
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
          <span>{title}</span>
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
          className="relative flex flex-1 cursor-pointer items-center justify-between gap-0.5 sm:gap-1 py-3 select-none h-10"
          title="Click or drag to seek"
        >
          {waveform.map((barHeight, idx) => {
            const barProgress = (idx / waveform.length) * 100;
            const isFilled = progress >= barProgress;
            return (
              <span
                key={idx}
                style={{ height: `${Math.max(6, Math.min(28, Math.round(barHeight * 0.28)))}px` }}
                className={`flex-1 max-w-[3px] sm:max-w-[4px] min-w-[2px] rounded-full transition-all duration-150 ${
                  isFilled
                    ? "bg-[#0F8B8D]"
                    : isPlaying
                    ? "bg-[#0F8B8D]/35 animate-pulse"
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
