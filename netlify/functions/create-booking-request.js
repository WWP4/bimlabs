/* ==========================================================
   BIM LABS — NETLIFY BOOKING FUNCTION
   Saves booking request to Supabase + sends emails with Resend.
========================================================== */

const STUDIO_TIME_ZONE = "America/Chicago";
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
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  };
}

function requiredEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

function zonedParts(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
    .formatToParts(date)
    .reduce((acc, part) => {
      if (part.type !== "literal") {
        acc[part.type] = Number(part.value);
      }

      return acc;
    }, {});

  if (parts.hour === 24) {
    parts.hour = 0;
  }

  return parts;
}

function isAllowedStudioSlot(start) {
  const parts = zonedParts(start, STUDIO_TIME_ZONE);

  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: STUDIO_TIME_ZONE,
    weekday: "short",
  }).format(start);

  const allowedTime = ALLOWED_SLOTS.some((slot) => {
    return slot.hour === parts.hour && slot.minute === parts.minute;
  });

  return weekday !== "Sat" && weekday !== "Sun" && allowedTime;
}

async function sendEmail({ to, subject, text }) {
  const resendApiKey = requiredEnv("RESEND_API_KEY");
  const from = requiredEnv("BOOKING_FROM_EMAIL");
  const replyTo = process.env.BOOKING_REPLY_TO_EMAIL || process.env.BOOKING_ADMIN_EMAIL || "bimlabsstudio@gmail.com";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      text,
      reply_to: replyTo,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Resend email failed: ${details}`);
  }
}

exports.handler = async function handler(event) {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: "ok",
    };
  }

  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed." });
  }

  try {
    const supabaseUrl = requiredEnv("SUPABASE_URL");
    const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
    const adminEmail = process.env.BOOKING_ADMIN_EMAIL || "bimlabsstudio@gmail.com";

    const payload = JSON.parse(event.body || "{}");

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

      source: clean(payload.source) || "bim-labs-booking-page",
    };

    const requiredFields = [
      "project_type",
      "budget_range",
      "start_at_utc",
      "end_at_utc",
      "client_timezone",
      "studio_timezone",
      "client_display_time",
      "studio_display_time",
      "name",
      "email",
      "project_context",
    ];

    const missing = requiredFields.filter((field) => !booking[field]);

    if (missing.length) {
      return json(400, {
        error: "Please complete all required booking fields.",
      });
    }

    if (!/^\S+@\S+\.\S+$/.test(booking.email)) {
      return json(400, {
        error: "Please enter a valid email.",
      });
    }

    if (booking.studio_timezone !== STUDIO_TIME_ZONE) {
      return json(400, {
        error: "Invalid studio timezone.",
      });
    }

    const start = new Date(booking.start_at_utc);
    const end = new Date(booking.end_at_utc);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return json(400, {
        error: "Invalid selected time.",
      });
    }

    if (start.getTime() <= Date.now()) {
      return json(400, {
        error: "Please choose a future time.",
      });
    }

    if (end.getTime() - start.getTime() !== SLOT_MINUTES * 60 * 1000) {
      return json(400, {
        error: "Invalid call length.",
      });
    }

    if (!isAllowedStudioSlot(start)) {
      return json(400, {
        error: "Please choose an available BIM Labs time.",
      });
    }

    const tableUrl = `${supabaseUrl.replace(/\/$/, "")}/rest/v1/booking_requests`;

    const supabaseHeaders = {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
    };

    const duplicateUrl =
      `${tableUrl}?select=id` +
      `&start_at_utc=eq.${encodeURIComponent(start.toISOString())}` +
      `&status=neq.cancelled` +
      `&limit=1`;

    const duplicateResponse = await fetch(duplicateUrl, {
      method: "GET",
      headers: supabaseHeaders,
    });

    if (!duplicateResponse.ok) {
      const details = await duplicateResponse.text();
      throw new Error(`Duplicate check failed: ${details}`);
    }

    const duplicates = await duplicateResponse.json();

    if (Array.isArray(duplicates) && duplicates.length > 0) {
      return json(409, {
        error: "That time was just taken. Please choose another time.",
      });
    }

    const insertResponse = await fetch(tableUrl, {
      method: "POST",
      headers: {
        ...supabaseHeaders,
        Prefer: "return=representation",
      },
      body: JSON.stringify(booking),
    });

    if (!insertResponse.ok) {
      const details = await insertResponse.text();

      if (
        insertResponse.status === 409 ||
        details.includes("booking_requests_active_slot_unique")
      ) {
        return json(409, {
          error: "That time was just taken. Please choose another time.",
        });
      }

      throw new Error(`Supabase insert failed: ${details}`);
    }

    const createdRows = await insertResponse.json();
    const created = createdRows && createdRows[0];
    const requestId = created?.id || "Unavailable";

    const adminBody = [
      "New BIM Labs booking request",
      "",
      `Name: ${booking.name}`,
      `Email: ${booking.email}`,
      `Phone: ${booking.phone || "—"}`,
      `Business name: ${booking.business_name || "—"}`,
      `Project type: ${booking.project_type}`,
      `Budget range: ${booking.budget_range}`,
      "",
      "Project context:",
      booking.project_context,
      "",
      `Client timezone: ${booking.client_timezone}`,
      `Client display time: ${booking.client_display_time}`,
      `BIM Labs display time: ${booking.studio_display_time}`,
      `UTC start time: ${start.toISOString()}`,
      `Booking request ID: ${requestId}`,
    ].join("\n");

    const clientBody = [
      `Hey ${booking.name},`,
      "",
      "We received your intro call request.",
      "",
      "Your selected time:",
      booking.client_display_time,
      "",
      "BIM Labs studio time:",
      booking.studio_display_time,
      "",
      "We’ll review the request and confirm by email.",
      "",
      "— BIM Labs Studio",
    ].join("\n");

    await sendEmail({
      to: adminEmail,
      subject: "New BIM Labs booking request",
      text: adminBody,
    });

    await sendEmail({
      to: booking.email,
      subject: "BIM Labs received your booking request",
      text: clientBody,
    });

    return json(200, {
      ok: true,
      id: requestId,
    });
  } catch (error) {
    console.error(error);

    return json(500, {
      error: "Unable to submit this booking request. Please try again.",
    });
  }
};
