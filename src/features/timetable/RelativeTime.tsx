const relative = new Intl.RelativeTimeFormat("en-GB", { numeric: "auto" });

export function relativeLabel(startsAt: Date, now: number): string {
  const diffMin = Math.round((startsAt.getTime() - now) / 60000);
  if (Math.abs(diffMin) >= 180) return "";
  if (diffMin >= 0) return relative.format(diffMin, "minute");
  return `started ${relative.format(diffMin, "minute").replace(" ago", "")} ago`;
}

export function RelativeTime({
  startsAt,
  now,
}: {
  startsAt: Date;
  now: number;
}) {
  const label = relativeLabel(startsAt, now);
  if (!label) return null;

  return <span className="text-2xs text-text-muted">{label}</span>;
}
