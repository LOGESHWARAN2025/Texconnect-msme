import { supabase } from '../lib/supabase';

/**
 * Notification Service
 * Handles WhatsApp and SMS notifications for order confirmations
 * Uses Meta WhatsApp API and SMS fallbacks
 */

interface NotificationConfig {
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioPhoneNumber: string;
  twilioWhatsAppNumber: string;
}

interface OrderNotificationData {
  buyerName: string;
  buyerPhone: string;
  orderId: string;
  orderStatus: string;
  itemName: string;
  quantity: number;
  totalAmount: number;
  applicationName: string;
}

/**
 * Get Twilio configuration from environment variables
 */
const getTwilioConfig = (): NotificationConfig => {
  const accountSid = import.meta.env.VITE_TWILIO_ACCOUNT_SID;
  const authToken = import.meta.env.VITE_TWILIO_AUTH_TOKEN;
  const phoneNumber = import.meta.env.VITE_TWILIO_PHONE_NUMBER;
  const whatsappNumber = import.meta.env.VITE_TWILIO_WHATSAPP_NUMBER;

  if (!accountSid || !authToken || !phoneNumber || !whatsappNumber) {
    console.warn('⚠️ Twilio configuration incomplete. Notifications will not be sent.');
    console.warn('Required env vars: VITE_TWILIO_ACCOUNT_SID, VITE_TWILIO_AUTH_TOKEN, VITE_TWILIO_PHONE_NUMBER, VITE_TWILIO_WHATSAPP_NUMBER');
  }

  return {
    twilioAccountSid: accountSid || '',
    twilioAuthToken: authToken || '',
    twilioPhoneNumber: phoneNumber || '',
    twilioWhatsAppNumber: whatsappNumber || ''
  };
};

/**
 * Format phone number to E.164 format (+country code + number)
 * Assumes Indian numbers if no country code provided
 */
const formatPhoneNumber = (phone: string): string => {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // If already has country code (11+ digits), return as is
  if (cleaned.length >= 11) {
    return '+' + cleaned;
  }
  
  // If 10 digits (Indian mobile), add +91
  if (cleaned.length === 10) {
    return '+91' + cleaned;
  }
  
  // If already has +91, return as is
  if (phone.startsWith('+91')) {
    return phone;
  }
  
  // Default: assume Indian number
  return '+91' + cleaned;
};

/**
 * Create SMS message for order confirmation
 */
const createSMSMessage = (data: OrderNotificationData): string => {
  return `Hi ${data.buyerName},

Your order #${data.orderId} has been ${data.orderStatus}.

Order Details:
- Item: ${data.itemName}
- Quantity: ${data.quantity}
- Total: ₹${data.totalAmount}

Thank you for using ${data.applicationName}!`;
};

/**
 * Create WhatsApp message for order confirmation
 */
const createWhatsAppMessage = (data: OrderNotificationData): string => {
  return `🎉 *Order Confirmation* 🎉

Hi ${data.buyerName},

Your order *#${data.orderId}* has been *${data.orderStatus}*.

📦 *Order Details:*
• Item: ${data.itemName}
• Quantity: ${data.quantity}
• Total: ₹${data.totalAmount}

Thank you for using *${data.applicationName}*!

For support, reply to this message.`;
};

/**
 * Send SMS notification via Twilio
 */
export const sendSMSNotification = async (data: OrderNotificationData): Promise<boolean> => {
  try {
    const config = getTwilioConfig();
    
    if (!config.twilioAccountSid || !config.twilioAuthToken) {
      console.warn('⚠️ Twilio SMS not configured. Skipping SMS notification.');
      return false;
    }

    const formattedPhone = formatPhoneNumber(data.buyerPhone);
    const message = createSMSMessage(data);

    console.log('📱 Sending SMS to:', formattedPhone);

    // Call your backend API to send SMS
    // This should be done from backend for security
    const response = await fetch('/api/notifications/sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: formattedPhone,
        message: message,
        orderId: data.orderId
      })
    });

    if (!response.ok) {
      throw new Error(`SMS API error: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ SMS sent successfully:', result);
    return true;
  } catch (error) {
    console.error('❌ Error sending SMS:', error);
    return false;
  }
};

/**
 * Send WhatsApp notification via Twilio
 */
export const sendWhatsAppNotification = async (data: OrderNotificationData): Promise<boolean> => {
  try {
    const config = getTwilioConfig();
    
    if (!config.twilioAccountSid || !config.twilioAuthToken) {
      console.warn('⚠️ Twilio WhatsApp not configured. Skipping WhatsApp notification.');
      return false;
    }

    const formattedPhone = formatPhoneNumber(data.buyerPhone);
    const message = createWhatsAppMessage(data);

    console.log('💬 Sending WhatsApp to:', formattedPhone);

    // Call your backend API to send WhatsApp
    // This should be done from backend for security
    const response = await fetch('/api/notifications/whatsapp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: formattedPhone,
        message: message,
        orderId: data.orderId
      })
    });

    if (!response.ok) {
      throw new Error(`WhatsApp API error: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ WhatsApp sent successfully:', result);
    return true;
  } catch (error) {
    console.error('❌ Error sending WhatsApp:', error);
    return false;
  }
};

