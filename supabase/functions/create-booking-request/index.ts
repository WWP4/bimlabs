const STUDIO_TIME_ZONE = 'America/Chicago';
const SLOT_MINUTES = 15;
const ALLOWED_SLOTS = [
  { hour: 9, minute: 0 },
  { hour: 10, minute: 30 },
  { hour: 12, minute: 0 },
  { hour: 13, minute: 30 },
  { hour: 15, minute: 0 },
  { hour: 16, minute: 30 },
];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function requiredEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function zonedParts(date: Date, timeZone: string) {
  const values = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date).reduce<Record<string, number>>((acc, part) => {
    if (part.type !== 'literal') acc[part.type] = Number(part.value);
    return acc;
  }, {});

  if (values.hour === 24) values.hour = 0;
  return values;
}

function displayFull(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(date);
}

function isAllowedStudioSlot(start: Date) {
  const parts = zonedParts(start, STUDIO_TIME_ZONE);
  const weekday = new Intl.DateTimeFormat('en-US', { timeZone: STUDIO_TIME_ZONE, weekday: 'short' }).format(start);
  const allowedTime = ALLOWED_SLOTS.some((slot) => slot.hour === parts.hour && slot.minute === parts.minute);
  return weekday !== 'Sat' && weekday !== 'Sun' && allowedTime;
}

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

async function sendEmail({ to, subject, text }: { to: string; subject: string; text: string }) {
  const resendApiKey = requiredEnv('RESEND_API_KEY');
  const from = requiredEnv('BOOKING_FROM_EMAIL');

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject, text }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Resend email failed: ${details}`);
  }
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  try {
    const supabaseUrl = requiredEnv('SUPABASE_URL');
    const serviceRoleKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY');
    const adminEmail = Deno.env.get('BOOKING_ADMIN_EMAIL') || 'bimlabsstudio@gmail.com';
    const payload = await request.json();

    const booking = {
      project_type: clean(payload.project_type),
      budget_range: clean(payload.budget_range),
      start_at_utc: clean(payload.start_at_utc),
      end_at_utc: clean(payload.end_at_utc),
      client_timezone: clean(payload.client_timezone),
      studio_timezone: clean(payload.studio_timezone) || STUDIO_TIME_ZONE,
      client_display_time: clean(payload.client_display_time),
      studio_display_time: clean(payload.studio_display_time),
      name: clean(payload.name),
      email: clean(payload.email).toLowerCase(),
      phone: clean(payload.phone),
      business_name: clean(payload.business_name),
      project_context: clean(payload.project_context),
      source: clean(payload.source) || 'bim-labs-booking-page',
    };

    const requiredFields = [
      'project_type', 'budget_range', 'start_at_utc', 'end_at_utc', 'client_timezone',
      'studio_timezone', 'client_display_time', 'studio_display_time', 'name', 'email', 'project_context',
    ] as const;
    const missing = requiredFields.filter((field) => !booking[field]);
    if (missing.length) return jsonResponse({ error: 'Please complete all required booking fields.' }, 400);
    if (!/^\S+@\S+\.\S+$/.test(booking.email)) return jsonResponse({ error: 'Please enter a valid email.' }, 400);
    if (booking.studio_timezone !== STUDIO_TIME_ZONE) return jsonResponse({ error: 'Invalid studio timezone.' }, 400);

    const start = new Date(booking.start_at_utc);
    const end = new Date(booking.end_at_utc);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return jsonResponse({ error: 'Invalid selected time.' }, 400);
    if (start.getTime() <= Date.now()) return jsonResponse({ error: 'Please choose a future time.' }, 400);
    if (end.getTime() - start.getTime() !== SLOT_MINUTES * 60 * 1000) return jsonResponse({ error: 'Invalid call length.' }, 400);
    if (!isAllowedStudioSlot(start)) return jsonResponse({ error: 'Please choose an available BIM Labs time.' }, 400);

    const tableUrl = `${supabaseUrl}/rest/v1/booking_requests`;
    const authHeaders = {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
    };

    const duplicateUrl = `${tableUrl}?select=id&start_at_utc=eq.${encodeURIComponent(start.toISOString())}&status=neq.cancelled&limit=1`;
    const duplicateResponse = await fetch(duplicateUrl, { headers: authHeaders });
    if (!duplicateResponse.ok) throw new Error(await duplicateResponse.text());
    const duplicates = await duplicateResponse.json();
    if (Array.isArray(duplicates) && duplicates.length > 0) {
      return jsonResponse({ error: 'That time was just taken. Please choose another time.' }, 409);
    }

    const insertResponse = await fetch(tableUrl, {
      method: 'POST',
      headers: { ...authHeaders, Prefer: 'return=representation' },
      body: JSON.stringify(booking),
    });

    if (!insertResponse.ok) {
      const details = await insertResponse.text();
      if (insertResponse.status === 409 || details.includes('booking_requests_active_start_at_utc_idx')) {
        return jsonResponse({ error: 'That time was just taken. Please choose another time.' }, 409);
      }
      throw new Error(details);
    }

    const [created] = await insertResponse.json();
    const requestId = created?.id;
    const adminBody = `New BIM Labs booking request\n\nName: ${booking.name}\nEmail: ${booking.email}\nPhone: ${booking.phone || '—'}\nBusiness name: ${booking.business_name || '—'}\nProject type: ${booking.project_type}\nBudget range: ${booking.budget_range}\nProject context:\n${booking.project_context}\n\nClient timezone: ${booking.client_timezone}\nClient display time: ${booking.client_display_time}\nBIM Labs display time: ${booking.studio_display_time}\nUTC start time: ${start.toISOString()}\nBooking request ID: ${requestId}`;
    const clientBody = `Hey ${booking.name},\n\nWe received your intro call request.\n\nYour selected time:\n${booking.client_display_time}\n\nBIM Labs studio time:\n${booking.studio_display_time}\n\nWe’ll review the request and confirm by email.\n\n— BIM Labs Studio`;

    await sendEmail({ to: adminEmail, subject: 'New BIM Labs booking request', text: adminBody });
    await sendEmail({ to: booking.email, subject: 'BIM Labs received your booking request', text: clientBody });

    return jsonResponse({ ok: true, id: requestId });
  } catch (error) {
    console.error(error);
    return jsonResponse({ error: 'Unable to submit this booking request. Please try again.' }, 500);
  }
});
