/* ==========================================================
   BIM LABS — NETLIFY BOOKING FUNCTION
   Saves booking request to Supabase + sends branded emails with Resend.
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

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function toFirstName(name) {
  const cleanName = clean(name);
  return cleanName.split(" ")[0] || cleanName || "there";
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

function emailDetailBlock({ label, value, subvalue }) {
  return `
    <td class="detail-column" valign="top" width="50%" style="width:50%; padding:0 12px 24px 12px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        <tr>
          <td style="padding:0 0 14px 0; border-bottom:1px solid #deded8;">
            <div style="font-size:11px; line-height:1.2; letter-spacing:0.14em; text-transform:uppercase; color:#696965; font-weight:700;">
              ${escapeHtml(label)}
            </div>

            <div style="padding-top:10px; font-size:18px; line-height:1.35; color:#101010; font-weight:700; letter-spacing:-0.03em;">
              ${escapeHtml(value || "—")}
            </div>

            ${
              subvalue
                ? `
            <div style="padding-top:4px; font-size:14px; line-height:1.45; color:#555550;">
              ${escapeHtml(subvalue)}
            </div>
            `
                : ""
            }
          </td>
        </tr>
      </table>
    </td>
  `;
}

function timelineStep({ number, title, text }) {
  return `
    <tr>
      <td valign="top" style="width:54px; padding:0 16px 22px 0;">
        <div style="width:38px; height:38px; border-radius:999px; background:#050505; color:#f5f5ef; font-size:12px; line-height:38px; text-align:center; font-weight:700; letter-spacing:0.08em;">
          ${escapeHtml(number)}
        </div>
      </td>

      <td valign="top" style="padding:0 0 22px 0; border-bottom:1px solid #e4e4de;">
        <div style="font-size:17px; line-height:1.25; color:#101010; font-weight:700; letter-spacing:-0.025em;">
          ${escapeHtml(title)}
        </div>

        <div style="padding-top:6px; font-size:14px; line-height:1.65; color:#4d4d48;">
          ${escapeHtml(text)}
        </div>
      </td>
    </tr>
  `;
}

function brandedEmailShell({
  pretitle,
  title,
  intro,
  detailsHtml = "",
  timelineHtml = "",
  noticeTitle,
  noticeText,
}) {
  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>

    <style>
      @media only screen and (max-width: 620px) {
        .email-shell {
          width: 100% !important;
        }

        .email-padding {
          padding-left: 22px !important;
          padding-right: 22px !important;
        }

        .email-title {
          font-size: 38px !important;
          line-height: 1.02 !important;
        }

        .detail-column {
          display: block !important;
          width: 100% !important;
          padding-left: 0 !important;
          padding-right: 0 !important;
        }

        .footer-left,
        .footer-right {
          display: block !important;
          width: 100% !important;
          text-align: left !important;
        }

        .footer-right {
          padding-top: 12px !important;
        }
      }
    </style>
  </head>

  <body style="margin:0; padding:0; background:#f2f2ef; font-family:Arial, Helvetica, sans-serif; color:#101010;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f2ef; padding:30px 12px;">
      <tr>
        <td align="center">
          <table class="email-shell" role="presentation" width="860" cellpadding="0" cellspacing="0" style="width:860px; max-width:100%; border-collapse:collapse; background:#ffffff; border:1px solid #deded8;">

            <tr>
              <td style="background:#050505; padding:30px 38px;">
                <div style="font-size:22px; line-height:1; letter-spacing:0.34em; text-transform:uppercase; color:#f5f5ef; font-weight:700;">
                  BIM LABS
                </div>
              </td>
            </tr>

            <tr>
              <td class="email-padding" style="padding:38px 38px 12px 38px;">
                <div style="font-size:12px; line-height:1.2; letter-spacing:0.14em; text-transform:uppercase; color:#555550; font-weight:700;">
                  ${escapeHtml(pretitle)}
                </div>
              </td>
            </tr>

            <tr>
              <td class="email-padding" style="padding:0 38px 22px 38px;">
                <h1 class="email-title" style="margin:0; font-size:54px; line-height:0.98; letter-spacing:-0.06em; color:#101010; font-weight:700;">
                  ${escapeHtml(title)}
                </h1>
              </td>
            </tr>

            <tr>
              <td class="email-padding" style="padding:0 38px 26px 38px;">
                <div style="height:1px; line-height:1px; background:#deded8;">&nbsp;</div>
              </td>
            </tr>

            <tr>
              <td class="email-padding" style="padding:0 38px 34px 38px;">
                <div style="font-size:16px; line-height:1.75; color:#444440;">
                  ${intro}
                </div>
              </td>
            </tr>

            ${detailsHtml}

            ${
              timelineHtml
                ? `
            <tr>
              <td class="email-padding" style="padding:4px 38px 34px 38px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                  <tr>
                    <td style="padding:0 0 18px 0;">
                      <div style="font-size:12px; line-height:1.2; letter-spacing:0.14em; text-transform:uppercase; color:#555550; font-weight:700;">
                        What happens next
                      </div>
                    </td>
                  </tr>

                  ${timelineHtml}
                </table>
              </td>
            </tr>
            `
                : ""
            }

            ${
              noticeTitle || noticeText
                ? `
            <tr>
              <td class="email-padding" style="padding:4px 38px 34px 38px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; background:#f5f5f2; border:1px solid #e4e4de;">
                  <tr>
                    <td style="padding:22px 24px;">
                      <div style="font-size:18px; line-height:1.25; color:#101010; font-weight:700; letter-spacing:-0.025em; margin-bottom:8px;">
                        ${escapeHtml(noticeTitle || "")}
                      </div>

                      <div style="font-size:15px; line-height:1.7; color:#444440;">
                        ${noticeText || ""}
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            `
                : ""
            }

            <tr>
              <td class="email-padding" style="padding:0 38px 22px 38px;">
                <div style="height:1px; line-height:1px; background:#deded8;">&nbsp;</div>
              </td>
            </tr>

            <tr>
              <td class="email-padding" style="padding:0 38px 36px 38px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                  <tr>
                    <td class="footer-left" valign="top" style="width:50%; font-size:18px; line-height:1; letter-spacing:0.32em; text-transform:uppercase; color:#101010; font-weight:700;">
                      BIM LABS
                    </td>

                    <td class="footer-right" align="right" valign="top" style="width:50%; font-size:13px; line-height:1.5; color:#6b6b65; font-style:italic;">
                      Design. Precision. Built to last.
                    </td>
                  </tr>

                  <tr>
                    <td colspan="2" style="padding-top:16px; font-size:13px; line-height:1.7; color:#6b6b65;">
                      bimlabsstudio.com &nbsp;&nbsp;•&nbsp;&nbsp; bimlabsstudio@gmail.com &nbsp;&nbsp;•&nbsp;&nbsp; @bimlabsstudio
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;
}

function bookingDetailsGrid(booking) {
  return `
    <tr>
      <td style="padding:0 26px 10px 26px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
          <tr>
            ${emailDetailBlock({
              label: "Your scheduled time",
              value: booking.client_display_time,
              subvalue: "Shown in your local timezone",
            })}
            ${emailDetailBlock({
              label: "BIM Labs studio time",
              value: booking.studio_display_time,
              subvalue: "America/Chicago",
            })}
          </tr>

          <tr>
            ${emailDetailBlock({
              label: "Project direction",
              value: booking.project_type,
              subvalue: booking.business_name || "BIM Labs intro call",
            })}
            ${emailDetailBlock({
              label: "Budget range",
              value: booking.budget_range,
              subvalue: "Used to understand scope and fit",
            })}
          </tr>
        </table>
      </td>
    </tr>
  `;
}

async function sendEmail({ to, subject, text, html }) {
  const resendApiKey = requiredEnv("RESEND_API_KEY");
  const from = requiredEnv("BOOKING_FROM_EMAIL");
  const replyTo =
    process.env.BOOKING_REPLY_TO_EMAIL ||
    process.env.BOOKING_ADMIN_EMAIL ||
    "bimlabsstudio@gmail.com";

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
      html,
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
    const firstName = toFirstName(booking.name);

    const adminText = [
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

    const clientText = [
      `Hi ${firstName},`,
      "",
      "Thank you for booking with BIM Labs.",
      "",
      "We look forward to meeting with you and learning more about what you're building.",
      "",
      "This is your scheduled call time:",
      booking.client_display_time,
      "",
      "BIM Labs studio time:",
      booking.studio_display_time,
      "",
      "We’ll be in touch shortly by email with anything else you need before the call.",
      "",
      "What happens next:",
      "1. Your meeting is scheduled.",
      "2. We meet, plan, and identify your needs.",
      "3. We build the right digital system.",
      "4. You enjoy a cleaner, easier business workflow.",
      "",
      "— BIM Labs Studio",
    ].join("\n");

    const clientTimelineHtml = [
      timelineStep({
        number: "01",
        title: "Your meeting is scheduled.",
        text: "We received your selected time and will be in touch shortly if anything else is needed before the call.",
      }),
      timelineStep({
        number: "02",
        title: "We meet, plan, and identify your needs.",
        text: "On the call, we’ll talk through what you’re building, what feels unclear, and what the digital system needs to solve.",
      }),
      timelineStep({
        number: "03",
        title: "We build the right system.",
        text: "If the project is a fit, BIM Labs will shape the website, portal, AI system, or automation around the real business need.",
      }),
      timelineStep({
        number: "04",
        title: "You enjoy a cleaner workflow.",
        text: "The goal is simple: a sharper digital experience that helps your business present, sell, book, or operate with less friction.",
      }),
    ].join("");

    const clientHtml = brandedEmailShell({
      pretitle: `THANK YOU, ${firstName.toUpperCase()}`,
      title: "We look forward to meeting with you.",
      intro:
        "Thank you for booking with BIM Labs.<br /><br />We’re looking forward to learning more about what you’re building and how we can help make the digital side of your business clearer, sharper, and easier to use.",
      detailsHtml: bookingDetailsGrid(booking),
      timelineHtml: clientTimelineHtml,
      noticeTitle: "We’ll be in touch shortly.",
      noticeText:
        "We’ll review your request and follow up by email with anything else you need before the call. We appreciate you reaching out and look forward to speaking with you soon.",
    });

    const adminTimelineHtml = [
      timelineStep({
        number: "01",
        title: "Review request.",
        text: `Review ${booking.name}'s project context and selected time.`,
      }),
      timelineStep({
        number: "02",
        title: "Confirm by email.",
        text: "Reply with confirmation, prep questions, or the closest available option if the selected time needs to shift.",
      }),
      timelineStep({
        number: "03",
        title: "Prepare call direction.",
        text: "Use the project type, budget range, and context to identify the likely scope before the meeting.",
      }),
      timelineStep({
        number: "04",
        title: "Move to next step.",
        text: "If the call is a fit, define scope, timing, and the first project action.",
      }),
    ].join("");

    const adminDetailsHtml = `
      <tr>
        <td style="padding:0 26px 10px 26px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            <tr>
              ${emailDetailBlock({
                label: "Client",
                value: booking.name,
                subvalue: booking.email,
              })}
              ${emailDetailBlock({
                label: "Selected time",
                value: booking.studio_display_time,
                subvalue: start.toISOString(),
              })}
            </tr>

            <tr>
              ${emailDetailBlock({
                label: "Project type",
                value: booking.project_type,
                subvalue: booking.business_name || "No business name provided",
              })}
              ${emailDetailBlock({
                label: "Budget range",
                value: booking.budget_range,
                subvalue: booking.phone || "No phone provided",
              })}
            </tr>
          </table>
        </td>
      </tr>
    `;

    const adminHtml = brandedEmailShell({
      pretitle: "NEW BOOKING REQUEST",
      title: "New booking request.",
      intro:
        "A new BIM Labs intro call request was submitted. Review the details below and confirm the time by email.",
      detailsHtml: adminDetailsHtml,
      timelineHtml: adminTimelineHtml,
      noticeTitle: "Project context",
      noticeText: escapeHtml(booking.project_context).replace(/\n/g, "<br />"),
    });

    /*
      Email should not make the booking fail after the Supabase row is created.
      If Resend has an issue, the lead is still saved and the site still shows success.
    */
    try {
      await sendEmail({
        to: adminEmail,
        subject: "New BIM Labs booking request",
        text: adminText,
        html: adminHtml,
      });

      await sendEmail({
        to: booking.email,
        subject: "Thank you for booking with BIM Labs",
        text: clientText,
        html: clientHtml,
      });
    } catch (emailError) {
      console.error("Booking saved, but email failed:", emailError);
    }

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