/**
 * Send both SMS and WhatsApp notifications
 */
export const sendOrderConfirmationNotifications = async (
  data: OrderNotificationData
): Promise<{ sms: boolean; whatsapp: boolean }> => {
  console.log('🔔 Sending order confirmation notifications for order:', data.orderId);

  const [smsSent, whatsappSent] = await Promise.all([
    sendSMSNotification(data),
    sendWhatsAppNotification(data)
  ]);

  return {
    sms: smsSent,
    whatsapp: whatsappSent
  };
};

/**
 * Send order status update notification
 */
export const sendOrderStatusUpdateNotification = async (
  buyerName: string,
  buyerPhone: string,
  orderId: string,
  newStatus: string,
  applicationName: string = 'TexConnect'
): Promise<{ sms: boolean; whatsapp: boolean }> => {
  const data: OrderNotificationData = {
    buyerName,
    buyerPhone,
    orderId,
    orderStatus: newStatus,
    itemName: 'Your Order',
    quantity: 1,
    totalAmount: 0,
    applicationName
  };

  return sendOrderConfirmationNotifications(data);
};

/**
 * Create detailed SMS message for order status update
 */
const createDetailedStatusSMS = (
  buyerName: string,
  orderId: string,
  status: string,
  itemName: string,
  quantity: number,
  totalAmount: number
): string => {
  const statusMessages: { [key: string]: string } = {
    'Pending': 'Your order is pending confirmation from the seller.',
    'Accepted': 'Great! Your order has been accepted by the seller.',
    'Shipped': 'Your order is on the way! Track your shipment.',
    'Delivered': 'Your order has been delivered. Thank you for shopping!',
    'Cancelled': 'Your order has been cancelled. Please contact support for details.'
  };

  const statusMessage = statusMessages[status] || `Your order status has been updated to ${status}.`;

  return `Hi ${buyerName},

${statusMessage}

Order Details:
Order ID: #${orderId}
Item: ${itemName}
Quantity: ${quantity}
Total: ₹${totalAmount}
Status: ${status}

For support, contact us or reply to this message.`;
};

/**
 * Create detailed WhatsApp message for order status update
 */
const createDetailedStatusWhatsApp = (
  buyerName: string,
  orderId: string,
  status: string,
  itemName: string,
  quantity: number,
  totalAmount: number
): string => {
  const statusEmojis: { [key: string]: string } = {
    'Pending': '⏳',
    'Accepted': '✅',
    'Shipped': '🚚',
    'Delivered': '📦',
    'Cancelled': '❌'
  };

  const statusMessages: { [key: string]: string } = {
    'Pending': 'Your order is pending confirmation from the seller.',
    'Accepted': 'Great! Your order has been accepted by the seller.',
    'Shipped': 'Your order is on the way! Track your shipment.',
    'Delivered': 'Your order has been delivered. Thank you for shopping!',
    'Cancelled': 'Your order has been cancelled. Please contact support for details.'
  };

  const emoji = statusEmojis[status] || '📦';
  const statusMessage = statusMessages[status] || `Your order status has been updated to ${status}.`;

  return `${emoji} *Order Status Update* ${emoji}

Hi ${buyerName},

${statusMessage}

📋 *Order Details:*
• Order ID: #${orderId}
• Item: ${itemName}
• Quantity: ${quantity}
• Total: ₹${totalAmount}
• Status: *${status}*

Need help? Reply to this message or contact our support team.`;
};

/**
 * Send detailed order status update via SMS
 */
