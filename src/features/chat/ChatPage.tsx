import { HeroMascot, HeroWave } from "../../components/atoms/HeroWave";
import ChatWindow from "../../components/organisms/ChatWindow";
import { useAuth } from "../../hooks/useAuth";

export default function ChatPage() {
  const { user } = useAuth();
  const firstName = user?.name?.split(" ")[0] || "there";

  return (
    <div className="flex h-full flex-col gap-[18px]">
      <div className="relative min-h-[120px] overflow-hidden rounded-[24px] px-6 py-6 sm:px-7">
        <HeroWave height={220} />
        <div className="relative flex items-center justify-between gap-4">
          <div>
            <p className="font-display text-[22px] font-extrabold text-white sm:text-[27px]">Hello, {firstName}! 👋</p>
            <p className="mt-1.5 text-sm text-white/85">You're doing great — let's keep the streak going.</p>
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
