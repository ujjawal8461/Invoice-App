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
    Platform,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList, InvoiceData } from "../types/navigation";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from '@react-navigation/native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

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
                businessName: "Ujjawal Refrigeration",
                address: "53/8, Samajwadi Indra Nagar, Behind: Polytechnic College Indore",
                phone: "Mob.9893222107\nMob(W).9039378360",
                email: "ujjawal.refrigeration@gmail.com",
            };
        }
        return JSON.parse(raw) as BusinessDetails;
    } catch (e) {
        console.warn("loadBusinessDetails error:", e);
        return {
            businessName: "Ujjawal Refrigeration",
            address: "53/8, Samajwadi Indra Nagar, Behind: Polytechnic College Indore",
            phone: "Mob.9893222107\nMob(W).9039378360",
            email: "ujjawal.refrigeration@gmail.com",
        };
    }
}

// Convert number to words (Indian style)
function numberToWords(num: number): string {
    if (num === 0) return "Zero";

    const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
    const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

    function convertLessThanThousand(n: number): string {
        if (n === 0) return "";
        if (n < 10) return ones[n];
        if (n < 20) return teens[n - 10];
        if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + ones[n % 10] : "");
        return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " " + convertLessThanThousand(n % 100) : "");
    }

    if (num < 1000) return convertLessThanThousand(num);

    // Indian numbering system: crores, lakhs, thousands
    const crores = Math.floor(num / 10000000);
    const lakhs = Math.floor((num % 10000000) / 100000);
    const thousands = Math.floor((num % 100000) / 1000);
    const remainder = num % 1000;

    let result = "";
    if (crores > 0) result += convertLessThanThousand(crores) + " Crore ";
    if (lakhs > 0) result += convertLessThanThousand(lakhs) + " Lakh ";
    if (thousands > 0) result += convertLessThanThousand(thousands) + " Thousand ";
    if (remainder > 0) result += convertLessThanThousand(remainder);

    return result.trim();
}

function amountToWords(amountInRupees: number): string {
    const rupees = Math.floor(amountInRupees);
    const paise = Math.round((amountInRupees - rupees) * 100);

    let words = numberToWords(rupees) + " Rupees";
    if (paise > 0) {
        words += " and " + numberToWords(paise) + " Paise";
    }
    words += " Only";
    return words;
}

// EMBEDDED HTML TEMPLATE - No file loading needed
function getInvoiceTemplate(): string {
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 14px;
            color: #000;
            padding: 20px;
            line-height: 1.4;
        }

        .mobile-numbers {
            text-align: left;
            font-size: 13px;
            margin-bottom: 10px;
            font-weight: 500;
        }

        .business-name {
            font-size: 28px;
            font-weight: bold;
            text-align: left;
            margin-bottom: 8px;
        }

        .address {
            font-size: 13px;
            text-align: left;
            margin-bottom: 15px;
            line-height: 1.5;
        }

        .email {
            font-size: 12px;
            text-align: left;
            margin-bottom: 20px;
            color: #333;
        }

        .invoice-header {
            border: 2px solid #000;
            padding: 10px;
            margin-bottom: 0;
        }

        .invoice-details {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
        }

        .invoice-details-left,
        .invoice-details-right {
            font-size: 13px;
        }

        .invoice-details-left strong,
        .invoice-details-right strong {
            font-weight: bold;
        }

        .customer-section {
            border-left: 2px solid #000;
            border-right: 2px solid #000;
            border-bottom: 2px solid #000;
            padding: 10px;
            margin-bottom: 0;
        }

        .customer-label {
            font-size: 13px;
            font-weight: bold;
        }

        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 0;
        }

        .items-table th {
            border: 2px solid #000;
            padding: 8px;
            text-align: center;
            font-size: 13px;
            font-weight: bold;
            background-color: #f5f5f5;
        }

        .items-table td {
            border: 2px solid #000;
            padding: 8px;
            font-size: 13px;
        }

        .items-table td.center {
            text-align: center;
        }

        .items-table td.right {
            text-align: right;
        }

        .amount-words {
            border-left: 2px solid #000;
            border-right: 2px solid #000;
            border-bottom: 2px solid #000;
            padding: 10px;
            font-size: 13px;
            margin-bottom: 0;
        }

        .amount-words strong {
            font-weight: bold;
        }

        .total-section {
            border-left: 2px solid #000;
            border-right: 2px solid #000;
            border-bottom: 2px solid #000;
            padding: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 14px;
            font-weight: bold;
        }

        .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #666;
            font-style: italic;
        }

        .empty-rows td {
            border-left: 2px solid #000;
            border-right: 2px solid #000;
            border-bottom: 1px solid #ddd;
            padding: 15px 8px;
        }

        @media print {
            body {
                padding: 10px;
            }
        }
    </style>
