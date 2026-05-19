"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown, Languages } from "lucide-react";
import { LANGUAGES, LANGUAGES_LIST, FSI_CATEGORIES } from "@/lib/languages";
import { FAMILY_THEMES } from "@/lib/family-theme";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

export function LanguageSelector({ activeLang }: { activeLang?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const active = activeLang ? LANGUAGES[activeLang] : undefined;
  const activeTheme = active ? FAMILY_THEMES[active.family] : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-stone-200 bg-white hover:bg-stone-50 text-sm transition-colors min-w-44 max-w-72">
        {active ? (
          <>
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: activeTheme?.accentHex }}
            />
            <span className="font-medium text-stone-900">{active.name}</span>
            <span
              className="text-stone-500 truncate"
              style={active.script !== "Latin" ? { fontFamily: activeTheme?.targetFontStack } : undefined}
            >
              · {active.nativeName}
            </span>
          </>
        ) : (
          <>
            <Languages className="w-4 h-4 text-stone-500" />
            <span className="text-stone-600">Pick a language</span>
          </>
        )}
        <ChevronsUpDown className="w-3.5 h-3.5 text-stone-400 ml-auto shrink-0" />
      </PopoverTrigger>
      <PopoverContent className="w-[340px] p-0" align="center">
        <Command>
          <CommandInput placeholder="Search by name or native name..." className="text-sm" />
          <CommandList className="max-h-80">
            <CommandEmpty>No languages match.</CommandEmpty>
            {FSI_CATEGORIES.map((cat, idx) => {
              const langs = LANGUAGES_LIST.filter((l) => l.fsiCategory === cat.cat);
              if (!langs.length) return null;
              return (
                <div key={cat.cat}>
                  {idx > 0 && <CommandSeparator />}
                  <CommandGroup heading={`${cat.label} · ${langs[0].totalWeeks}+ weeks`}>
                    {langs.map((lang) => {
                      const theme = FAMILY_THEMES[lang.family];
                      const isActive = lang.code === activeLang;
                      return (
                        <CommandItem
                          key={lang.code}
                          value={`${lang.name} ${lang.nativeName} ${lang.code}`}
                          onSelect={() => {
                            router.push(`/${lang.code}`);
                            setOpen(false);
                          }}
                          className="gap-2.5 cursor-pointer"
                        >
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: theme.accentHex }}
                          />
                          <span className="font-medium text-stone-900">{lang.name}</span>
                          <span
                            className="text-stone-500 text-xs truncate"
                            style={lang.script !== "Latin" ? { fontFamily: theme.targetFontStack } : undefined}
                          >
                            {lang.nativeName}
                          </span>
                          <span className="ml-auto text-[10px] text-stone-400 font-mono shrink-0">
                            {lang.totalWeeks}w
                          </span>
                          {isActive && <Check className="w-3.5 h-3.5 text-emerald-600 ml-1" />}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </div>
              );
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
