/**
 * Vercel Serverless Function: /api/notifications/sms
 * Sends an SMS notification via Twilio to a buyer.
 *
 * Required env vars (set in Vercel dashboard or .env):
 *   TWILIO_ACCOUNT_SID
 *   TWILIO_AUTH_TOKEN
 *   TWILIO_PHONE_NUMBER  (e.g. +14155552671)
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

  const accountSid = (process.env.TWILIO_ACCOUNT_SID || '').trim();
  const authToken = (process.env.TWILIO_AUTH_TOKEN || '').trim();
  const fromNumber = (process.env.TWILIO_PHONE_NUMBER || '').trim();

  // Debugging logs (safe - only shows lengths and first/last chars)
  console.log('[DEBUG] Twilio Config Check:');
  console.log(`- AccountSID: ${accountSid.substring(0, 4)}... (length: ${accountSid.length})`);
  console.log(`- AuthToken: ${authToken.substring(0, 2)}... (length: ${authToken.length})`);
  console.log(`- FromNumber: ${fromNumber}`);

  if (!accountSid || !authToken || !fromNumber) {
    console.warn('⚠️ Twilio SMS credentials not configured');
    // Return success in mock mode so frontend is not blocked
    return res.status(200).json({
      success: true,
      mock: true,
      message: 'SMS skipped (Twilio not configured)',
      to,
      orderId,
    });
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const body = new URLSearchParams({
      To: to,
      From: fromNumber,
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
      console.error('❌ Twilio SMS error:', data);
      return res.status(500).json({ error: data.message || 'Twilio SMS error', details: data });
    }

    console.log('✅ SMS sent successfully:', data.sid);
    return res.status(200).json({
      success: true,
      sid: data.sid,
      to: data.to,
      status: data.status,
    });
  } catch (err: any) {
    console.error('❌ SMS API exception:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
