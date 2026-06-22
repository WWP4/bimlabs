export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const data = JSON.parse(event.body || '{}');
    const required = ['projectType', 'budgetRange', 'selectedDate', 'selectedTime', 'name', 'email', 'projectContext'];
    const missing = required.filter((field) => !String(data[field] || '').trim());

    if (missing.length || !/^\S+@\S+\.\S+$/.test(String(data.email || ''))) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing or invalid booking request fields.' }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, message: 'Booking request received.' }),
    };
  } catch (error) {
    return { statusCode: 400, body: JSON.stringify({ error: error.message }) };
  }
}
