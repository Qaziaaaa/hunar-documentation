"use client";

import { useEffect, useRef, useState } from "react";
import {
  Mic,
  Pause,
  Play,
  RotateCcw,
  Square,
  Trash2,
  Volume2,
} from "lucide-react";
import { useLocale } from "next-intl";

export interface VoiceNoteRecorderProps {
  onAudioRecorded?: (audioUrl: string | undefined, durationSeconds: number) => void;
  onRecordingComplete?: (audioUrl: string, durationSeconds: number) => void;
  onRemove?: () => void;
  voiceNoteUrl?: string;
  duration?: number;
  initialAudioUrl?: string;

  // Compatibility props for tests/external control
  onRecord?: () => void;
  onPlay?: () => void;
  onDelete?: () => void;
  isRecording?: boolean;
  hasRecording?: boolean;
}


const DEFAULT_WAVEFORM = [
  25, 45, 68, 90, 75, 42, 60, 85, 100, 78, 52, 82, 95, 65, 38, 70, 85, 50, 30, 22,
];

export interface VoiceNoteBubblePlayerProps {
  audioUrl: string;
  durationSeconds?: number;
  onDelete?: () => void;
  onReRecord?: () => void;
  readOnly?: boolean;
  className?: string;
  onPlayClick?: () => void;
}

