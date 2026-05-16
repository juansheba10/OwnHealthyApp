"use server";

import { createClient } from "@/lib/supabase/server";

export type OnboardingInput = {
  name: string;
  profile: {
    edad: number | null;
    sexo: "M" | "F" | "otro";
    altura: number | null;
    peso: number | null;
    nivel_actividad: "bajo" | "moderado" | "alto" | "muy_alto";
  };
  calorie_targets: {
    training: number;
    rest: number;
    double: number;
    football_only: number;
  };
  protein_target: number;
  restrictions: string[];
  fasting_protocol: string | null;
};

export async function completeOnboarding(input: OnboardingInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false as const, error: "No autenticado" };
  if (!user.email) return { ok: false as const, error: "Email faltante" };
  if (!input.name.trim()) return { ok: false as const, error: "Nombre requerido" };

  const { error } = await supabase.from("users").insert({
    id: user.id,
    email: user.email,
    name: input.name.trim(),
    profile: input.profile,
    calorie_targets: input.calorie_targets,
    protein_target: input.protein_target,
    restrictions: input.restrictions,
    fasting_protocol: input.fasting_protocol,
  });

  if (error) return { ok: false as const, error: error.message };

  // Initial weight log so the dashboard has something to show.
  if (input.profile.peso) {
    const today = new Date().toISOString().split("T")[0];
    await supabase.from("weight_logs").insert({
      user_id: user.id,
      date: today,
      weight_kg: input.profile.peso,
    });
  }

  return { ok: true as const };
}
