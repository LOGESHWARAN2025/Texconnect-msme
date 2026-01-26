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
} from 'react-native';
import { supabase } from '../lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { LucideChevronLeft, LucidePackage, LucideTruck, LucideCheckCircle, LucideClock } from 'lucide-react-native';

const STATUS_STEPS = ['Pending', 'Accepted', 'Prepared', 'Shipped', 'Out for Delivery', 'Delivered'];

export default function OrderStatusScreen({ route, navigation }: any) {
    const { orderId } = route.params || {};
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [statusModalOpen, setStatusModalOpen] = useState(false);
    const [updating, setUpdating] = useState(false);

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

    async function fetchOrderDetails() {
        setLoading(true);
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
        setLoading(false);
    }

    const getAllowedNextStatuses = (status: string): string[] => {
        switch ((status || '').toLowerCase()) {
            case 'accepted':
                return ['Prepared', 'Shipped', 'Out for Delivery', 'Delivered'];
            case 'prepared':
                return ['Shipped', 'Out for Delivery', 'Delivered'];
            case 'shipped':
                return ['Out for Delivery', 'Delivered'];
            case 'out for delivery':
                return ['Delivered'];
            default:
                return [];
        }
    };

    async function handleUpdateStatus(targetStatus: string) {
        if (!order) return;
        try {
            setUpdating(true);
            const { error } = await supabase
                .from('orders')
                .update({ status: targetStatus, updatedAt: new Date().toISOString() })
                .eq('id', order.id);

            if (error) {
                Alert.alert('Update Failed', error.message);
                return;
            }
            setStatusModalOpen(false);
            fetchOrderDetails();
        } finally {
            setUpdating(false);
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
    const totalUnits = order.printedUnits || order.totalUnits || 0;
    const scannedUnitsCount = order.scannedUnits?.length || 0;
    const isVerified = totalUnits > 0 && scannedUnitsCount >= totalUnits;
    const allowedStatuses = getAllowedNextStatuses(order.status);
    const itemName = order.itemName || order.items?.[0]?.productName || '';
    const quantity = order.quantity ?? order.totalUnits ?? order.items?.[0]?.quantity ?? 0;
    const totalAmount = order.totalAmount ?? order.totalPrice ?? 0;
    const buyerName = order.buyerName || order.buyer?.displayName || 'N/A';

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
                {(order.printedUnits > 0 || order.totalUnits > 0) && (
                    <View style={styles.scanProgressCard}>
                        <View style={styles.progressHeader}>
                            <LucidePackage color="#38bdf8" size={20} />
                            <Text style={styles.progressTitle}>Package Verification</Text>
                        </View>
                        <View style={styles.progressBarContainer}>
                            <View
                                style={[
                                    styles.progressBar,
                                    { width: `${Math.min(100, ((order.scannedUnits?.length || 0) / (order.printedUnits || order.totalUnits || 1)) * 100)}%` }
                                ]}
                            />
                        </View>
                        <View style={styles.progressFooter}>
                            <Text style={styles.progressText}>
                                {scannedUnitsCount} of {totalUnits} Units Scanned
                            </Text>
                            {isVerified ? (
                                <Text style={styles.verifiedText}>Fully Verified</Text>
                            ) : (
                                <Text style={styles.pendingText}>Verification Pending</Text>
                            )}
                        </View>
                    </View>
                )}

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
                    onPress={fetchOrderDetails}
                >
                    <Text style={styles.refreshButtonText}>Refresh Status</Text>
                </TouchableOpacity>

                {/* Conditional Update Button */}
                {(() => {
                    const currentIndex = getStatusIndex(order.status);

                    if (allowedStatuses.length > 0) {
                        if (isVerified) {
                            return (
                                <TouchableOpacity
                                    style={[styles.updateButton, updating ? { opacity: 0.7 } : null]}
                                    onPress={() => setStatusModalOpen(true)}
                                    disabled={updating}
                                >
                                    <LucideCheckCircle color="#fff" size={20} />
                                    <Text style={styles.updateButtonText}>Update Status</Text>
                                </TouchableOpacity>
                            );
                        }

                        if (currentIndex >= 1) {
                            return (
                                <View style={styles.warningContainer}>
                                    <Text style={styles.warningText}>
                                        Scan {Math.max(totalUnits - scannedUnitsCount, 0)} more boxes to unlock status update
                                    </Text>
                                </View>
                            );
                        }
                    }
                    return null;
                })()}

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
});
