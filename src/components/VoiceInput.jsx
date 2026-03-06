import { useState, useRef, useEffect } from "react";

export default function VoiceInput({ onTranscript, onClose }) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [duration, setDuration] = useState(0);
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { alert("Speech recognition not supported in this browser."); onClose?.(); return; }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    let finalTranscript = "";

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) { finalTranscript += t + " "; } else { interim = t; }
      }
      setTranscript(finalTranscript + interim);
    };

    recognition.onerror = (event) => {
      if (event.error === "no-speech") return; // ignore silence
      console.error("Speech error:", event.error);
    };

    recognition.onend = () => {
      // Auto-restart if still recording (prevents browser auto-stop)
      if (recognitionRef.current?._shouldContinue) {
        try { recognition.start(); } catch {}
      }
    };

    recognitionRef.current = recognition;
    recognitionRef.current._shouldContinue = true;

    // Start recording
    try { recognition.start(); setIsRecording(true); } catch {}

    // Duration timer
    timerRef.current = setInterval(() => { setDuration(prev => prev + 1); }, 1000);

    return () => {
      if (recognitionRef.current) { recognitionRef.current._shouldContinue = false; try { recognitionRef.current.stop(); } catch {} }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function handleDone() {
    if (recognitionRef.current) { recognitionRef.current._shouldContinue = false; try { recognitionRef.current.stop(); } catch {} }
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
    if (transcript.trim()) { onTranscript?.(transcript.trim()); }
    onClose?.();
  }

  function handleCancel() {
    if (recognitionRef.current) { recognitionRef.current._shouldContinue = false; try { recognitionRef.current.stop(); } catch {} }
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
    onClose?.();
  }

  const mins = Math.floor(duration / 60);
  const secs = duration % 60;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={handleCancel}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
        <div className="text-center mb-4">
          <div className={`w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center ${isRecording ? "bg-red-100 animate-pulse" : "bg-gray-100"}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-10 w-10 ${isRecording ? "text-red-500" : "text-gray-400"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
          </div>
          <p className="text-lg font-semibold">{isRecording ? "Listening..." : "Stopped"}</p>
          <p className="text-sm text-gray-500 font-mono">{mins}:{secs.toString().padStart(2,"0")}</p>
        </div>

        {transcript && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg max-h-32 overflow-auto">
            <p className="text-sm text-gray-700">{transcript}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={handleCancel} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
          <button onClick={handleDone} className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Done</button>
        </div>
      </div>
    </div>
  );
}
