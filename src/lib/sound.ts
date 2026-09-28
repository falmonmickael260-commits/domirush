"use client";

/**
 * Tiny synthesized sound engine (WebAudio oscillators/noise) so Domirush has
 * a full, deployable sound set with zero external audio assets to ship or license.
 */

type SoundName = "place" | "click" | "confirm" | "turn" | "victory" | "error" | "join";

let ctx: AudioContext | null = null;
let enabled = true;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function setSoundEnabled(value: boolean) {
  enabled = value;
  try {
    localStorage.setItem("domirush:sound", value ? "1" : "0");
  } catch {
    // ignore storage errors (private mode, etc.)
  }
}

export function getSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const stored = localStorage.getItem("domirush:sound");
    return stored === null ? true : stored === "1";
  } catch {
    return enabled;
  }
}

function tone(
  audioCtx: AudioContext,
  { freq, start, duration, type = "sine", gain = 0.16 }: { freq: number; start: number; duration: number; type?: OscillatorType; gain?: number }
) {
  const osc = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime + start);
  g.gain.setValueAtTime(0, audioCtx.currentTime + start);
  g.gain.linearRampToValueAtTime(gain, audioCtx.currentTime + start + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + start + duration);
  osc.connect(g);
  g.connect(audioCtx.destination);
  osc.start(audioCtx.currentTime + start);
  osc.stop(audioCtx.currentTime + start + duration + 0.02);
}

export function playSound(name: SoundName) {
  if (!getSoundEnabled()) return;
  const audioCtx = getCtx();
  if (!audioCtx) return;

  switch (name) {
    case "click":
      tone(audioCtx, { freq: 720, start: 0, duration: 0.05, type: "triangle", gain: 0.08 });
      break;
    case "place":
      tone(audioCtx, { freq: 180, start: 0, duration: 0.09, type: "square", gain: 0.18 });
      tone(audioCtx, { freq: 90, start: 0.02, duration: 0.12, type: "sine", gain: 0.14 });
      break;
    case "confirm":
      tone(audioCtx, { freq: 520, start: 0, duration: 0.08, type: "sine", gain: 0.14 });
      tone(audioCtx, { freq: 780, start: 0.07, duration: 0.1, type: "sine", gain: 0.12 });
      break;
    case "turn":
      tone(audioCtx, { freq: 660, start: 0, duration: 0.12, type: "sine", gain: 0.1 });
      break;
    case "join":
      tone(audioCtx, { freq: 440, start: 0, duration: 0.08, type: "sine", gain: 0.1 });
      tone(audioCtx, { freq: 660, start: 0.06, duration: 0.1, type: "sine", gain: 0.1 });
      break;
    case "error":
      tone(audioCtx, { freq: 180, start: 0, duration: 0.16, type: "sawtooth", gain: 0.12 });
      break;
    case "victory":
      [523, 659, 784, 1046].forEach((freq, i) =>
        tone(audioCtx, { freq, start: i * 0.11, duration: 0.3, type: "sine", gain: 0.14 })
      );
      break;
  }
}
