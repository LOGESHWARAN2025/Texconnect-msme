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

        // Meta WhatsApp API Configuration (Permanent System User Token)
        const WHATSAPP_TOKEN = 'EAA3t8IAfi6kBRCJraaNkoe018cUvlvzHAuLWSb2ZC08bNi7hbBwNXmBlxrn3pFcRHccrOWUKoIdsPGnQbBYLl3zUexkUZCNxgTNqVNaKJ0cK5SgopoZARmV2VqebTbAizajHVV0NlLUkwHglqbVQGOatfSUZAKm8UtpOVUKox3t1pzno9kE7iZCEZBuZCeRxdREkp5eZBPdnaZA0316Oqtn8lNQPUdxAwL6bZAuD6WWUXRVQ8PYBdYZArZC7fHqwy7LXNxxmTao4OLi4WyTRr5ZAsxYbuvFEa';
        const PHONE_NUMBER_ID = '1079330375257311';

        // 1. Fetch contact details
        let buyerPhone = null;
        let buyerName = 'Buyer';
        let msmePhone = null;
        let msmeName = 'MSME';

        try {
            // Fetch Buyer Profile
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

            // Fetch MSME ID and Profile
            let msmeId = null;
            if (order.items && order.items.length > 0) {
                const firstItem = order.items[0];
                const pid = firstItem.productId || firstItem.product_id;
                if (pid) {
                    const { data: productData } = await supabase
                        .from('products')
                        .select('msmeid')
                        .eq('id', pid)
                        .single();
                    msmeId = productData?.msmeid;
                }
            }

            if (msmeId) {
                const { data: msmeData } = await supabase
                    .from('users')
                    .select('phone, username, displayname')
                    .eq('id', msmeId)
                    .single();
                
                if (msmeData) {
                    msmePhone = msmeData.phone;
                    msmeName = msmeData.displayname || msmeData.username || 'MSME';
                }
            }
        } catch (err) {
            console.error('[Mobile] Error fetching profiles:', err);
        }

        const orderIdShort = order.id.split('-')[0].toUpperCase();

        // Helper to format phone for WhatsApp
        const formatPhone = (phone: string) => {
            const clean = phone.replace(/\D/g, '');
            return clean.length === 10 ? `91${clean}` : clean;
        };

        const sendWhatsAppTemplate = async (to: string, template: string, params: any[]) => {
            try {
                const response = await fetch(`https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        messaging_product: 'whatsapp',
                        to: formatPhone(to),
                        type: 'template',
                        template: {
                            name: template,
                            language: { code: 'en' },
                            components: [{ type: 'body', parameters: params }]
                        }
                    })
                });
                return await response.json();
            } catch (err) {
                console.error('[Mobile] WhatsApp Error:', err);
                return { error: err };
            }
        };

        const sendSMSFallback = (to: string, msg: string) => {
            const phone = formatPhone(to);
            const url = `sms:${phone}${Platform.OS === 'ios' ? '&' : '?'}body=${encodeURIComponent(msg)}`;
            Linking.openURL(url).catch(e => console.error('[Mobile] SMS failed:', e));
        };

        // Logic: MSME -> Buyer (Accepted to Out for Delivery)
        if (userRole === 'msme' && ['Accepted', 'Prepared', 'Shipped', 'Out for Delivery'].includes(status) && buyerPhone) {
            const params = [
                { type: 'text', text: buyerName },
                { type: 'text', text: orderIdShort },
                { type: 'text', text: status.toUpperCase() }
            ];
            const res = await sendWhatsAppTemplate(buyerPhone, 'order_status_update', params);
            if (res?.error) {
                sendSMSFallback(buyerPhone, `TexConnect: Hello ${buyerName}, your order #${orderIdShort} is now ${status.toUpperCase()}.`);
            }
        }

        // Logic: Buyer -> MSME (Delivered)
        if (userRole === 'buyer' && status === 'Delivered' && msmePhone) {
            const params = [
                { type: 'text', text: buyerName },
                { type: 'text', text: orderIdShort },
                { type: 'text', text: 'DELIVERED' }
            ];
            const res = await sendWhatsAppTemplate(msmePhone, 'order_status_update', params);
            if (res?.error) {
                sendSMSFallback(msmePhone, `TexConnect: Order #${orderIdShort} from ${buyerName} has been DELIVERED.`);
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

   // Rest of your component JSX here...
   return (
       <View style={styles.container}>
           <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.background} />
           <ScrollView style={styles.scrollView}>
               <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                   <LucideChevronLeft color="#38bdf8" size={24} />
                   <Text style={styles.backText}>Back</Text>
               </TouchableOpacity>

               <Text style={styles.title}>Order #{order.id.substring(0, 8).toUpperCase()}</Text>
               <Text style={styles.status}>Status: {order.status}</Text>

               {totalUnits > 0 && (
                   <View style={styles.progressCard}>
                       <Text style={styles.progressText}>
                           Scanned: {(order.scannedUnits?.length || 0)} / {totalUnits} units
                       </Text>
                   </View>
               )}

               <TouchableOpacity 
                   style={styles.updateButton}
                   onPress={() => setStatusModalOpen(true)}
                   disabled={updating}
               >
                   <Text style={styles.updateButtonText}>
                       {updating ? 'Updating...' : 'Update Status'}
                   </Text>
               </TouchableOpacity>
           </ScrollView>

           <Modal
               visible={statusModalOpen}
               transparent
               animationType="slide"
               onRequestClose={() => setStatusModalOpen(false)}
           >
               <View style={styles.modalBackdrop}>
                   <View style={styles.modalCard}>
                       <Text style={styles.modalTitle}>Update Status</Text>
                       {getAllowedNextStatuses(order.status, userRole).map((nextStatus) => (
                           <TouchableOpacity
                               key={nextStatus}
                               style={styles.statusOption}
                               onPress={() => handleUpdateStatus(nextStatus)}
                           >
                               <Text style={styles.statusOptionText}>{nextStatus}</Text>
                           </TouchableOpacity>
                       ))}
                       <TouchableOpacity onPress={() => setStatusModalOpen(false)}>
                           <Text style={styles.cancelText}>Cancel</Text>
                       </TouchableOpacity>
                   </View>
               </View>
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
       padding: 20,
   },
   loadingContainer: {
       flex: 1,
       justifyContent: 'center',
       alignItems: 'center',
   },
   backButton: {
       flexDirection: 'row',
       alignItems: 'center',
       marginBottom: 20,
   },
   backText: {
       color: '#38bdf8',
       fontSize: 16,
       marginLeft: 8,
   },
   title: {
       color: '#fff',
       fontSize: 24,
       fontWeight: 'bold',
       marginBottom: 10,
   },
   status: {
       color: '#94a3b8',
       fontSize: 16,
       marginBottom: 20,
   },
   progressCard: {
       backgroundColor: 'rgba(56, 189, 248, 0.1)',
       padding: 16,
       borderRadius: 12,
       marginBottom: 20,
   },
   progressText: {
       color: '#38bdf8',
       fontSize: 14,
   },
   updateButton: {
       backgroundColor: '#10b981',
       padding: 16,
       borderRadius: 12,
       alignItems: 'center',
   },
   updateButtonText: {
       color: '#fff',
       fontSize: 16,
       fontWeight: 'bold',
   },
   modalBackdrop: {
       flex: 1,
       backgroundColor: 'rgba(0,0,0,0.6)',
       justifyContent: 'center',
       padding: 20,
   },
   modalCard: {
       backgroundColor: '#1e293b',
       padding: 20,
       borderRadius: 16,
   },
   modalTitle: {
       color: '#fff',
       fontSize: 18,
       fontWeight: 'bold',
       marginBottom: 16,
   },
   statusOption: {
       padding: 16,
       backgroundColor: 'rgba(56, 189, 248, 0.1)',
       borderRadius: 12,
       marginBottom: 12,
   },
   statusOptionText: {
       color: '#fff',
       fontSize: 16,
       textAlign: 'center',
   },
   cancelText: {
       color: '#94a3b8',
       fontSize: 14,
       textAlign: 'center',
       marginTop: 12,
   },
});
