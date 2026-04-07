import type { VercelRequest, VercelResponse } from '@vercel/node';

const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Meta webhook verification (GET)
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token && VERIFY_TOKEN && String(token) === String(VERIFY_TOKEN)) {
      return res.status(200).send(String(challenge ?? ''));
    }

    return res.status(403).json({ error: 'Webhook verification failed' });
  }

  // Incoming webhook notifications (POST)
  if (req.method === 'POST') {
    try {
      // Log the webhook payload to Vercel function logs for diagnosis
      console.log('[WA Webhook] headers:', JSON.stringify(req.headers));
      console.log('[WA Webhook] body:', JSON.stringify(req.body));
    } catch (e) {
      console.log('[WA Webhook] log error:', String(e));
    }

    // WhatsApp expects 200 OK quickly.
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}
