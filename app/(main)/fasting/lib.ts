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
