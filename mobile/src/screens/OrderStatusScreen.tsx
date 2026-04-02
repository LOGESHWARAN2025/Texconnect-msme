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
        const WHATSAPP_TOKEN = 'EAA3t8IAfi6kBRPvLy1guMaZC81Mj2ZCZAg7putFXAKLjTJ8ff5gCZBGJ56C7kfbJPoxas2jd4lYuzmZCVj7QXu8aLJeJeYKTjCBwgHLWGOOAzwRuKB02KrItYcney8wjNm7EbZCdJnfUoQzPuBjWGCoJNYlWzEAV4qg4RgNpkWxqC01ZBAyQECnShpLoJbf47nSamVSOtg5S2y08NdGNundX4yV0ZCdNtrJz9FUemgM7Xypg7ZBcQN7p7QyUPuCmZAfZBiPli9F3ZAqzh7ZBdNPV9qCv8mZCwKNwZDZD';
        const PHONE_NUMBER_ID = '1079330375257311';

        // 1. Fetch contact details - Fix: Use lowercase column names 'displayname' as per Supabase hint
        const { data: buyerProfile, error: buyerError } = await supabase
            .from('users')
            .select('phone, username, displayname')
            .eq('id', order.buyerId)
            .single();

        if (buyerError) {
            console.error('[Mobile] Error fetching buyer profile:', buyerError);
        }

        // Find MSME ID from order items
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
        let msmeProfile = null;
        if (firstItem?.product?.msmeid) {
            const { data: mProfile } = await supabase
                .from('users')
                .select('phone, username, displayname')
                .eq('id', firstItem.product.msmeid)
                .single();
            msmeProfile = mProfile;
        }

        const buyerPhone = buyerProfile?.phone;
        const buyerName = buyerProfile?.displayname || buyerProfile?.username || 'Buyer';
        
        const msmePhone = msmeProfile?.phone;
        const msmeName = msmeProfile?.displayname || msmeProfile?.username || 'MSME';

        const orderIdShort = order.id.split('-')[0].toUpperCase();
        
        // TEMPLATE: Texconnect branding
        const buyerMsg = `*Texconnect* 📦\nHello ${buyerName}, your order #${orderIdShort} is now *${status.toUpperCase()}*.\n\nThank you for choosing Texconnect!`;
        const msmeMsg = `*Texconnect* 🔔\nOrder #${orderIdShort} from ${buyerName} has been *DELIVERED* successfully.`;

        // Function to send via Meta WhatsApp API (Automated)
        const sendWhatsAppAPI = async (toPhone: string, message: string) => {
            try {
                const cleanPhone = toPhone.replace(/\D/g, '');
                const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
                
                const response = await fetch(`https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        messaging_product: 'whatsapp',
                        to: formattedPhone,
                        type: 'text',
                        text: { body: message }
                    })
                });
                const result = await response.json();
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
            Linking.openURL(url).catch(err => console.error('SMS fallback failed:', err));
        };

        // 1. MSME Updates Status (Accepted -> Out for Delivery) -> AUTOMATED Notify Buyer
        if (userRole === 'msme') {
            if (!buyerPhone) {
                console.warn("[Mobile] Buyer phone number not found for automated notification.");
                return;
            }
            
            console.log(`[Mobile] Sending automated notification to Buyer: ${buyerPhone} for status: ${status}`);
            const apiResult = await sendWhatsAppAPI(buyerPhone, buyerMsg);
            console.log('[Mobile] WhatsApp API Result:', JSON.stringify(apiResult));
            
            if (!apiResult?.messaging_product) {
                console.log("[Mobile] WhatsApp API failed, attempting deep link fallback...");
                // For deep links/SMS, we still need manual action but we trigger it immediately
                const cleanPhone = buyerPhone.replace(/\D/g, '');
                const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
                const url = `whatsapp://send?phone=${formattedPhone}&text=${encodeURIComponent(buyerMsg)}`;
                
                Linking.canOpenURL(url).then(supported => {
                    if (supported) {
                        Linking.openURL(url);
                    } else {
                        sendSMSFallback(buyerPhone, buyerMsg);
                    }
                });
            }
        }

        // 2. Buyer Updates to Delivered -> AUTOMATED Notify MSME
        if (userRole === 'buyer' && status === 'Delivered') {
            if (!msmePhone) {
                console.warn("[Mobile] MSME phone number not found for automated notification.");
                return;
            }

            console.log(`[Mobile] Sending automated notification to MSME: ${msmePhone} for status: Delivered`);
            const apiResult = await sendWhatsAppAPI(msmePhone, msmeMsg);
            console.log('[Mobile] WhatsApp API Result:', JSON.stringify(apiResult));
            
            if (!apiResult?.messaging_product) {
                console.log("[Mobile] WhatsApp API failed, attempting deep link fallback...");
                const cleanPhone = msmePhone.replace(/\D/g, '');
                const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
                const url = `whatsapp://send?phone=${formattedPhone}&text=${encodeURIComponent(msmeMsg)}`;
                
                Linking.canOpenURL(url).then(supported => {
                    if (supported) {
                        Linking.openURL(url);
                    } else {
                        sendSMSFallback(msmePhone, msmeMsg);
                    }
                });
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
    const scannedUnitsArray = order.scannedUnits ?? order.scannedunits ?? [];
    const scannedUnitsCount = Array.isArray(scannedUnitsArray) ? scannedUnitsArray.length : 0;
    const verificationRequired = totalUnits > 0;
    const isVerified = !verificationRequired || scannedUnitsCount >= totalUnits;
    const allowedStatuses = getAllowedNextStatuses(order.status, userRole);
    const itemName = order.itemName || order.items?.[0]?.productName || '';
    const quantity = order.quantity ?? order.totalUnits ?? order.items?.[0]?.quantity ?? 0;
    const totalAmount = order.totalAmount ?? order.totalPrice ?? 0;
    const buyerName = order.buyerName || order.buyer?.displayName || 'N/A';

    const handleDownloadInvoice = async () => {
        try {
            const htmlContent = `
                <html>
                <body style="font-family: Arial, sans-serif; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #38bdf8;">TexConnect Invoice</h1>
                        <p style="color: #64748b;">Order ID: ${order.id}</p>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <h3 style="color: #1e293b; margin-bottom: 5px;">Billed To:</h3>
                        <p style="margin: 0; color: #475569;">${buyerName}</p>
                    </div>
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background-color: #f8fafc; color: #1e293b;">
                                <th style="padding: 12px; border: 1px solid #e2e8f0; text-align: left;">Item</th>
                                <th style="padding: 12px; border: 1px solid #e2e8f0; text-align: right;">Quantity</th>
                                <th style="padding: 12px; border: 1px solid #e2e8f0; text-align: right;">Total Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style="padding: 12px; border: 1px solid #e2e8f0; color: #475569;">${itemName}</td>
                                <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: right; color: #475569;">${quantity}</td>
                                <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: right; color: #475569;">₹${totalAmount}</td>
                            </tr>
                        </tbody>
                    </table>
                    <div style="margin-top: 30px; text-align: right;">
                        <h2 style="color: #0f172a;">Total Paid: ₹${totalAmount}</h2>
                    </div>
                    <div style="margin-top: 60px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
                        <p>Thank you for choosing TexConnect!</p>
                        <p>This is a system-generated electronic invoice. No signature required.</p>
                    </div>
                </body>
                </html>
            `;
            const { uri } = await Print.printToFileAsync({ html: htmlContent });
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri);
            } else {
                Alert.alert("Error", "Sharing is not available on this device.");
            }
        } catch (error) {
            Alert.alert("Error", "Failed to generate invoice.");
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.background} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <LucideChevronLeft color="#fff" size={28} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Order Tracking</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Order Info Card */}
                <View style={styles.card}>
                    <Text style={styles.orderIdLabel}>ORDER ID</Text>
                    <Text style={styles.orderIdValue}>{order.id.split('-')[0].toUpperCase()}</Text>

                    <View style={styles.divider} />

                    <View style={styles.infoRow}>
                        <View>
                            <Text style={styles.itemLabel}>Item</Text>
                            <Text style={styles.itemValue}>{itemName}</Text>
                        </View>
                        <View style={styles.alignRight}>
                            <Text style={styles.itemLabel}>Quantity</Text>
                            <Text style={styles.itemValue}>{quantity}</Text>
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <View>
                            <Text style={styles.itemLabel}>Customer</Text>
                            <Text style={styles.itemValue}>{buyerName}</Text>
                        </View>
                        <View style={styles.alignRight}>
                            <Text style={styles.itemLabel}>Total</Text>
                            <Text style={[styles.itemValue, { color: '#38bdf8' }]}>₹{totalAmount}</Text>
                        </View>
                    </View>
                </View>

                {/* Scan Progress Card */}
                {(order.printedUnits > 0 || order.totalUnits > 0) && (() => {
                    const reqUnits = order.printedUnits || order.totalUnits || 1;
                    const scannedIdsList = order.scannedUnits || order.scannedunits || [];
                    const scannedUnitNumbers = new Set(
                        scannedIdsList.map((id: string) => {
                            const parts = id.split('_');
                            return parseInt(parts[parts.length - 1], 10);
                        })
                    );

                    return (
                        <View style={styles.scanProgressCard}>
                            <View style={styles.progressHeader}>
                                <LucidePackage color="#38bdf8" size={20} />
                                <Text style={styles.progressTitle}>Package Verification</Text>
                            </View>
                            <View style={styles.progressBarContainer}>
                                <View
                                    style={[
                                        styles.progressBar,
                                        { width: `${Math.min(100, (scannedUnitsCount / reqUnits) * 100)}%` }
                                    ]}
                                />
                            </View>
                            <View style={styles.progressFooter}>
                                <Text style={styles.progressText}>
                                    {scannedUnitsCount} of {reqUnits} Units Scanned
                                </Text>
                                {isVerified ? (
                                    <Text style={styles.verifiedText}>Fully Verified</Text>
                                ) : (
                                    <Text style={styles.pendingText}>Verification Pending</Text>
                                )}
                            </View>

                            {/* Box Grid */}
                            <View style={styles.boxGridContainer}>
                                <View style={styles.boxGridHeader}>
                                    <Text style={styles.boxGridTitle}>BOX SCAN PROGRESS</Text>
                                    {(() => {
                                        // Conditional visibility for Scan Button:
                                        // 1. MSME: Hide when status is 'Out for Delivery' or 'Delivered'
                                        // 2. Buyer: Hide when status is 'Delivered'
                                        const statusLower = (order.status || '').toLowerCase();
                                        let showBtn = true;
                                        
                                        if (userRole === 'msme') {
                                            // MSME: Button shows till "Out for Delivery" (removed at Out for Delivery)
                                            if (statusLower === 'out for delivery' || statusLower === 'delivered') {
                                                showBtn = false;
                                            }
                                        } else if (userRole === 'buyer') {
                                            // Buyer: Button shows until status is 'Delivered'
                                            if (statusLower === 'delivered') {
                                                showBtn = false;
                                            }
                                        }

                                        if (!showBtn) return null;

                                        return (
                                            <TouchableOpacity 
                                                style={styles.cameraIconButton}
                                                onPress={() => navigation.navigate('Scanning', { 
                                                    orderId: order.id, 
                                                    targetStatus: (allowedStatuses && allowedStatuses.length > 0) ? allowedStatuses[0] : null 
                                                })}
                                            >
                                                <View style={{
                                                    padding: 10,
                                                    backgroundColor: '#38bdf8',
                                                    borderRadius: 12,
                                                    shadowColor: '#38bdf8',
                                                    shadowOffset: { width: 0, height: 2 },
                                                    shadowOpacity: 0.3,
                                                    shadowRadius: 4,
                                                    elevation: 3
                                                }}>
                                                    <LucideCamera color="#fff" size={24} />
                                                </View>
                                            </TouchableOpacity>
                                        );
                                    })()}
                                </View>
                                <View style={styles.boxGrid}>
                                    {Array.from({ length: reqUnits }, (_, i) => i + 1).map(unitNum => {
                                        const isScanned = scannedUnitNumbers.has(unitNum);
                                        return (
                                            <View 
                                                key={unitNum} 
                                                style={[
                                                    styles.boxItem, 
                                                    isScanned ? styles.boxItemScanned : styles.boxItemPending
                                                ]}
                                            >
                                                <Text style={[
                                                    styles.boxItemText,
                                                    isScanned ? styles.boxItemTextScanned : styles.boxItemTextPending
                                                ]}>
                                                    {isScanned ? '✓' : unitNum}
                                                </Text>
                                            </View>
                                        );
                                    })}
                                </View>
                                
                                {/* Check-in Status below grid */}
                                <View style={styles.checkInStatusWrapper}>
                                    <Text style={styles.checkInStatusLabel}>Check-in Status:</Text>
                                    <View style={[styles.checkInBadge, isVerified ? styles.checkInComplete : styles.checkInIncomplete]}>
                                        <Text style={styles.checkInBadgeText}>
                                            {isVerified ? 'COMPLETE' : 'INCOMPLETE'}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {/* Remaining Items Scan Button near Box Scan Progress */}
                            {!isVerified && allowedStatuses.length > 0 && (
                                <View style={{ marginTop: 20 }}>
                                    <TouchableOpacity
                                        style={styles.scanMoreButton}
                                        onPress={() => navigation.navigate('Scanning', { 
                                            orderId: order.id, 
                                            targetStatus: allowedStatuses[0] 
                                        })}
                                    >
                                        <LucideCamera color="#fff" size={20} />
                                        <Text style={styles.scanMoreButtonText}>
                                            Scan Remaining {Math.max(reqUnits - scannedUnitsCount, 0)} QR Stickers
                                        </Text>
                                    </TouchableOpacity>
                                    <Text style={{ color: '#94a3b8', fontSize: 12, textAlign: 'center', marginTop: 8 }}>
                                        Required to update order status to {allowedStatuses[0]}
                                    </Text>
                                </View>
                            )}
                        </View>
                    );
                })()}

                {/* Progress Tracker */}
                <Text style={styles.sectionTitle}>Tracking Progress</Text>
                <View style={styles.trackerCard}>
                    {STATUS_STEPS.map((step, index) => (
                        <View key={step} style={styles.stepContainer}>
                            <View style={styles.stepIndicator}>
                                <View
                                    style={[
                                        styles.stepCircle,
                                        index <= currentStatusIndex ? styles.activeCircle : styles.inactiveCircle
                                    ]}
                                >
                                    {index < currentStatusIndex ? (
                                        <LucideCheckCircle size={20} color="#fff" />
                                    ) : index === currentStatusIndex ? (
                                        <LucideClock size={20} color="#fff" />
                                    ) : (
                                        <View style={styles.dot} />
                                    )}
                                </View>
                                {index < STATUS_STEPS.length - 1 && (
                                    <View
                                        style={[
                                            styles.stepLine,
                                            index < currentStatusIndex ? styles.activeLine : styles.inactiveLine
                                        ]}
                                    />
                                )}
                            </View>
                            <View style={styles.stepTextContainer}>
                                <Text
                                    style={[
                                        styles.stepLabel,
                                        index <= currentStatusIndex ? styles.activeStepLabel : styles.inactiveStepLabel
                                    ]}
                                >
                                    {step.charAt(0).toUpperCase() + step.slice(1)}
                                </Text>
                                {index === currentStatusIndex && (
                                    <Text style={styles.currentStatusBadge}>Current Status</Text>
                                )}
                            </View>
                        </View>
                    ))}
                </View>

                <TouchableOpacity
                    style={styles.refreshButton}
                    onPress={() => fetchOrderDetails(true)}
                >
                    <Text style={styles.refreshButtonText}>Refresh Status</Text>
                </TouchableOpacity>

                {/* Status Update Button */}
                {allowedStatuses.length > 0 && isVerified && (
                    <View style={{ marginTop: 16 }}>
                        <TouchableOpacity
                            style={[styles.updateButton, updating ? { opacity: 0.7 } : null]}
                            onPress={() => setStatusModalOpen(true)}
                            disabled={updating}
                        >
                            <LucideCheckCircle color="#fff" size={20} />
                            <Text style={styles.updateButtonText}>Update to {allowedStatuses[0]}</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Buyer Invoice Download */}
                {userRole === 'buyer' && order.status === 'Delivered' && (
                    <TouchableOpacity
                        style={styles.invoiceButton}
                        onPress={handleDownloadInvoice}
                    >
                        <LucideFileText color="#fff" size={20} />
                        <Text style={styles.invoiceButtonText}>Download Invoice</Text>
                    </TouchableOpacity>
                )}

                <Modal
                    visible={statusModalOpen}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setStatusModalOpen(false)}
                >
                    <Pressable style={styles.modalBackdrop} onPress={() => setStatusModalOpen(false)}>
                        <Pressable style={styles.modalCard} onPress={() => {}}>
                            <Text style={styles.modalTitle}>Update Order Status</Text>
                            <Text style={styles.modalSubtitle}>Select the next status</Text>
                            <View style={styles.modalList}>
                                {allowedStatuses.map((s) => (
                                    <TouchableOpacity
                                        key={s}
                                        style={[styles.modalItem, updating ? { opacity: 0.7 } : null]}
                                        onPress={() => handleUpdateStatus(s)}
                                        disabled={updating}
                                    >
                                        <Text style={styles.modalItemText}>{s}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <TouchableOpacity
                                style={styles.modalClose}
                                onPress={() => setStatusModalOpen(false)}
                                disabled={updating}
                            >
                                <Text style={styles.modalCloseText}>Close</Text>
                            </TouchableOpacity>
                        </Pressable>
                    </Pressable>
                </Modal>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    background: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
    },
    backButton: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginLeft: 16,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: 'rgba(30, 41, 59, 0.7)',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        marginBottom: 24,
    },
    orderIdLabel: {
        color: '#94a3b8',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    orderIdValue: {
        color: '#38bdf8',
        fontSize: 22,
        fontWeight: 'bold',
        marginTop: 4,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        marginVertical: 20,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    alignRight: {
        alignItems: 'flex-end',
    },
    itemLabel: {
        color: '#94a3b8',
        fontSize: 14,
    },
    itemValue: {
        color: '#f8fafc',
        fontSize: 16,
        fontWeight: '600',
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 16,
        marginLeft: 4,
    },
    trackerCard: {
        backgroundColor: 'rgba(30, 41, 59, 0.7)',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    stepContainer: {
        flexDirection: 'row',
        height: 80,
    },
    stepIndicator: {
        alignItems: 'center',
        width: 30,
    },
    stepCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    activeCircle: {
        backgroundColor: '#38bdf8',
        shadowColor: '#38bdf8',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
    },
    inactiveCircle: {
        backgroundColor: '#334155',
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#64748b',
    },
    stepLine: {
        width: 2,
        flex: 1,
        marginVertical: -2,
    },
    activeLine: {
        backgroundColor: '#38bdf8',
    },
    inactiveLine: {
        backgroundColor: '#334155',
    },
    stepTextContainer: {
        marginLeft: 20,
        paddingTop: 4,
    },
    stepLabel: {
        fontSize: 18,
        fontWeight: '600',
    },
    activeStepLabel: {
        color: '#f8fafc',
    },
    inactiveStepLabel: {
        color: '#64748b',
    },
    currentStatusBadge: {
        color: '#38bdf8',
        fontSize: 12,
        fontWeight: 'bold',
        marginTop: 4,
        backgroundColor: 'rgba(56, 189, 248, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        alignSelf: 'flex-start',
    },
    refreshButton: {
        marginTop: 32,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        padding: 18,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    refreshButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    updateButton: {
        marginTop: 16,
        flexDirection: 'row',
        backgroundColor: '#10b981',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    updateButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    warningContainer: {
        marginTop: 16,
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderRadius: 16,
        padding: 18,
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.2)',
        alignItems: 'center',
    },
    warningText: {
        color: '#f59e0b',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 12,
    },
    scanMoreButton: {
        flexDirection: 'row',
        backgroundColor: '#38bdf8',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    scanMoreButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        padding: 20,
    },
    modalCard: {
        backgroundColor: '#0f172a',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    modalTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 6,
    },
    modalSubtitle: {
        color: '#94a3b8',
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 14,
    },
    modalList: {
        gap: 10,
    },
    modalItem: {
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    modalItemText: {
        color: '#f8fafc',
        fontSize: 15,
        fontWeight: '700',
    },
    modalClose: {
        marginTop: 14,
        paddingVertical: 12,
        alignItems: 'center',
    },
    modalCloseText: {
        color: '#94a3b8',
        fontSize: 14,
        fontWeight: '700',
    },
    scanProgressCard: {
        backgroundColor: 'rgba(56, 189, 248, 0.1)',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(56, 189, 248, 0.2)',
        marginBottom: 24,
    },
    progressHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    progressTitle: {
        color: '#f8fafc',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    progressBarContainer: {
        height: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 5,
        overflow: 'hidden',
        marginBottom: 12,
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#38bdf8',
    },
    progressFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    progressText: {
        color: '#94a3b8',
        fontSize: 13,
        fontWeight: '600',
    },
    verifiedText: {
        color: '#10b981',
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    pendingText: {
        color: '#f59e0b',
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    boxGridContainer: {
        marginTop: 20,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
    },
    boxGridHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    cameraButtonSmall: {
        padding: 8,
        backgroundColor: 'rgba(248, 250, 252, 0.05)',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    boxGridTitle: {
        color: '#94a3b8',
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    cameraIconButton: {
        padding: 8,
        backgroundColor: 'rgba(56, 189, 248, 0.1)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(56, 189, 248, 0.3)',
    },
    checkInStatusWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
        gap: 10,
    },
    checkInStatusLabel: {
        color: '#94a3b8',
        fontSize: 13,
        fontWeight: '700',
    },
    checkInBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
    },
    checkInComplete: {
        backgroundColor: 'rgba(34, 197, 94, 0.15)',
        borderColor: 'rgba(34, 197, 94, 0.3)',
    },
    checkInIncomplete: {
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    checkInBadgeText: {
        fontSize: 11,
        fontWeight: '900',
        color: '#f8fafc',
        letterSpacing: 0.5,
    },
    boxGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    boxItem: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
    },
    boxItemPending: {
        backgroundColor: 'rgba(241, 245, 249, 0.05)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    boxItemScanned: {
        backgroundColor: '#22c55e',
        borderColor: '#16a34a',
    },
    boxItemText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    boxItemTextPending: {
        color: '#94a3b8',
    },
    boxItemTextScanned: {
        color: '#ffffff',
    },
    invoiceButton: {
        marginTop: 16,
        flexDirection: 'row',
        backgroundColor: '#4f46e5',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#4f46e5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    invoiceButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 10,
    },
});
