import { useQuery } from "@tanstack/react-query";
import { lessonsApi } from "../../api/lessonsApi";
import Badge from "../../components/atoms/Badge";
import Card from "../../components/atoms/Card";
import Spinner from "../../components/atoms/Spinner";

export default function VocabularyPage() {
  const { data: words, isLoading } = useQuery({
    queryKey: ["vocabulary"],
    queryFn: () => lessonsApi.vocabulary(),
  });

  if (isLoading) return <Spinner />;

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold text-slate-900 dark:text-ink-100">Vocabulary</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {(words || []).map((word) => (
          <Card key={word.word}>
            <div className="mb-1 flex items-center justify-between">
              <span className="font-semibold text-slate-900 dark:text-ink-100">{word.word}</span>
              <Badge tone="brand">{word.level}</Badge>
            </div>
            <p className="text-sm text-slate-600 dark:text-ink-400">{word.meaning}</p>
            <p className="mt-1 text-xs italic text-slate-400 dark:text-ink-400">{word.example}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
