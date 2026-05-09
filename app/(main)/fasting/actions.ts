"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface FastingSession {
  id: string;
  user_id: string;
  started_at: string;
  target_end_at: string;
  ended_at: string | null;
  protocol: string | null;
  notes: string | null;
}

export function fastHoursForProtocol(protocol: string | null): number {
  if (!protocol) return 16;
  const [fast] = protocol.split(":").map(Number);
  return Number.isFinite(fast) && fast > 0 ? fast : 16;
}

export async function getActiveFast(): Promise<FastingSession | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("fasting_sessions")
    .select("*")
    .eq("user_id", user.id)
    .is("ended_at", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data as FastingSession | null) ?? null;
}

export async function startFast(): Promise<FastingSession> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("users")
    .select("fasting_protocol")
    .eq("id", user.id)
    .single();

  const protocol = (profile?.fasting_protocol as string | null) ?? null;
  const hours = fastHoursForProtocol(protocol);

  const startedAt = new Date();
  const targetEndAt = new Date(startedAt.getTime() + hours * 60 * 60 * 1000);

  const { data, error } = await supabase
    .from("fasting_sessions")
    .insert({
      user_id: user.id,
      started_at: startedAt.toISOString(),
      target_end_at: targetEndAt.toISOString(),
      protocol,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/");
  return data as FastingSession;
}

export async function stopFast(notes?: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { data: active } = await supabase
    .from("fasting_sessions")
    .select("id")
    .eq("user_id", user.id)
    .is("ended_at", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!active) throw new Error("No hay un ayuno activo");

  const { error } = await supabase
    .from("fasting_sessions")
    .update({
      ended_at: new Date().toISOString(),
      notes: notes?.trim() || null,
    })
    .eq("id", active.id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/");
}
