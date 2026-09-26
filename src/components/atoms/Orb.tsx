import { useEffect, useRef, type RefObject } from "react";

export type OrbState = "idle" | "listening" | "thinking" | "speaking";

interface OrbProps {
  /** Diameter in px. Every layer scales off this, so the orb looks and
   * moves identically at 30px and 150px - there is deliberately no
   * "small" variant, so the assistant reads as one thing everywhere. */
  size?: number;
  state?: OrbState;
  /** Live 0-1 loudness (useVoiceConversation's levelRef). When supplied the
   * orb swells and brightens with the speaker's actual voice. A ref rather
   * than a prop value on purpose: this updates every frame, and
   * re-rendering the chat tree at 60fps to animate a circle would be
   * absurd. */
  levelRef?: RefObject<number>;
  label?: string;
  className?: string;
}

// How fast the rendered level chases the real one. Raw RMS is jittery;
// easing in fast (0.35) and out slow (0.12) makes the orb feel like it's
// reacting to a voice rather than flickering with noise.
const ATTACK = 0.35;
const RELEASE = 0.12;

/** The assistant, wherever it appears: a dark sphere with luminous bands
 * orbiting it, silk drifting inside, and a bloom that tracks the speaker's
 * voice. See the `.orb` rules in index.css for the visuals. */
export default function Orb({
  size = 44,
  state = "idle",
  levelRef,
  label = "Lumi",
  className = "",
}: OrbProps) {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!levelRef) return;
    const element = elementRef.current;
    if (!element) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let rendered = 0;

    const tick = () => {
      const target = levelRef.current ?? 0;
      rendered += (target - rendered) * (target > rendered ? ATTACK : RELEASE);
      element.style.setProperty("--orb-level", rendered.toFixed(3));
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      element.style.setProperty("--orb-level", "0");
    };
  }, [levelRef]);

  return (
    <div
      ref={elementRef}
      className={`orb ${className}`}
      data-state={state}
      style={{ "--orb-size": `${size}px` } as React.CSSProperties}
      role="img"
      aria-label={label}
    >
      <div className="orb__breathe">
        {/* Sonar rings - CSS only runs these while listening. */}
        <span className="orb__pulse" />
        <span className="orb__pulse" />
        <span className="orb__pulse" />
        <div className="orb__clip">
          <div className="orb__base" />
          <div className="orb__silk" />
          <div className="orb__silk orb__silk--b" />
          <div className="orb__orbit" />
          <div className="orb__orbit orb__orbit--b" />
          <div className="orb__highlight" />
        </div>
      </div>
    </div>
  );
}
