import { ShieldCheck, BadgeCheck, Clock, Wallet } from "lucide-react";

const ITEMS = [
  { icon: BadgeCheck, label: "قطعات اصل" },
  { icon: ShieldCheck, label: "۶ ماه گارانتی" },
  { icon: Wallet, label: "عیب یابی رایگان" },
  { icon: Clock, label: "تحویل سریع" },
];

export default function TrustBadges({
  variant = "row",
}: {
  variant?: "row" | "pills";
}) {
  if (variant === "pills") {
    return (
      <div className="flex flex-wrap gap-2">
        {ITEMS.map((i) => (
          <span
            key={i.label}
            className="inline-flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent-tint px-3.5 py-1.5 text-xs font-semibold text-accent"
          >
            <i.icon className="h-3.5 w-3.5" />
            {i.label}
          </span>
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3 rounded-2xl border border-line bg-white p-4 sm:grid-cols-4">
      {ITEMS.map((i) => (
        <div key={i.label} className="flex items-center gap-2.5 px-2 py-1.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent-tint text-accent">
            <i.icon className="h-4 w-4" />
          </span>
          <span className="text-sm font-medium text-ink-700">{i.label}</span>
        </div>
      ))}
    </div>
  );
}
