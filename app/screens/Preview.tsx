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
import { WebView } from 'react-native-webview';
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

// SINGLE HTML TEMPLATE - Highly Customizable
function getInvoiceTemplate(): string {
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 14px;
            margin: 0;
            padding: 20px;
        }
        .container {
            width: 100%;
            max-width: 800px;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
        }
        .phone {
            font-size: 14px;
            margin-bottom: 10px;
            text-align: right;
        }
        .business-name {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .address {
            font-size: 14px;
            margin-bottom: 5px;
        }
        .email {
            font-size: 14px;
            margin-bottom: 20px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        .header-table td {
            border: none;
            padding: 0;
        }
        .bill-line {
            border-top: 2px solid black;
            border-bottom: 2px solid black;
            padding: 8px 0;
        }
        .bill-details {
            display: flex;
            justify-content: space-between;
            font-size: 14px;
        }
        .customer-line {
            border-bottom: 2px solid black;
            padding: 10px 0 15px 0;
            font-size: 14px;
        }
        .items-table {
            margin-top: 20px;
        }
        .items-table th,
        .items-table td {
            border: 2px solid black;
            padding: 10px;
            text-align: center;
            font-size: 14px;
        }
        .items-table th {
            font-weight: bold;
        }
        .items-table td.description {
            text-align: left;
        }
        .items-table td.right {
            text-align: right;
        }
        .empty-space {
            height: 300px; /* large empty space like in the image */
        }
        .words-line {
            border-top: 2px solid black;
            border-bottom: 2px solid black;
            padding: 10px 0;
            font-size: 14px;
        }
        .total-section {
            display: flex;
            justify-content: flex-end;
            border-bottom: 2px solid black;
            padding: 10px 0;
        }
        .total-box {
            width: 300px;
            display: flex;
            justify-content: space-between;
            font-size: 16px;
            font-weight: bold;
        }
        @media print {
            body { padding: 10px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="phone">{{PHONE}}</div>
            <div class="business-name">{{BUSINESS_NAME}}</div>
            <div class="address">{{ADDRESS}}</div>
            <div class="email">{{EMAIL}}</div>
        </div>

        <table class="header-table">
            <tr>
                <td class="bill-line">
                    <div class="bill-details">
                        <div><strong>Bill no.:</strong> {{BILL_NO}}</div>
                        <div><strong>Date:</strong> {{DATE}}</div>
                    </div>
                </td>
            </tr>
            <tr>
                <td class="customer-line">
                    <strong>M/S: ....................</strong>
                    <span style="margin-left: 20px;">{{CUSTOMER_NAME}}</span>
                </td>
            </tr>
        </table>

        <table class="items-table">
            <thead>
                <tr>
                    <th style="width:8%">Sr. No.</th>
                    <th style="width:44%">Description</th>
                    <th style="width:12%">Quantity</th>
                    <th style="width:18%">Rate</th>
                    <th style="width:18%">Amount</th>
                </tr>
            </thead>
            <tbody>
                {{ITEMS_TABLE}}
                <tr>
                    <td colspan="5" class="empty-space"></td>
                </tr>
            </tbody>
        </table>

        <table style="width:100%; border-collapse: collapse;">
            <tr>
                <td class="words-line" style="width:70%;">
                    <strong>Rupees (in words):</strong> {{AMOUNT_WORDS}}
                </td>
                <td style="border-bottom: 2px solid black; padding: 10px 0; width:30%;">
                    <div class="total-section">
                        <div class="total-box">
                            <span>Total Amount</span>
                            <span>₹ {{TOTAL}}</span>
                        </div>
                    </div>
                </td>
            </tr>
        </table>
    </div>
</body>
</html>`;
}

export default function Preview({ navigation }: Props) {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [businessDetails, setBusinessDetails] = useState<BusinessDetails | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [invoiceHTML, setInvoiceHTML] = useState<string>("");

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
        if (!businessDetails) return;

        setSelectedInvoice(invoice);
        const html = generateInvoiceHTML(invoice, businessDetails);
        setInvoiceHTML(html);
        setShowPreview(true);
    }

    function closePreview() {
        setShowPreview(false);
        setSelectedInvoice(null);
        setInvoiceHTML("");
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
        // Generate items table rows
        const itemsRows = invoice.items.map((item, index) => {
            const amount = item.ratePaise * item.quantity;
            return `
                <tr>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center; font-size: 12px;">${index + 1}</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: left; font-size: 12px;">${item.serviceName}</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center; font-size: 12px;">${item.quantity}</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center; font-size: 12px;">${(item.ratePaise / 100).toFixed(0)}</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center; font-size: 12px;">${(amount / 100).toFixed(0)}</td>
                </tr>`;
        }).join('');

        // Calculate total
        const totalAmount = (invoice.totalPaise / 100).toFixed(0);
        const amountWords = amountToWords(invoice.totalPaise / 100);

        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice ${invoice.billNo}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        @page {
            size: A4;
            margin: 10mm;
        }
        
        body {
            font-family: Arial, sans-serif;
            width: 100%;
            max-width: 190mm;
            margin: 0 auto;
            padding: 0;
            background: white;
        }
        
        .invoice-container {
            width: 100%;
            border: 2.5px solid #000;
            padding: 0;
            display: flex;
            flex-direction: column;
            min-height: 277mm;
        }
        
        /* Header Section */
        .header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding: 10px 12px 8px 12px;
            position: relative;
        }
        
        .phone-numbers {
            text-align: right;
            font-size: 10px;
            line-height: 1.4;
            margin-bottom: 3px;
            font-weight: normal;
        }
        
        .business-name {
            font-size: 28px;
            font-weight: bold;
            letter-spacing: 0.3px;
            margin-bottom: 6px;
            font-family: 'Times New Roman', serif;
            line-height: 1.1;
        }
        
        .address {
            font-size: 11px;
            margin-bottom: 3px;
            font-weight: normal;
            line-height: 1.3;
        }
        
        .email {
            font-size: 11px;
            color: #0066cc;
            text-decoration: underline;
            font-weight: normal;
        }
        
        /* Bill Info Section */
        .bill-info {
            display: flex;
            justify-content: space-between;
            padding: 7px 12px;
            border-bottom: 2px solid #000;
            font-size: 12px;
        }
        
        .bill-info strong {
            font-weight: bold;
        }
        
        /* Customer Section */
        .customer-section {
            padding: 8px 12px;
            border-bottom: 2px solid #000;
            font-size: 12px;
        }
        
        .customer-section strong {
            font-weight: bold;
        }
        
        .customer-name {
            margin-left: 15px;
        }
        
        /* Table Section */
        .table-container {
            flex: 1;
            display: flex;
            flex-direction: column;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
        }
        
        .items-table {
            flex: 1;
            display: flex;
            flex-direction: column;
        }
        
        .items-table thead {
            display: table;
            width: 100%;
            table-layout: fixed;
        }
        
        .items-table tbody {
            display: table;
            width: 100%;
            table-layout: fixed;
        }
        
        .items-table th {
            border: 1px solid #000;
            padding: 7px 8px;
            text-align: center;
            font-size: 12px;
            font-weight: bold;
            background: white;
        }
        
        .items-table td {
            border: 1px solid #000;
            padding: 6px 8px;
            font-size: 12px;
        }
        
        /* Empty space row */
        .spacer-row td {
            height: 450px !important;
            padding: 0 !important;
            vertical-align: top;
        }
        
        /* Bottom Section */
        .bottom-section {
            border-top: 1px solid #000;
            display: flex;
            height: 45px;
        }
        
        .words-section {
            flex: 1;
            padding: 8px 12px;
            border-right: 1px solid #000;
            font-size: 11px;
            display: flex;
            align-items: center;
        }
        
        .words-section strong {
            font-weight: bold;
            margin-right: 5px;
        }
        
        .total-section {
            width: 200px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 8px 12px;
            font-size: 13px;
        }
        
        .total-section strong {
            font-weight: bold;
        }
        
        .total-amount {
            font-weight: bold;
            font-size: 14px;
        }
        
        @media print {
            body {
                margin: 0;
                padding: 0;
                max-width: 100%;
            }
            
            .invoice-container {
                page-break-inside: avoid;
                border: 2.5px solid #000;
            }
            
            @page {
                margin: 10mm;
            }
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <!-- Header -->
        <div class="header">
            <div class="phone-numbers">
                ${business.phone.replace(/\n/g, '<br>')}
            </div>
            <div class="business-name">${business.businessName}</div>
            <div class="address">${business.address}</div>
            <div class="email">${business.email}</div>
        </div>
        
        <!-- Bill Info -->
        <div class="bill-info">
            <div><strong>Bill no.:</strong> ${invoice.billNo}</div>
            <div><strong>Date:</strong> ${invoice.date}</div>
        </div>
        
        <!-- Customer -->
        <div class="customer-section">
            <strong>M/S:</strong>
            <span class="customer-name">${invoice.customerName}</span>
        </div>
        
        <!-- Items Table -->
        <div class="table-container">
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
                    ${itemsRows}
                    <tr class="spacer-row">
                        <td colspan="5" style="border: 1px solid #000;"></td>
                    </tr>
                </tbody>
            </table>
        </div>
        
        <!-- Bottom Section -->
        <div class="bottom-section">
            <div class="words-section">
                <strong>Rupees (in words):</strong> <span>${amountWords}</span>
            </div>
            <div class="total-section">
                <strong>Total Amount</strong>
                <span class="total-amount">₹${totalAmount}</span>
            </div>
        </div>
    </div>
</body>
</html>`;
    }

    async function generatePDF() {
        if (!selectedInvoice || !businessDetails) {
            Alert.alert("Error", "Invoice data not available");
            return;
        }

        setIsGeneratingPDF(true);
        try {
            const html = generateInvoiceHTML(selectedInvoice, businessDetails);

            // WEB-SPECIFIC: If running on web, use browser print
            if (Platform.OS === 'web') {
                const printWindow = window.open('', '_blank');
                if (printWindow) {
                    printWindow.document.write(html);
                    printWindow.document.close();
                    printWindow.onload = () => {
                        printWindow.print();
                    };
                } else {
                    Alert.alert("Error", "Please allow pop-ups for this site to generate PDFs");
                }
            } else {
                // MOBILE: Use expo-print
                const { uri } = await Print.printToFileAsync({
                    html,
                    base64: false,
                });

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
            console.error('PDF generation error:', error);
            Alert.alert("Error", "Failed to generate PDF. Please try again.");
        } finally {
            setIsGeneratingPDF(false);
        }
    }

    // Preview mode - Now using WebView to show HTML
    if (showPreview && selectedInvoice && businessDetails && invoiceHTML) {
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

                <WebView
                    style={styles.webview}
                    source={{ html: invoiceHTML }}
                    originWhitelist={['*']}
                    scalesPageToFit={true}
                    showsVerticalScrollIndicator={true}
                />
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
    webview: { flex: 1, backgroundColor: "#f9fafb" },
});