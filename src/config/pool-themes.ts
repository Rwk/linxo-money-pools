import { EventType } from "@/domain/pool/pool.types";

type PoolTheme = {
  label: string;
  shortDescription: string;
  emoji: string;
  accentClassName: string;
  backgroundClassName: string;
  cardClassName: string;
};

export const poolThemes: Record<EventType, PoolTheme> = {
  BIRTHDAY: {
    label: "Birthday",
    shortDescription: "Warm and festive for shared birthday gifts.",
    emoji: "🎉",
    accentClassName: "text-amber-700",
    backgroundClassName: "bg-amber-100/70",
    cardClassName: "border-amber-200 bg-white/80"
  },
  BIRTH: {
    label: "Birth",
    shortDescription: "Soft and gentle for welcoming a newborn.",
    emoji: "🍼",
    accentClassName: "text-sky-700",
    backgroundClassName: "bg-sky-100/70",
    cardClassName: "border-sky-200 bg-white/80"
  },
  WEDDING: {
    label: "Wedding",
    shortDescription: "Elegant and polished for memorable celebrations.",
    emoji: "💍",
    accentClassName: "text-rose-700",
    backgroundClassName: "bg-rose-100/70",
    cardClassName: "border-rose-200 bg-white/80"
  },
  FAREWELL: {
    label: "Farewell",
    shortDescription: "Friendly and appreciative for team goodbyes.",
    emoji: "👏",
    accentClassName: "text-emerald-700",
    backgroundClassName: "bg-emerald-100/70",
    cardClassName: "border-emerald-200 bg-white/80"
  },
  OTHER: {
    label: "Other",
    shortDescription: "Neutral and classy for every shared occasion.",
    emoji: "✨",
    accentClassName: "text-slate-700",
    backgroundClassName: "bg-slate-100/70",
    cardClassName: "border-slate-200 bg-white/80"
  }
};
