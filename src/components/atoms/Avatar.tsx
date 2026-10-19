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

const TONES = {
  brand: "bg-brand-500",
  admin: "bg-admin-500",
  // For avatars sitting ON the brand-blue sidebar, where a blue circle
  // would disappear into the background.
  accent: "bg-live-500",
} as const;

interface AvatarProps {
  name?: string;
  tone?: keyof typeof TONES;
  size?: number;
}

export default function Avatar({ name, tone = "brand", size = 36 }: AvatarProps) {
  const bg = TONES[tone];
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-semibold text-white ${bg}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initials(name)}
    </span>
  );
}
