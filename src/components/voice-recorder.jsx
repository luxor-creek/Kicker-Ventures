import { useState, useRef, useEffect, useCallback } from "react";

// ═══════════════════════════════════════════════════════════════
// MISTOL VOICE RECORDER v3 — CTO pressure test hardened
//
// Changes from v2:
//  - 422 handling: shows security-blocked message (not generic error)
//  - 429 handling: shows daily limit message  
//  - Timeout errors: shows "try shorter recording" hint
//  - onBlocked callback for analytics
// ═══════════════════════════════════════════════════════════════

const DEFAULT_URL = "https://mzqjivtidadjaawmlslz.supabase.co";

export default function VoiceRecorder({
  onTranscript = () => {},
  onSending = () => {},
  onBlocked = () => {},   // NEW: fires when injection shield blocks
  orgId = "",
  userId = "",
  agentSlug = "mistol",
  conversationId = null,
  supabaseUrl = DEFAULT_URL,
  supabaseKey = "",
  maxSeconds = 120,
}) {
  const [state, setState] = useState("idle");
  const [duration, setDuration] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");
  const [errorType, setErrorType] = useState(""); // "blocked" | "limit" | "timeout" | "error"
  const [amplitude, setAmplitude] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const streamRef = useRef(null);
  const audioCtxRef = useRef(null);

  useEffect(() => { return () => { cleanupRecording(); }; }, []);
  useEffect(() => {
    if (state === "recording" && duration >= maxSeconds) stopRecording();
  }, [duration, maxSeconds, state]);

  const cleanupRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (audioCtxRef.current) { audioCtxRef.current.close().catch(() => {}); audioCtxRef.current = null; }
    analyserRef.current = null;
    setAmplitude(0);
  };

  const startRecording = useCallback(async () => {
    try {
      setError(""); setErrorType(""); setTranscript(""); setDuration(0); setUploadProgress(0);
      chunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, sampleRate: 16000, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;

      const audioCtx = new AudioContext(); audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser(); analyser.fftSize = 256;
      source.connect(analyser); analyserRef.current = analyser;

      const updateAmplitude = () => {
        if (!analyserRef.current) return;
        const data = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteTimeDomainData(data);
        let sum = 0; for (let i = 0; i < data.length; i++) { const v = (data[i] - 128) / 128; sum += v * v; }
        setAmplitude(Math.sqrt(sum / data.length));
        animFrameRef.current = requestAnimationFrame(updateAmplitude);
      };
      updateAmplitude();

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus" : MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const recorder = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 32000 });
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => handleRecordingComplete(mimeType);
      mediaRecorderRef.current = recorder;
      recorder.start(250);
      setState("recording");
      const start = Date.now();
      timerRef.current = setInterval(() => { setDuration(Math.floor((Date.now() - start) / 1000)); }, 200);
    } catch (err) {
      setError(err.name === "NotAllowedError" ? "Microphone blocked. Check browser permissions." : `Mic error: ${err.message}`);
      setErrorType("error");
      setState("error");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state !== "inactive") mediaRecorderRef.current?.stop();
    cleanupRecording();
  }, []);

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state !== "inactive") {
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }
    cleanupRecording(); chunksRef.current = []; setState("idle"); setDuration(0);
  }, []);

  const handleRecordingComplete = useCallback(async (mimeType) => {
    const chunks = chunksRef.current;
    if (!chunks.length) { setState("idle"); return; }
    const blob = new Blob(chunks, { type: mimeType });
    if (blob.size < 1000) { setError("Recording too short."); setErrorType("error"); setState("error"); return; }

    onSending(true);
    try {
      setState("uploading");
      const ext = mimeType.includes("mp4") ? "m4a" : "webm";
      const storagePath = `${userId}/${Date.now()}.${ext}`;
      const uploadRes = await fetch(`${supabaseUrl}/storage/v1/object/voice-notes/${storagePath}`, {
        method: "POST", headers: { Authorization: `Bearer ${supabaseKey}`, "Content-Type": mimeType, "x-upsert": "false" }, body: blob,
      });
      if (!uploadRes.ok) { const e = await uploadRes.json().catch(() => ({})); throw new Error(e.message || `Upload failed (${uploadRes.status})`); }
      setUploadProgress(100);

      setState("transcribing");
      const transcribeRes = await fetch(`${supabaseUrl}/functions/v1/voice-transcribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${supabaseKey}` },
        body: JSON.stringify({ org_id: orgId, user_id: userId, storage_path: storagePath, agent_slug: agentSlug, conversation_id: conversationId }),
      });

      const data = await transcribeRes.json();

      // ─── HANDLE SPECIFIC ERROR CODES ───────────────────
      if (transcribeRes.status === 422 && data.blocked) {
        // Injection shield blocked the transcript
        setError("Your voice note was blocked for security. Please type your request instead.");
        setErrorType("blocked");
        setState("error");
        onBlocked(data.threat_level || "unknown");
        return;
      }

      if (transcribeRes.status === 429) {
        // Daily usage limit
        setError(data.error || "Daily voice note limit reached. Try again tomorrow.");
        setErrorType("limit");
        setState("error");
        return;
      }

      if (!transcribeRes.ok || data.error) {
        const msg = data.error || "Transcription failed";
        // Check for timeout hint
        if (msg.includes("timed out")) {
          setError("Transcription timed out. Try a shorter recording.");
          setErrorType("timeout");
        } else {
          setError(msg);
          setErrorType("error");
        }
        setState("error");
        return;
      }

      // ─── SUCCESS ──────────────────────────────────────
      setTranscript(data.transcript);
      setState("done");
      onTranscript(data.transcript, data.note_id);
      setTimeout(() => { setState("idle"); setTranscript(""); setDuration(0); setUploadProgress(0); }, 2500);
    } catch (err) {
      setError(err.message || String(err));
      setErrorType("error");
      setState("error");
    } finally {
      onSending(false);
    }
  }, [orgId, userId, agentSlug, conversationId, supabaseUrl, supabaseKey, onTranscript, onSending, onBlocked]);

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  // Error icon/color by type
  const errorStyles = {
    blocked: { icon: "🛡️", bg: "rgba(220,38,38,0.08)", border: "rgba(220,38,38,0.2)", color: "#991b1b" },
    limit:   { icon: "⏱️", bg: "rgba(234,179,8,0.08)",  border: "rgba(234,179,8,0.2)",  color: "#854d0e" },
    timeout: { icon: "⌛", bg: "rgba(234,179,8,0.08)",  border: "rgba(234,179,8,0.2)",  color: "#854d0e" },
    error:   { icon: "⚠",  bg: "rgba(239,68,68,0.06)",  border: "rgba(239,68,68,0.15)", color: "#dc2626" },
  };
  const es = errorStyles[errorType] || errorStyles.error;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>

      {state === "error" && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", background: es.bg, borderRadius: 10, border: `1px solid ${es.border}` }}>
          <span style={{ fontSize: 13 }}>{es.icon}</span>
          <span style={{ fontSize: 12, color: es.color, flex: 1 }}>{error}</span>
          <button onClick={() => { setState("idle"); setError(""); setErrorType(""); }}
            style={{ background: "none", border: "none", color: es.color, fontSize: 16, cursor: "pointer", padding: "0 2px" }}>×</button>
        </div>
      )}

      {state === "done" && transcript && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "8px 12px", background: "rgba(34,197,94,0.05)", borderRadius: 10, border: "1px solid rgba(34,197,94,0.15)" }}>
          <span style={{ fontSize: 13, marginTop: 1 }}>🎙️</span>
          <span style={{ fontSize: 12, color: "#166534", lineHeight: 1.45, fontStyle: "italic" }}>
            {transcript.length > 140 ? transcript.substring(0, 140) + "…" : transcript}
          </span>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center" }}>
        {state === "idle" && (
          <button onClick={startRecording} title="Record voice note"
            style={{ width: 38, height: 38, borderRadius: "50%", border: "1.5px solid rgba(220,38,38,0.25)", background: "rgba(220,38,38,0.05)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </button>
        )}

        {state === "recording" && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, background: "rgba(220,38,38,0.04)", borderRadius: 22, padding: "5px 5px 5px 10px", border: "1px solid rgba(220,38,38,0.12)" }}>
            <button onClick={cancelRecording} title="Cancel"
              style={{ width: 30, height: 30, borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.05)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#888" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, overflow: "hidden" }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#dc2626", animation: "voice-pulse 1.2s ease-in-out infinite", flexShrink: 0 }} />
              <div style={{ display: "flex", alignItems: "center", gap: "1.5px", flex: 1, height: 28, overflow: "hidden" }}>
                {Array.from({ length: 28 }, (_, i) => {
                  const w = Math.sin((i / 28) * Math.PI) * amplitude * 2.5 + 0.1;
                  return <div key={i} style={{ width: "2.5px", borderRadius: 2, background: "#dc2626", height: `${Math.max(3, Math.min(26, w * 26))}px`, opacity: 0.35 + w * 0.65, transition: "height 0.08s ease", flexShrink: 0 }} />;
                })}
              </div>
              <span style={{ fontFamily: "'SF Mono', 'Fira Code', monospace", fontSize: 12, color: "#dc2626", fontWeight: 600, flexShrink: 0, whiteSpace: "nowrap" }}>
                {formatTime(duration)}<span style={{ color: "rgba(220,38,38,0.4)", fontWeight: 400 }}>/{formatTime(maxSeconds)}</span>
              </span>
            </div>
            <button onClick={stopRecording} title="Send"
              style={{ width: 34, height: 34, borderRadius: "50%", border: "none", background: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 1px 6px rgba(220,38,38,0.25)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="none"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
            </button>
          </div>
        )}

        {state === "uploading" && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", background: "rgba(99,102,241,0.04)", borderRadius: 22, border: "1px solid rgba(99,102,241,0.12)", flex: 1 }}>
            <div style={{ flex: 1, height: 4, borderRadius: 2, background: "rgba(99,102,241,0.1)", overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: 2, background: "#6366f1", transition: "width 0.3s ease", width: `${uploadProgress}%` }} />
            </div>
            <span style={{ fontSize: 12, color: "#6366f1", fontWeight: 500, flexShrink: 0 }}>Uploading…</span>
          </div>
        )}

        {state === "transcribing" && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", background: "rgba(99,102,241,0.04)", borderRadius: 22, border: "1px solid rgba(99,102,241,0.12)", flex: 1 }}>
            <div style={{ width: 16, height: 16, border: "2px solid rgba(99,102,241,0.15)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "voice-spin 0.7s linear infinite", flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: "#6366f1", fontWeight: 500 }}>Transcribing…</span>
          </div>
        )}
      </div>

      <style>{`
        @keyframes voice-pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.3; transform: scale(0.8); } }
        @keyframes voice-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
