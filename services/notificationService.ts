/**
 * TexConnect Notification Service
 * Sends SMS and WhatsApp notifications to buyers when order status changes.
 *
 * This service calls Supabase Edge Functions (or can be configured to call
 * Twilio / MSG91 / Fast2SMS APIs directly). Add your API credentials to .env.
 *
 * Required env vars (add to .env):
 *   VITE_NOTIFICATION_PROVIDER = 'supabase' | 'twilio' | 'fast2sms' | 'mock'
 *   VITE_TWILIO_ACCOUNT_SID    = (if using Twilio)
 *   VITE_TWILIO_AUTH_TOKEN     = (if using Twilio)
 *   VITE_TWILIO_FROM_NUMBER    = (if using Twilio, e.g. +14155552671)
 *   VITE_TWILIO_WHATSAPP_FROM  = (if using Twilio WA, e.g. whatsapp:+14155238886)
 */

import type { OrderStatus } from '../types';
import { supabase } from '../src/lib/supabase';

export interface NotificationPayload {
  recipientName: string;
  recipientPhone: string; // E.164 format e.g. +919876543210
  recipientRole: 'buyer' | 'msme';
  orderId: string;
  orderStatus: OrderStatus;
  itemName?: string;
  totalAmount?: number;
}

const APP_NAME = 'TexConnect';

function buildSmsMessage(payload: NotificationPayload): string {
  const shortId = payload.orderId.substring(0, 8).toUpperCase();
  
  if (payload.recipientRole === 'msme') {
    if (payload.orderStatus === 'Delivered') {
      return `🎉 Success! Order #${shortId} has been Delivered successfully to the buyer. - ${APP_NAME}`;
    }
    return `Order #${shortId} status changed to ${payload.orderStatus}. - ${APP_NAME}`;
  }

  const statusMessages: Partial<Record<OrderStatus, string>> = {
    Accepted:         `✅ Your order #${shortId} has been Accepted by the MSME. We will prepare it shortly.`,
    'Ready to Prepare': `🔧 Good news! Your order #${shortId} is now being Prepared.`,
    Prepared:         `📦 Your order #${shortId} is Prepared and ready for shipping.`,
    Shipped:          `🚚 Your order #${shortId} has been Shipped! It's on its way to you.`,
    'Out for Delivery': `🛵 Your order #${shortId} is Out for Delivery. Expect it today!`,
    Delivered:        `🎉 Your order #${shortId} has been Delivered successfully. Thank you for choosing ${APP_NAME}!`,
    Cancelled:        `❌ Your order #${shortId} has been Cancelled. Contact us for assistance.`,
  };
  return statusMessages[payload.orderStatus]
    ?? `Your order #${shortId} status has been updated to: ${payload.orderStatus}. - ${APP_NAME}`;
}

function buildWhatsAppMessage(payload: NotificationPayload): string {
  const shortId = payload.orderId.substring(0, 8).toUpperCase();
  const amount = payload.totalAmount ? `₹${payload.totalAmount.toLocaleString('en-IN')}` : '';
  
  if (payload.recipientRole === 'msme') {
    return (
      `*${APP_NAME} MSME Alert* 🏭\n\n` +
      `Hello ${payload.recipientName}! 👋\n\n` +
      `The order *#${shortId}*${payload.itemName ? ` (${payload.itemName})` : ''} ` +
      `has been updated to:\n\n` +
      `*📌 Status: ${payload.orderStatus}*\n\n` +
      buildSmsMessage(payload) + `\n\n` +
      `_– ${APP_NAME} Team_`
    );
  }

  return (
    `*${APP_NAME} Order Update* 🏭\n\n` +
    `Hello ${payload.recipientName}! 👋\n\n` +
    `Your order *#${shortId}*${payload.itemName ? ` (${payload.itemName})` : ''}${amount ? ` worth ${amount}` : ''} ` +
    `has been updated to:\n\n` +
    `*📌 Status: ${payload.orderStatus}*\n\n` +
    buildSmsMessage(payload) + `\n\n` +
    `_– ${APP_NAME} Team_`
  );
}

