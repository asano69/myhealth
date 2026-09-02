import AudioLines from "lucide-solid/icons/audio-lines";
import { pinkNoisePlaying, togglePinkNoise } from "../../lib/pinkNoise";

// Toggles pink noise playback via Tone.js. Always shows AudioLines,
// dimmed to opacity-40 while stopped so the icon still signals its
// own state without needing a separate "off" icon.
export default function PinkNoiseToggle() {
  return (
    <button
      type="button"
      aria-label={pinkNoisePlaying() ? "Stop pink noise" : "Play pink noise"}
      class="icon-btn transition-opacity"
      classList={{ "opacity-40": !pinkNoisePlaying() }}
      onClick={togglePinkNoise}
    >
      <AudioLines size={24} />
    </button>
  );
}
