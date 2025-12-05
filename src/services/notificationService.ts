/**
 * Notification Service
 * Handles WhatsApp and SMS notifications for order confirmations
 * Uses Twilio API for both WhatsApp and SMS
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
 * Send both SMS and WhatsApp for order status update
 */
export const sendOrderStatusUpdateBothChannels = async (
  buyerName: string,
  buyerPhone: string,
  orderId: string,
  status: string,
  itemName: string,
  quantity: number,
  totalAmount: number
): Promise<{ sms: boolean; whatsapp: boolean }> => {
  console.log('🔔 Sending order status update notifications for order:', orderId, 'Status:', status);

  const [smsSent, whatsappSent] = await Promise.all([
    sendDetailedStatusSMS(buyerName, buyerPhone, orderId, status, itemName, quantity, totalAmount),
    sendDetailedStatusWhatsApp(buyerName, buyerPhone, orderId, status, itemName, quantity, totalAmount)
  ]);

  return {
    sms: smsSent,
    whatsapp: whatsappSent
  };
};

export default {
  sendSMSNotification,
  sendWhatsAppNotification,
  sendOrderConfirmationNotifications,
  sendOrderStatusUpdateNotification,
  sendDetailedStatusSMS,
  sendDetailedStatusWhatsApp,
  sendOrderStatusUpdateBothChannels,
  formatPhoneNumber
};
