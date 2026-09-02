import { createSignal } from "solid-js";
import * as Tone from "tone";

// Module-level state (not per-component), so playback keeps running
// across route navigation instead of stopping whenever
// PinkNoiseToggle unmounts/remounts.
const [isPlaying, setIsPlaying] = createSignal(false);

let noise: Tone.Noise | undefined;

function ensureNoise(): Tone.Noise {
  if (!noise) {
    noise = new Tone.Noise("pink").toDestination();
  }
  return noise;
}

export const pinkNoisePlaying = isPlaying;

export async function togglePinkNoise(): Promise<void> {
  // Tone.js requires a user gesture before the audio context can
  // start; this is always called from a click handler, so that's
  // satisfied here.
  await Tone.start();
  const instance = ensureNoise();
  if (isPlaying()) {
    instance.stop();
    setIsPlaying(false);
  } else {
    instance.start();
    setIsPlaying(true);
  }
}
