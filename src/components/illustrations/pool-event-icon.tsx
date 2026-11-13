import { t } from "@/i18n/t";
import type { EventType } from "@/domain/pool/pool.types";

const motifs: Record<EventType, string> = {
  BIRTHDAY:
    "M5 15h22v13H5zM5 20c4 5 6-4 10 0s7-4 12 0M11 15V9m10 6V9M11 4l-2 3h4zm10 0-2 3h4zM3 28h26",
  BIRTH:
    "M3 16h26c-1 9-6 12-13 12S4 25 3 16Zm5 12-2 2m18-2 2 2M9 16c-2-6 0-13 6-13 5 0 8 4 8 9m-7-6c6 1 1 5 0 2m-4 4c2 2 4 2 6 0",
  FAREWELL: "m3 13 26-9-9 25-5-11L3 13Zm12 5L29 4 11 15l1 9 3-6",
  WEDDING: "M18 20a8 8 0 1 1-4-7m4 0a8 8 0 1 1-4 7M12 3l4-2 4 2-4 5-4-5Z",
  OTHER:
    "M4 13h24v16H4zM3 9h26v6H3zm13 0v20M16 9C3 9 7-1 12 4l4 5Zm0 0c13 0 9-10 4-5l-4 5Z"
};

export function PoolEventIcon({ eventType }: { eventType: string }) {
  const type = Object.hasOwn(motifs, eventType)
    ? (eventType as EventType)
    : "OTHER";
  return (
    <span className={`pool-event-icon pool-event-${type}`} aria-hidden="true">
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        focusable="false"
      >
        <path d={motifs[type]} />
      </svg>
    </span>
  );
}
