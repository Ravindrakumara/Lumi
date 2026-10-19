import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { lessonsApi } from "../../api/lessonsApi";
import { profileApi } from "../../api/profileApi";
import { HeroMascotLessons, HeroWave } from "../../components/atoms/HeroWave";
import Spinner from "../../components/atoms/Spinner";
import LessonGrid from "../../components/organisms/LessonGrid";
import { useSettingsStore } from "../../store/settingsStore";

// The CEFR ladder - the axis the learner is actually placed on by the
// assessment, and the one the lessons are tagged with. This replaced the
// four Programs (Primary/Secondary/College/Professional): every lesson now
// sits in one program, so three of those four tabs returned nothing at all.
const BANDS = ["A1", "A2", "B1", "B2", "C1", "C2"];

const BAND_NAMES: Record<string, string> = {
  A1: "Beginner",
  A2: "Elementary",
  B1: "Intermediate",
  B2: "Upper intermediate",
  C1: "Advanced",
  C2: "Proficient",
};

export default function LessonsPage() {
  // Shared with the Settings page's lesson filter.
  const band = useSettingsStore((s) => s.lessonLevel);
  const setBand = useSettingsStore((s) => s.setLessonLevel);
  const syncLessonLevelOwner = useSettingsStore((s) => s.syncLessonLevelOwner);
  const navigate = useNavigate();

  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: profileApi.get });

  // Open on the learner's own measured band rather than whatever was last
  // chosen in this browser, which may have been a different account. An
  // unassessed learner has no band, so they get the whole ladder.
  useEffect(() => {
    if (profile) syncLessonLevelOwner(profile.user_id, profile.cefr_level ?? "all");
  }, [profile, syncLessonLevelOwner]);

  const { data: lessons, isLoading } = useQuery({
    queryKey: ["lessons", band],
    queryFn: () => lessonsApi.list(band === "all" ? "" : band),
    enabled: profile !== undefined,
  });

  // Only the bands the learner has reached. A band above their level has
  // nothing they can open, so offering the tab would be offering an empty
  // page - the Journey strip is where the whole ladder stays visible.
  const reached = profile?.cefr_level ? BANDS.slice(0, BANDS.indexOf(profile.cefr_level) + 1) : BANDS;
  const bandOptions = [{ value: "all", label: "All" }, ...reached.map((b) => ({ value: b, label: b }))];

  // A band stored from before - a re-assessment can move someone down -
  // would otherwise filter the page to nothing with no tab to click back.
  useEffect(() => {
    if (band !== "all" && !reached.includes(band)) setBand("all", profile?.user_id);
  }, [band, reached, setBand, profile?.user_id]);

  const placement = profile?.cefr_level
    ? `${profile.cefr_level} · ${BAND_NAMES[profile.cefr_level] ?? ""}`
    : null;

  return (
    <div className="flex flex-col gap-5">
      <div className="relative flex min-h-[110px] items-center justify-between gap-4 overflow-hidden rounded-[24px] px-7 py-6">
        <HeroWave height={200} />
        <div className="relative">
          <h1 className="font-display text-[27px] font-extrabold text-white">Your lessons</h1>
          <p className="mt-1.5 text-[14.5px] text-white/85">
            {placement ? (
              <>
                Placed at <b className="text-white">{placement}</b> — lessons above your level unlock as you progress.
              </>
            ) : (
              <>Take the placement assessment to find your level.</>
            )}
          </p>
        </div>
        <div className="hidden shrink-0 sm:block">
          <HeroMascotLessons size={96} />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {bandOptions.map((opt) => {
          const isCurrent = opt.value === band;
          // The learner's own band is marked even when they are browsing
          // another one, so they never lose track of where they actually are.
          const isPlacement = opt.value === profile?.cefr_level;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setBand(opt.value, profile?.user_id)}
              title={BAND_NAMES[opt.value] ?? "Every band"}
              className={`rounded-full px-4 py-2 text-[13px] font-bold transition-colors ${
                isCurrent
                  ? "bg-brand-500 text-white"
                  : isPlacement
                    ? "border border-live-500 bg-white text-live-600 dark:bg-ink-900"
                    : "border border-slate-200 bg-white text-slate-500 hover:border-brand-100 hover:text-brand-600 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-400"
              }`}
            >
              {opt.label}
              {isPlacement && !isCurrent ? " ·" : ""}
            </button>
          );
        })}
      </div>

      {isLoading ? <Spinner /> : <LessonGrid lessons={lessons || []} onStart={(id) => navigate(`/lessons/${id}`)} />}
    </div>
  );
}
