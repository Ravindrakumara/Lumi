import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { lessonsApi } from "../../api/lessonsApi";
import { profileApi } from "../../api/profileApi";
import Select, { type SelectOption } from "../../components/atoms/Select";
import Spinner from "../../components/atoms/Spinner";
import LessonGrid from "../../components/organisms/LessonGrid";
import { useSettingsStore } from "../../store/settingsStore";

const LEVEL_OPTIONS: SelectOption[] = [
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
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-slate-900">Lessons</h2>
        <div className="w-48">
          <Select
            value={level}
            onChange={(value) => setLevel(value, profile?.user_id)}
            options={LEVEL_OPTIONS}
          />
        </div>
      </div>

      {isLoading ? <Spinner /> : <LessonGrid lessons={lessons || []} onStart={(id) => navigate(`/lessons/${id}`)} />}
    </div>
  );
}
