// Netlify function: checkout.js
import Stripe from 'stripe';

export async function handler(event) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const { name, email, company, phone, notes, builderConfig } = JSON.parse(event.body || "{}");
    const leadId = crypto.randomUUID?.() || Math.random().toString(36).slice(2);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: email || undefined,
      line_items: [{ price_data:{currency:'usd',product_data:{name:'Vision Deposit ($500)'},unit_amount:50000}, quantity:1 }],
      client_reference_id: leadId,
      metadata: {
        name: name || '', company: company || '', phone: phone || '',
        notes: notes || '', builderConfig: JSON.stringify(builderConfig||{}), source: 'website-builds'
      },
      automatic_tax: { enabled: true },
      success_url: `${process.env.SITE_URL}/success.html?lead=${leadId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${process.env.SITE_URL}/website-builds.html?canceled=1`,
    });

    return { statusCode: 200, body: JSON.stringify({ url: session.url }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
}
