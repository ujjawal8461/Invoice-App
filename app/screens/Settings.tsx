import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    ScrollView,
    Pressable,
    SafeAreaView,
    Alert,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

type BusinessDetails = {
    businessName: string;
    address: string;
    phone: string;
    email: string;
    gst: string;
};

const BUSINESS_KEY = 'business_details_v1';
const INVOICES_KEY = 'invoices_v1';
const SERVICES_KEY = 'services_v1';

async function loadBusinessDetails(): Promise<BusinessDetails> {
    try {
        const raw = await AsyncStorage.getItem(BUSINESS_KEY);
        if (!raw) {
            return {
                businessName: 'Your Business Name',
                address: '123 Business Street, City',
                phone: '+91 98765 43210',
                email: 'business@example.com',
                gst: 'GSTIN1234567890',
            };
        }
        return JSON.parse(raw) as BusinessDetails;
    } catch (e) {
        console.warn('loadBusinessDetails error:', e);
        return {
            businessName: 'Your Business Name',
            address: '123 Business Street, City',
            phone: '+91 98765 43210',
            email: 'business@example.com',
            gst: 'GSTIN1234567890',
        };
    }
}

async function saveBusinessDetails(details: BusinessDetails): Promise<void> {
    try {
        await AsyncStorage.setItem(BUSINESS_KEY, JSON.stringify(details));
    } catch (e) {
        console.warn('saveBusinessDetails error:', e);
        throw e;
    }
}

export default function Settings({ navigation }: Props) {
    const [businessName, setBusinessName] = useState('');
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [gst, setGst] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        (async () => {
            const details = await loadBusinessDetails();
            setBusinessName(details.businessName);
            setAddress(details.address);
            setPhone(details.phone);
            setEmail(details.email);
            setGst(details.gst);
        })();
    }, []);

    async function handleSave() {
        if (!businessName.trim()) {
            Alert.alert('Validation Error', 'Business name is required');
            return;
        }

        setIsSaving(true);
        try {
            const details: BusinessDetails = {
                businessName: businessName.trim(),
                address: address.trim(),
                phone: phone.trim(),
                email: email.trim(),
                gst: gst.trim(),
            };
            await saveBusinessDetails(details);
            Alert.alert('Success', 'Business details saved successfully!');
        } catch (e) {
            Alert.alert('Error', 'Failed to save business details. Please try again.');
            console.error('Save error:', e);
        } finally {
            setIsSaving(false);
        }
    }

    function handleClearAllData() {
        Alert.alert(
            'Clear All Data',
            'This will delete all invoices, services, and business details. This action cannot be undone. Are you sure?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear All',
                    style: 'destructive',
                    onPress: () => {
                        AsyncStorage.multiRemove([
                            BUSINESS_KEY,
                            INVOICES_KEY,
                            SERVICES_KEY,
                        ])
                            .then(() => {
                                Alert.alert('Success', 'All data cleared successfully');
                                // Reset to defaults
                                loadBusinessDetails().then(defaults => {
                                    setBusinessName(defaults.businessName);
                                    setAddress(defaults.address);
                                    setPhone(defaults.phone);
                                    setEmail(defaults.email);
                                    setGst(defaults.gst);
                                });
                            })
                            .catch((e) => {
                                Alert.alert('Error', 'Failed to clear data');
                                console.error('Clear error:', e);
                            });
                    },
                },
            ]
        );
    }

    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.title}>Business Details</Text>
                <Text style={styles.subtitle}>
                    This information will appear on all your invoices
                </Text>

                <View style={styles.section}>
                    <Text style={styles.label}>Business Name *</Text>
                    <TextInput
                        style={styles.input}
                        value={businessName}
                        onChangeText={setBusinessName}
                        placeholder="Enter your business name"
                        placeholderTextColor="#999"
                    />

                    <Text style={styles.label}>Address</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={address}
                        onChangeText={setAddress}
                        placeholder="Street address, City, State, PIN"
                        placeholderTextColor="#999"
                        multiline
                        numberOfLines={3}
                    />

                    <Text style={styles.label}>Phone Number</Text>
                    <TextInput
                        style={styles.input}
                        value={phone}
                        onChangeText={setPhone}
                        placeholder="+91 98765 43210"
                        placeholderTextColor="#999"
                        keyboardType="phone-pad"
                    />

                    <Text style={styles.label}>Email</Text>
                    <TextInput
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        placeholder="business@example.com"
                        placeholderTextColor="#999"
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />

                    <Text style={styles.label}>GST Number</Text>
                    <TextInput
                        style={styles.input}
                        value={gst}
                        onChangeText={setGst}
                        placeholder="GSTIN1234567890"
                        placeholderTextColor="#999"
                        autoCapitalize="characters"
                    />
                </View>

                <Pressable
                    style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
                    onPress={handleSave}
                    disabled={isSaving}
                >
                    <Text style={styles.saveBtnText}>
                        {isSaving ? 'Saving...' : 'Save Business Details'}
                    </Text>
                </Pressable>

                <View style={styles.dangerSection}>
                    <Text style={styles.dangerTitle}>Danger Zone</Text>
                    <Pressable style={styles.dangerBtn} onPress={handleClearAllData}>
                        <Text style={styles.dangerBtnText}>Clear All Data</Text>
                    </Pressable>
                    <Text style={styles.dangerHint}>
                        This will delete all invoices, services, and reset business details
                    </Text>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Invoice App v1.0.0</Text>
                    <Text style={styles.footerHint}>
                        Made for fast invoicing on mobile
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#f8fafc' },
    container: { padding: 16, paddingBottom: 32 },
    title: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 4 },
    subtitle: { fontSize: 14, color: '#6b7280', marginBottom: 20 },
    section: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 8,
        elevation: 2,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginTop: 12,
        marginBottom: 6,
    },
    input: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#111',
        backgroundColor: '#fff',
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    saveBtn: {
        backgroundColor: '#0b74ff',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 24,
    },
    saveBtnDisabled: {
        backgroundColor: '#93c5fd',
    },
    saveBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
    },
    dangerSection: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        borderWidth: 2,
        borderColor: '#fecaca',
        marginBottom: 24,
    },
    dangerTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#dc2626',
        marginBottom: 12,
    },
    dangerBtn: {
        backgroundColor: '#dc2626',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 8,
    },
    dangerBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
    dangerHint: {
        fontSize: 12,
        color: '#6b7280',
        textAlign: 'center',
    },
    footer: {
        alignItems: 'center',
        paddingTop: 16,
    },
    footerText: {
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '600',
    },
    footerHint: {
        fontSize: 12,
        color: '#9ca3af',
        marginTop: 4,
    },
});