import { Resend } from 'resend';
import { escapeHtml } from '@/lib/email/escape-html';
import { formatShopTime, shopTzAbbrev } from '@/lib/timezone';

// Fixed-template confirmation. Deliberate design decision: no AI-generated
// text — the customer sees service, barber, time, and reference only.

// TODO: replace with a verified sending domain for production.
const FROM_ADDRESS = 'Fade & Co <onboarding@resend.dev>';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_CONFIGURED =
  !!RESEND_API_KEY && RESEND_API_KEY.startsWith('re_');

if (!RESEND_CONFIGURED) {
  console.warn(
    'send-booking-confirmation: RESEND_API_KEY missing or placeholder — confirmation emails will no-op.',
  );
}

export async function sendBookingConfirmation(
  to: string,
  customerName: string,
  referenceCode: string,
  serviceName: string,
  barberName: string,
  startsAt: Date,
  endsAt: Date,
): Promise<boolean> {
  if (!RESEND_CONFIGURED) return false;
  try {
    const resend = new Resend(RESEND_API_KEY!);
    const when = `${formatShopTime(startsAt, "EEEE, d MMM yyyy 'at' h:mm a")} – ${formatShopTime(endsAt, 'h:mm a')} (${shopTzAbbrev()})`;
    const subject = `Your Fade & Co. booking — ${referenceCode}`;
    const text = [
      `Hi ${customerName},`,
      '',
      'Your appointment is confirmed.',
      '',
      `Service:   ${serviceName}`,
      `Barber:    ${barberName}`,
      `When:      ${when}`,
      `Reference: ${referenceCode}`,
      '',
      'Address: [shop address placeholder]',
      '',
      'Need to cancel or reschedule? Reply to this email or call the shop.',
      '',
      '— Fade & Co.',
    ].join('\n');
    const html = [
      `<p>Hi ${escapeHtml(customerName)},</p>`,
      `<p>Your appointment is confirmed.</p>`,
      `<ul>`,
      `<li>Service: ${escapeHtml(serviceName)}</li>`,
      `<li>Barber: ${escapeHtml(barberName)}</li>`,
      `<li>When: ${escapeHtml(when)}</li>`,
      `<li>Reference: <strong>${escapeHtml(referenceCode)}</strong></li>`,
      `</ul>`,
      `<p>Address: [shop address placeholder]</p>`,
      `<p>Need to cancel or reschedule? Reply to this email or call the shop.</p>`,
      `<p>— Fade &amp; Co.</p>`,
    ].join('\n');
    // NOTE: resend.emails.send resolves (does not throw) on API errors,
    // returning { data, error } — so check error explicitly.
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject,
      text,
      html,
    });
    if (error) {
      console.error('send-booking-confirmation: send failed:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('send-booking-confirmation: send failed:', err);
    return false;
  }
}
