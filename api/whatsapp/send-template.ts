import type { VercelRequest, VercelResponse } from '@vercel/node';

const PHONE_NUMBER_ID = process.env.META_PHONE_NUMBER_ID;
const WHATSAPP_TOKEN = process.env.META_WHATSAPP_TOKEN;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!PHONE_NUMBER_ID || !WHATSAPP_TOKEN) {
    return res.status(500).json({
      error: 'Meta WhatsApp not configured',
      details: 'Missing META_PHONE_NUMBER_ID or META_WHATSAPP_TOKEN env var'
    });
  }

  const { to, templateName, languageCode, parameters } = req.body || {};

  if (!to || !templateName) {
    return res.status(400).json({ error: 'Missing required fields: to, templateName' });
  }

  const cleanPhone = String(to).replace(/\D/g, '');
  const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

  const lang = languageCode || 'en_US';
  const params = Array.isArray(parameters) ? parameters : [];

  try {
    const response = await fetch(`https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'template',
        template: {
          name: templateName,
          language: { code: lang },
          ...(params.length
            ? {
                components: [
                  {
                    type: 'body',
                    parameters: params
                  }
                ]
              }
            : {})
        }
      })
    });

    const data = (await response.json()) as any;

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Failed to call Meta API' });
  }
}