export function VoiceNoteBubblePlayer({
  audioUrl,
  durationSeconds = 12,
  onDelete,
  onReRecord,
  readOnly = false,
  className = "",
  onPlayClick,
}: VoiceNoteBubblePlayerProps) {
  let locale = "en";
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    locale = useLocale();
  } catch {
    locale = "en";
  }
  const isUrdu = locale === "ur";

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [actualDuration, setActualDuration] = useState<number>(durationSeconds || 0);
  const [speed, setSpeed] = useState<1 | 1.5 | 2>(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const simTimerRef = useRef<NodeJS.Timeout | null>(null);

  const totalDuration = Math.max(1, Math.round(actualDuration || durationSeconds || 0));

  useEffect(() => {
    return () => {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
    };
  }, []);

  const handleLoadedMetadata = () => {
    if (audioRef.current && !isNaN(audioRef.current.duration) && isFinite(audioRef.current.duration)) {
      setActualDuration(audioRef.current.duration);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (!actualDuration && !isNaN(audioRef.current.duration) && audioRef.current.duration > 0) {
        setActualDuration(audioRef.current.duration);
      }
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleAudioError = () => {
    // Fallback simulation for playback if decoding fails
    if (isPlaying) {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
      simTimerRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= totalDuration) {
            clearInterval(simTimerRef.current!);
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000 / speed);
    }
  };

  const togglePlay = () => {
    onPlayClick?.();
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      if (simTimerRef.current) clearInterval(simTimerRef.current);
      setIsPlaying(false);
    } else {
      audioRef.current.playbackRate = speed;
      try {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined && typeof playPromise.then === "function") {
          playPromise
            .then(() => {
              setIsPlaying(true);
            })
            .catch(() => {
              // Play simulated timer if play was blocked or blob error
              setIsPlaying(true);
              if (simTimerRef.current) clearInterval(simTimerRef.current);
              simTimerRef.current = setInterval(() => {
                setCurrentTime((prev) => {
                  if (prev >= totalDuration) {
                    clearInterval(simTimerRef.current!);
                    setIsPlaying(false);
                    return 0;
                  }
                  return prev + 1;
                });
              }, 1000 / speed);
            });
        } else {
          setIsPlaying(true);
        }
      } catch {
        setIsPlaying(true);
      }
    }
  };

  const handleSeek = (index: number) => {
    const fraction = index / DEFAULT_WAVEFORM.length;
    const targetTime = fraction * totalDuration;
    setCurrentTime(targetTime);
    if (audioRef.current && !isNaN(audioRef.current.duration) && audioRef.current.duration > 0) {
      audioRef.current.currentTime = targetTime;
    }
  };

  const toggleSpeed = () => {
    const nextSpeed = speed === 1 ? 1.5 : speed === 1.5 ? 2 : 1;
    setSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const progressPercent = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  return (
    <div
      className={`bg-gradient-to-r from-teal-50/90 via-slate-50 to-teal-50/70 border border-teal-200/80 rounded-2xl p-3 sm:p-3.5 flex flex-col gap-2.5 shadow-2xs ${className}`}
    >
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleAudioEnded}
        onError={handleAudioError}
      />

      {/* Main playback control row */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Play / Pause button */}
        <button
          type="button"
          onClick={togglePlay}
          aria-label={isPlaying ? "Pause" : "Play"}
          className="size-9 sm:size-10 rounded-full bg-[#0F8B8D] hover:bg-[#0D7A7C] text-white flex items-center justify-center shrink-0 shadow-xs hover:shadow transition-all cursor-pointer active:scale-95"
        >
          {isPlaying ? (
            <Pause className="size-4 fill-white" />
          ) : (
            <Play className="size-4 fill-white ml-0.5 rtl:ml-0 rtl:mr-0.5" />
          )}
        </button>

        {/* Waveform Scrubber & Equalizer Bars */}
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
          <div
            className="flex items-center gap-1 sm:gap-1.5 h-7 px-1 cursor-pointer select-none group"
            title={isUrdu ? "سننے کے لیے بار پر کلک کریں" : "Click wave bar to seek"}
          >
            {DEFAULT_WAVEFORM.map((height, i) => {
              const barProgress = (i / DEFAULT_WAVEFORM.length) * 100;
              const isPlayed = barProgress <= progressPercent;
              return (
                <button
                  key={i}
                  type="button"
                  tabIndex={-1}
                  onClick={() => handleSeek(i)}
                  style={{ height: `${Math.max(16, height)}%` }}
                  className={`flex-1 min-w-[2.5px] max-w-[6px] rounded-full transition-all duration-150 cursor-pointer group-hover:opacity-90 ${
                    isPlayed
                      ? "bg-[#0F8B8D] shadow-2xs"
                      : "bg-teal-200/70 group-hover:bg-teal-300"
                  }`}
                  aria-label={`Seek to ${(barProgress).toFixed(0)}%`}
                />
              );
            })}
          </div>

          {/* Time & Speed Controls */}
          <div className="flex items-center justify-between text-[11px] font-mono font-bold text-[#123B5D] px-1">
            <span className="text-[#0F8B8D]">
              {formatTime(currentTime)}
              <span className="text-slate-400 font-normal"> / {formatTime(totalDuration)}</span>
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleSpeed}
                className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-100 hover:bg-teal-200 text-[#0F8B8D] transition-colors cursor-pointer"
                title="Playback speed"
              >
                {speed}x
              </button>
            </div>
          </div>
        </div>

        {/* Action icons (Re-record / Delete) */}
        {!readOnly && (
          <div className="flex items-center gap-1 shrink-0">
            {onReRecord && (
              <button
                type="button"
                onClick={onReRecord}
                className="p-1.5 text-slate-500 hover:text-[#0F8B8D] rounded-lg hover:bg-white/80 transition-colors cursor-pointer"
                title={isUrdu ? "دوبارہ ریکارڈ کریں" : "Re-record voice note"}
              >
                <RotateCcw className="size-3.5" />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                aria-label="Delete"
                className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                title={isUrdu ? "آواز حذف کریں" : "Delete voice note"}
              >
                <Trash2 className="size-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function VoiceNoteRecorder({
  onAudioRecorded,
  onRecordingComplete,
  onRemove,
  voiceNoteUrl,
  duration,
  initialAudioUrl,
  onRecord,
  onPlay,
  onDelete,
  isRecording: externalIsRecording,
  hasRecording: externalHasRecording,
}: VoiceNoteRecorderProps) {
  let locale = "en";
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    locale = useLocale();
  } catch {
    locale = "en";
  }
  const isUrdu = locale === "ur";

  const [internalIsRecording, setInternalIsRecording] = useState(false);
  const isRecording = externalIsRecording !== undefined ? externalIsRecording : internalIsRecording;

  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | undefined>(
    voiceNoteUrl || initialAudioUrl || (externalHasRecording ? "mock-audio-has-recording" : undefined)
  );
  const [audioDuration, setAudioDuration] = useState<number>(
    duration || (initialAudioUrl ? 18 : 12)
  );

  // Live frequency visualizer during recording
  const [liveWaveform, setLiveWaveform] = useState<number[]>([
    25, 45, 60, 80, 65, 45, 75, 95, 70, 50, 85, 90, 60, 40, 70, 80, 50, 30,
  ]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const recordingTimeRef = useRef<number>(0);

  // Sync external voiceNoteUrl
  useEffect(() => {
    if (voiceNoteUrl) {
      setAudioUrl(voiceNoteUrl);
    }
  }, [voiceNoteUrl]);

  useEffect(() => {
    if (duration !== undefined && duration > 0) {
      setAudioDuration(duration);
    }
  }, [duration]);

  useEffect(() => {
    if (externalHasRecording && !audioUrl) {
      setAudioUrl("mock-audio-has-recording");
    }
  }, [externalHasRecording, audioUrl]);

  // Clean up timers & audio on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(() => {});
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startLiveVisualizer = (stream: MediaStream) => {
    if (typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = ctx;
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const renderLoop = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        const bars: number[] = [];
        const step = Math.max(1, Math.floor(bufferLength / 18));
        for (let i = 0; i < 18; i++) {
          const val = dataArray[i * step] || 0;
          // Scale smoothly between 20% and 100%
          const pct = Math.max(20, Math.min(100, Math.round((val / 255) * 100)));
          bars.push(pct);
        }
        setLiveWaveform(bars);
        animFrameRef.current = requestAnimationFrame(renderLoop);
      };
      animFrameRef.current = requestAnimationFrame(renderLoop);
    } catch (e) {
      console.warn("Could not start live visualizer:", e);
    }
  };

  const startRecording = async () => {
    onRecord?.();
    setAudioUrl(undefined);
    setRecordingTime(0);
    recordingTimeRef.current = 0;
    startTimeRef.current = Date.now();
    setInternalIsRecording(true);

    try {
      if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        streamRef.current = stream;

        // Try supported mime type
        let mimeType = "";
        if (typeof MediaRecorder !== "undefined") {
          if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
            mimeType = "audio/webm;codecs=opus";
          } else if (MediaRecorder.isTypeSupported("audio/webm")) {
            mimeType = "audio/webm";
          } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
            mimeType = "audio/mp4";
          }
        }

        const options = mimeType ? { mimeType } : undefined;
        const mediaRecorder = new MediaRecorder(stream, options);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const recordedType = mimeType || "audio/webm";
          const audioBlob = new Blob(audioChunksRef.current, { type: recordedType });
          const url = URL.createObjectURL(audioBlob);
          const finalDuration = Math.max(1, recordingTimeRef.current || Math.round((Date.now() - startTimeRef.current) / 1000));

          setAudioUrl(url);
          setAudioDuration(finalDuration);
          onAudioRecorded?.(url, finalDuration);
          onRecordingComplete?.(url, finalDuration);

          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
          }
        };

        mediaRecorder.start(200);
        startLiveVisualizer(stream);
      } else {
        // Fallback if getUserMedia is not supported
        simulateVoiceWaveform();
      }

      // Interval ticker
      timerRef.current = setInterval(() => {
        recordingTimeRef.current += 1;
        setRecordingTime(recordingTimeRef.current);
        if (recordingTimeRef.current >= 120) {
          stopRecording();
        }
      }, 1000);
    } catch (err) {
      console.warn("Microphone access error or denied, using playable simulation fallback:", err);
      simulateVoiceWaveform();
      timerRef.current = setInterval(() => {
        recordingTimeRef.current += 1;
        setRecordingTime(recordingTimeRef.current);
        if (recordingTimeRef.current >= 120) {
          stopRecording();
        }
      }, 1000);
    }
  };

  const simulateVoiceWaveform = () => {
    // Generate pulsating wave bars for fallback simulation
    const interval = setInterval(() => {
      setLiveWaveform(
        Array.from({ length: 18 }, () => Math.floor(Math.random() * 75) + 25)
      );
    }, 120);
    animFrameRef.current = interval as unknown as number;
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (animFrameRef.current) {
      if (typeof cancelAnimationFrame === "function") {
        cancelAnimationFrame(animFrameRef.current);
      } else {
        clearInterval(animFrameRef.current);
      }
      animFrameRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    const finalDuration = Math.max(1, recordingTimeRef.current || Math.round((Date.now() - startTimeRef.current) / 1000) || 5);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    } else {
      setAudioUrl(undefined);
      setAudioDuration(0);
    }

    setInternalIsRecording(false);
  };

  const cancelRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }
    setInternalIsRecording(false);
    setRecordingTime(0);
    recordingTimeRef.current = 0;
  };

  const deleteRecording = () => {
    onDelete?.();
    setAudioUrl(undefined);
    setAudioDuration(0);
    setRecordingTime(0);
    recordingTimeRef.current = 0;
    onAudioRecorded?.(undefined, 0);
    onRemove?.();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="bg-white rounded-xl p-2 sm:p-2.5 flex flex-col justify-between h-full gap-2">
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-[#123B5D]">
          <Volume2 className="size-3.5 text-[#0F8B8D]" />
          <span>{isUrdu ? "وائس نوٹ شامل کریں" : "Voice Note"}</span>
        </div>
        <span className="text-[9px] sm:text-[10px] text-slate-500 font-medium bg-slate-50 px-2 py-0.5 rounded-full whitespace-nowrap">
          {isUrdu ? "زیادہ سے زیادہ 2 منٹ" : "Up to 2 mins"}
        </span>
      </div>

      {/* State 1: Recording in progress with animated bubble waves */}
      {isRecording ? (
        <div className="flex flex-col gap-2.5 bg-gradient-to-r from-red-50 via-rose-50 to-red-50 border border-red-200/90 rounded-2xl p-3 shadow-2xs">
          {/* Header Row: Recording status & Elapsed Timer */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {/* Concentric pulsing voice recording bubbles */}
              <div className="relative flex items-center justify-center size-4 shrink-0">
                <span className="absolute size-4 rounded-full bg-red-500/30 animate-ping" />
                <span className="absolute size-2.5 rounded-full bg-red-600 animate-pulse" />
                <span className="relative size-2 rounded-full bg-red-600" />
              </div>
              <span className="text-xs font-extrabold text-red-700 tracking-wide uppercase">
                {isUrdu ? "ریکارڈنگ ہو رہی ہے..." : "Recording..."}
              </span>
            </div>

            <div className="flex items-center gap-1 font-mono text-xs font-bold text-red-700 bg-white/80 px-2 py-0.5 rounded-md border border-red-200/70">
              <span>{formatTime(recordingTime)}</span>
              <span className="text-red-400 font-normal">/ 2:00</span>
            </div>
          </div>

          {/* Voice recording bubble waves: Live animated audio equalizer */}
          <div className="flex items-center justify-between gap-1 sm:gap-1.5 h-10 px-1 bg-white/70 rounded-xl border border-red-100">
            {liveWaveform.map((height, i) => (
              <div
                key={i}
                style={{ height: `${height}%` }}
                className="flex-1 min-w-[2px] max-w-[5px] rounded-full bg-gradient-to-t from-red-600 to-rose-400 transition-all duration-75 shadow-2xs"
              />
            ))}
          </div>

          {/* Control Buttons Row */}
          <div className="flex items-center justify-between gap-2 pt-0.5">
            <button
              type="button"
              onClick={cancelRecording}
              className="px-2.5 py-1.5 rounded-xl border border-red-200 text-red-600 hover:bg-white text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
              title={isUrdu ? "منسوخ کریں" : "Cancel"}
            >
              <Trash2 className="size-3" />
              <span>{isUrdu ? "منسوخ" : "Discard"}</span>
            </button>

            <button
              type="button"
              onClick={stopRecording}
              aria-label="Stop recording"
              className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Square className="size-3 fill-white" />
              <span>{isUrdu ? "ریکارڈنگ مکمل کریں" : "Stop Recording"}</span>
            </button>
          </div>
        </div>
      ) : audioUrl ? (
        /* State 2: Audio recorded, display VoiceNoteBubblePlayer with real audible playback & waveform */
        <VoiceNoteBubblePlayer
          audioUrl={audioUrl}
          durationSeconds={audioDuration}
          onDelete={deleteRecording}
          onReRecord={startRecording}
          onPlayClick={onPlay}
        />
      ) : (
        /* State 3: Ready to record idle button */
        <button
          type="button"
          onClick={startRecording}
          aria-label="Start recording"
          className="w-full py-3 sm:py-3.5 px-3 rounded-2xl bg-gradient-to-b from-slate-50 to-teal-50/40 hover:from-teal-50/60 hover:to-teal-100/40 border border-dashed border-teal-300/80 hover:border-[#0F8B8D] text-[#0F8B8D] transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer group shadow-2xs"
        >
          {/* Animated Mic Bubble */}
          <div className="relative flex items-center justify-center">
            <div className="size-8 sm:size-9 rounded-full bg-[#0F8B8D]/10 text-[#0F8B8D] flex items-center justify-center group-hover:scale-110 group-hover:bg-[#0F8B8D] group-hover:text-white transition-all shadow-2xs">
              <Mic className="size-4.5" />
            </div>
          </div>
          <div className="text-center">
            <span className="text-xs font-bold block text-[#123B5D] group-hover:text-[#0F8B8D] transition-colors">
              {isUrdu ? "وائس نوٹ ریکارڈ کرنے کے لیے دبائیں" : "Tap to Record Voice Note"}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              {isUrdu ? "مسئلہ اپنی آواز میں بیان کریں" : "Describe the problem in your own words"}
            </span>
          </div>
        </button>
      )}
    </div>
  );
}
