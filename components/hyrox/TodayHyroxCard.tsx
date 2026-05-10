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

interface Props {
  weekNum: number;
  phase: HyroxPhaseId;
  weekFocus: string;
  weekDateLabel: string;
  day: HyroxDayCode;
  session: HyroxSession;
  initialStatus: HyroxSessionStatus | null;
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
  daysUntilRace,
}: Props) {
  const ph = HYROX_PHASES[phase];
  const st = HYROX_SESSION_TYPES[session.type];

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

        <p
          className="mt-2 text-sm font-light text-text/90 [&_strong]:font-medium [&_strong]:text-text"
          dangerouslySetInnerHTML={{ __html: session.desc }}
        />
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
