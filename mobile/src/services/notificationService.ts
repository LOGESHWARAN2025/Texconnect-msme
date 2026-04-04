/**
 * TexConnect Mobile Notification Service
 * Sends SMS and WhatsApp notifications
 * SMS is PRIMARY (always works), WhatsApp is OPTIONAL (requires opt-in)
 */

import { Linking, Platform, Alert } from 'react-native';

const BUSINESS_WHATSAPP_NUMBER = '+919366120001';

export interface NotificationPayload {
  recipientName: string;
  recipientPhone: string;
  recipientRole: 'buyer' | 'msme';
  orderId: string;
  orderStatus: string;
  itemName?: string;
  totalAmount?: number;
}

const APP_NAME = 'TexConnect';

function buildSMSMessage(payload: NotificationPayload): string {
  const shortId = payload.orderId.substring(0, 8).toUpperCase();
  
  if (payload.recipientRole === 'msme') {
    if (payload.orderStatus === 'Delivered') {
      return `🎉 TexConnect: Order #${shortId} from ${payload.recipientName} has been DELIVERED successfully.`;
    }
    return `TexConnect: Order #${shortId} status changed to ${payload.orderStatus}.`;
  }

  const statusMessages: Record<string, string> = {
    'Accepted': `✅ Your order #${shortId} has been Accepted. We will prepare it shortly. - TexConnect`,
    'Prepared': `📦 Your order #${shortId} is Prepared and ready for shipping. - TexConnect`,
    'Shipped': `🚚 Your order #${shortId} has been Shipped! It's on the way. - TexConnect`,
    'Out for Delivery': `🛵 Your order #${shortId} is Out for Delivery today! - TexConnect`,
    'Delivered': `🎉 Your order #${shortId} has been Delivered. Thank you! - TexConnect`,
    'Cancelled': `❌ Your order #${shortId} has been Cancelled. Contact support. - TexConnect`,
  };
  
  return statusMessages[payload.orderStatus] 
    || `TexConnect: Order #${shortId} status updated to ${payload.orderStatus}.`;
}

function buildWhatsAppMessage(payload: NotificationPayload): string {
  const shortId = payload.orderId.substring(0, 8).toUpperCase();
  const amount = payload.totalAmount ? `₹${payload.totalAmount.toLocaleString('en-IN')}` : '';
  
  if (payload.recipientRole === 'msme') {
    return `*${APP_NAME} MSME Alert* 🏭\n\n` +
      `Hello! 👋\n\n` +
      `Order *#${shortId}* has been updated to:\n\n` +
      `*📌 Status: ${payload.orderStatus}*\n\n` +
      `_– ${APP_NAME}_`;
  }

  return `*${APP_NAME} Order Update* 📦\n\n` +
    `Hello ${payload.recipientName}! 👋\n\n` +
    `Your order *#${shortId}*${amount ? ` worth ${amount}` : ''} ` +
    `has been updated to:\n\n` +
    `*📌 Status: ${payload.orderStatus}*\n\n` +
    `_– ${APP_NAME}_`;
}

/**
 * PRIMARY: Send SMS via native SMS app (always works, no opt-in needed)
 */
export function sendSMS(toPhone: string, message: string): void {
  const cleanPhone = toPhone.replace(/\D/g, '');
  const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  
  const url = `sms:${formattedPhone}${Platform.OS === 'ios' ? '&' : '?'}body=${encodeURIComponent(message)}`;
  
  console.log('[Notification] Opening SMS app:', url);
  
  Linking.openURL(url).catch(err => {
    console.error('SMS app failed:', err);
    Alert.alert('Error', 'Could not open SMS app');
  });
}

/**
 * SECONDARY: Send WhatsApp via WhatsApp app (requires user to have business number)
 */
