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
    console.error('[API] Missing environment variables:', {
      hasPhoneNumberId: !!PHONE_NUMBER_ID,
      hasWhatsappToken: !!WHATSAPP_TOKEN
    });
    return res.status(500).json({
      error: 'Meta WhatsApp not configured',
      details: 'Missing META_PHONE_NUMBER_ID or META_WHATSAPP_TOKEN env var'
    });
  }

  const { to, templateName, languageCode, parameters, buttons } = req.body || {};

  if (!to || !templateName) {
    return res.status(400).json({ error: 'Missing required fields: to, templateName' });
  }

  // Clean phone number - remove all non-digits
  const cleanPhone = String(to).replace(/\D/g, '');
  
  // Format: country code + number (no + prefix)
  let formattedPhone;
  if (cleanPhone.length === 10) {
    // Indian number without country code
    formattedPhone = `91${cleanPhone}`;
  } else if (cleanPhone.startsWith('91') && cleanPhone.length === 12) {
    // Already has 91 prefix
    formattedPhone = cleanPhone;
  } else if (cleanPhone.startsWith('0') && cleanPhone.length === 11) {
    // Starts with 0, remove it and add 91
    formattedPhone = `91${cleanPhone.substring(1)}`;
  } else {
    // Assume it has country code already
    formattedPhone = cleanPhone;
  }

  const lang = languageCode || 'en';
  const paramsArray = Array.isArray(parameters) ? parameters : null;
  const paramsObject =
    parameters && typeof parameters === 'object' && !Array.isArray(parameters) ? parameters : null;
  const buttonsArray = Array.isArray(buttons) ? buttons : null;

  console.log('[API] WhatsApp request:', {
    to: formattedPhone,
    templateName,
    language: lang,
    paramCount: paramsArray ? paramsArray.length : paramsObject ? Object.keys(paramsObject).length : 0,
    buttonCount: buttonsArray ? buttonsArray.length : 0
  });

  try {
    const apiUrl = `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`;
    
    const bodyParameters = paramsArray
      ? paramsArray.map((p: any) => ({
          type: p?.type || 'text',
          text: String(p?.text ?? p)
        }))
      : paramsObject
        ? Object.entries(paramsObject)
            .filter(([key]) => key !== 'button_url')
            .map(([key, value]) => ({
              type: 'text',
              text: String(value),
              parameter_name: key
            }))
        : [];

    const inferredButtonUrl = paramsObject && typeof (paramsObject as any).button_url !== 'undefined'
      ? String((paramsObject as any).button_url)
      : null;

    const buttonComponents = buttonsArray
      ? buttonsArray
      : inferredButtonUrl
        ? [{ type: 'url', index: 0, parameters: [{ type: 'text', text: inferredButtonUrl }] }]
        : [];

    const components: any[] = [
      {
        type: 'body',
        parameters: bodyParameters
      }
    ];

    for (const b of buttonComponents) {
      if (!b) continue;
      const idx = typeof b.index === 'number' ? b.index : 0;
      const urlText =
        Array.isArray(b.parameters) && b.parameters[0]
          ? String(b.parameters[0]?.text ?? b.parameters[0])
          : null;

      if (!urlText) continue;

      components.push({
        type: 'button',
        sub_type: 'url',
        index: String(idx),
        parameters: [{ type: 'text', text: urlText }]
      });
    }

    const requestBody = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: formattedPhone,
      type: 'template',
      template: {
        name: templateName,
        language: { code: lang },
        components
      }
    };

    console.log('[API] Request body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const data = (await response.json()) as any;

    console.log('[API] Response status:', response.status);
    console.log('[API] Response body:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (e: any) {
    console.error('[API] Error calling Meta API:', e);
    return res.status(500).json({ error: e?.message || 'Failed to call Meta API' });
  }
}
