import React, { useEffect, useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    ActivityIndicator,
    TouchableOpacity,
    Alert,
    Modal,
    Pressable,
    Linking,
    Platform,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { LucideChevronLeft, LucidePackage, LucideTruck, LucideCheckCircle, LucideClock, LucideFileText, LucideCamera } from 'lucide-react-native';
import { RoleContext } from '../../App';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const STATUS_STEPS = ['Pending', 'Accepted', 'Prepared', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];

export default function OrderStatusScreen({ route, navigation }: any) {
    const { orderId } = route.params || {};
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [statusModalOpen, setStatusModalOpen] = useState(false);
    const [updating, setUpdating] = useState(false);
    const { role: userRole } = React.useContext(RoleContext);

    useEffect(() => {
        if (orderId) {
            fetchOrderDetails();

            // Set up real-time subscription for this specific order
            const channel = supabase
                .channel(`order-updates-${orderId}`)
                .on(
                    'postgres_changes',
                    { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
                    () => fetchOrderDetails()
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [orderId]);

    async function fetchOrderDetails(showLoading = true) {
        if (showLoading) setLoading(true);
        try {
            // Using optimized service if available, otherwise fallback to direct supabase
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .eq('id', orderId)
                .single();

            if (error) {
                Alert.alert('Error', 'Order not found or access denied');
                navigation.goBack();
            } else {
                setOrder(data);
            }
        } finally {
            if (showLoading) setLoading(false);
        }
    }

    const getAllowedNextStatuses = (status: string, role: string | null): string[] => {
        let possibleNext: string[] = [];
        switch ((status || '').toLowerCase()) {
            case 'pending':
                possibleNext = ['Accepted']; break;
            case 'accepted':
                possibleNext = ['Prepared']; break;
            case 'prepared':
                possibleNext = ['Shipped']; break;
            case 'shipped':
                possibleNext = ['Out for Delivery']; break;
            case 'out for delivery':
                possibleNext = ['Delivered']; break;
            default:
                possibleNext = [];
        }

        if (role === 'buyer') {
            // Buyer can strictly ONLY do Out for Delivery -> Delivered
            return possibleNext.filter(s => s === 'Delivered');
        } else if (role === 'msme') {
            // MSME can do Accepted -> Prepared -> Shipped -> Out for Delivery only
            return possibleNext.filter(s => s !== 'Delivered' && s !== 'Accepted');
        }
        
        return [];
    };

    async function handleUpdateStatus(targetStatus: string) {
        if (!order) return;
        try {
            setUpdating(true);

            // 1. Role and scan validation before update
            const reqUnits = Number(order.printedunits ?? order.printedUnits ?? order.totalunits ?? order.totalUnits ?? 0);
            const scanned = order.scannedunits ?? order.scannedUnits ?? [];
            const isFullyScanned = scanned.length >= reqUnits;

            if (reqUnits > 0 && !isFullyScanned) {
                Alert.alert('Verification Required', `Please scan all ${reqUnits} units before updating to ${targetStatus}.`);
                return;
            }

            // 2. Perform Update (clearing scans to force re-scan for next stage)
            console.log('--- STARTING STATUS UPDATE AND SCAN RESET ---');
            console.log('Target Status:', targetStatus);
            console.log('Order ID:', order.id);

            const { error } = await supabase
                .from('orders')
                .update({ 
                    status: targetStatus, 
                    scannedunits: [], 
                    scannedUnits: [],
                    updatedAt: new Date().toISOString()
                })
                .eq('id', order.id);

            if (error) {
                console.error('DATABASE UPDATE ERROR:', error);
                Alert.alert('Update Failed', error.message);
                return;
            }
            console.log('--- DATABASE UPDATE SUCCESSFUL ---');
            
            // Manually update local state to reflect reset immediately
            setOrder((prev: any) => prev ? { 
                ...prev, 
                status: targetStatus, 
                scannedunits: [], 
                scannedUnits: [],
                updatedAt: new Date().toISOString()
            } : null);

            // Fetch in background without blocking UI
            fetchOrderDetails(false);

            // TRIGGER NOTIFICATION (Non-blocking)
            triggerOrderNotification(targetStatus).catch(err => 
                console.warn('Notification trigger failed:', err)
            );

            setStatusModalOpen(false);
        } finally {
            setUpdating(false);
        }
    }

    async function triggerOrderNotification(status: string) {
        if (!order) return;

        // Meta WhatsApp API Configuration (New Token provided by user)
        const WHATSAPP_TOKEN = 'EAA3t8IAfi6kBRCJraaNkoe018cUvlvzHAuLWSb2ZC08bNi7hbBwNXmBlxrn3pFcRHccrOWUKoIdsPGnQbBYLl3zUexkUZCNxgTNqVNaKJ0cK5SgopoZARmV2VqebTbAizajHVV0NlLUkwHglqbVQGOatfSUZAKm8UtpOVUKox3t1pzno9kE7iZCEZBuZCeRxdREkp5eZBPdnaZA0316Oqtn8lNQPUdxAwL6bZAuD6WWUXRVQ8PYBdYZArZC7fHqwy7LXNxxmTao4OLi4WyTRr5ZAsxYbuvFEa';
        const PHONE_NUMBER_ID = '1079330375257311';

        // DEBUG: Log order object to see available fields
        console.log('[DEBUG] Full order object:', JSON.stringify(order, null, 2));
        console.log('[DEBUG] Order buyerId:', order?.buyerId);
        console.log('[DEBUG] Order buyer_id:', order?.buyer_id);
        console.log('[DEBUG] Order items:', order?.items);

        // 1. Fetch contact details - Fix: Use lowercase column names 'displayname' as per Supabase hint
        let buyerIdToQuery = order.buyerId || order.buyer_id || order.buyerid;
        
        // If no buyerId, try to extract from items array
        if (!buyerIdToQuery && order.items && Array.isArray(order.items) && order.items.length > 0) {
            buyerIdToQuery = order.items[0]?.buyerId || order.items[0]?.buyer_id;
            console.log('[DEBUG] Extracted buyerId from items:', buyerIdToQuery);
        }

        console.log('[DEBUG] Final buyerIdToQuery:', buyerIdToQuery);

        let buyerProfile: any = null;
        if (buyerIdToQuery) {
            const { data: buyerProfileData, error: buyerError } = await supabase
                .from('users')
                .select('phone, username, displayname')
                .eq('id', buyerIdToQuery)
                .single();

            if (buyerError) {
                console.error('[Mobile] Error fetching buyer profile:', buyerError);
            } else {
                buyerProfile = buyerProfileData;
                console.log('[DEBUG] Found buyer profile:', JSON.stringify(buyerProfile, null, 2));
            }
        }

        // Find MSME ID from order items
        let msmeId = null;
        
        // Try to get msmeId from order items
        if (order.items && Array.isArray(order.items) && order.items.length > 0) {
            const firstItem = order.items[0];
            if (firstItem.productId || firstItem.product_id) {
                const { data: productData, error: productError } = await supabase
                    .from('products')
                    .select('msmeid')
                    .eq('id', firstItem.productId || firstItem.product_id)
                    .single();
                
                if (!productError && productData) {
                    msmeId = productData.msmeid;
                    console.log('[DEBUG] Found MSME ID from product:', msmeId);
                }
            }
        }

        // Fallback: Try order_items table
        if (!msmeId) {
            const { data: orderItems } = await supabase
                .from('order_items')
                .select(`
                    product:products(
                        msmeid
                    )
                `)
                .eq('orderId', order.id)
                .limit(1);

            const firstItem: any = orderItems?.[0];
            if (firstItem?.product?.msmeid) {
                msmeId = firstItem.product.msmeid;
                console.log('[DEBUG] Found MSME ID from order_items:', msmeId);
            }
        }

        let msmeProfile = null;
        if (msmeId) {
            const { data: mProfile, error: msmeError } = await supabase
                .from('users')
                .select('phone, username, displayname')
                .eq('id', msmeId)
                .single();
            
            if (msmeError) {
                console.error('[Mobile] Error fetching MSME profile:', msmeError);
            } else {
                msmeProfile = mProfile;
                console.log('[DEBUG] Found MSME profile:', JSON.stringify(msmeProfile, null, 2));
            }
        }

        const buyerPhone = buyerProfile?.phone;
        const buyerName = buyerProfile?.displayname || buyerProfile?.username || 'Buyer';
        
        const msmePhone = msmeProfile?.phone;
        const msmeName = msmeProfile?.displayname || msmeProfile?.username || 'MSME';

        // DEBUG: Log phone numbers
        console.log('[DEBUG] buyerPhone:', buyerPhone);
        console.log('[DEBUG] msmePhone:', msmePhone);

        const orderIdShort = order.id.split('-')[0].toUpperCase();
        
        // Function to send via Meta WhatsApp API (Template based)
        const sendWhatsAppAPI = async (toPhone: string, templateName: string, components: any[]) => {
            try {
                const cleanPhone = toPhone.replace(/\D/g, '');
                const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
                
                console.log('[DEBUG] Sending WhatsApp to:', formattedPhone);
                console.log('[DEBUG] Template:', templateName);
                console.log('[DEBUG] Components:', JSON.stringify(components));
                
                const response = await fetch(`https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        messaging_product: 'whatsapp',
                        to: formattedPhone,
                        type: 'template',
                        template: {
                            name: templateName,
                            language: {
                                code: 'en_US'
                            },
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
                console.log('[DEBUG] WhatsApp API Response:', JSON.stringify(result, null, 2));
                return result;
            } catch (err) {
                console.error('WhatsApp API Error:', err);
                return null;
            }
        };

        const sendSMSFallback = (toPhone: string, message: string) => {
            const cleanPhone = toPhone.replace(/\D/g, '');
            const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
            const url = `sms:${formattedPhone}${Platform.OS === 'ios' ? '&' : '?'}body=${encodeURIComponent(message)}`;
            console.log('[DEBUG] SMS fallback URL:', url);
            Linking.openURL(url).catch(err => console.error('SMS fallback failed:', err));
        };

        // 1. MSME Updates Status (Accepted -> Out for Delivery) -> AUTOMATED Notify Buyer
        if (userRole === 'msme') {
            if (!buyerPhone) {
                console.warn("[Mobile] ❌ Buyer phone number not found! Cannot send notification.");
                Alert.alert('Notification Failed', 'Buyer phone number not found in database.');
                return;
            }
            
            console.log(`[Mobile] ✅ Sending automated notification to Buyer: ${buyerPhone} for status: ${status}`);
            
            // Template parameters for 'order_status_update'
            const buyerParams = [
                { type: 'text', text: buyerName },
                { type: 'text', text: orderIdShort },
                { type: 'text', text: status.toUpperCase() }
            ];

            const apiResult = await sendWhatsAppAPI(buyerPhone, 'order_status_update', buyerParams);
            
            if (apiResult?.error) {
                console.error('[Mobile] WhatsApp API Error:', apiResult.error);
                console.log("[Mobile] WhatsApp API failed, attempting SMS fallback...");
                Alert.alert(
                    'WhatsApp Failed', 
                    'WhatsApp message could not be sent. Opening SMS app as fallback.',
                    [{ text: 'OK' }]
                );
                sendSMSFallback(buyerPhone, `*Texconnect* 📦\nHello ${buyerName}, your order #${orderIdShort} is now *${status.toUpperCase()}*.\n\nThank you for choosing Texconnect!`);
            } else if (apiResult?.messaging_product) {
                console.log('[Mobile] ✅ WhatsApp message sent successfully!');
                Alert.alert('Notification Sent', `WhatsApp notification sent to buyer: ${buyerPhone}`);
            } else {
                console.log("[Mobile] Unknown WhatsApp response, attempting SMS fallback...");
                sendSMSFallback(buyerPhone, `*Texconnect* 📦\nHello ${buyerName}, your order #${orderIdShort} is now *${status.toUpperCase()}*.\n\nThank you for choosing Texconnect!`);
            }
        }

        // 2. Buyer Updates to Delivered -> AUTOMATED Notify MSME
        if (userRole === 'buyer' && status === 'Delivered') {
            if (!msmePhone) {
                console.warn("[Mobile] ❌ MSME phone number not found! Cannot send notification.");
                Alert.alert('Notification Failed', 'MSME phone number not found in database.');
                return;
            }

            console.log(`[Mobile] ✅ Sending automated notification to MSME: ${msmePhone} for status: Delivered`);
            
            // Template parameters for 'order_status_update' (MSME notification)
            const msmeParams = [
                { type: 'text', text: buyerName },
                { type: 'text', text: orderIdShort },
                { type: 'text', text: 'DELIVERED' }
            ];

            const apiResult = await sendWhatsAppAPI(msmePhone, 'order_status_update', msmeParams);
            
            if (apiResult?.error) {
                console.error('[Mobile] WhatsApp API Error:', apiResult.error);
                console.log("[Mobile] WhatsApp API failed, attempting fallback...");
                Alert.alert(
                    'WhatsApp Failed', 
                    'WhatsApp message could not be sent. Opening SMS/WhatsApp app as fallback.',
                    [{ text: 'OK' }]
                );
                const cleanPhone = msmePhone.replace(/\D/g, '');
                const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
                const url = `whatsapp://send?phone=${formattedPhone}&text=${encodeURIComponent(`Order #${orderIdShort} from ${buyerName} has been DELIVERED successfully.`)}`;
                
                Linking.canOpenURL(url).then(supported => {
                    if (supported) {
                        Linking.openURL(url);
                    } else {
                        sendSMSFallback(msmePhone, `Order #${orderIdShort} from ${buyerName} has been DELIVERED successfully.`);
                    }
                });
            } else if (apiResult?.messaging_product) {
                console.log('[Mobile] ✅ WhatsApp message sent successfully to MSME!');
                Alert.alert('Notification Sent', `WhatsApp notification sent to MSME: ${msmePhone}`);
            }
        }
    }

    const getStatusIndex = (status: string) => {
        return STATUS_STEPS.findIndex(s => s.toLowerCase() === status.toLowerCase());
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.background} />
                <ActivityIndicator size="large" color="#38bdf8" />
            </View>
        );
    }

    if (!order) return null;

    const currentStatusIndex = getStatusIndex(order.status);
    const totalUnits = Number(order.printedUnits ?? order.printedunits ?? order.totalUnits ?? order.totalunits ?? 0);