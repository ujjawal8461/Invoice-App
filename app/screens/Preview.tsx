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
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Asset } from 'expo-asset';

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

// Load HTML template from assets
async function loadHTMLTemplate(): Promise<string> {
    try {
        console.log("🔍 Starting to load HTML template...");

        // Load the asset
        const asset = Asset.fromModule(require('../../assets/invoice-template.html'));
        console.log("📦 Asset module loaded:", asset);

        await asset.downloadAsync();
        console.log("✅ Asset downloaded");

        // Fetch the content
        const response = await fetch(asset.localUri || asset.uri);
        const htmlContent = await response.text();

        console.log("📄 HTML Content loaded, length:", htmlContent.length);
        console.log("📄 First 200 chars:", htmlContent.substring(0, 200));

        return htmlContent;
    } catch (e) {
        console.error("❌ Error loading HTML template:", e);
        console.log("⚠️ Using fallback default template");
        // Fallback to default template if loading fails
        return getDefaultTemplate();
    }
}

// Fallback default template (your original HTML)
function getDefaultTemplate(): string {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                    margin: 0;
                    padding: 40px;
                    color: #111827;
                }
                .invoice-container {
                    max-width: 800px;
                    margin: 0 auto;
                    background: white;
                    padding: 40px;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                }
                .header {
                    border-bottom: 3px solid #0b74ff;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }
                .business-name {
                    font-size: 24px;
                    font-weight: 800;
                    color: #111827;
                    margin-bottom: 10px;
                }
                .business-info {
                    font-size: 12px;
                    color: #6b7280;
                    line-height: 1.6;
                }
                .invoice-title {
                    text-align: center;
                    font-size: 32px;
                    font-weight: 900;
                    color: #111827;
                    margin: 30px 0;
                    letter-spacing: 2px;
                }
                .details-section {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 30px;
                }
                .detail-label {
                    font-size: 11px;
                    color: #6b7280;
                    font-weight: 600;
                    margin-bottom: 4px;
                }
                .detail-value {
                    font-size: 14px;
                    color: #111827;
                    font-weight: 700;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 30px;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    overflow: hidden;
                }
                th {
                    background-color: #f3f4f6;
                    padding: 12px;
                    text-align: left;
                    font-size: 12px;
                    font-weight: 800;
                    color: #374151;
                    border-bottom: 2px solid #e5e7eb;
                }
                td {
                    font-size: 13px;
                }
                .total-section {
                    background-color: #f3f4f6;
                    padding: 20px;
                    border-radius: 8px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 30px;
                }
                .total-label {
                    font-size: 18px;
                    font-weight: 800;
                    color: #374151;
                }
                .total-amount {
                    font-size: 24px;
                    font-weight: 900;
                    color: #0b74ff;
                }
                .footer {
                    text-align: center;
                    padding-top: 20px;
                    border-top: 1px solid #e5e7eb;
                    font-size: 13px;
                    color: #6b7280;
                    font-style: italic;
                }
            </style>
        </head>
        <body>
            <div class="invoice-container">
                <div class="header">
                    <div class="business-name">{{BUSINESS_NAME}}</div>
                    <div class="business-info">{{ADDRESS}}</div>
                    <div class="business-info">Phone: {{PHONE}}</div>
                    <div class="business-info">Email: {{EMAIL}}</div>
                    <div class="business-info">GST: {{GST}}</div>
                </div>

                <div class="invoice-title">INVOICE</div>

                <div class="details-section">
                    <div>
                        <div class="detail-label">Bill To:</div>
                        <div class="detail-value">{{CUSTOMER_NAME}}</div>
                    </div>
                    <div style="text-align: right;">
                        <div class="detail-label">Invoice No:</div>
                        <div class="detail-value">{{BILL_NO}}</div>
                        <div class="detail-label" style="margin-top: 8px;">Date:</div>
                        <div class="detail-value">{{DATE}}</div>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Service</th>
                            <th style="text-align: center;">Qty</th>
                            <th style="text-align: right;">Rate</th>
                            <th style="text-align: right;">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {{ITEMS_TABLE}}
                    </tbody>
                </table>

                <div class="total-section">
                    <div class="total-label">Total Amount:</div>
                    <div class="total-amount">₹{{TOTAL}}</div>
                </div>

                <div class="footer">
                    Thank you for your business!
                </div>
            </div>
        </body>
        </html>
    `;
}

export default function Preview({ navigation, route }: Props) {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [businessDetails, setBusinessDetails] = useState<BusinessDetails | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [htmlTemplate, setHtmlTemplate] = useState<string>("");

    // Load HTML template once when component mounts
    useEffect(() => {
        (async () => {
            console.log("🚀 Component mounted, loading template...");
            const template = await loadHTMLTemplate();
            console.log("✅ Template loaded into state, length:", template.length);
            setHtmlTemplate(template);
        })();
    }, []);

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
                            setInvoices(updated);
                            await AsyncStorage.setItem(
                                "invoices_v1",
                                JSON.stringify(updated)
                            );
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

    // Generate HTML for PDF using template
    function generateInvoiceHTML(invoice: Invoice, business: BusinessDetails): string {
        console.log("🎨 Generating invoice HTML...");
        console.log("📝 htmlTemplate state length:", htmlTemplate.length);

        // Use loaded template or fallback
        let html = htmlTemplate || getDefaultTemplate();

        console.log("📋 Using template length:", html.length);
        console.log("📋 Template preview:", html.substring(0, 300));

        // Replace business details placeholders
        html = html.replace(/\{\{BUSINESS_NAME\}\}/g, business.businessName);
        html = html.replace(/\{\{ADDRESS\}\}/g, business.address);
        html = html.replace(/\{\{PHONE\}\}/g, business.phone);
        html = html.replace(/\{\{EMAIL\}\}/g, business.email);
        html = html.replace(/\{\{GST\}\}/g, business.gst || '');

        // Replace invoice details placeholders
        html = html.replace(/\{\{BILL_NO\}\}/g, invoice.billNo);
        html = html.replace(/\{\{DATE\}\}/g, invoice.date);
        html = html.replace(/\{\{CUSTOMER_NAME\}\}/g, invoice.customerName);

        // Generate items table rows
        const itemsHTML = invoice.items.map((item, index) => {
            const amount = item.ratePaise * item.quantity;
            return `
                <tr>
                    <td style="padding: 8px; text-align: center;">${index + 1}</td>
                    <td style="padding: 8px;">${item.serviceName}</td>
                    <td style="padding: 8px; text-align: center;">${item.quantity}</td>
                    <td style="padding: 8px; text-align: right;">₹${(item.ratePaise / 100).toFixed(2)}</td>
                    <td style="padding: 8px; text-align: right;">₹${(amount / 100).toFixed(2)}</td>
                </tr>
            `;
        }).join('');

        html = html.replace(/\{\{ITEMS_TABLE\}\}/g, itemsHTML);

        // Replace total
        html = html.replace(/\{\{TOTAL\}\}/g, (invoice.totalPaise / 100).toFixed(2));

        console.log("✅ HTML generation complete, final length:", html.length);

        return html;
    }

    async function generatePDF() {
        if (!selectedInvoice || !businessDetails) {
            Alert.alert("Error", "Invoice data not available");
            return;
        }

        setIsGeneratingPDF(true);
        try {
            const html = generateInvoiceHTML(selectedInvoice, businessDetails);

            // Generate PDF
            const { uri } = await Print.printToFileAsync({
                html,
                base64: false,
            });

            console.log('PDF generated at:', uri);

            // Check if sharing is available
            const isAvailable = await Sharing.isAvailableAsync();

            if (isAvailable) {
                // Share the PDF
                await Sharing.shareAsync(uri, {
                    mimeType: 'application/pdf',
                    dialogTitle: `Invoice ${selectedInvoice.billNo}`,
                    UTI: 'com.adobe.pdf',
                });
            } else {
                Alert.alert(
                    "PDF Generated",
                    `PDF saved successfully at: ${uri}`,
                    [{ text: "OK" }]
                );
            }
        } catch (error) {
            console.error('PDF generation error:', error);
            Alert.alert(
                "Error",
                "Failed to generate PDF. Please try again."
            );
        } finally {
            setIsGeneratingPDF(false);
        }
    }

    // Preview mode - showing selected invoice
    if (showPreview && selectedInvoice && businessDetails) {
        return (
            <SafeAreaView style={styles.safe}>
                <View style={styles.previewHeader}>
                    <Pressable onPress={closePreview}>
                        <Text style={styles.backBtn}>← Back</Text>
                    </Pressable>
                    <Pressable
                        style={[styles.pdfBtn, isGeneratingPDF && styles.pdfBtnDisabled]}
                        onPress={generatePDF}
                        disabled={isGeneratingPDF}
                    >
                        <Text style={styles.pdfBtnText}>
                            {isGeneratingPDF ? "Generating..." : "📄 Generate PDF"}
                        </Text>
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
    pdfBtnDisabled: {
        backgroundColor: "#93c5fd",
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