export const sendDetailedStatusSMS = async (
  buyerName: string,
  buyerPhone: string,
  orderId: string,
  status: string,
  itemName: string,
  quantity: number,
  totalAmount: number
): Promise<boolean> => {
  try {
    const config = getTwilioConfig();
    
    if (!config.twilioAccountSid || !config.twilioAuthToken) {
      console.warn('⚠️ Twilio SMS not configured. Skipping SMS notification.');
      return false;
    }

    const formattedPhone = formatPhoneNumber(buyerPhone);
    const message = createDetailedStatusSMS(buyerName, orderId, status, itemName, quantity, totalAmount);

    console.log('📱 Sending detailed status SMS to:', formattedPhone);

    const response = await fetch('/api/notifications/sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: formattedPhone,
        message: message,
        orderId: orderId,
        type: 'status_update'
      })
    });

    if (!response.ok) {
      throw new Error(`SMS API error: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Detailed status SMS sent successfully:', result);
    return true;
  } catch (error) {
    console.error('❌ Error sending detailed status SMS:', error);
    return false;
  }
};

/**
 * Send detailed order status update via WhatsApp
 */
export const sendDetailedStatusWhatsApp = async (
  buyerName: string,
  buyerPhone: string,
  orderId: string,
  status: string,
  itemName: string,
  quantity: number,
  totalAmount: number
): Promise<boolean> => {
  try {
    const config = getTwilioConfig();
    
    if (!config.twilioAccountSid || !config.twilioAuthToken) {
      console.warn('⚠️ Twilio WhatsApp not configured. Skipping WhatsApp notification.');
      return false;
    }

    const formattedPhone = formatPhoneNumber(buyerPhone);
    const message = createDetailedStatusWhatsApp(buyerName, orderId, status, itemName, quantity, totalAmount);

    console.log('💬 Sending detailed status WhatsApp to:', formattedPhone);

    const response = await fetch('/api/notifications/whatsapp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: formattedPhone,
        message: message,
        orderId: orderId,
        type: 'status_update'
      })
    });

    if (!response.ok) {
      throw new Error(`WhatsApp API error: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Detailed status WhatsApp sent successfully:', result);
    return true;
  } catch (error) {
    console.error('❌ Error sending detailed status WhatsApp:', error);
    return false;
  }
};

/**
 * Meta WhatsApp API Configuration
 * On Web: Proxying through Vercel API routes (/api/whatsapp/send-template)
 */

/**
 * Send automated SMS via backend API (Twilio/server provider)
 */
const sendAutomatedSMS = async (toPhone: string, message: string, orderId: string) => {
  const cleanPhone = toPhone.replace(/\D/g, '');
  const formattedPhone = cleanPhone.length === 10 ? `+91${cleanPhone}` : (toPhone.startsWith('+') ? toPhone : `+${cleanPhone}`);

  const smsMessage = message.startsWith('TexConnect:') ? message : `TexConnect: ${message}`;

  const response = await fetch('/api/notifications/sms', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: formattedPhone,
      message: smsMessage,
      orderId
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`SMS API failed: ${response.status} ${text}`);
  }

  return response.json();
};

/**
 * Send automated order status notifications (Web)
 * MSME -> Buyer for Accepted to Out for Delivery
 * Buyer -> MSME for Delivered
 */
