import { useQuery } from "@tanstack/react-query";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/react";
import { profileApi } from "../../api/profileApi";
import { HeroMascot, HeroWave } from "../../components/atoms/HeroWave";
import ChatWindow from "../../components/organisms/ChatWindow";
import { AGENT_OPTIONS } from "../../constants/agents";
import { useAuth } from "../../hooks/useAuth";
import { useSettingsStore } from "../../store/settingsStore";

export default function ChatPage() {
  const { user } = useAuth();
  const { agentName, setAgentName } = useSettingsStore();
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: profileApi.get });
  const firstName = user?.name?.split(" ")[0] || "there";
  const selectedAgent = AGENT_OPTIONS.find((o) => o.value === agentName) ?? AGENT_OPTIONS[0];

  return (
    <div className="flex h-full flex-col gap-[18px]">
      <div className="relative min-h-[120px] overflow-hidden rounded-[24px] px-6 py-6 sm:px-7">
        <HeroWave height={220} />
        <div className="relative flex items-center justify-between gap-4">
          <div>
            <p className="font-display text-[22px] font-extrabold text-white sm:text-[27px]">Hello, {firstName}! 👋</p>
            <p className="mt-1.5 text-sm text-white/85">You're doing great — let's keep the streak going.</p>
            <div className="mt-3.5 flex flex-wrap items-center gap-2">
              {profile?.program?.name ? (
                <span className="flex items-center gap-1.5 rounded-full border border-white/30 bg-white/16 px-3 py-1.5 text-[12.5px] font-bold text-white">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#ffb08a]" />
                  {profile.program.name}
                </span>
              ) : null}
              <div className="w-44 shrink-0">
                <Listbox value={agentName} onChange={setAgentName}>
                  <div className="relative">
                    <ListboxButton className="flex w-full items-center justify-between gap-2 rounded-[10px] border border-white/30 bg-white/16 px-3 py-1.5 text-left text-[12.5px] font-semibold text-white">
                      <span className="truncate">{selectedAgent?.label}</span>
                      <ChevronDownIcon className="h-3.5 w-3.5 shrink-0 text-white" />
                    </ListboxButton>
                    {/* anchor portals the panel out to the body. Without it
                        the hero banner's overflow-hidden (which clips the
                        wave graphic to the rounded corners) sliced this list
                        in half, so most agents could never be picked. */}
                    <ListboxOptions
                      transition
                      anchor="bottom start"
                      className="z-50 max-h-64 w-[var(--button-width)] min-w-52 overflow-auto rounded-lg bg-white py-1 text-sm shadow-lg ring-1 ring-black/5 transition duration-100 ease-in [--anchor-gap:4px] data-closed:opacity-0 dark:bg-ink-800 dark:ring-white/10"
                    >
                      {AGENT_OPTIONS.map((option) => (
                        <ListboxOption
                          key={option.value}
                          value={option.value}
                          className="cursor-pointer px-3 py-2 text-slate-700 data-focus:bg-brand-50 data-focus:text-brand-700 data-selected:font-semibold dark:text-ink-100 dark:data-focus:bg-ink-700"
                        >
                          {option.label}
                        </ListboxOption>
                      ))}
                    </ListboxOptions>
                  </div>
                </Listbox>
              </div>
            </div>
          </div>
          {/* Decorative only - on a phone the heading needs the width more
              than the illustration does. */}
          <div className="hidden shrink-0 sm:block">
            <HeroMascot size={112} />
          </div>
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col">
        <ChatWindow />
      </div>
    </div>
  );
}
