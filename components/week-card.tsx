"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import type { Week } from "@/lib/types";

const levelAccent: Record<string, string> = {
  A1: "before:bg-emerald-500",
  A2: "before:bg-teal-500",
  B1: "before:bg-sky-500",
  B2: "before:bg-violet-500",
  C1: "before:bg-rose-500",
  C2: "before:bg-amber-500",
};

interface WeekCardProps {
  week: Week;
  langCode: string;
  completed: boolean;
  hasNotes?: boolean;
}

export function WeekCard({ week, langCode, completed, hasNotes }: WeekCardProps) {
  return (
    <Link href={`/${langCode}/lesson/${week.number}`}>
      <div
        className={`group relative h-full overflow-hidden bg-white rounded-xl border transition-all hover:-translate-y-0.5 hover:shadow-md
          before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 ${levelAccent[week.level]}
          ${completed
            ? "border-emerald-200/80 bg-emerald-50/30"
            : "border-stone-200/80 hover:border-stone-300"}
        `}
      >
        <div className="pl-5 pr-4 py-4">
          <div className="flex items-start justify-between gap-3 mb-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-stone-400">
              Week {week.number.toString().padStart(3, "0")}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              {hasNotes && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Has notes" />
              )}
              {completed ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <span className="w-4 h-4 rounded-full border border-stone-300 group-hover:border-stone-400 transition-colors" />
              )}
            </div>
          </div>

          <h3 className="font-display text-base font-semibold text-stone-900 leading-snug tracking-tight mb-2.5 group-hover:text-orange-800 transition-colors line-clamp-2">
            {week.title}
          </h3>

          <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">{week.focus}</p>

          {week.anchorSentence && (
            <p className="text-[10px] text-stone-400 italic mt-2 line-clamp-1">
              ✦ {week.anchorSentence}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