/**
 * Sends notification via Supabase Edge Function.
 * Create a Supabase Edge Function named 'send-notification' that
 * accepts { phone, sms, whatsapp } and calls Twilio/MSG91.
 */
async function sendViaSupabaseEdge(payload: NotificationPayload): Promise<void> {
  const { error } = await supabase.functions.invoke('send-notification', {
    body: {
      phone: payload.recipientPhone,
      sms: buildSmsMessage(payload),
      whatsapp: buildWhatsAppMessage(payload),
      orderId: payload.orderId,
      recipientName: payload.recipientName,
      status: payload.orderStatus,
    },
  });
  if (error) throw error;
}

/**
 * Sends notification via Twilio REST API (browser-safe only if CORS is configured,
 * otherwise use Edge Function for production).
 */
async function sendViaTwilio(payload: NotificationPayload): Promise<void> {
  const accountSid = import.meta.env.VITE_TWILIO_ACCOUNT_SID;
  const authToken = import.meta.env.VITE_TWILIO_AUTH_TOKEN;
  const fromNumber = import.meta.env.VITE_TWILIO_FROM_NUMBER;
  const fromWhatsApp = import.meta.env.VITE_TWILIO_WHATSAPP_FROM || `whatsapp:+14155238886`;

  if (!accountSid || !authToken || !fromNumber) {
    console.warn('⚠️ Twilio credentials not configured');
    return;
  }

  const baseUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const headers = {
    'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  const toPhone = payload.recipientPhone.startsWith('+') ? payload.recipientPhone : `+91${payload.recipientPhone}`;

  // Send SMS
  try {
    const smsBody = new URLSearchParams({
      To: toPhone,
      From: fromNumber,
      Body: buildSmsMessage(payload),
    });
    const smsRes = await fetch(baseUrl, { method: 'POST', headers, body: smsBody.toString() });
    if (!smsRes.ok) {
      const err = await smsRes.json();
      console.error('❌ Twilio SMS error:', err);
    } else {
      console.log('✅ SMS sent via Twilio');
    }
  } catch (e) {
    console.error('❌ Twilio SMS exception:', e);
  }

  // Send WhatsApp
  try {
    const waBody = new URLSearchParams({
      To: `whatsapp:${toPhone}`,
      From: fromWhatsApp,
      Body: buildWhatsAppMessage(payload),
    });
    const waRes = await fetch(baseUrl, { method: 'POST', headers, body: waBody.toString() });
    if (!waRes.ok) {
      const err = await waRes.json();
      console.error('❌ Twilio WhatsApp error:', err);
    } else {
      console.log('✅ WhatsApp message sent via Twilio');
    }
  } catch (e) {
    console.error('❌ Twilio WhatsApp exception:', e);
  }
}

/**
 * Mock provider — logs to console (no real API calls).
 * Useful for development/testing.
 */
function sendMock(payload: NotificationPayload): void {
  console.group(`📱 [MOCK] TexConnect Notification — Order ${payload.orderId.substring(0, 8)} (${payload.recipientRole})`);
  console.log('📞 To:', payload.recipientPhone);
  console.log('📝 SMS:', buildSmsMessage(payload));
  console.log('💬 WhatsApp:', buildWhatsAppMessage(payload));
  console.groupEnd();
}

/**
 * Main entry point — call this after a successful order status update.
 * It will NOT throw; errors are caught and logged so the UI keeps working.
 */
export async function sendOrderStatusNotification(payload: NotificationPayload): Promise<void> {
  if (!payload.recipientPhone) {
    console.warn(`⚠️ Notification skipped: ${payload.recipientRole} has no phone number`);
    return;
  }

  const provider = import.meta.env.VITE_NOTIFICATION_PROVIDER || 'mock';
  console.log(`📬 Sending order notification via provider: ${provider}`);

  try {
    switch (provider) {
      case 'supabase':
        await sendViaSupabaseEdge(payload);
        break;
      case 'twilio':
        await sendViaTwilio(payload);
        break;
      case 'mock':
      default:
        sendMock(payload);
        break;
    }
  } catch (err) {
    console.error('❌ Notification dispatch failed:', err);
    // Non-fatal — do not rethrow
  }
}
