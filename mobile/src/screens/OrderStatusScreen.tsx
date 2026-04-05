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

const API_BASE_URL = 'https://texconnect-msme.vercel.app';

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
           return possibleNext.filter(s => s === 'Delivered');
       } else if (role === 'msme') {
           return possibleNext.filter(s => s !== 'Delivered' && s !== 'Accepted');
       }
        
       return [];
   };

   async function handleUpdateStatus(targetStatus: string) {
       if (!order) return;
       try {
           setUpdating(true);

           const reqUnits = Number(order.printedunits ?? order.printedUnits ?? order.totalunits ?? order.totalUnits ?? 0);
           const scanned = order.scannedunits ?? order.scannedUnits ?? [];
           const isFullyScanned = scanned.length >= reqUnits;

           if (reqUnits > 0 && !isFullyScanned) {
               Alert.alert('Verification Required', `Please scan all ${reqUnits} units before updating to ${targetStatus}.`);
               return;
           }

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
               Alert.alert('Update Failed', error.message);
               return;
           }

           setOrder((prev: any) => prev ? { 
               ...prev, 
               status: targetStatus, 
               scannedunits: [], 
               scannedUnits: [],
               updatedAt: new Date().toISOString()
           } : null);

           fetchOrderDetails(false);
           triggerOrderNotification(targetStatus);
           setStatusModalOpen(false);
       } finally {
           setUpdating(false);
       }
   }

    async function triggerOrderNotification(status: string) {
        if (!order) return;

        // Fetch Buyer and MSME phone numbers (same logic as old UI commit)
        let buyerPhone: string | null = null;
        let buyerName = 'Buyer';
        let msmePhone: string | null = null;

        try {
            const buyerId = order.buyerId || order.buyer_id || order.buyerid;
            if (buyerId) {
                const { data: buyerData } = await supabase
                    .from('users')
                    .select('phone, username, displayname')
                    .eq('id', buyerId)
                    .single();
                if (buyerData) {
                    buyerPhone = buyerData.phone;
                    buyerName = buyerData.displayname || buyerData.username || 'Buyer';
                }
            }

            let msmeId: string | null = null;
            const firstItem = order.items?.[0];
            if (firstItem?.productId || firstItem?.product_id) {
                const { data: productData } = await supabase
                    .from('products')
                    .select('msmeid')
                    .eq('id', firstItem.productId || firstItem.product_id)
                    .single();
                msmeId = productData?.msmeid || null;
            }

            if (msmeId) {
                const { data: msmeData } = await supabase
                    .from('users')
                    .select('phone')
                    .eq('id', msmeId)
                    .single();
                if (msmeData?.phone) {
                    msmePhone = msmeData.phone;
                }
            }
        } catch {
            // ignore
        }

        const orderIdShort = order.id.split('-')[0].toUpperCase();

        const sendAutomatedSMS = async (toPhone: string, message: string) => {
            const cleanPhone = toPhone.replace(/\D/g, '');
            const formattedPhone = cleanPhone.length === 10 ? `+91${cleanPhone}` : (toPhone.startsWith('+') ? toPhone : `+${cleanPhone}`);

            try {
                const resp = await fetch(`${API_BASE_URL}/api/notifications/sms`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        to: formattedPhone,
                        message,
                        orderId: order.id,
                    }),
                });
                return await resp.json();
            } catch (e: any) {
                return { error: e?.message || String(e) };
            }
        };

        const sendAutomatedWhatsApp = async (toPhone: string, customerName: string, statusText: string) => {
            const cleanPhone = toPhone.replace(/\D/g, '');
            const formattedPhone = cleanPhone.length === 10 ? `+91${cleanPhone}` : (toPhone.startsWith('+') ? toPhone : `+${cleanPhone}`);
            try {
                const resp = await fetch(`${API_BASE_URL}/api/whatsapp/send-template`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        to: formattedPhone,
                        templateName: 'order_status_update',
                        languageCode: 'en',
                        parameters: {
                            customer_name: customerName,
                            order_id: orderIdShort,
                            status: statusText,
                            button_url: `${orderIdShort}`,
                        },
                    }),
                });
                const data = await resp.json();
                if (!resp.ok) {
                    console.warn('[Mobile] WhatsApp API non-200:', resp.status, JSON.stringify(data));
                } else {
                    console.log('[Mobile] WhatsApp API ok:', JSON.stringify(data));
                }
                return data;
            } catch (e: any) {
                return { error: e?.message || String(e) };
            }
        };

        // MSME -> Buyer: any status except Pending/Delivered (includes Cancelled)
        if (userRole === 'msme' && buyerPhone && status !== 'Pending' && status !== 'Delivered') {
            const smsMsg = status === 'Cancelled'
                ? `TexConnect: Hello ${buyerName}, your order #${orderIdShort} has been CANCELLED.`
                : `TexConnect: Hello ${buyerName}, your order #${orderIdShort} is now ${status.toUpperCase()}.`;

            const [waResult, smsResult] = await Promise.allSettled([
                sendAutomatedWhatsApp(buyerPhone, buyerName, status.toUpperCase()),
                sendAutomatedSMS(buyerPhone, smsMsg),
            ]);

            const waVal: any = waResult.status === 'fulfilled' ? waResult.value : { error: String(waResult.reason) };
            if (waVal?.error || !waVal?.messages?.[0]?.id) {
                console.warn('[Mobile] WhatsApp not accepted for buyer:', JSON.stringify(waVal));
            }

            const smsVal: any = smsResult.status === 'fulfilled' ? smsResult.value : { error: String(smsResult.reason) };
            if (smsVal?.error) {
                console.warn('[Mobile] SMS send error for buyer:', JSON.stringify(smsVal));
            }
        }

        // Buyer -> MSME: Delivered only
        if (userRole === 'buyer' && status === 'Delivered' && msmePhone) {
            const smsMsg = `TexConnect: Order #${orderIdShort} from ${buyerName} has been DELIVERED.`;
            const [waResult, smsResult] = await Promise.allSettled([
                sendAutomatedWhatsApp(msmePhone, buyerName, 'DELIVERED'),
                sendAutomatedSMS(msmePhone, smsMsg),
            ]);

            const waVal: any = waResult.status === 'fulfilled' ? waResult.value : { error: String(waResult.reason) };
            if (waVal?.error || !waVal?.messages?.[0]?.id) {
                console.warn('[Mobile] WhatsApp not accepted for msme:', JSON.stringify(waVal));
            }

            const smsVal: any = smsResult.status === 'fulfilled' ? smsResult.value : { error: String(smsResult.reason) };
            if (smsVal?.error) {
                console.warn('[Mobile] SMS send error for msme:', JSON.stringify(smsVal));
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
   const scannedCount = (order.scannedUnits?.length || order.scannedunits?.length || 0);
   const scanPercent = totalUnits > 0 ? Math.min(scannedCount / totalUnits, 1) : 0;
   const isVerified = totalUnits === 0 || scannedCount >= totalUnits;

   const buildInvoiceHtml = () => {
       const item = order.itemName || order.items?.[0]?.productName || 'Item';
       const qty = totalUnits || 0;
       const total = order.totalAmount || 0;
       return `
      <html>
        <body style="font-family: Arial; padding: 24px;">
          <h2>TexConnect Invoice</h2>
          <p><b>Order ID:</b> ${order.id.substring(0, 8).toUpperCase()}</p>
          <p><b>Item:</b> ${item}</p>
          <p><b>Quantity:</b> ${qty}</p>
          <p><b>Total:</b> ₹${total}</p>
          <p><b>Status:</b> ${order.status}</p>
        </body>
      </html>
    `;
   };

   const handleDownloadInvoice = async () => {
       try {
           const { uri } = await Print.printToFileAsync({ html: buildInvoiceHtml() });
           await Sharing.shareAsync(uri);
       } catch (e: any) {
           Alert.alert('Invoice Failed', e?.message || 'Could not generate invoice');
       }
   };

   const handleOpenScanner = () => {
       navigation.navigate('Scanning', { orderId });
   };

   return (
       <View style={styles.container}>
           <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.background} />

           <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
               <View style={styles.header}>
                   <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                       <LucideChevronLeft color="#38bdf8" size={24} />
                   </TouchableOpacity>
                   <Text style={styles.headerTitle}>Order Tracking</Text>
               </View>

               <View style={styles.summaryCard}>
                   <Text style={styles.summaryLabel}>ORDER ID</Text>
                   <Text style={styles.orderId}>{order.id.substring(0, 8).toUpperCase()}</Text>

                   <View style={styles.summaryGrid}>
                       <View style={styles.summaryRow}>
                           <Text style={styles.summaryKey}>Item</Text>
                           <Text style={styles.summaryKey}>Quantity</Text>
                       </View>
                       <View style={styles.summaryRow}>
                           <Text style={styles.summaryValue}>{order.itemName || order.items?.[0]?.productName || '—'}</Text>
                           <Text style={styles.summaryValue}>{totalUnits || 0}</Text>
                       </View>
                       <View style={styles.summaryRow}>
                           <Text style={styles.summaryKey}>Customer</Text>
                           <Text style={styles.summaryKey}>Total</Text>
                       </View>
                       <View style={styles.summaryRow}>
                           <Text style={styles.summaryValue}>{order.buyerName || '—'}</Text>
                           <Text style={styles.summaryValue}>₹{order.totalAmount || 0}</Text>
                       </View>
                   </View>
               </View>

               <View style={styles.scanProgressCard}>
                   <View style={styles.progressHeader}>
                       <LucidePackage color="#38bdf8" size={20} />
                       <Text style={styles.progressTitle}>Package Verification</Text>
                   </View>

                   <View style={styles.progressBarContainer}>
                       <View style={[styles.progressBar, { width: `${scanPercent * 100}%` }]} />
                   </View>

                   <View style={styles.progressFooter}>
                       <Text style={styles.progressText}>{scannedCount} of {totalUnits || 0} Units Scanned</Text>
                       <Text style={isVerified ? styles.verifiedText : styles.pendingText}>
                           {isVerified ? 'FULLY VERIFIED' : 'PENDING'}
                       </Text>
                   </View>

                   <View style={styles.boxGridContainer}>
                       <View style={styles.boxGridHeader}>
                           <Text style={styles.boxGridTitle}>BOX SCAN PROGRESS</Text>
                           <TouchableOpacity style={styles.cameraIconButton} onPress={handleOpenScanner}>
                               <LucideCamera color="#38bdf8" size={18} />
                           </TouchableOpacity>
                       </View>

                       <View style={styles.boxGrid}>
                           {Array.from({ length: Math.max(totalUnits || 0, 0) }).map((_, i) => {
                               const scanned = i < scannedCount;
                               return (
                                   <View
                                       key={i}
                                       style={[
                                           styles.boxItem,
                                           scanned ? styles.boxItemScanned : styles.boxItemPending
                                       ]}
                                   >
                                       <Text
                                           style={[
                                               styles.boxItemText,
                                               scanned ? styles.boxItemTextScanned : styles.boxItemTextPending
                                           ]}
                                       >
                                           {scanned ? '✓' : i + 1}
                                       </Text>
                                   </View>
                               );
                           })}
                       </View>

                       <View style={styles.checkInStatusWrapper}>
                           <Text style={styles.checkInStatusLabel}>Check-in Status:</Text>
                           <View style={[styles.checkInBadge, isVerified ? styles.checkInComplete : styles.checkInIncomplete]}>
                               <Text style={styles.checkInBadgeText}>{isVerified ? 'COMPLETE' : 'INCOMPLETE'}</Text>
                           </View>
                       </View>

                       {!isVerified && totalUnits > 0 ? (
                           <View style={styles.warningContainer}>
                               <Text style={styles.warningText}>Please scan all {totalUnits} units before updating status.</Text>
                               <TouchableOpacity style={styles.scanMoreButton} onPress={handleOpenScanner}>
                                   <LucideCamera color="#fff" size={18} />
                                   <Text style={styles.scanMoreButtonText}>Scan QR Stickers</Text>
                               </TouchableOpacity>
                           </View>
                       ) : null}
                   </View>
               </View>

               <Text style={styles.sectionTitle}>Tracking Progress</Text>

               <View style={styles.trackingCard}>
                   {STATUS_STEPS.map((step, index) => {
                       const isActive = index <= currentStatusIndex;
                       const isCurrent = index === currentStatusIndex;

                       const icon = step === 'Delivered'
                           ? <LucideCheckCircle size={22} color={isActive ? '#38bdf8' : '#64748b'} />
                           : step === 'Out for Delivery' || step === 'Shipped'
                               ? <LucideTruck size={22} color={isActive ? '#38bdf8' : '#64748b'} />
                               : step === 'Prepared' || step === 'Accepted'
                                   ? <LucidePackage size={22} color={isActive ? '#38bdf8' : '#64748b'} />
                                   : <LucideClock size={22} color={isActive ? '#38bdf8' : '#64748b'} />;

                       return (
                           <View key={step} style={styles.stepRow}>
                               <View style={styles.stepIconColumn}>
                                   <View style={[styles.stepDot, isActive ? styles.activeDot : styles.inactiveDot]}>
                                       {icon}
                                   </View>
                                   {index < STATUS_STEPS.length - 1 && (
                                       <View style={[styles.stepLine, isActive ? styles.activeLine : styles.inactiveLine]} />
                                   )}
                               </View>

                               <View style={styles.stepTextContainer}>
                                   <Text style={[styles.stepLabel, isActive ? styles.activeStepLabel : styles.inactiveStepLabel]}>
                                       {step}
                                   </Text>
                                   {isCurrent ? (
                                       <Text style={styles.currentStatusBadge}>Current Status</Text>
                                   ) : null}
                               </View>
                           </View>
                       );
                   })}
               </View>

               <TouchableOpacity style={styles.refreshButton} onPress={() => fetchOrderDetails()}>
                   <Text style={styles.refreshButtonText}>Refresh Status</Text>
               </TouchableOpacity>

               <TouchableOpacity
                   style={styles.updateButton}
                   onPress={() => setStatusModalOpen(true)}
                   disabled={updating}
               >
                   <LucideCheckCircle color="#fff" size={20} />
                   <Text style={styles.updateButtonText}>{updating ? 'Updating...' : 'Update Status'}</Text>
               </TouchableOpacity>

               {userRole === 'buyer' && String(order.status || '').toLowerCase() === 'delivered' ? (
                   <TouchableOpacity style={styles.invoiceButton} onPress={handleDownloadInvoice}>
                       <LucideFileText color="#fff" size={20} />
                       <Text style={styles.invoiceButtonText}>Download Invoice</Text>
                   </TouchableOpacity>
               ) : null}
           </ScrollView>

           <Modal
               visible={statusModalOpen}
               transparent
               animationType="fade"
               onRequestClose={() => setStatusModalOpen(false)}
           >
               <Pressable style={styles.modalBackdrop} onPress={() => setStatusModalOpen(false)}>
                   <Pressable style={styles.modalCard}>
                       <Text style={styles.modalTitle}>Update Status</Text>
                       <Text style={styles.modalSubtitle}>Select the next stage for this order</Text>

                       <View style={styles.modalList}>
                           {getAllowedNextStatuses(order.status, userRole).map((nextStatus) => (
                               <TouchableOpacity
                                   key={nextStatus}
                                   style={styles.modalItem}
                                   onPress={() => handleUpdateStatus(nextStatus)}
                               >
                                   <Text style={styles.modalItemText}>{nextStatus}</Text>
                               </TouchableOpacity>
                           ))}
                       </View>

                       <TouchableOpacity style={styles.modalClose} onPress={() => setStatusModalOpen(false)}>
                           <Text style={styles.modalCloseText}>Close</Text>
                       </TouchableOpacity>
                   </Pressable>
               </Pressable>
           </Modal>
       </View>
   );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    background: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 22,
        paddingBottom: 40,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 6,
        gap: 14,
    },
    headerTitle: {
        color: '#f8fafc',
        fontSize: 18,
        fontWeight: '800',
        marginLeft: 6,
    },
    backButton: {
        width: 42,
        height: 42,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.06)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    summaryCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 22,
        padding: 18,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        marginBottom: 18,
    },
    summaryLabel: {
        color: '#94a3b8',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 2,
    },
    orderId: {
        color: '#38bdf8',
        fontSize: 24,
        fontWeight: '900',
        marginTop: 6,
        marginBottom: 14,
    },
    summaryGrid: {
        gap: 6,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    summaryKey: {
        color: '#94a3b8',
        fontSize: 12,
        fontWeight: '700',
    },
    summaryValue: {
        color: '#f8fafc',
        fontSize: 14,
        fontWeight: '800',
    },
    sectionTitle: {
        color: '#f8fafc',
        fontSize: 20,
        fontWeight: '900',
        marginTop: 10,
        marginBottom: 12,
    },
    trackingCard: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    stepRow: {
        flexDirection: 'row',
    },
    stepIconColumn: {
        width: 40,
        alignItems: 'center',
    },
    stepDot: {
        width: 38,
        height: 38,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    activeDot: {
        backgroundColor: 'rgba(56, 189, 248, 0.1)',
    },
    inactiveDot: {
        backgroundColor: 'rgba(255,255,255,0.03)',
    },
    stepLine: {
        width: 2,
        flex: 1,
        marginVertical: 2,
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
