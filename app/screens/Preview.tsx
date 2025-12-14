// app/screens/Preview.tsx
import React, { useEffect, useState, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    SafeAreaView,
    Alert,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList, InvoiceData } from "../types/navigation";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from '@react-navigation/native';

type Props = NativeStackScreenProps<RootStackParamList, "Preview">;

type Invoice = {
    id: string;
    billNo: string;
    date: string;
    customerName: string;
    items: InvoiceData["items"];
    totalPaise: number;
    createdAt: number;
};

type BusinessDetails = {
    businessName: string;
    address: string;
    phone: string;
    email: string;
    gst: string;
};

const INVOICES_KEY = "invoices_v1";
const BUSINESS_KEY = "business_details_v1";

async function loadInvoices(): Promise<Invoice[]> {
    try {
        const raw = await AsyncStorage.getItem(INVOICES_KEY);
        if (!raw) return [];
        return JSON.parse(raw) as Invoice[];
    } catch (e) {
        console.warn("loadInvoices error:", e);
        return [];
    }
}

async function saveInvoices(invoices: Invoice[]): Promise<void> {
    try {
        await AsyncStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
    } catch (e) {
        console.warn("saveInvoices error:", e);
        throw e;
    }
}

async function loadBusinessDetails(): Promise<BusinessDetails> {
    try {
        const raw = await AsyncStorage.getItem(BUSINESS_KEY);
        if (!raw) {
            return {
                businessName: "Your Business Name",
                address: "123 Business Street, City",
                phone: "+91 98765 43210",
                email: "business@example.com",
                gst: "GSTIN1234567890",
            };
        }
        return JSON.parse(raw) as BusinessDetails;
    } catch (e) {
        console.warn("loadBusinessDetails error:", e);
        return {
            businessName: "Your Business Name",
            address: "123 Business Street, City",
            phone: "+91 98765 43210",
            email: "business@example.com",
            gst: "GSTIN1234567890",
        };
    }
}

