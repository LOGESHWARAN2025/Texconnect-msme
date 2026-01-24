import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { LucideCamera } from 'lucide-react-native';
import { supabase } from '../lib/supabase';

export default function ScanningScreen({ navigation }: any) {
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

    const handleBarCodeScanned = async ({ type, data }: any) => {
        if (scanned) return;
        setScanned(true);

        let orderId = '';
        let uid = '';

        if (data.includes('orderId=')) {
            // It's a sticker URL
            const queryString = data.split('?')[1];
            const urlParams = new URLSearchParams(queryString);
            orderId = urlParams.get('orderId') || '';
            uid = urlParams.get('uid') || '';
        } else {
            // It might be just the order UUID
            orderId = data;
        }

        if (!orderId) {
            Alert.alert('Invalid Scan', 'Could not extract Order ID.');
            setScanned(false);
            return;
        }

        // 1. Fetch current order data
        const { data: order, error: fetchError } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();

        if (fetchError || !order) {
            Alert.alert('Order Not Found', 'The scanned Order ID does not exist.');
            setScanned(false);
            return;
        }

        // 2. If it was a unit scan (sticker), update the scannedUnits array
        if (uid) {
            const currentScanned = order.scannedUnits || [];
            if (!currentScanned.includes(uid)) {
                const newScanned = [...currentScanned, uid];
                const { error: updateError } = await supabase
                    .from('orders')
                    .update({ scannedUnits: newScanned })
                    .eq('id', orderId);

                if (updateError) {
                    Alert.alert('Update Failed', 'Could not record the unit scan.');
                }
            }
        }

        // 3. Navigate to Status screen
        navigation.navigate('OrderStatus', { orderId: order.id });
        setTimeout(() => setScanned(false), 2000);
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
