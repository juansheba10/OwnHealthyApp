"use client";

import Link from "next/link";
import { Trophy, ChevronRight } from "lucide-react";
import { HyroxSessionControls } from "./HyroxSessionControls";
import type { HyroxSessionStatus } from "@/app/(main)/hyrox/actions";
import {
  HYROX_PHASES,
  HYROX_SESSION_TYPES,
  type HyroxDayCode,
  type HyroxPhaseId,
  type HyroxSession,
} from "@/lib/hyrox/plan";

const WORKOUT_TYPE_LABELS: Record<string, string> = {
  crossfit: "CrossFit",
  hyrox: "Hyrox",
  football: "Fútbol",
  running: "Running",
  other: "Otro",
};

interface Props {
  weekNum: number;
  phase: HyroxPhaseId;
  weekFocus: string;
  weekDateLabel: string;
  day: HyroxDayCode;
  session: HyroxSession;
  initialStatus: HyroxSessionStatus | null;
  initialReplacement?: {
    type: string;
    duration_min: number;
    notes: string;
  } | null;
  daysUntilRace: number;
}

export function TodayHyroxCard({
  weekNum,
  phase,
  weekFocus,
  weekDateLabel,
  day,
  session,
  initialStatus,
  initialReplacement,
  daysUntilRace,
}: Props) {
  const ph = HYROX_PHASES[phase];
  const st = HYROX_SESSION_TYPES[session.type];
  const isReplacedPlanned =
    initialStatus === "replaced_planned" && initialReplacement;
  const replacementTypeLabel = initialReplacement
    ? (WORKOUT_TYPE_LABELS[initialReplacement.type] ?? initialReplacement.type)
    : null;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <Link href="/hyrox" className="block transition-opacity hover:opacity-90">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Trophy size={14} style={{ color: ph.color }} />
            <h3 className="text-xs uppercase tracking-wider text-muted">
              Hyrox · S{weekNum} · {day}
            </h3>
          </div>
          <span
            className="font-mono text-[10px] uppercase tracking-wider"
            style={{ color: ph.color }}
          >
            {ph.label} · {weekDateLabel}
          </span>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: st.color }}
          />
          <span className="text-[11px] text-muted">{st.label}</span>
          <span className="ml-auto text-[11px] text-muted">
            {daysUntilRace > 0
              ? `${daysUntilRace} d para Tenerife`
              : daysUntilRace === 0
                ? "RACE DAY"
                : ""}
          </span>
        </div>

        {isReplacedPlanned ? (
          <div className="mt-2 rounded-lg border border-blue/30 bg-blue/5 p-3">
            <p className="font-mono text-[10px] uppercase tracking-wider text-blue">
              Reemplazo programado
            </p>
            <p className="mt-1 text-sm font-light text-text/90">
              <span className="font-medium text-text">
                {replacementTypeLabel}
              </span>{" "}
              · {initialReplacement!.duration_min} min
              {initialReplacement!.notes
                ? ` — ${initialReplacement!.notes}`
                : ""}
            </p>
            <p className="mt-1.5 text-[11px] text-muted line-through">
              Original: {st.label}
            </p>
          </div>
        ) : (
          <p
            className="mt-2 text-sm font-light text-text/90 [&_strong]:font-medium [&_strong]:text-text"
            dangerouslySetInnerHTML={{ __html: session.desc }}
          />
        )}
        <p className="mt-1 flex items-center gap-1 text-xs text-muted">
          {weekFocus} <ChevronRight size={12} className="opacity-60" />
        </p>
      </Link>

      <div className="mt-3">
        <HyroxSessionControls
          weekNum={weekNum}
          day={day}
          sessionType={session.type}
          initialStatus={initialStatus}
        />
      </div>
    </div>
  );
}
