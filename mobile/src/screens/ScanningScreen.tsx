import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { LucideCamera } from 'lucide-react-native';
import { supabase } from '../lib/supabase';

export default function ScanningScreen({ navigation, route }: any) {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);

    useEffect(() => {
        if (!permission) {
            requestPermission();
        }
    }, [permission]);

    if (!permission) {
        return <View style={styles.container} />;
    }

    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.background} />
                <View style={styles.centerContent}>
                    <Text style={styles.message}>We need your permission to show the camera</Text>
                    <TouchableOpacity style={styles.button} onPress={requestPermission}>
                        <Text style={styles.buttonText}>Grant Permission</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const parseQueryParams = (input: string): Record<string, string> => {
        const out: Record<string, string> = {};
        const qIndex = input.indexOf('?');
        if (qIndex === -1) return out;
        const query = input.slice(qIndex + 1);
        const pairs = query.split('&');
        for (const p of pairs) {
            if (!p) continue;
            const [kRaw, vRaw] = p.split('=');
            const k = decodeURIComponent((kRaw || '').trim());
            const v = decodeURIComponent((vRaw || '').trim());
            if (k) out[k] = v;
        }
        return out;
    };

    const tryParseJson = (input: string): any | null => {
        const trimmed = (input || '').trim();
        if (!trimmed) return null;
        if (!(trimmed.startsWith('{') && trimmed.endsWith('}'))) return null;
        try {
            return JSON.parse(trimmed);
        } catch {
            return null;
        }
    };

    const extractOrderAndUid = (raw: any): { orderId?: string; uid?: string } => {
        const text = typeof raw === 'string' ? raw.trim() : '';
        if (!text) return {};

        // 1) URL / querystring format: ...?orderId=...&uid=...
        if (text.includes('?') && (text.toLowerCase().includes('orderid=') || text.toLowerCase().includes('uid='))) {
            const params = parseQueryParams(text);
            const orderId = params.orderId || params.orderid || params.order_id;
            const uid = params.uid || params.unit || params.unitId || params.unitid;
            return { orderId, uid };
        }

        // 2) JSON format: {"orderId":"...","uid":"..."}
        const j = tryParseJson(text);
        if (j && typeof j === 'object') {
            const orderId = j.orderId || j.orderid || j.order_id || j.order;
            const uid = j.uid || j.unitId || j.unitid || j.unit;
            return { orderId, uid };
        }

        // 3) Delimited formats
        // - orderId:<id>|uid:<uid>
        // - orderId=<id>;uid=<uid>
        const mOrder = text.match(/(?:orderid|order_id|order)\s*[:=]\s*([a-zA-Z0-9-]+)/i);
        const mUid = text.match(/(?:uid|unitid|unit_id|unit)\s*[:=]\s*([a-zA-Z0-9-]+)/i);
        if (mOrder || mUid) {
            return { orderId: mOrder?.[1], uid: mUid?.[1] };
        }

        // 4) If it's just a UID sticker (no orderId), accept uid only
        // Heuristic: if it looks like a uuid, treat as uid.
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(text)) {
            return { uid: text };
        }

        // 5) Fallback: treat as orderId (older QR which only contained orderId)
        return { orderId: text };
    };

    const handleBarCodeScanned = async ({ type, data }: any) => {
        if (scanned) return;
        setScanned(true);

        const { orderId: orderIdFromScan, uid } = extractOrderAndUid(data);

        // If we scanned only a UID sticker, we MUST have orderId from route params.
        const effectiveOrderId = (orderIdFromScan || '').trim() || route?.params?.orderId;

        if (!effectiveOrderId) {
            Alert.alert('Invalid Scan', 'Could not extract Order ID.');
            setScanned(false);
            return;
        }

        try {
            // 1. Fetch current order data
            const { data: order, error: fetchError } = await supabase
                .from('orders')
                .select('*')
                .eq('id', effectiveOrderId)
                .single();

            if (fetchError || !order) {
                Alert.alert('Order Not Found', 'The scanned Order ID does not exist.');
                setScanned(false);
                return;
            }

            // 2. If it was a unit scan (sticker), update the scannedUnits array
            if (uid) {
                const currentScanned = order.scannedunits || order.scannedUnits || [];
                if (!currentScanned.includes(uid)) {
                    const newScanned = [...currentScanned, uid];

                    const updatePayload: any = {
                        scannedunits: newScanned,
                        scannedUnits: newScanned,
                        updatedAt: new Date().toISOString()
                    };

                    const { error: updateError } = await supabase
                        .from('orders')
                        .update(updatePayload)
                        .eq('id', effectiveOrderId);

                    if (updateError) {
                        throw updateError;
                    }
                } else {
                    Alert.alert('Duplicate Scan', 'This unit has already been scanned.');
                }
            }

            // 3. Navigate back to Status screen
            navigation.navigate('OrderStatus', { orderId: effectiveOrderId });
        } catch (error: any) {
            console.error('Scan processing error:', error);
            Alert.alert('Update Failed', error.message || 'Could not record the unit scan.');
        } finally {
            setTimeout(() => setScanned(false), 1000);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    return (
        <View style={styles.container}>
            <CameraView
                style={StyleSheet.absoluteFillObject}
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: ["qr", "pdf417"],
                }}
            />

            <View style={styles.overlay}>
                <View style={styles.headerRow}>
                    <TouchableOpacity
                        style={styles.logoutButton}
                        onPress={handleLogout}
                    >
                        <Text style={styles.logoutText}>Logout</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.unfocusedContainer} />
                <View style={styles.focusedRow}>
                    <View style={styles.unfocusedContainer} />
                    <View style={styles.focusedContainer}>
                        <View style={styles.cornerTopLeft} />
                        <View style={styles.cornerTopRight} />
                        <View style={styles.cornerBottomLeft} />
                        <View style={styles.cornerBottomRight} />
                    </View>
                    <View style={styles.unfocusedContainer} />
                </View>
                <View style={styles.unfocusedContainer}>
                    <Text style={styles.instructionText}>Position the Order QR Code inside the frame</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    background: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    message: {
        textAlign: 'center',
        color: '#f8fafc',
        fontSize: 18,
        marginBottom: 20,
    },
    button: {
        backgroundColor: '#38bdf8',
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 12,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingTop: 60,
        paddingHorizontal: 20,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    logoutButton: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    logoutText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    unfocusedContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    focusedRow: {
        flexDirection: 'row',
        height: 280,
    },
    focusedContainer: {
        width: 280,
        position: 'relative',
    },
    cornerTopLeft: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: 40,
        height: 40,
        borderTopWidth: 4,
        borderLeftWidth: 4,
        borderColor: '#38bdf8',
    },
    cornerTopRight: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 40,
        height: 40,
        borderTopWidth: 4,
        borderRightWidth: 4,
        borderColor: '#38bdf8',
    },
    cornerBottomLeft: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: 40,
        height: 40,
        borderBottomWidth: 4,
        borderLeftWidth: 4,
        borderColor: '#38bdf8',
    },
    cornerBottomRight: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 40,
        height: 40,
        borderBottomWidth: 4,
        borderRightWidth: 4,
        borderColor: '#38bdf8',
    },
    instructionText: {
        color: '#fff',
        fontSize: 16,
        marginTop: 20,
        fontWeight: '500',
    },
    closeButton: {
        marginTop: 40,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
});
