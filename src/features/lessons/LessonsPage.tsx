import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { lessonsApi } from "../../api/lessonsApi";
import { profileApi } from "../../api/profileApi";
import { HeroMascotLessons, HeroWave } from "../../components/atoms/HeroWave";
import Spinner from "../../components/atoms/Spinner";
import LessonGrid from "../../components/organisms/LessonGrid";
import { useSettingsStore } from "../../store/settingsStore";

const LEVEL_OPTIONS = [
  { value: "all", label: "All levels" },
  { value: "primary", label: "Primary" },
  { value: "secondary", label: "Secondary" },
  { value: "college", label: "College" },
  { value: "professional", label: "Professional" },
];

export default function LessonsPage() {
  // Shared with Settings' "Lesson level" - matches the old vanilla app,
  // where lessonLevelSelect and settingsLevelSelect stayed in sync.
  const level = useSettingsStore((s) => s.lessonLevel);
  const setLevel = useSettingsStore((s) => s.setLessonLevel);
  const syncLessonLevelOwner = useSettingsStore((s) => s.syncLessonLevelOwner);
  const navigate = useNavigate();

  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: profileApi.get });

  // Defaults a beginner to beginner content: reconciles the persisted
  // level to this account's own recommended Program the moment we know
  // who's logged in, rather than trusting whatever level was last chosen
  // in this browser (which may have been a different account entirely).
  useEffect(() => {
    if (profile) syncLessonLevelOwner(profile.user_id, profile.program.id);
  }, [profile, syncLessonLevelOwner]);

  const { data: lessons, isLoading } = useQuery({
    queryKey: ["lessons", level],
    queryFn: () => lessonsApi.list(level === "all" ? "" : level),
    enabled: profile !== undefined,
  });

  return (
    <div className="flex flex-col gap-5">
      <div className="relative flex min-h-[110px] items-center justify-between gap-4 overflow-hidden rounded-[24px] px-7 py-6">
        <HeroWave height={200} />
        <div className="relative">
          <h1 className="font-display text-[27px] font-extrabold text-white">Your lessons</h1>
          <p className="mt-1.5 text-[14.5px] text-white/85">
            Placed at <b className="text-white">{profile?.program?.name ?? "your level"}</b> — change it anytime.
          </p>
        </div>
        <div className="hidden shrink-0 sm:block">
          <HeroMascotLessons size={96} />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {LEVEL_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setLevel(opt.value, profile?.user_id)}
            className={`rounded-full px-4 py-2 text-[13px] font-bold transition-colors ${
              level === opt.value
                ? "bg-brand-500 text-white"
                : "border border-slate-200 bg-white text-slate-500 hover:border-brand-100 hover:text-brand-600 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-400"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {isLoading ? <Spinner /> : <LessonGrid lessons={lessons || []} onStart={(id) => navigate(`/lessons/${id}`)} />}
    </div>
  );
}
