"use client";
import { BarVisualizer, LiveKitRoom, RoomAudioRenderer, useLocalParticipant, useVoiceAssistant } from "@livekit/components-react";
import { useEffect, useState } from "react";
import { Button, Label } from "@/components/ui";

type Conn = { url: string; token: string };

const STATE_TEXT: Record<string, string> = {
  disconnected: "Connecting",
  connecting: "Connecting",
  "pre-connect-buffering": "Connecting",
  initializing: "Joining",
  idle: "Ready",
  listening: "Listening",
  thinking: "Thinking",
  speaking: "Speaking",
  failed: "Couldn't connect",
};

/** Voice interview over LiveKit. The agent joins the same room, speaks, and writes the transcript server-side. */
export function VoiceSession({ interviewId, onEnd }: { interviewId: string; onEnd: () => void }) {
  const [conn, setConn] = useState<Conn | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/interviews/${interviewId}/voice`, { method: "POST" })
      .then(async (r) => (r.ok ? r.json() : Promise.reject(new Error((await r.json()).error))))
      .then((c: Conn) => !cancelled && setConn(c))
      .catch((e: Error) => setError(e.message || "Voice is unavailable."));
    return () => {
      cancelled = true;
    };
  }, [interviewId]);

  if (error)
    return (
      <div className="flex flex-col items-start gap-4 rounded-card bg-surface p-8">
        <p className="text-ink-2">{error}</p>
        <Button variant="tile" className="w-fit" onClick={onEnd}>
          Back to text
        </Button>
      </div>
    );

  if (!conn) return <div className="h-[260px] animate-pulse rounded-card bg-surface" />;

  return (
    <LiveKitRoom serverUrl={conn.url} token={conn.token} connect audio video={false} onDisconnected={onEnd} onError={(e) => setError(e.message)}>
      <Stage onEnd={onEnd} />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}

function Stage({ onEnd }: { onEnd: () => void }) {
  const { state, audioTrack } = useVoiceAssistant();
  const { localParticipant, isMicrophoneEnabled } = useLocalParticipant();
  return (
    <div className="flex flex-col items-center gap-6 rounded-card bg-surface px-8 pt-10 pb-8">
      <BarVisualizer state={state} track={audioTrack} barCount={7} className="voice-bars" options={{ minHeight: 10 }} />
      <Label className={state === "speaking" ? "text-accent" : state === "listening" ? "text-ink" : undefined}>{STATE_TEXT[state] ?? state}</Label>
      <div className="flex gap-3">
        <Button variant="tile" className="w-36" onClick={() => localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled)}>
          {isMicrophoneEnabled ? "Mute" : "Unmute"}
        </Button>
        <Button variant="tile" className="w-36" onClick={onEnd}>
          End voice
        </Button>
      </div>
    </div>
  );
}
