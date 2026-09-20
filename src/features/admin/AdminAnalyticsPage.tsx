import ComingSoon from "../../components/molecules/ComingSoon";

export default function AdminAnalyticsPage() {
  return (
    <div>
      <h2 className="mb-4 text-xl font-bold text-slate-900">Analytics</h2>
      <ComingSoon
        title="Cross-user analytics"
        description="/api/progress only ever scopes to one user_id today. A real analytics view needs an aggregate backend endpoint across all learners."
      />
    </div>
  );
}
