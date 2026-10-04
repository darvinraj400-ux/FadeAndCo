import './_env';
import { addDays } from 'date-fns';
import { createAdminClient } from '@/lib/supabase';
import { formatShopTime } from '@/lib/timezone';

// Picks a barber + service with open slots tomorrow, then fires
// two POST /api/bookings calls at the exact same instant for the same slot.

const APP_URL = process.env.APP_URL ?? 'http://localhost:3000';

type Service = { id: string; duration_minutes: number };
type Barber = { id: string };
type Slot = { startsAt: string; endsAt: string };

async function getJson(path: string): Promise<{ status: number; body: unknown }> {
  const res = await fetch(`${APP_URL}${path}`, { cache: 'no-store' });
  return { status: res.status, body: await res.json() };
}

async function main() {
  const stamp = Date.now();
  const emailA = `race-a-${stamp}@example.com`;
  const emailB = `race-b-${stamp}@example.com`;

  // 1. Fetch a service (shortest duration = most slots) + a barber offering it.
  const servicesRes = await getJson('/api/services');
  const services = (servicesRes.body as { services: Service[] }).services ?? [];
  if (services.length === 0) {
    console.error('FAIL: no services from /api/services');
    console.error(JSON.stringify(servicesRes.body));
    process.exit(1);
  }
  const service = [...services].sort(
    (a, b) => a.duration_minutes - b.duration_minutes
  )[0]!;
  const barbersRes = await getJson(`/api/barbers?serviceId=${service.id}`);
  const barbers = (barbersRes.body as { barbers: Barber[] }).barbers ?? [];
  if (barbers.length === 0) {
    console.error('FAIL: no barbers offer the service');
    process.exit(1);
  }
  const barber = barbers[0]!;

  // 2. Find a slot across the next 7 shop-local days.
  let slot: Slot | null = null;
  let dateStr = '';
  for (let i = 1; i <= 7 && !slot; i++) {
    const candidate = formatShopTime(addDays(new Date(), i), 'yyyy-MM-dd');
    const slotsRes = await getJson(
      `/api/slots?barberId=${barber.id}&serviceId=${service.id}&date=${candidate}`
    );
    const slots = (slotsRes.body as { slots: Slot[] }).slots ?? [];
    if (slots.length > 0) {
      slot = slots[0]!;
      dateStr = candidate;
    }
  }
  if (!slot) {
    console.error('FAIL: no free slots in the next 7 days');
    process.exit(1);
  }
  console.log(`contesting slot ${slot.startsAt} on ${dateStr}`);

  // 3. Two identical payloads, distinct traceable emails, same tick.
  const payload = (email: string) => ({
    barberId: barber.id,
    serviceId: service.id,
    startsAt: (slot as Slot).startsAt,
    customerName: 'Concurrency Test',
    customerEmail: email,
    notes: 'layer 3 race test',
  });
  const [a, b] = await Promise.all(
    [emailA, emailB].map(async (email) => {
      const res = await fetch(`${APP_URL}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload(email)),
      });
      return { status: res.status, body: (await res.json()) as Record<string, unknown> };
    })
  );
  console.log('response A:', a!.status, JSON.stringify(a!.body));
  console.log('response B:', b!.status, JSON.stringify(b!.body));

  // 4. Assert exactly one 201 + one 409 slot_taken.
  const winner = [a, b].find((r) => r!.status === 201);
  const loser = [a, b].find(
    (r) => r!.status === 409 && (r!.body as { error?: string }).error === 'slot_taken'
  );
  if (!winner || !loser) {
    console.error('FAIL: expected exactly one 201 and one 409 slot_taken');
    process.exit(1);
  }
  console.log(`✅ Exactly one booking succeeded (ref: ${winner.body.reference_code})`);
  console.log('✅ Second request rejected with 409 slot_taken');

  // 5. DB has exactly one non-cancelled row for that slot.
  const admin = createAdminClient();
  const { data: rows, error } = await admin
    .from('fade_appointments')
    .select('id,reference_code')
    .eq('barber_id', barber.id)
    .eq('starts_at', slot.startsAt)
    .neq('status', 'cancelled');
  if (error) {
    console.error('FAIL: db check error:', error.message);
    process.exit(1);
  }
  if ((rows ?? []).length !== 1) {
    console.error(`FAIL: expected 1 row for slot, found ${(rows ?? []).length}`);
    process.exit(1);
  }
  console.log(`✅ DB has exactly 1 row for slot ${slot.startsAt}`);

  // 6. Clean up the winning row (service-role bypasses RLS by design;
  // demo script only — never run against production).
  const { error: cleanupError } = await admin
    .from('fade_appointments')
    .delete()
    .eq('id', (winner.body as { appointment_id: string }).appointment_id);
  if (cleanupError) {
    console.error('FAIL: cleanup error:', cleanupError.message);
    process.exit(1);
  }
  console.log(`✅ Winning appointment ${(winner.body as { reference_code: string }).reference_code} cleaned up`);
  console.log('PASS');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
