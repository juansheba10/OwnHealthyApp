"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Download, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getUserProfile, updateProfile, exportUserData } from "./actions";
import type { CalorieTargets } from "@/lib/types";

interface Profile {
  name: string;
  email: string;
  protein_target: number;
  calorie_targets: CalorieTargets;
  restrictions: string[];
  fasting_protocol: string | null;
}

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getUserProfile().then((data) => {
      setProfile(data as Profile | null);
      setLoading(false);
    });
  }, []);

  async function handleSave() {
    if (!profile) return;
    setSaving(true);
    await updateProfile({
      protein_target: profile.protein_target,
      calorie_targets: profile.calorie_targets,
      restrictions: profile.restrictions,
      fasting_protocol: profile.fasting_protocol,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleExport() {
    const data = await exportUserData();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ownhealthyapp-export-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  if (loading) {
    return <div className="text-center text-muted py-8">Cargando...</div>;
  }

  if (!profile) {
    return (
      <div className="text-center text-muted py-8">Error cargando perfil</div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl uppercase tracking-wide">Ajustes</h1>

      {/* Profile info */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <h3 className="text-sm font-medium">Perfil</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-xs text-muted block">Nombre</span>
            <span className="text-text">{profile.name}</span>
          </div>
          <div>
            <span className="text-xs text-muted block">Email</span>
            <span className="text-text">{profile.email}</span>
          </div>
        </div>
      </div>

      {/* Calorie targets */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <h3 className="text-sm font-medium">Objetivos calóricos</h3>
        <div className="grid grid-cols-2 gap-3">
          {(["training", "rest", "double", "football_only"] as const).map(
            (type) => (
              <div key={type}>
                <label className="text-xs text-muted block mb-1 capitalize">
                  {type === "football_only"
                    ? "Fútbol"
                    : type === "double"
                      ? "Doble sesión"
                      : type === "training"
                        ? "Entreno"
                        : "Descanso"}
                </label>
                <input
                  type="number"
                  value={profile.calorie_targets[type]}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      calorie_targets: {
                        ...profile.calorie_targets,
                        [type]: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm font-mono text-text focus:border-accent focus:outline-none"
                />
              </div>
            ),
          )}
        </div>
      </div>

      {/* Protein target */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <h3 className="text-sm font-medium">Proteína objetivo (g/día)</h3>
        <input
          type="number"
          value={profile.protein_target}
          onChange={(e) =>
            setProfile({ ...profile, protein_target: Number(e.target.value) })
          }
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm font-mono text-text focus:border-accent focus:outline-none"
        />
      </div>

      {/* Fasting */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <h3 className="text-sm font-medium">Protocolo de ayuno</h3>
        <select
          value={profile.fasting_protocol ?? "none"}
          onChange={(e) =>
            setProfile({
              ...profile,
              fasting_protocol:
                e.target.value === "none" ? null : e.target.value,
            })
          }
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
        >
          <option value="none">Sin ayuno</option>
          <option value="16:8">16:8</option>
          <option value="18:6">18:6</option>
          <option value="20:4">20:4</option>
        </select>
      </div>

      {/* Restrictions */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <h3 className="text-sm font-medium">Restricciones alimentarias</h3>
        <div className="flex flex-wrap gap-2">
          {[
            "sin_pescado",
            "sin_aguacate",
            "sin_lactosa",
            "sin_gluten",
            "pocas_verduras_crudas",
          ].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() =>
                setProfile({
                  ...profile,
                  restrictions: profile.restrictions.includes(r)
                    ? profile.restrictions.filter((x) => x !== r)
                    : [...profile.restrictions, r],
                })
              }
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                profile.restrictions.includes(r)
                  ? "bg-pink/20 text-pink border border-pink/30"
                  : "bg-surface text-muted border border-border"
              }`}
            >
              {r.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-accent py-3 text-sm font-semibold text-bg disabled:opacity-50"
      >
        <Save size={16} />
        {saving ? "Guardando..." : saved ? "Guardado" : "Guardar cambios"}
      </button>

      {/* Export & Logout */}
      <div className="flex gap-3">
        <button
          onClick={handleExport}
          className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-border py-3 text-sm text-muted hover:text-text transition-colors"
        >
          <Download size={16} />
          Exportar datos
        </button>
        <button
          onClick={handleLogout}
          className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-pink/30 py-3 text-sm text-pink hover:bg-pink/10 transition-colors"
        >
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
