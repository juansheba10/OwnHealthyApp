"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { completeOnboarding } from "./actions";

const RESTRICTION_OPTIONS = [
  "sin_pescado",
  "sin_aguacate",
  "sin_lactosa",
  "sin_gluten",
  "pocas_verduras_crudas",
];

export function OnboardingForm({ email }: { email: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [edad, setEdad] = useState("");
  const [sexo, setSexo] = useState<"M" | "F" | "otro">("M");
  const [altura, setAltura] = useState("");
  const [peso, setPeso] = useState("");
  const [nivelActividad, setNivelActividad] =
    useState<"bajo" | "moderado" | "alto" | "muy_alto">("moderado");
  const [calTraining, setCalTraining] = useState(2500);
  const [calRest, setCalRest] = useState(2000);
  const [calDouble, setCalDouble] = useState(3000);
  const [calFootballOnly, setCalFootballOnly] = useState(2500);
  const [proteinTarget, setProteinTarget] = useState(150);
  const [restrictions, setRestrictions] = useState<string[]>([]);
  const [fastingProtocol, setFastingProtocol] = useState<string>("none");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function toggleRestriction(r: string) {
    setRestrictions((curr) =>
      curr.includes(r) ? curr.filter((x) => x !== r) : [...curr, r],
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await completeOnboarding({
      name,
      profile: {
        edad: edad ? Number(edad) : null,
        sexo,
        altura: altura ? Number(altura) : null,
        peso: peso ? Number(peso) : null,
        nivel_actividad: nivelActividad,
      },
      calorie_targets: {
        training: calTraining,
        rest: calRest,
        double: calDouble,
        football_only: calFootballOnly,
      },
      protein_target: proteinTarget,
      restrictions,
      fasting_protocol: fastingProtocol === "none" ? null : fastingProtocol,
    });

    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="font-display text-4xl uppercase tracking-wide text-accent">
          Bienvenido
        </h1>
        <p className="mt-2 text-sm text-muted">
          Configuremos tu perfil para empezar
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Datos personales */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <h3 className="text-sm font-medium">Datos personales</h3>

          <div>
            <label className="text-xs text-muted block mb-1">
              Nombre <span className="text-pink">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
              placeholder="Tu nombre"
            />
          </div>

          <div>
            <label className="text-xs text-muted block mb-1">Email</label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-muted"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted block mb-1">Edad</label>
              <input
                type="number"
                value={edad}
                onChange={(e) => setEdad(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm font-mono text-text focus:border-accent focus:outline-none"
                placeholder="30"
              />
            </div>
            <div>
              <label className="text-xs text-muted block mb-1">Sexo</label>
              <select
                value={sexo}
                onChange={(e) =>
                  setSexo(e.target.value as "M" | "F" | "otro")
                }
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
              >
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
                <option value="otro">Otro</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted block mb-1">
                Altura (cm)
              </label>
              <input
                type="number"
                value={altura}
                onChange={(e) => setAltura(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm font-mono text-text focus:border-accent focus:outline-none"
                placeholder="175"
              />
            </div>
            <div>
              <label className="text-xs text-muted block mb-1">Peso (kg)</label>
              <input
                type="number"
                step="0.1"
                value={peso}
                onChange={(e) => setPeso(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm font-mono text-text focus:border-accent focus:outline-none"
                placeholder="75"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted block mb-1">
              Nivel de actividad
            </label>
            <select
              value={nivelActividad}
              onChange={(e) =>
                setNivelActividad(
                  e.target.value as "bajo" | "moderado" | "alto" | "muy_alto",
                )
              }
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
            >
              <option value="bajo">Bajo</option>
              <option value="moderado">Moderado</option>
              <option value="alto">Alto</option>
              <option value="muy_alto">Muy alto</option>
            </select>
          </div>
        </div>

        {/* Objetivos calóricos */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <h3 className="text-sm font-medium">Objetivos calóricos</h3>
          <p className="text-xs text-muted">
            Kcal según el tipo de día
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted block mb-1">Entreno</label>
              <input
                type="number"
                value={calTraining}
                onChange={(e) => setCalTraining(Number(e.target.value))}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm font-mono text-text focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-muted block mb-1">Descanso</label>
              <input
                type="number"
                value={calRest}
                onChange={(e) => setCalRest(Number(e.target.value))}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm font-mono text-text focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-muted block mb-1">
                Doble sesión
              </label>
              <input
                type="number"
                value={calDouble}
                onChange={(e) => setCalDouble(Number(e.target.value))}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm font-mono text-text focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-muted block mb-1">Fútbol</label>
              <input
                type="number"
                value={calFootballOnly}
                onChange={(e) => setCalFootballOnly(Number(e.target.value))}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm font-mono text-text focus:border-accent focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted block mb-1">
              Proteína objetivo (g/día)
            </label>
            <input
              type="number"
              value={proteinTarget}
              onChange={(e) => setProteinTarget(Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm font-mono text-text focus:border-accent focus:outline-none"
            />
          </div>
        </div>

        {/* Restricciones y ayuno */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <h3 className="text-sm font-medium">Restricciones y ayuno</h3>

          <div>
            <label className="text-xs text-muted block mb-2">
              Restricciones alimentarias
            </label>
            <div className="flex flex-wrap gap-2">
              {RESTRICTION_OPTIONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => toggleRestriction(r)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    restrictions.includes(r)
                      ? "bg-pink/20 text-pink border border-pink/30"
                      : "bg-surface text-muted border border-border"
                  }`}
                >
                  {r.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-muted block mb-1">
              Protocolo de ayuno
            </label>
            <select
              value={fastingProtocol}
              onChange={(e) => setFastingProtocol(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
            >
              <option value="none">Sin ayuno</option>
              <option value="16:8">16:8</option>
              <option value="18:6">18:6</option>
              <option value="20:4">20:4</option>
            </select>
          </div>
        </div>

        {error && (
          <p className="text-sm text-pink text-center">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-accent py-3 font-semibold text-bg transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Guardando..." : "Empezar"}
        </button>
      </form>
    </div>
  );
}
