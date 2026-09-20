function initials(name = ""): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?"
  );
}

interface AvatarProps {
  name?: string;
  tone?: "brand" | "admin";
  size?: number;
}

export default function Avatar({ name, tone = "brand", size = 36 }: AvatarProps) {
  const bg = tone === "admin" ? "bg-admin-500" : "bg-brand-500";
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-semibold text-white ${bg}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initials(name)}
    </span>
  );
}
