"use client";

import { useEffect, useId, useRef, useState, type InputHTMLAttributes, type KeyboardEvent } from "react";
import { formatPersonLabel } from "@/lib/people-search";
import { Avatar } from "./avatar";

type Person = { id: string; name: string; department: string | null };

// A short pause after the last key, so a fast typist sends one lookup and not one per letter.
const PAUSE_MS = 200;

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type" | "role"> & {
  value: string;
  onChange: (value: string) => void;
  /** Names the list of matching people for a screen reader. */
  listLabel: string;
};

/**
 * A text box that offers the people in the system while something is typed: a list of names and departments to pick
 * from. Choosing one fills the box with "name · department". The box stays free text, so someone who is not in the
 * system yet (a new employee) can still be typed in.
 */
export function PersonSearchInput({ value, onChange, listLabel, ...input }: Props) {
  const uid = useId();
  const box = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lookup = useRef<AbortController | undefined>(undefined);
  const [people, setPeople] = useState<Person[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  function cancelLookup() {
    clearTimeout(timer.current);
    lookup.current?.abort();
  }

  // Nothing is left running when the form goes away.
  useEffect(() => cancelLookup, []);

  useEffect(() => {
    if (open && active >= 0) document.getElementById(`${uid}-opt-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [open, active, uid]);

  function search(text: string) {
    cancelLookup();
    if (text.trim() === "") {
      setPeople([]);
      setOpen(false);
      return;
    }
    timer.current = setTimeout(async () => {
      const request = new AbortController();
      lookup.current = request;
      try {
        const response = await fetch(`/api/people?q=${encodeURIComponent(text)}`, { signal: request.signal });
        if (!response.ok) throw new Error(`lookup failed: ${response.status}`);
        const body = (await response.json()) as { people: Person[] };
        setPeople(body.people);
        setActive(-1);
        // The list belongs under a box the person is still typing in, not one they have already left.
        setOpen(body.people.length > 0 && document.activeElement === box.current);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setPeople([]);
        setOpen(false);
      }
    }, PAUSE_MS);
  }

  function choose(person: Person) {
    cancelLookup();
    onChange(formatPersonLabel(person));
    setPeople([]);
    setOpen(false);
    setActive(-1);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!open) {
      if (event.key === "ArrowDown" && people.length > 0) {
        event.preventDefault();
        setOpen(true);
        setActive(0);
      }
      return;
    }
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActive((index) => Math.min(people.length - 1, index + 1));
        return;
      case "ArrowUp":
        event.preventDefault();
        setActive((index) => Math.max(0, index - 1));
        return;
      case "Enter":
        // Only when a person is highlighted: without one, Enter keeps its usual job in the form.
        if (active >= 0) {
          event.preventDefault();
          choose(people[active]);
        }
        return;
      case "Escape":
        event.preventDefault();
        setOpen(false);
        return;
    }
  }

  return (
    <div className="relative">
      <input
        {...input}
        ref={box}
        type="text"
        role="combobox"
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={open ? `${uid}-list` : undefined}
        aria-activedescendant={open && active >= 0 ? `${uid}-opt-${active}` : undefined}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          search(event.target.value);
        }}
        onKeyDown={onKeyDown}
        onBlur={() => {
          cancelLookup();
          setOpen(false);
        }}
      />

      {open && (
        <ul
          id={`${uid}-list`}
          role="listbox"
          aria-label={listLabel}
          className="absolute z-30 mt-1.5 max-h-72 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-lift"
        >
          {people.map((person, index) => (
            <li
              key={person.id}
              id={`${uid}-opt-${index}`}
              role="option"
              aria-selected={index === active}
              // Keep the focus in the box, so the keyboard keeps working after a mouse click.
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => setActive(index)}
              onClick={() => choose(person)}
              className={`flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px] ${
                index === active ? "bg-emerald-50 text-emerald-900" : "text-slate-800"
              }`}
            >
              <Avatar name={person.name} size="xs" />
              <span className="min-w-0 flex-1 truncate font-medium">{person.name}</span>
              {person.department && <span className="max-w-[45%] shrink-0 truncate text-xs text-slate-500">{person.department}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