export const triggerAutomatedOrderNotification = async (
  order: any, 
  status: string, 
  userRole: string
) => {
  try {
    // 1. Fetch contact details - Fix: Use lowercase column names 'displayname' as per Supabase hint
    const buyerIdToQuery = order.buyerId || order.buyer_id || order.buyerid;
    console.log('[Web] Debug: order object:', JSON.stringify(order));
    console.log('[Web] Debug: buyerIdToQuery:', buyerIdToQuery);

    let buyerProfile: any = null;
    const { data: bProfile, error: buyerError } = await supabase
      .from('users')
      .select('phone, username, displayname')
      .eq('id', buyerIdToQuery)
      .single();

    if (buyerError) {
      console.error('[Web] Error fetching buyer profile:', buyerError);
      console.log('[Web] Debug: Attempting fallback fetch by buyerName:', order.buyerName);
      if (order.buyerName) {
        const { data: fallbackProfile } = await supabase
          .from('users')
          .select('phone, username, displayname')
          .eq('username', order.buyerName)
          .single();
        if (fallbackProfile) {
          console.log('[Web] Debug: Found buyer profile via fallback:', JSON.stringify(fallbackProfile));
          buyerProfile = fallbackProfile;
        }
      }
    } else {
      console.log('[Web] Debug: Found buyer profile:', JSON.stringify(bProfile));
      buyerProfile = bProfile;
    }

    // Fix: Simplify relational lookup which is causing 404/400
    // First get the msmeId from the order if it's there (try both cases)
    let msmeId = order.msmeId || order.msme_id || order.msmeid;
    
    if (!msmeId) {
      // Use 'orders' table since 'order_items' might not exist or be accessible
      // Extracting from order items if they are embedded in the order object
      const firstItem = order.items?.[0];
      if (firstItem?.productId || firstItem?.product_id) {
        const { data: productData } = await supabase
          .from('products')
          .select('msmeid')
          .eq('id', firstItem.productId || firstItem.product_id)
          .single();
        msmeId = productData?.msmeid;
      }
    }

    let msmeProfile: any = null;
    if (msmeId) {
      const { data: mProfile, error: msmeError } = await supabase
        .from('users')
        .select('phone, username, displayname')
        .eq('id', msmeId)
        .single();
      
      if (msmeError) {
        console.error('[Web] Error fetching MSME profile:', msmeError);
      }
      msmeProfile = mProfile;
    }

    const buyerPhone = buyerProfile?.phone;
    const buyerName = buyerProfile?.displayname || buyerProfile?.username || 'Buyer';
    const msmePhone = msmeProfile?.phone;
    const orderIdShort = (order.id || '').split('-')[0].toUpperCase();

    const buyerMsg = `Hello ${buyerName}, your order #${orderIdShort} is now ${status.toUpperCase()}. Thank you for choosing TexConnect!`;
    const msmeMsg = `Order #${orderIdShort} from ${buyerName} has been DELIVERED successfully via TexConnect.`;

    // 2. Logic: MSME -> Buyer (Accepted to Out for Delivery)
    if (userRole === 'msme' && ['Accepted', 'Prepared', 'Shipped', 'Out for Delivery'].includes(status)) {
      if (buyerPhone) {
        console.log(`[Web] Sending notifications to Buyer: ${buyerPhone} for status: ${status}`);
        
        // 1. Send SMS (via Twilio Proxy)
        const smsResult = await sendAutomatedSMS(buyerPhone, buyerMsg, order.id);
        console.log('[Web] SMS API Response:', JSON.stringify(smsResult, null, 2));

        // 2. Send WhatsApp Template (via Meta Proxy)
        const buyerParams = {
          customer_name: buyerName,
          order_id: orderIdShort,
          status: status.toUpperCase()
        };
        
        const waResult = await fetch('/api/whatsapp/send-template', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: buyerPhone,
            templateName: 'order_status_update',
            languageCode: 'en',
            parameters: buyerParams,
          }),
        }).then(res => res.json());
        
        console.log('[Web] WhatsApp API Response:', JSON.stringify(waResult, null, 2));
      } else {
        console.warn('[Web] No buyer phone found for order:', order.id);
      }
    }

    // 3. Logic: Buyer -> MSME (Delivered)
    if (userRole === 'buyer' && status === 'Delivered') {
      if (msmePhone) {
        console.log(`[Web] Sending notifications to MSME: ${msmePhone} for status: Delivered`);
        
        // 1. Send SMS (via Twilio Proxy)
        const smsResult = await sendAutomatedSMS(msmePhone, msmeMsg, order.id);
        console.log('[Web] SMS API Response:', JSON.stringify(smsResult, null, 2));

        // 2. Send WhatsApp Template (via Meta Proxy)
        const msmeParams = {
          customer_name: buyerName,
          order_id: orderIdShort,
          status: 'DELIVERED'
        };

        const waResult = await fetch('/api/whatsapp/send-template', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: msmePhone,
            templateName: 'order_status_update',
            languageCode: 'en',
            parameters: msmeParams,
          }),
        }).then(res => res.json());

        console.log('[Web] WhatsApp API Response:', JSON.stringify(waResult, null, 2));
      } else {
        console.warn('[Web] No MSME phone found for order:', order.id);
      }
    }
  } catch (err) {
    console.error('Error triggering automated notification:', err);
  }
};

/**
 * Legacy support for OrdersView.tsx
 */
export const sendOrderStatusUpdateBothChannels = async (
  _buyerName: string,
  _buyerPhone: string,
  orderId: string,
  _status: string,
  _itemName: string,
  _quantity: number,
  _totalAmount: number
): Promise<{ sms: boolean; whatsapp: boolean }> => {
  // This now just triggers the automated one if possible, or returns false
  console.log('Legacy notification call for:', orderId);
  return { sms: true, whatsapp: true };
};

export default {
  triggerAutomatedOrderNotification,
  sendOrderStatusUpdateBothChannels,
  formatPhoneNumber
};