</head>
<body>
    <div class="mobile-numbers">{{PHONE}}</div>
    <div class="business-name">**{{BUSINESS_NAME}}**</div>
    <div class="address">{{ADDRESS}}</div>
    <div class="email">&lt;{{EMAIL}}&gt;</div>
    
    <div class="invoice-header">
        <div class="invoice-details">
            <div class="invoice-details-left"><strong>Bill no.:</strong> {{BILL_NO}}</div>
            <div class="invoice-details-right"><strong>Date:</strong> {{DATE}}</div>
        </div>
    </div>
    
    <div class="customer-section">
        <span class="customer-label">M/S:</span> {{CUSTOMER_NAME}}
    </div>
    
    <table class="items-table">
        <thead>
            <tr>
                <th style="width: 8%;">Sr. No.</th>
                <th style="width: 44%;">Description</th>
                <th style="width: 12%;">Quantity</th>
                <th style="width: 18%;">Rate</th>
                <th style="width: 18%;">Amount</th>
            </tr>
        </thead>
        <tbody>
            {{ITEMS_TABLE}}
            <tr class="empty-rows">
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
            </tr>
            <tr class="empty-rows">
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
            </tr>
        </tbody>
    </table>
    
    <div class="amount-words">
        <strong>Rupees (in words):</strong> {{AMOUNT_WORDS}}
    </div>
    
    <div class="total-section">
        <span><strong>Total Amount</strong></span>
        <span><strong>**₹{{TOTAL}}**</strong></span>
    </div>
    
    <div class="footer">
        Thank you for your business!
    </div>
