"use client";

import { useState, useRef, useEffect } from "react";
import {
  Mic,
  Send,
  Square,
  Trash2,
  Paperclip,
  Image as ImageIcon,
  Check,
  Sparkles,
} from "lucide-react";
import { useLocale } from "next-intl";

interface ChatInputBarProps {
  onSendMessage: (text: string) => void;
  onSendVoiceNote: (audioUrl: string, durationSeconds: number) => void;
  onSendImage?: (file: File) => void;
  quickSuggestions?: string[];
  disabled?: boolean;
}

export function ChatInputBar({
  onSendMessage,
  onSendVoiceNote,
  onSendImage,
  quickSuggestions,
  disabled = false,
}: ChatInputBarProps) {
  const locale = useLocale();
  const isUrdu = locale === "ur";

  const [text, setText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const defaultSuggestions = isUrdu
    ? [
        "میں مین گیٹ پر موجود ہوں",
        "آپ کتنی دیر میں پہنچیں گے؟",
        "لوکیشن شیئر کر دی ہے",
        "کیا اضافی سامان کی ضرورت ہے؟",
      ]
    : [
        "I am waiting at the main gate",
        "How far are you?",
        "Location verified",
        "Do you need spare parts?",
      ];

  const suggestions = quickSuggestions || defaultSuggestions;

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startVoiceRecording = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: "audio/webm",
          });
          const url = URL.createObjectURL(audioBlob);
          stream.getTracks().forEach((track) => track.stop());
        };

        mediaRecorder.start();
      }
    } catch {
      console.warn("Microphone access simulated / fallback mode");
    }

    setIsRecording(true);
    setRecordingSeconds(0);
    timerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);
  };

  const cancelRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  const finishAndSendRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const duration = recordingSeconds || 1;

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        const url = URL.createObjectURL(audioBlob);
        onSendVoiceNote(url, duration);
      };
      mediaRecorderRef.current.stop();
    } else {
      // Fallback simulated voice note
      const fallbackUrl = `simulated-voice-${Date.now()}`;
      onSendVoiceNote(fallbackUrl, duration);
    }

    setIsRecording(false);
    setRecordingSeconds(0);
  };

  const handleSendText = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() || disabled) return;
    onSendMessage(text.trim());
    setText("");
  };

  const handleSuggestionClick = (suggestion: string) => {
    onSendMessage(suggestion);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onSendImage) {
      onSendImage(file);
    }
  };

  const formatSec = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="bg-white border-t border-slate-200 p-2.5 sm:p-3 flex flex-col gap-2">
      {/* Quick Suggestion Chips */}
      {!isRecording && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <div className="flex items-center gap-1 text-[11px] font-bold text-[#0F766E] shrink-0">
            <Sparkles className="size-3" />
            <span>{isUrdu ? "فوری جواب:" : "Quick Reply:"}</span>
          </div>
          {suggestions.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSuggestionClick(s)}
              className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-50 hover:bg-[#0F766E]/10 hover:text-[#0F766E] border border-slate-200 text-slate-700 transition-colors shrink-0 cursor-pointer"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Main Input Controls */}
      {isRecording ? (
        /* Voice Recording Active Mode */
        <div className="flex items-center justify-between gap-3 bg-red-50 border border-red-200 rounded-2xl p-2.5 sm:p-3 animate-in fade-in-50 duration-200">
          <div className="flex items-center gap-2.5">
            <div className="size-3 rounded-full bg-red-500 animate-ping" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-red-700">
                {isUrdu ? "آواز ریکارڈ ہو رہی ہے..." : "Recording Voice Note..."}
              </span>
              <span className="font-mono text-xs font-semibold text-red-600">
                {formatSec(recordingSeconds)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={cancelRecording}
              className="size-9 rounded-xl bg-white border border-red-200 text-red-600 hover:bg-red-100 flex items-center justify-center transition-colors cursor-pointer"
              title={isUrdu ? "منسوخ کریں" : "Discard"}
            >
              <Trash2 className="size-4" />
            </button>

            <button
              type="button"
              onClick={finishAndSendRecording}
              className="h-9 px-4 rounded-xl bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <Send className="size-3.5 rtl:rotate-180" />
              <span>{isUrdu ? "بھیجیں" : "Send Voice"}</span>
            </button>
          </div>
        </div>
      ) : (
        /* Text Typing & Voice Trigger Mode */
        <form
          onSubmit={handleSendText}
          className="flex items-center gap-2"
        >
          {/* File / Image Attachment Button */}
          {onSendImage && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="size-10 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-[#0F766E] flex items-center justify-center transition-colors cursor-pointer shrink-0"
                title={isUrdu ? "تصویر منسلک کریں" : "Attach Image"}
              >
                <ImageIcon className="size-4.5" />
              </button>
            </>
          )}

          {/* Text Input to Write Message */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={disabled}
              placeholder={
                isUrdu
                  ? "پیغام لکھیں..."
                  : "Type a message..."
              }
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 text-xs sm:text-sm text-[#123B5D] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 bg-slate-50 focus:bg-white transition-all rtl:text-right"
            />
          </div>

          {/* Voice Record Button (Always Accessible) */}
          <button
            type="button"
            onClick={startVoiceRecording}
            disabled={disabled}
            className="size-10 rounded-xl bg-[#0F766E]/10 hover:bg-[#0F766E] text-[#0F766E] hover:text-white border border-[#0F766E]/20 flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0"
            title={isUrdu ? "وائس میسج ریکارڈ کریں" : "Record Voice Note"}
          >
            <Mic className="size-4.5" />
          </button>

          {/* Send Text Message Button */}
          <button
            type="submit"
            disabled={!text.trim() || disabled}
            className="size-10 rounded-xl bg-[#0F766E] hover:bg-[#115E59] disabled:opacity-40 disabled:hover:bg-[#0F766E] text-white flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95 shrink-0"
            title={isUrdu ? "پیغام بھیجیں" : "Send Message"}
          >
            <Send className="size-4 rtl:rotate-180" />
          </button>
        </form>
      )}
    </div>
  );
}
