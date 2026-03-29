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
import { LucideChevronLeft, LucidePackage, LucideTruck, LucideCheckCircle, LucideClock, LucideFileText, LucideCamera } from 'lucide-react-native';
import { RoleContext } from '../../App';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const STATUS_STEPS = ['Pending', 'Accepted', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];

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

    const getAllowedNextStatuses = (status: string, role: string | null): string[] => {
        let possibleNext: string[] = [];
        switch ((status || '').toLowerCase()) {
            case 'pending':
                possibleNext = ['Accepted']; break;
            case 'accepted':
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
            // MSME can do everything EXCEPT Delivered
            return possibleNext.filter(s => s !== 'Delivered');
        }
        
        return [];
    };

    async function handleUpdateStatus(targetStatus: string) {
        if (!order) return;
        try {
            setUpdating(true);
            const { error } = await supabase
                .from('orders')
                .update({ 
                    status: targetStatus, 
                    scannedunits: [], // Clear scans on transition, enforcing re-scan for next stage
                    updated_at: new Date().toISOString() 
                })
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
                                <Text style={styles.boxGridTitle}>Box Scan Progress</Text>
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
                            </View>
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
                    onPress={fetchOrderDetails}
                >
                    <Text style={styles.refreshButtonText}>Refresh Status</Text>
                </TouchableOpacity>

                {/* Conditional Update Button */}
                {(() => {
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

                        if (verificationRequired && currentStatusIndex >= 1) {
                            return (
                                <View style={styles.warningContainer}>
                                    <Text style={styles.warningText}>
                                        Scan {Math.max(totalUnits - scannedUnitsCount, 0)} more boxes to unlock status update
                                    </Text>
                                    <TouchableOpacity
                                        style={styles.scanMoreButton}
                                        onPress={() => navigation.navigate('Scanning')}
                                    >
                                        <LucideCamera color="#fff" size={20} />
                                        <Text style={styles.scanMoreButtonText}>Scan Next QR Code</Text>
                                    </TouchableOpacity>
                                </View>
                            );
                        }
                    }
                    return null;
                })()}

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
    boxGridTitle: {
        color: '#94a3b8',
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: 12,
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
