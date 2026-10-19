import { useQuery } from "@tanstack/react-query";
import { SpeakerWaveIcon } from "@heroicons/react/24/solid";
import { lessonsApi } from "../../api/lessonsApi";
import PageHeader from "../../components/atoms/PageHeader";
import Spinner from "../../components/atoms/Spinner";

export default function VocabularyPage() {
  const { data: words, isLoading } = useQuery({
    queryKey: ["vocabulary"],
    queryFn: () => lessonsApi.vocabulary(),
  });

  if (isLoading) return <Spinner />;

  return (
    <div className="flex flex-col gap-[18px]">
      <PageHeader title="Your words" subtitle="Words you've met in lessons and chat, kept for review." />

      {!words?.length ? (
        <p className="text-sm text-slate-500 dark:text-ink-400">No vocabulary collected yet — it fills in as you work through lessons.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {words.map((word) => (
            <div
              key={word.word}
              className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-[18px] dark:border-ink-700 dark:bg-ink-900"
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-[17px] font-extrabold text-ink-900 dark:text-ink-100">
                  {word.word}
                </span>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 dark:bg-ink-800">
                  <SpeakerWaveIcon className="h-3.5 w-3.5 text-brand-500" />
                </span>
              </div>
              <div className="flex gap-1.5">
                <span className="rounded-[10px] bg-slate-100 px-2 py-0.5 text-[10.5px] font-bold text-slate-500 dark:bg-ink-800 dark:text-ink-400">
                  {word.topic}
                </span>
                <span className="rounded-[10px] bg-brand-50 px-2 py-0.5 text-[10.5px] font-bold text-brand-700 dark:bg-brand-500/10 dark:text-live-500">
                  {word.level}
                </span>
              </div>
              <p className="text-[13px] leading-relaxed text-slate-600 dark:text-ink-400">{word.meaning}</p>
              <p className="text-[12.5px] italic leading-relaxed text-slate-400 dark:text-ink-400">
                &ldquo;{word.example}&rdquo;
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