export function sendWhatsApp(toPhone: string, message: string): void {
  const cleanPhone = toPhone.replace(/\D/g, '');
  const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  
  const url = `whatsapp://send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`;
  
  console.log('[Notification] Opening WhatsApp:', url);
  
  Linking.canOpenURL(url).then(supported => {
    if (supported) {
      Linking.openURL(url);
    } else {
      console.log('[Notification] WhatsApp not available, falling back to SMS');
      sendSMS(toPhone, message);
    }
  }).catch(() => {
    sendSMS(toPhone, message);
  });
}

/**
 * Send notification via Meta WhatsApp Business API (requires opt-in)
 * Falls back to SMS if WhatsApp fails
 */
export async function sendWhatsAppBusinessAPI(
  toPhone: string, 
  templateName: string, 
  components: any[],
  fallbackMessage: string
): Promise<void> {
  const WHATSAPP_TOKEN = 'EAA3t8IAfi6kBRCJraaNkoe018cUvlvzHAuLWSb2ZC08bNi7hbBwNXmBlxrn3pFcRHccrOWUKoIdsPGnQbBYLl3zUexkUZCNxgTNqVNaKJ0cK5SgopoZARmV2VqebTbAizajHVV0NlLUkwHglqbVQGOatfSUZAKm8UtpOVUKox3t1pzno9kE7iZCEZBuZCeRxdREkp5eZBPdnaZA0316Oqtn8lNQPUdxAwL6bZAuD6WWUXRVQ8PYBdYZArZC7fHqwy7LXNxxmTao4OLi4WyTRr5ZAsxYbuvFEa';
  const PHONE_NUMBER_ID = '1079330375257311';

  const cleanPhone = toPhone.replace(/\D/g, '');
  const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

  try {
    console.log('[Notification] Sending WhatsApp Business API to:', formattedPhone);
    
    const response = await fetch(`https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: formattedPhone,
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'en' },
          components: [
            {
              type: 'body',
              parameters: components
            }
          ]
        }
      })
    });

    const result = await response.json();
    console.log('[Notification] WhatsApp API response:', result);

    // If API fails (user not opted in, template error, etc), fallback to SMS
    if (result.error) {
      console.log('[Notification] WhatsApp API failed, using SMS:', result.error);
      sendSMS(toPhone, fallbackMessage);
    } else if (result.messages && result.messages.length > 0) {
      console.log('[Notification] WhatsApp sent successfully');
    } else {
      sendSMS(toPhone, fallbackMessage);
    }
  } catch (err) {
    console.error('[Notification] WhatsApp API error:', err);
    sendSMS(toPhone, fallbackMessage);
  }
}

/**
 * Main notification function
 * Tries WhatsApp Business API first (if user opted in), falls back to SMS
 * OR uses direct WhatsApp/SMS as primary
 */
export async function sendNotification(
  payload: NotificationPayload,
  useWhatsAppAPI: boolean = false
): Promise<void> {
  if (!payload.recipientPhone) {
    console.warn('[Notification] No phone number provided');
    return;
  }

  const smsMessage = buildSMSMessage(payload);
  const whatsAppMessage = buildWhatsAppMessage(payload);

  if (useWhatsAppAPI) {
    // Try Meta Business API (requires opt-in), fallback to SMS
    const components = [
      { type: 'text', text: payload.recipientName },
      { type: 'text', text: payload.orderId.substring(0, 8).toUpperCase() },
      { type: 'text', text: payload.orderStatus.toUpperCase() }
    ];
    await sendWhatsAppBusinessAPI(
      payload.recipientPhone, 
      'order_status_update', 
      components, 
      smsMessage
    );
  } else {
    // Use SMS as primary (always works)
    console.log('[Notification] Using SMS (primary)');
    sendSMS(payload.recipientPhone, smsMessage);
    
    // Also try to open WhatsApp as secondary (user can tap to send)
    setTimeout(() => {
      console.log('[Notification] Also opening WhatsApp (secondary)');
      sendWhatsApp(payload.recipientPhone, whatsAppMessage);
    }, 500);
  }
}

export default {
  sendSMS,
  sendWhatsApp,
  sendNotification,
  sendWhatsAppBusinessAPI,
};
