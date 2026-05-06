"use client";

import { AlertTriangle, Check, X } from "lucide-react";

interface ConfirmCardProps {
  title: string;
  summary: string;
  onApprove: () => void;
  onReject: () => void;
  disabled?: boolean;
  resolved?: "approved" | "rejected";
}

export function ConfirmCard({
  title,
  summary,
  onApprove,
  onReject,
  disabled,
  resolved,
}: ConfirmCardProps) {
  if (resolved) {
    const approved = resolved === "approved";
    return (
      <div
        className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-xs ${
          approved
            ? "border-accent2/30 bg-accent2/5 text-accent2"
            : "border-border bg-surface text-muted"
        }`}
      >
        {approved ? <Check size={14} /> : <X size={14} />}
        <span>
          {approved ? "Cambio aplicado" : "Cambio descartado"} · {title}
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-accent/30 bg-surface px-4 py-3">
      <div className="flex items-start gap-2">
        <AlertTriangle size={16} className="text-accent shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-xs uppercase tracking-wide text-accent font-medium">
            Confirmación
          </p>
          <p className="text-sm text-text font-medium mt-0.5">{title}</p>
          <p className="text-xs text-muted mt-1 break-words">{summary}</p>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <button
          onClick={onApprove}
          disabled={disabled}
          className="flex-1 rounded-lg bg-accent px-3 py-2 text-xs font-medium text-bg disabled:opacity-50 transition-opacity"
        >
          Aplicar
        </button>
        <button
          onClick={onReject}
          disabled={disabled}
          className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-text hover:border-muted disabled:opacity-50 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