export default function Preview({ navigation, route }: Props) {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [businessDetails, setBusinessDetails] = useState<BusinessDetails | null>(null);
    const [showPreview, setShowPreview] = useState(false);

    // Load invoices whenever screen comes into focus
    useFocusEffect(
        useCallback(() => {
            (async () => {
                const loaded = await loadInvoices();
                setInvoices(loaded.sort((a, b) => b.createdAt - a.createdAt));
                const business = await loadBusinessDetails();
                setBusinessDetails(business);
            })();
        }, [])
    );

    function viewInvoice(invoice: Invoice) {
        setSelectedInvoice(invoice);
        setShowPreview(true);
    }

    function closePreview() {
        setShowPreview(false);
        setSelectedInvoice(null);
    }

    function deleteInvoice(id: string) {
        Alert.alert(
            "Delete Invoice",
            "Are you sure you want to delete this invoice?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const updated = invoices.filter(inv => inv.id !== id);

                            // update UI immediately
                            setInvoices(updated);

                            // save to storage
                            await AsyncStorage.setItem(
                                "invoices_v1",
                                JSON.stringify(updated)
                            );

                            // close preview if same invoice
                            if (selectedInvoice?.id === id) {
                                closePreview();
                            }
                        } catch (e) {
                            Alert.alert("Error", "Failed to delete invoice");
                            console.error(e);
                        }
                    },
                },
            ]
        );
    }



    async function generatePDF() {
        Alert.alert(
            "Generate PDF",
            "PDF generation will be implemented with react-native-pdf or similar library"
        );
    }

    // Preview mode - showing selected invoice
    if (showPreview && selectedInvoice && businessDetails) {
        return (
            <SafeAreaView style={styles.safe}>
                <View style={styles.previewHeader}>
                    <Pressable onPress={closePreview}>
                        <Text style={styles.backBtn}>← Back</Text>
                    </Pressable>
                    <Pressable style={styles.pdfBtn} onPress={generatePDF}>
                        <Text style={styles.pdfBtnText}>📄 Generate PDF</Text>
                    </Pressable>
                </View>

                <ScrollView style={styles.previewScroll} contentContainerStyle={styles.previewContent}>
                    <View style={styles.invoiceDoc}>
                        {/* Header */}
                        <View style={styles.docHeader}>
                            <View>
                                <Text style={styles.bizName}>{businessDetails.businessName}</Text>
                                <Text style={styles.bizInfo}>{businessDetails.address}</Text>
                                <Text style={styles.bizInfo}>Phone: {businessDetails.phone}</Text>
                                <Text style={styles.bizInfo}>Email: {businessDetails.email}</Text>
                                {businessDetails.gst && (
                                    <Text style={styles.bizInfo}>GST: {businessDetails.gst}</Text>
                                )}
                            </View>
                        </View>

                        <View style={styles.invoiceTitle}>
                            <Text style={styles.invoiceTitleText}>INVOICE</Text>
                        </View>

                        {/* Bill Details */}
                        <View style={styles.detailsRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.detailLabel}>Bill To:</Text>
                                <Text style={styles.detailValue}>{selectedInvoice.customerName}</Text>
                            </View>
                            <View style={{ alignItems: "flex-end" }}>
                                <Text style={styles.detailLabel}>Invoice No:</Text>
                                <Text style={styles.detailValue}>{selectedInvoice.billNo}</Text>
                                <Text style={styles.detailLabel}>Date:</Text>
                                <Text style={styles.detailValue}>{selectedInvoice.date}</Text>
                            </View>
                        </View>

                        {/* Items Table */}
                        <View style={styles.table}>
                            <View style={styles.tableHeader}>
                                <Text style={[styles.tableHeaderText, { flex: 2 }]}>Service</Text>
                                <Text style={[styles.tableHeaderText, { flex: 1, textAlign: "center" }]}>
                                    Qty
                                </Text>
                                <Text style={[styles.tableHeaderText, { flex: 1, textAlign: "right" }]}>
                                    Rate
                                </Text>
                                <Text style={[styles.tableHeaderText, { flex: 1, textAlign: "right" }]}>
                                    Amount
                                </Text>
                            </View>

                            {selectedInvoice.items.map((item, idx) => {
                                const amount = item.ratePaise * item.quantity;
                                return (
                                    <View
                                        key={item.id}
                                        style={[
                                            styles.tableRow,
                                            idx === selectedInvoice.items.length - 1 && styles.tableRowLast,
                                        ]}
                                    >
                                        <Text style={[styles.tableCell, { flex: 2 }]}>
                                            {item.serviceName}
                                        </Text>
                                        <Text style={[styles.tableCell, { flex: 1, textAlign: "center" }]}>
                                            {item.quantity}
                                        </Text>
                                        <Text style={[styles.tableCell, { flex: 1, textAlign: "right" }]}>
                                            ₹{(item.ratePaise / 100).toFixed(2)}
                                        </Text>
                                        <Text style={[styles.tableCell, { flex: 1, textAlign: "right" }]}>
                                            ₹{(amount / 100).toFixed(2)}
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>

                        {/* Total */}
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Total Amount:</Text>
                            <Text style={styles.totalValue}>
                                ₹{(selectedInvoice.totalPaise / 100).toFixed(2)}
                            </Text>
                        </View>

                        {/* Footer */}
                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Thank you for your business!</Text>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    // List mode - showing all saved invoices
    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.headerRow}>
                    <Text style={styles.title}>Recent Invoices</Text>
                </View>

                {invoices.length === 0 ? (
                    <View style={styles.emptyBox}>
                        <Text style={styles.emptyText}>No invoices yet</Text>
                        <Text style={styles.emptyHint}>Create your first invoice to see it here</Text>
                        <Pressable
                            style={styles.createBtn}
                            onPress={() => navigation.navigate("NewInvoice")}
                        >
                            <Text style={styles.createBtnText}>+ Create Invoice</Text>
                        </Pressable>
                    </View>
                ) : (
                    invoices.map((invoice) => (
                        <View key={invoice.id} style={styles.invoiceCard}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.cardBillNo}>{invoice.billNo}</Text>
                                <Text style={styles.cardCustomer}>{invoice.customerName}</Text>
                                <Text style={styles.cardDate}>{invoice.date}</Text>
                            </View>
                            <View style={{ alignItems: "flex-end" }}>
                                <Text style={styles.cardAmount}>
                                    ₹{(invoice.totalPaise / 100).toFixed(2)}
                                </Text>
                                <View style={styles.cardActions}>
                                    <Pressable
                                        style={styles.actionBtn}
                                        onPress={() => viewInvoice(invoice)}
                                    >
                                        <Text style={styles.actionBtnText}>View</Text>
                                    </Pressable>
                                    <Pressable
                                        style={[styles.actionBtn, styles.deleteActionBtn]}
                                        onPress={() => deleteInvoice(invoice.id)}
                                    >
                                        <Text style={[styles.actionBtnText, { color: "#dc2626" }]}>
                                            Delete
                                        </Text>
                                    </Pressable>
                                </View>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#f8fafc" },
    container: { padding: 16, paddingBottom: 32 },
    headerRow: { marginBottom: 16 },
    title: { fontSize: 22, fontWeight: "800", color: "#111827" },
    emptyBox: {
        alignItems: "center",
        paddingVertical: 60,
        backgroundColor: "#fff",
        borderRadius: 12,
        marginTop: 20,
    },
    emptyText: { fontSize: 18, color: "#6b7280", fontWeight: "600" },
    emptyHint: { fontSize: 14, color: "#9ca3af", marginTop: 8 },
    createBtn: {
        backgroundColor: "#0b74ff",
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        marginTop: 20,
    },
    createBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
    invoiceCard: {
        flexDirection: "row",
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 8,
        elevation: 2,
    },
    cardBillNo: { fontSize: 16, fontWeight: "800", color: "#111827" },
    cardCustomer: { fontSize: 14, color: "#374151", marginTop: 4 },
    cardDate: { fontSize: 12, color: "#6b7280", marginTop: 2 },
    cardAmount: { fontSize: 20, fontWeight: "800", color: "#0b74ff", marginBottom: 8 },
    cardActions: { flexDirection: "row", gap: 8 },
    actionBtn: {
        backgroundColor: "#eef2ff",
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
        marginLeft: 8,
    },
    deleteActionBtn: { backgroundColor: "#fee" },
    actionBtnText: { color: "#0b74ff", fontWeight: "700", fontSize: 13 },
    previewHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 16,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
    },
    backBtn: { fontSize: 16, color: "#0b74ff", fontWeight: "700" },
    pdfBtn: {
        backgroundColor: "#0b74ff",
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    pdfBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
    previewScroll: { flex: 1 },
    previewContent: { padding: 16 },
    invoiceDoc: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 24,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 12,
        elevation: 5,
    },
    docHeader: {
        borderBottomWidth: 2,
        borderBottomColor: "#e5e7eb",
        paddingBottom: 16,
        marginBottom: 16,
    },
    bizName: { fontSize: 20, fontWeight: "800", color: "#111827", marginBottom: 8 },
    bizInfo: { fontSize: 12, color: "#6b7280", marginTop: 2 },
    invoiceTitle: {
        alignItems: "center",
        marginBottom: 20,
    },
    invoiceTitleText: {
        fontSize: 28,
        fontWeight: "900",
        color: "#111827",
        letterSpacing: 2,
    },
    detailsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 24,
    },
    detailLabel: {
        fontSize: 11,
        color: "#6b7280",
        fontWeight: "600",
        marginBottom: 4,
    },
    detailValue: { fontSize: 14, color: "#111827", fontWeight: "700" },
    table: {
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 8,
        overflow: "hidden",
        marginBottom: 20,
    },
    tableHeader: {
        flexDirection: "row",
        backgroundColor: "#f3f4f6",
        padding: 12,
        borderBottomWidth: 2,
        borderBottomColor: "#e5e7eb",
    },
    tableHeaderText: { fontSize: 12, fontWeight: "800", color: "#374151" },
    tableRow: {
        flexDirection: "row",
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#f3f4f6",
    },
    tableRowLast: { borderBottomWidth: 0 },
    tableCell: { fontSize: 13, color: "#111827" },
    totalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#f3f4f6",
        padding: 16,
        borderRadius: 8,
        marginBottom: 24,
    },
    totalLabel: { fontSize: 16, fontWeight: "800", color: "#374151" },
    totalValue: { fontSize: 22, fontWeight: "900", color: "#0b74ff" },
    footer: {
        alignItems: "center",
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: "#e5e7eb",
    },
    footerText: { fontSize: 13, color: "#6b7280", fontStyle: "italic" },
});