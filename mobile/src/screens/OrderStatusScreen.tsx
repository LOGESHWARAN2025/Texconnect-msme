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

       // Fetch buyer phone from users table
       let buyerPhone = order.buyerPhone;
       let buyerName = order.buyerName;
        
       if (!buyerPhone || !buyerName) {
           try {
               const buyerId = order.buyerId || order.buyer_id || order.buyerid;
               if (buyerId) {
                   const { data: buyerData } = await supabase
                       .from('users')
                       .select('phone, username, displayname')
                       .eq('id', buyerId)
                       .single();
                    
                   if (buyerData) {
                       buyerPhone = buyerData.phone || buyerPhone;
                       buyerName = buyerData.displayname || buyerData.username || buyerName;
                   }
               }
           } catch (err) {
               console.error('Failed to fetch buyer:', err);
           }
       }

       // Fetch MSME phone
       let msmePhone = null;
       if (order.items && order.items.length > 0) {
           const firstItem = order.items[0];
           if (firstItem.productId || firstItem.product_id) {
               const { data: productData } = await supabase
                   .from('products')
                   .select('msmeid')
                   .eq('id', firstItem.productId || firstItem.product_id)
                   .single();
                
               if (productData?.msmeid) {
                   const { data: msmeData } = await supabase
                       .from('users')
                       .select('phone, username, displayname')
                       .eq('id', productData.msmeid)
                       .single();
                    
                   if (msmeData) {
                       msmePhone = msmeData.phone;
                   }
               }
           }
       }

       const orderIdShort = order.id.split('-')[0].toUpperCase();

       const sendSMSFallback = (toPhone: string, message: string) => {
           const cleanPhone = toPhone.replace(/\D/g, '');
           const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
           const url = `sms:${formattedPhone}${Platform.OS === 'ios' ? '&' : '?'}body=${encodeURIComponent(message)}`;
           Linking.openURL(url);
       };

       const sendCompanySMS = async (toPhone: string, message: string) => {
           const apiBase = (process.env.EXPO_PUBLIC_API_BASE_URL || '').trim();
           const cleanPhone = toPhone.replace(/\D/g, '');
           const formattedPhone = cleanPhone.length === 10 ? `+91${cleanPhone}` : (toPhone.startsWith('+') ? toPhone : `+${cleanPhone}`);
           const brandedMessage = message.startsWith('TexConnect:') ? message : `TexConnect: ${message}`;

           if (!apiBase) {
               console.warn('[Mobile] EXPO_PUBLIC_API_BASE_URL not configured. Falling back to local SMS app.');
               sendSMSFallback(toPhone, brandedMessage);
               return;
           }

           try {
               const response = await fetch(`${apiBase}/api/notifications/sms`, {
                   method: 'POST',
                   headers: { 'Content-Type': 'application/json' },
                   body: JSON.stringify({
                       to: formattedPhone,
                       message: brandedMessage,
                       orderId: order.id
                   })
               });

               if (!response.ok) {
                   const text = await response.text();
                   throw new Error(`SMS API failed: ${response.status} ${text}`);
               }

               console.log('[Mobile] ✅ Company SMS sent:', formattedPhone);
           } catch (err) {
               console.error('[Mobile] Company SMS failed, falling back to local SMS app:', err);
               sendSMSFallback(toPhone, brandedMessage);
           }
       };

       // MSME -> Notify Buyer (SMS only)
       if (userRole === 'msme' && buyerPhone) {
           await sendCompanySMS(buyerPhone, `TexConnect: Hello ${buyerName}, your order #${orderIdShort} is now ${status.toUpperCase()}.`);
       }

       // Buyer -> Notify MSME (SMS only)
       if (userRole === 'buyer' && status === 'Delivered' && msmePhone) {
           await sendCompanySMS(msmePhone, `TexConnect: Order #${orderIdShort} from ${buyerName} has been DELIVERED.`);
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
