// Shared Postgres-error helpers for booking writes. The exclusion
// constraint is the source of truth for race safety; it fires as 23P01.
export function isSlotTaken(error: { code?: string; message?: string }): boolean {
  if (!error) return false;
  if (error.code === "23P01") return true;
  const message = error.message ?? "";
  return /fade_appointments_no_overlap|exclusion|overlap/i.test(message);
}

export function isReferenceCollision(error: {
  code?: string;
  message?: string;
}): boolean {
  if (!error || error.code !== "23505") return false;
  return /fade_appointments_reference_code_key|reference_code/i.test(
    error.message ?? ""
  );
}
