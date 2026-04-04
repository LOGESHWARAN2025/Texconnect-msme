import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Linking,
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface WhatsAppOnboardingPromptProps {
    visible: boolean;
    onDismiss: () => void;
    phoneNumber: string;
    businessName: string;
}

const BUSINESS_WHATSAPP_NUMBER = '+919366120001'; // TexConnect business number

export const openWhatsAppToOptIn = () => {
    const message = 'START';
    const url = `https://wa.me/${BUSINESS_WHATSAPP_NUMBER.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    
    Linking.canOpenURL(url).then(supported => {
        if (supported) {
            Linking.openURL(url);
        } else {
            // Fallback to direct WhatsApp link
            const whatsappUrl = `whatsapp://send?phone=${BUSINESS_WHATSAPP_NUMBER.replace(/\D/g, '')}&text=${encodeURIComponent(message)}`;
            Linking.openURL(whatsappUrl).catch(() => {
                Alert.alert(
                    'WhatsApp Not Installed',
                    'Please install WhatsApp to receive order updates. SMS notifications will be used instead.'
                );
            });
        }
    });
};

export default function WhatsAppOnboardingPrompt({ 
    visible, 
    onDismiss, 
    phoneNumber = BUSINESS_WHATSAPP_NUMBER,
    businessName = 'TexConnect' 
}: WhatsAppOnboardingPromptProps) {
    if (!visible) return null;

    const handleOpenWhatsApp = () => {
        openWhatsAppToOptIn();
        onDismiss();
    };

    const handleSkip = () => {
        onDismiss();
    };

    return (
        <View style={styles.overlay}>
            <LinearGradient colors={['#1e293b', '#0f172a']} style={styles.container}>
                <View style={styles.iconContainer}>
                    <Text style={styles.icon}>💬</Text>
                </View>
                
                <Text style={styles.title}>Get WhatsApp Order Updates</Text>
                
                <Text style={styles.description}>
                    To receive instant WhatsApp notifications for your orders, please send "START" to our business number:
                </Text>
                
                <View style={styles.phoneContainer}>
                    <Text style={styles.phoneNumber}>{phoneNumber}</Text>
                </View>
                
                <Text style={styles.benefits}>
                    ✓ Order status updates{'\n'}
                    ✓ Delivery notifications{'\n'}
                    ✓ Faster than SMS
                </Text>

                <TouchableOpacity style={styles.whatsappButton} onPress={handleOpenWhatsApp}>
                    <Text style={styles.whatsappButtonText}>Open WhatsApp & Send "START"</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.smsButton} onPress={handleSkip}>
                    <Text style={styles.smsButtonText}>Continue with SMS Only</Text>
                </TouchableOpacity>

                <Text style={styles.note}>
                    Note: SMS notifications will always work. WhatsApp requires this one-time setup.
                </Text>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    container: {
        width: '90%',
        maxWidth: 400,
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    icon: {
        fontSize: 32,
    },
    title: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center',
    },
    description: {
        color: '#94a3b8',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 20,
    },
    phoneContainer: {
        backgroundColor: 'rgba(56, 189, 248, 0.1)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        marginBottom: 16,
    },
    phoneNumber: {
        color: '#38bdf8',
        fontSize: 16,
        fontWeight: '600',
    },
    benefits: {
        color: '#10b981',
        fontSize: 13,
        lineHeight: 20,
        marginBottom: 20,
        textAlign: 'left',
        width: '100%',
        paddingHorizontal: 20,
    },
    whatsappButton: {
        backgroundColor: '#10b981',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center',
        marginBottom: 12,
    },
    whatsappButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: 'bold',
    },
    smsButton: {
        backgroundColor: 'rgba(148, 163, 184, 0.2)',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center',
        marginBottom: 16,
    },
    smsButtonText: {
        color: '#94a3b8',
        fontSize: 15,
        fontWeight: '600',
    },
    note: {
        color: '#64748b',
        fontSize: 11,
        textAlign: 'center',
        fontStyle: 'italic',
    },
});
