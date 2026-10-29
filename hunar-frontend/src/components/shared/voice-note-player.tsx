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

  // Sync actualDuration when durationSeconds or url prop updates
  useEffect(() => {
    setCurrentTime(0);
    setIsPlaying(false);
    if (durationSeconds && durationSeconds > 0) {
      setActualDuration(durationSeconds);
    } else {
      setActualDuration(0);
    }
  }, [url, durationSeconds]);

  // Decode audio duration via Web Audio API as an instant fallback for WebM/Opus data URIs / blobs
  useEffect(() => {
    if (!url) return;
    if (actualDuration > 0) return;

    let cancelled = false;

    const decodeAudioDuration = async () => {
      try {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextClass) return;

        const res = await fetch(url);
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
  }, [url, actualDuration]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
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
          // Ignored
        }
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

    if (audio.readyState >= 1) {
      handleLoadedMetadata();
    }

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [url]);

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
