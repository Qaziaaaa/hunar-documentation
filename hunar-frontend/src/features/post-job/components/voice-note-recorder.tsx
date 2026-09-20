"use client";

import { useEffect, useRef, useState } from "react";
import {
  Mic,
  Pause,
  Play,
  Square,
  Trash2,
  Volume2,
} from "lucide-react";
import { useLocale } from "next-intl";

interface VoiceNoteRecorderProps {
  onAudioRecorded?: (audioUrl: string | undefined, durationSeconds: number) => void;
  onRecordingComplete?: (audioUrl: string, durationSeconds: number) => void;
  onRemove?: () => void;
  voiceNoteUrl?: string;
  duration?: number;
  initialAudioUrl?: string;
}

export function VoiceNoteRecorder({
  onAudioRecorded,
  onRecordingComplete,
  onRemove,
  voiceNoteUrl,
  duration,
  initialAudioUrl,
}: VoiceNoteRecorderProps) {
  const locale = useLocale();
  const isUrdu = locale === "ur";
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | undefined>(
    voiceNoteUrl || initialAudioUrl
  );
  const [audioDuration, setAudioDuration] = useState(
    duration || (initialAudioUrl ? 18 : 0)
  );

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          const url = URL.createObjectURL(audioBlob);
          setAudioUrl(url);
          setAudioDuration(recordingTime);
          onAudioRecorded?.(url, recordingTime);
          onRecordingComplete?.(url, recordingTime);
          stream.getTracks().forEach((track) => track.stop());
        };

        mediaRecorder.start();
      }

      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= 120) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch {
      // Fallback if mic permission is denied or simulated
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    } else {
      // Simulation fallback
      const mockAudioUrl = "mock-audio-recorded";
      const finalDuration = recordingTime || 12;
      setAudioUrl(mockAudioUrl);
      setAudioDuration(finalDuration);
      onAudioRecorded?.(mockAudioUrl, finalDuration);
      onRecordingComplete?.(mockAudioUrl, finalDuration);
    }

    setIsRecording(false);
  };

  const deleteRecording = () => {
    setAudioUrl(undefined);
    setAudioDuration(0);
    setRecordingTime(0);
    setIsPlaying(false);
    onAudioRecorded?.(undefined, 0);
    onRemove?.();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="bg-white rounded-xl p-1 sm:p-2 flex flex-col justify-between h-full gap-2">
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1 text-[11px] sm:text-xs font-bold text-[#123B5D]">
          <Volume2 className="size-3.5 text-[#0F8B8D]" />
          <span>{isUrdu ? "وائس نوٹ" : "Voice Note"}</span>
        </div>
        <span className="text-[9px] sm:text-[10px] text-slate-500 font-medium bg-slate-50 px-1.5 py-0.5 rounded-full whitespace-nowrap">
          {isUrdu ? "زیادہ سے زیادہ 2 منٹ" : "Up to 2m"}
        </span>
      </div>

      {/* Recording in progress */}
      {isRecording ? (
        <div className="flex items-center justify-between bg-red-50 rounded-xl p-2.5 text-red-700">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="size-2.5 rounded-full bg-red-600 animate-ping shrink-0" />
            <span className="font-mono text-xs font-bold truncate">
              {formatTime(recordingTime)}
            </span>
          </div>
          <button
            type="button"
            onClick={stopRecording}
            className="px-2.5 py-1 rounded-lg bg-red-600 text-white text-[11px] font-bold hover:bg-red-700 transition-colors flex items-center gap-1 shadow-2xs cursor-pointer shrink-0"
          >
            <Square className="size-2.5 fill-white" />
            <span>{isUrdu ? "مکمل کریں" : "Done"}</span>
          </button>
        </div>
      ) : audioUrl ? (
        /* Audio playback ready */
        <div className="flex items-center justify-between bg-slate-50/80 rounded-xl p-2 sm:p-2.5 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => setIsPlaying((prev) => !prev)}
              className="size-8 rounded-full bg-[#0F8B8D] text-white flex items-center justify-center hover:bg-[#0F8B8D]/90 transition-colors shadow-2xs shrink-0 cursor-pointer"
            >
              {isPlaying ? (
                <Pause className="size-3.5 fill-white" />
              ) : (
                <Play className="size-3.5 fill-white ml-0.5" />
              )}
            </button>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-bold text-slate-900 truncate">
                {isUrdu ? "ریکارڈ شدہ" : "Recorded"}
              </span>
              <span className="text-[9px] text-slate-500">
                {formatTime(audioDuration)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={deleteRecording}
            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            title="Delete audio note"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      ) : (
        /* Ready to record button */
        <button
          type="button"
          onClick={startRecording}
          className="w-full py-2.5 sm:py-3 px-2 rounded-xl bg-slate-50 hover:bg-[#0F8B8D]/5 text-[#0F8B8D] text-[11px] sm:text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer group shadow-2xs"
        >
          <div className="size-7 sm:size-8 rounded-full bg-[#0F8B8D]/10 text-[#0F8B8D] flex items-center justify-center group-hover:scale-110 transition-transform">
            <Mic className="size-4" />
          </div>
          <span className="truncate">{isUrdu ? "ریکارڈ کرنے کے لیے دبائیں" : "Tap to Record"}</span>
        </button>
      )}
    </div>
  );
}
