/**
 * Vercel Serverless Function: /api/notifications/whatsapp
 * Sends a WhatsApp notification via Twilio to a buyer.
 *
 * Required env vars (set in Vercel dashboard or .env):
 *   TWILIO_ACCOUNT_SID
 *   TWILIO_AUTH_TOKEN
 *   TWILIO_WHATSAPP_NUMBER  (e.g. whatsapp:+14155238886 — Twilio sandbox or approved number)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, message, orderId } = req.body;

  if (!to || !message) {
    return res.status(400).json({ error: 'Missing required fields: to, message' });
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromWhatsApp = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';

  if (!accountSid || !authToken) {
    console.warn('⚠️ Twilio WhatsApp credentials not configured');
    return res.status(200).json({
      success: true,
      mock: true,
      message: 'WhatsApp skipped (Twilio not configured)',
      to,
      orderId,
    });
  }

  try {
    // Ensure WhatsApp prefix
    const toWhatsApp = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const body = new URLSearchParams({
      To: toWhatsApp,
      From: fromWhatsApp,
      Body: message,
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    const data = await response.json() as any;

    if (!response.ok) {
      console.error('❌ Twilio WhatsApp error:', data);
      return res.status(500).json({ error: data.message || 'Twilio WhatsApp error', details: data });
    }

    console.log('✅ WhatsApp message sent successfully:', data.sid);
    return res.status(200).json({
      success: true,
      sid: data.sid,
      to: data.to,
      status: data.status,
    });
  } catch (err: any) {
    console.error('❌ WhatsApp API exception:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
