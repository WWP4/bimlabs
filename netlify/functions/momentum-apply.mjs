/**
 * Momentum partner applications
 *
 * Validates user input in a Netlify Function, then stores it through
 * Netlify's built-in Forms ingestion. No API keys or external services needed.
 * The corresponding static HTML form is registered as "momentum-partnership".
 */
const formName = "momentum-partnership";
const jsonHeaders = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};

function send(payload, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: jsonHeaders });
}

function clean(value, maxLength = 240) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export default async function momentumApply(request, context) {
  if (request.method === "GET") {
    return send({ ok: true, service: "momentum-application", accepts: "POST" });
  }
  if (request.method !== "POST") {
    return send({ ok: false, error: "Method not allowed." }, 405);
  }
  if (!(request.headers.get("content-type") || "").includes("application/json")) {
    return send({ ok: false, error: "Expected JSON." }, 415);
  }

  try {
    const raw = await request.text();
    if (raw.length > 12000) return send({ ok: false, error: "Application is too large." }, 413);

    let input;
    try { input = JSON.parse(raw || "{}"); }
    catch { return send({ ok: false, error: "Invalid JSON." }, 400); }
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      return send({ ok: false, error: "Invalid application." }, 400);
    }

    // Quietly ignore automated submissions filling the honeypot field.
    if (clean(input["bot-field"], 200)) return send({ ok: true });

    const name = clean(input.name, 120);
    const email = clean(input.email, 254).toLowerCase();
    const organization = clean(input.organization, 160);
    const organizationType = clean(input.organization_type, 20);
    const website = clean(input.website, 250);
    const phone = clean(input.phone, 60);
    const athleteCount = clean(input.athlete_count, 40);
    const message = clean(input.message, 2000);

    if (name.length < 2 || organization.length < 2 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        !["school", "club", "other"].includes(organizationType)) {
      return send({ ok: false, error: "Please provide your name, email, organization, and organization type." }, 422);
    }
    if (website && !/^https?:\/\//i.test(website) && !/^[\w-]+(\.[\w-]+)+/.test(website)) {
      return send({ ok: false, error: "Please enter a valid website, or leave it blank." }, 422);
    }

    // Use Netlify Forms for reliable, dashboard-visible persistence and spam handling.
    // context.site.url is supplied by Netlify, never by the public request.
    const siteURL = context?.site?.url;
    if (!siteURL) throw new Error("Netlify site URL is unavailable.");

    const payload = new URLSearchParams({
      "form-name": formName,
      name,
      email,
      organization,
      organization_type: organizationType,
      website,
      phone,
      athlete_count: athleteCount,
      message,
    });

    const upstream = await fetch(new URL("/momentum.html", siteURL), {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: payload.toString(),
      redirect: "manual",
      signal: AbortSignal.timeout(10000),
    });

    if (upstream.status < 200 || upstream.status >= 400) {
      console.error("Momentum form persistence failed with status", upstream.status);
      return send({ ok: false, error: "We couldn't save your application. Please try again." }, 502);
    }

    return send({ ok: true, message: "Your application has been received." }, 201);
  } catch (error) {
    console.error("Momentum application submission error:", error?.message || "unknown");
    return send({ ok: false, error: "Something went wrong. Please try again." }, 502);
  }
}

export const config = {
  rateLimit: {
    action: "rate_limit",
    aggregateBy: "ip",
    windowSize: 60,
    windowLimit: 8,
  },
};
