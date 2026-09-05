"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { NewRaceForm } from "@/components/hyrox/NewRaceForm";

// Lets the user add a next race while one is already active. getRaceForUser
// (lib/hyrox/data.ts) always shows the soonest upcoming race, so this only
// takes effect once the current one's date has passed (or if the new race
// date is sooner).
export function AddRaceSection() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-muted hover:text-text transition-colors"
      >
        <Plus size={14} />
        Añadir otra carrera
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Nueva carrera</h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="p-1 rounded-lg hover:bg-card text-muted"
        >
          <X size={16} />
        </button>
      </div>
      <NewRaceForm onDone={() => setOpen(false)} />
    </div>
  );
}