</body>
</html>`;
}

export default function Preview({ navigation, route }: Props) {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [businessDetails, setBusinessDetails] = useState<BusinessDetails | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

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
                            await AsyncStorage.setItem("invoices_v1", JSON.stringify(updated));
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

    function generateInvoiceHTML(invoice: Invoice, business: BusinessDetails): string {
        console.log("🎨 Generating invoice HTML from embedded template");

        // Get the embedded template
        let html = getInvoiceTemplate();

        // Replace business details
        html = html.replace(/\{\{BUSINESS_NAME\}\}/g, business.businessName);
        html = html.replace(/\{\{ADDRESS\}\}/g, business.address);
        html = html.replace(/\{\{PHONE\}\}/g, business.phone.replace(/\n/g, '<br>'));
        html = html.replace(/\{\{EMAIL\}\}/g, business.email);

        // Replace invoice details
        html = html.replace(/\{\{BILL_NO\}\}/g, invoice.billNo);
        html = html.replace(/\{\{DATE\}\}/g, invoice.date);
        html = html.replace(/\{\{CUSTOMER_NAME\}\}/g, invoice.customerName);

        // Generate items table rows
        const itemsHTML = invoice.items.map((item, index) => {
            const amount = item.ratePaise * item.quantity;
            return `
                <tr>
                    <td class="center">${index + 1}</td>
                    <td>${item.serviceName}</td>
                    <td class="center">${item.quantity}</td>
                    <td class="right">₹${(item.ratePaise / 100).toFixed(2)}</td>
                    <td class="right">₹${(amount / 100).toFixed(2)}</td>
                </tr>
            `;
        }).join('');

        html = html.replace(/\{\{ITEMS_TABLE\}\}/g, itemsHTML);

        // Replace total
        const totalAmount = (invoice.totalPaise / 100).toFixed(2);
        html = html.replace(/\{\{TOTAL\}\}/g, totalAmount);

        // Replace amount in words
        const amountWords = amountToWords(invoice.totalPaise / 100);
        html = html.replace(/\{\{AMOUNT_WORDS\}\}/g, amountWords);

        console.log("✅ HTML generation complete");
        console.log("📄 Template is being used correctly");

        return html;
    }

    async function generatePDF() {
        if (!selectedInvoice || !businessDetails) {
            Alert.alert("Error", "Invoice data not available");
            return;
        }

        setIsGeneratingPDF(true);
        try {
            console.log("🔍 Generating PDF for invoice:", selectedInvoice.billNo);
            console.log("📱 Platform:", Platform.OS);

            const html = generateInvoiceHTML(selectedInvoice, businessDetails);

            // WEB-SPECIFIC: If running on web, use browser print
            if (Platform.OS === 'web') {
                console.log("🌐 Web platform detected - using browser print");

                // Create a new window with the HTML
                const printWindow = window.open('', '_blank');
                if (printWindow) {
                    printWindow.document.write(html);
                    printWindow.document.close();

                    // Wait for content to load, then trigger print
                    printWindow.onload = () => {
                        printWindow.print();
                    };
                } else {
                    Alert.alert("Error", "Please allow pop-ups for this site to generate PDFs");
                }
            } else {
                // MOBILE: Use expo-print
                console.log("📱 Mobile platform - using expo-print");
                console.log("🖨️ Calling Print.printToFileAsync...");

                const { uri } = await Print.printToFileAsync({
                    html,
                    base64: false,
                });

                console.log('✅ PDF generated at:', uri);

                const isAvailable = await Sharing.isAvailableAsync();

                if (isAvailable) {
                    await Sharing.shareAsync(uri, {
                        mimeType: 'application/pdf',
                        dialogTitle: `Invoice ${selectedInvoice.billNo}`,
                        UTI: 'com.adobe.pdf',
                    });
                } else {
                    Alert.alert("PDF Generated", `PDF saved successfully at: ${uri}`, [{ text: "OK" }]);
                }
            }
        } catch (error) {
            console.error('❌ PDF generation error:', error);
            Alert.alert("Error", "Failed to generate PDF. Please try again.");
        } finally {
            setIsGeneratingPDF(false);
        }
    }

    // Preview mode
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
                        <View style={styles.docHeader}>
                            <View>
                                <Text style={styles.bizName}>{businessDetails.businessName}</Text>
                                <Text style={styles.bizInfo}>{businessDetails.address}</Text>
                                <Text style={styles.bizInfo}>Phone: {businessDetails.phone}</Text>
                                <Text style={styles.bizInfo}>Email: {businessDetails.email}</Text>
                            </View>
                        </View>

                        <View style={styles.invoiceTitle}>
                            <Text style={styles.invoiceTitleText}>INVOICE</Text>
                        </View>

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

                        <View style={styles.table}>
                            <View style={styles.tableHeader}>
                                <Text style={[styles.tableHeaderText, { flex: 2 }]}>Service</Text>
                                <Text style={[styles.tableHeaderText, { flex: 1, textAlign: "center" }]}>Qty</Text>
                                <Text style={[styles.tableHeaderText, { flex: 1, textAlign: "right" }]}>Rate</Text>
                                <Text style={[styles.tableHeaderText, { flex: 1, textAlign: "right" }]}>Amount</Text>
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
                                        <Text style={[styles.tableCell, { flex: 2 }]}>{item.serviceName}</Text>
                                        <Text style={[styles.tableCell, { flex: 1, textAlign: "center" }]}>{item.quantity}</Text>
                                        <Text style={[styles.tableCell, { flex: 1, textAlign: "right" }]}>₹{(item.ratePaise / 100).toFixed(2)}</Text>
                                        <Text style={[styles.tableCell, { flex: 1, textAlign: "right" }]}>₹{(amount / 100).toFixed(2)}</Text>
                                    </View>
                                );
                            })}
                        </View>

                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Total Amount:</Text>
                            <Text style={styles.totalValue}>₹{(selectedInvoice.totalPaise / 100).toFixed(2)}</Text>
                        </View>

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Thank you for your business!</Text>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    // List mode
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
                        <Pressable style={styles.createBtn} onPress={() => navigation.navigate("NewInvoice")}>
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
                                <Text style={styles.cardAmount}>₹{(invoice.totalPaise / 100).toFixed(2)}</Text>
                                <View style={styles.cardActions}>
                                    <Pressable style={styles.actionBtn} onPress={() => viewInvoice(invoice)}>
                                        <Text style={styles.actionBtnText}>View</Text>
                                    </Pressable>
                                    <Pressable style={[styles.actionBtn, styles.deleteActionBtn]} onPress={() => deleteInvoice(invoice.id)}>
                                        <Text style={[styles.actionBtnText, { color: "#dc2626" }]}>Delete</Text>
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
    emptyBox: { alignItems: "center", paddingVertical: 60, backgroundColor: "#fff", borderRadius: 12, marginTop: 20 },
    emptyText: { fontSize: 18, color: "#6b7280", fontWeight: "600" },
    emptyHint: { fontSize: 14, color: "#9ca3af", marginTop: 8 },
    createBtn: { backgroundColor: "#0b74ff", paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, marginTop: 20 },
    createBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
    invoiceCard: { flexDirection: "row", backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, elevation: 2 },
    cardBillNo: { fontSize: 16, fontWeight: "800", color: "#111827" },
    cardCustomer: { fontSize: 14, color: "#374151", marginTop: 4 },
    cardDate: { fontSize: 12, color: "#6b7280", marginTop: 2 },
    cardAmount: { fontSize: 20, fontWeight: "800", color: "#0b74ff", marginBottom: 8 },
    cardActions: { flexDirection: "row", gap: 8 },
    actionBtn: { backgroundColor: "#eef2ff", paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, marginLeft: 8 },
    deleteActionBtn: { backgroundColor: "#fee" },
    actionBtnText: { color: "#0b74ff", fontWeight: "700", fontSize: 13 },
    previewHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
    backBtn: { fontSize: 16, color: "#0b74ff", fontWeight: "700" },
    pdfBtn: { backgroundColor: "#0b74ff", paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
    pdfBtnDisabled: { backgroundColor: "#93c5fd" },
    pdfBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
    previewScroll: { flex: 1 },
    previewContent: { padding: 16 },
    invoiceDoc: { backgroundColor: "#fff", borderRadius: 12, padding: 24, shadowColor: "#000", shadowOpacity: 0.1, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, elevation: 5 },
    docHeader: { borderBottomWidth: 2, borderBottomColor: "#e5e7eb", paddingBottom: 16, marginBottom: 16 },
    bizName: { fontSize: 20, fontWeight: "800", color: "#111827", marginBottom: 8 },
    bizInfo: { fontSize: 12, color: "#6b7280", marginTop: 2 },
    invoiceTitle: { alignItems: "center", marginBottom: 20 },
    invoiceTitleText: { fontSize: 28, fontWeight: "900", color: "#111827", letterSpacing: 2 },
    detailsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
    detailLabel: { fontSize: 11, color: "#6b7280", fontWeight: "600", marginBottom: 4 },
    detailValue: { fontSize: 14, color: "#111827", fontWeight: "700" },
    table: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, overflow: "hidden", marginBottom: 20 },
    tableHeader: { flexDirection: "row", backgroundColor: "#f3f4f6", padding: 12, borderBottomWidth: 2, borderBottomColor: "#e5e7eb" },
    tableHeaderText: { fontSize: 12, fontWeight: "800", color: "#374151" },
    tableRow: { flexDirection: "row", padding: 12, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
    tableRowLast: { borderBottomWidth: 0 },
    tableCell: { fontSize: 13, color: "#111827" },
    totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#f3f4f6", padding: 16, borderRadius: 8, marginBottom: 24 },
    totalLabel: { fontSize: 16, fontWeight: "800", color: "#374151" },
    totalValue: { fontSize: 22, fontWeight: "900", color: "#0b74ff" },
    footer: { alignItems: "center", paddingTop: 16, borderTopWidth: 1, borderTopColor: "#e5e7eb" },
    footerText: { fontSize: 13, color: "#6b7280", fontStyle: "italic" },
});