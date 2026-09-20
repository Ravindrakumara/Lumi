interface ComingSoonProps {
  title: string;
  description: string;
}

export default function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center">
      <h3 className="mb-2 font-semibold text-slate-700">{title}</h3>
      <p className="text-sm text-slate-500">{description}</p>
      <p className="mt-3 text-xs text-slate-400">No backend endpoint exists for this yet — this page is a placeholder, not connected to fake data.</p>
    </div>
  );
}
