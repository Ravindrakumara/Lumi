import { Label, Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  label?: string;
  disabled?: boolean;
}

/** Accessible styled dropdown (Headless UI Listbox v2) - replaces native
 * <select> everywhere so keyboard nav, focus rings, and animated open/close
 * look and behave consistently instead of the browser's default chrome. */
export default function Select({ value, onChange, options, label, disabled }: SelectProps) {
  const selected = options.find((o) => o.value === value) ?? options[0];

  return (
    <Listbox value={value} onChange={onChange} disabled={disabled}>
      {label ? <Label className="mb-1 block text-sm font-medium text-slate-700">{label}</Label> : null}
      <div className="relative">
        <ListboxButton className="relative w-full cursor-pointer rounded-lg border border-slate-300 bg-white py-2 pl-3 pr-9 text-left text-sm shadow-sm transition-colors hover:border-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:opacity-50">
          <span className="block truncate">{selected?.label}</span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronUpDownIcon className="h-4 w-4 text-slate-400" />
          </span>
        </ListboxButton>
        <ListboxOptions
          transition
          className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 text-sm shadow-lg ring-1 ring-black/5 focus:outline-none
            transition duration-100 ease-in data-closed:opacity-0"
        >
          {options.map((option) => (
            <ListboxOption
              key={option.value}
              value={option.value}
              className="relative cursor-pointer select-none py-2 pl-9 pr-3 text-slate-700 data-focus:bg-brand-50 data-focus:text-brand-700"
            >
              <span className="block truncate data-selected:font-semibold">{option.label}</span>
              <span className="absolute inset-y-0 left-0 hidden items-center pl-3 text-brand-600 data-selected:flex">
                <CheckIcon className="h-4 w-4" />
              </span>
            </ListboxOption>
          ))}
        </ListboxOptions>
      </div>
    </Listbox>
  );
}
