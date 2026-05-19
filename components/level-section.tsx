"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { WeekCard } from "@/components/week-card";
import type { Week, CEFRLevel } from "@/lib/types";

const levelDot: Record<CEFRLevel, string> = {
  A1: "bg-emerald-500",
  A2: "bg-teal-500",
  B1: "bg-sky-500",
  B2: "bg-violet-500",
  C1: "bg-rose-500",
  C2: "bg-amber-500",
};

interface LevelSectionProps {
  level: CEFRLevel;
  name: string;
  startWeek: number;
  endWeek: number;
  targetVocab?: number;
  weeks: Week[];
  langCode: string;
  completedWeeks: Set<number>;
  noteWeeks: Set<number>;
  defaultOpen?: boolean;
}

export function LevelSection({
  level,
  name,
  startWeek,
  endWeek,
  targetVocab,
  weeks,
  langCode,
  completedWeeks,
  noteWeeks,
  defaultOpen,
}: LevelSectionProps) {
  const completedInLevel = weeks.filter((w) => completedWeeks.has(w.number)).length;
  const pct = weeks.length > 0 ? Math.round((completedInLevel / weeks.length) * 100) : 0;

  return (
    <Accordion defaultValue={defaultOpen ? ["level"] : []}>
      <AccordionItem
        value="level"
        className="border border-stone-200/70 rounded-xl overflow-hidden bg-white"
      >
        <AccordionTrigger className="px-6 py-5 hover:no-underline hover:bg-stone-50/60 [&>svg]:text-stone-400">
          <div className="flex items-center gap-5 text-left w-full">
            <span className={`w-3 h-3 rounded-full ${levelDot[level]} shadow-sm ring-2 ring-white shrink-0`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="font-display text-xl font-semibold text-stone-900 tracking-tight">
                  {level}
                </span>
                <span className="font-display text-lg text-stone-700">{name}</span>
                <span className="text-xs text-stone-400 font-mono">
                  W{startWeek}–{endWeek}
                </span>
                {targetVocab && (
                  <span className="text-xs text-stone-400">
                    ~{targetVocab.toLocaleString()} words
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0 mr-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-medium text-stone-700 tabular-nums">
                  {completedInLevel} / {weeks.length}
                </span>
                <div className="w-20 h-1 rounded-full bg-stone-200 overflow-hidden mt-1">
                  <div
                    className={`h-full ${levelDot[level]} transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-6 pb-6 pt-2 border-t border-stone-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-4">
            {weeks.map((week) => (
              <WeekCard
                key={week.number}
                week={week}
                langCode={langCode}
                completed={completedWeeks.has(week.number)}
                hasNotes={noteWeeks.has(week.number)}
              />
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
