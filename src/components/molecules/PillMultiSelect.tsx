interface PillMultiSelectProps {
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
}

/** Tap-to-toggle pills in a horizontal-scroll row - faster than typing for
 * a short onboarding step, and keeps answers to a known, predefined set
 * instead of free text. */
export default function PillMultiSelect({ options, value, onChange }: PillMultiSelectProps) {
  function toggle(option: string) {
    onChange(value.includes(option) ? value.filter((v) => v !== option) : [...value, option]);
  }

  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {options.map((option) => {
        const selected = value.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => toggle(option)}
            className={`shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm transition-colors
              ${
                selected
                  ? "border-brand-500 bg-brand-500 text-white dark:border-live-500 dark:bg-live-500"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-400"
              }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
