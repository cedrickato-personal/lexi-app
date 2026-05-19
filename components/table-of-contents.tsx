"use client";

import { useEffect, useState, useMemo } from "react";

export interface TocItem {
  /** DOM id (anchor) for the heading element. */
  id: string;
  /** Display label shown in the TOC. */
  label: string;
  /** Visual indent depth. 1 = top-level section, 2 = sub-section. */
  level: 1 | 2;
}

interface TableOfContentsProps {
  items: TocItem[];
  /** Optional kicker shown above the list, e.g., "ON THIS PAGE" */
  title?: string;
  /** Scroll offset to apply when jumping to a section (header height + padding). */
  scrollOffset?: number;
  /** Optional className applied to the outer <nav>. */
  className?: string;
}

/**
 * Sticky outline / table of contents component.
 *
 * Uses an IntersectionObserver to highlight the currently-visible section.
 * Clicking an item smooth-scrolls to its anchor.
 *
 * Render the headings the items reference with `id={item.id}` and
 * (recommended) `scroll-mt-{N}` so anchored jumps land below the sticky nav.
 */
export function TableOfContents({
  items,
  title = "On this page",
  scrollOffset = 80,
  className,
}: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null);

  // Track which heading is currently in view.
  useEffect(() => {
    if (typeof window === "undefined" || items.length === 0) return;

    const elements = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (a.target as HTMLElement).offsetTop - (b.target as HTMLElement).offsetTop);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        // Trigger when heading enters the top third of the viewport.
        rootMargin: `-${scrollOffset}px 0px -60% 0px`,
        threshold: 0,
      },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [items, scrollOffset]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const target = document.getElementById(id);
    if (!target) return;
    const top = target.getBoundingClientRect().top + window.scrollY - scrollOffset;
    window.scrollTo({ top, behavior: "smooth" });
    setActiveId(id);
    history.replaceState(null, "", `#${id}`);
  };

  if (items.length === 0) return null;

  return (
    <nav
      aria-label={title}
      className={`${className ?? ""} text-sm`}
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-400 mb-3">
        {title}
      </p>
      <ul className="space-y-1 border-l border-stone-200">
        {items.map((item) => {
          const active = item.id === activeId;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                onClick={(e) => handleClick(e, item.id)}
                className={`block py-1 pr-2 text-xs leading-snug transition-colors -ml-px border-l ${
                  item.level === 2 ? "pl-6" : "pl-3"
                } ${
                  active
                    ? "text-orange-800 font-medium border-orange-700"
                    : "text-stone-500 hover:text-stone-900 border-transparent"
                }`}
              >
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/**
 * Extracts an outline from raw markdown by matching H2 (##) and H3 (###).
 * Used to drive the TOC on lesson/reference pages.
 */
export function useMarkdownToc(markdown: string, includeH3 = true): TocItem[] {
  return useMemo(() => {
    if (!markdown) return [];
    const lines = markdown.split("\n");
    const items: TocItem[] = [];
    const slugCounts = new Map<string, number>();
    let inCodeFence = false;
    for (const rawLine of lines) {
      // Skip headings inside code fences
      if (rawLine.trim().startsWith("```")) {
        inCodeFence = !inCodeFence;
        continue;
      }
      if (inCodeFence) continue;
      const h2 = rawLine.match(/^##\s+(.+?)\s*$/);
      const h3 = rawLine.match(/^###\s+(.+?)\s*$/);
      if (h2) {
        const label = h2[1].replace(/[*_`]/g, "").trim();
        const slug = slugify(label, slugCounts);
        items.push({ id: slug, label, level: 1 });
      } else if (h3 && includeH3) {
        const label = h3[1].replace(/[*_`]/g, "").trim();
        const slug = slugify(label, slugCounts);
        items.push({ id: slug, label, level: 1 });
      }
    }
    return items;
  }, [markdown, includeH3]);
}

function slugify(label: string, counts: Map<string, number>): string {
  const base = label
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  const n = counts.get(base) ?? 0;
  counts.set(base, n + 1);
  return n === 0 ? base : `${base}-${n}`;
}

/** Same slugify exported for callers that need to compute IDs themselves. */
export function slugifyHeading(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
