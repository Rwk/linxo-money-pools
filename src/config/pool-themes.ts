import { EventType } from "@/domain/pool/pool.types";
import { t } from "@/i18n/t";

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
    label: t("events.BIRTHDAY"),
    shortDescription: "Chaleureux et festif pour un cadeau d'anniversaire commun.",
    emoji: "🎉",
    accentClassName: "text-amber-700",
    backgroundClassName: "bg-amber-100/70",
    cardClassName: "border-amber-200 bg-white/80"
  },
  BIRTH: {
    label: t("events.BIRTH"),
    shortDescription: "Doux et délicat pour accueillir une naissance.",
    emoji: "🍼",
    accentClassName: "text-sky-700",
    backgroundClassName: "bg-sky-100/70",
    cardClassName: "border-sky-200 bg-white/80"
  },
  WEDDING: {
    label: t("events.WEDDING"),
    shortDescription: "Élégant et soigné pour une célébration mémorable.",
    emoji: "💍",
    accentClassName: "text-rose-700",
    backgroundClassName: "bg-rose-100/70",
    cardClassName: "border-rose-200 bg-white/80"
  },
  FAREWELL: {
    label: t("events.FAREWELL"),
    shortDescription: "Chaleureux et reconnaissant pour un départ d'équipe.",
    emoji: "👏",
    accentClassName: "text-emerald-700",
    backgroundClassName: "bg-emerald-100/70",
    cardClassName: "border-emerald-200 bg-white/80"
  },
  OTHER: {
    label: t("events.OTHER"),
    shortDescription: "Sobre et polyvalent pour toutes les occasions partagées.",
    emoji: "✨",
    accentClassName: "text-slate-700",
    backgroundClassName: "bg-slate-100/70",
    cardClassName: "border-slate-200 bg-white/80"
  }
};
