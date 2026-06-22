# BIM Labs booking setup

The booking page submits to a Supabase Edge Function named `create-booking-request`. The frontend must never insert directly into Supabase tables and must never contain the Supabase service role key or Resend API key.

## 1. Create or link a Supabase project

```bash
supabase login
supabase link --project-ref <your-project-ref>
```

## 2. Run the booking table migration

```bash
supabase db push
```

This creates `public.booking_requests`, enables RLS, and adds a partial unique index that prevents more than one non-cancelled request for the same `start_at_utc`.

## 3. Add Edge Function secrets

```bash
supabase secrets set \
  SUPABASE_URL="https://<your-project-ref>.supabase.co" \
  SUPABASE_SERVICE_ROLE_KEY="<service-role-key>" \
  RESEND_API_KEY="<resend-api-key>" \
  BOOKING_FROM_EMAIL="BIM Labs Studio <bookings@your-domain.com>" \
  BOOKING_ADMIN_EMAIL="bimlabsstudio@gmail.com"
```

Keep these values only in Supabase Edge Function secrets. Do not add them to frontend files.

## 4. Deploy the Edge Function

```bash
supabase functions deploy create-booking-request
```

## 5. Set the frontend function URL

If the site is served from the same Supabase project domain, the default `/functions/v1/create-booking-request` works. Otherwise, set this before `book-page.js` loads:

```html
<script>
  window.BIM_LABS_BOOKING_FUNCTION_URL = "https://<your-project-ref>.functions.supabase.co/create-booking-request";
</script>
```

Only the public function URL belongs in frontend code. Never expose service role or Resend secrets.

## 6. Test booking submission

- Open `/book.html`.
- Confirm the timezone note appears on the date/time step.
- Submit a request.
- Confirm a row appears in `booking_requests`.
- Confirm both admin and client emails are sent.
- Try the same slot again and verify the function returns: “That time was just taken. Please choose another time.”
