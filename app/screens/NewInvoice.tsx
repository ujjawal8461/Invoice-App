// app/screens/NewInvoice.tsx
import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    ScrollView,
    Pressable,
    SafeAreaView,
    Platform,
    Modal,
    FlatList,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Props = NativeStackScreenProps<RootStackParamList, "NewInvoice">;

type Service = {
    id: string;
    name: string;
    ratePaise: number;
};

type InvoiceItem = {
    id: string;
    serviceId: string;
    serviceName: string;
    ratePaise: number;
    quantity: number;
};

type Invoice = {
    id: string;
    billNo: string;
    date: string;
    customerName: string;
    items: InvoiceItem[];
    totalPaise: number;
    createdAt: number;
};

const STORAGE_KEY = "services_v1";
const INVOICES_KEY = "invoices_v1";

async function loadServices(): Promise<Service[]> {
    try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        return JSON.parse(raw) as Service[];
    } catch (e) {
        console.warn("loadServices error:", e);
        return [];
    }
}

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

async function saveInvoice(invoice: Invoice): Promise<void> {
    try {
        const invoices = await loadInvoices();
        invoices.push(invoice);
        await AsyncStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
    } catch (e) {
        console.warn("saveInvoice error:", e);
        throw e;
    }
}

export default function NewInvoice({ navigation }: Props) {
    const [customerName, setCustomerName] = useState("");
    const [billNo, setBillNo] = useState("");
    const [date, setDate] = useState("");
    const [items, setItems] = useState<InvoiceItem[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [modalVisible, setModalVisible] = useState(false);

    useEffect(() => {
        // Set today's date
        const today = new Date();
        const formatted = `${today.getDate().toString().padStart(2, "0")}/${(today.getMonth() + 1)
            .toString()
            .padStart(2, "0")}/${today.getFullYear()}`;
        setDate(formatted);

        // Generate bill number
        const billNumber = `INV${Date.now().toString().slice(-6)}`;
        setBillNo(billNumber);

        // Load services
        (async () => {
            const loaded = await loadServices();
            setServices(loaded);
        })();
    }, []);

    function openServicePicker() {
        if (services.length === 0) {
            alert("No services available. Please add services first.");
            return;
        }
        setModalVisible(true);
    }

    function addService(service: Service) {
        const newItem: InvoiceItem = {
            id: String(Date.now()),
            serviceId: service.id,
            serviceName: service.name,
            ratePaise: service.ratePaise,
            quantity: 1,
        };
        setItems((prev) => [...prev, newItem]);
        setModalVisible(false);
    }

    function updateQuantity(id: string, qty: string) {
        const num = parseInt(qty || "0");
        if (num < 0) return;
        setItems((prev) => prev.map((item) => (item.id === id ? { ...item, quantity: num } : item)));
    }

    function removeItem(id: string) {
        setItems((prev) => prev.filter((item) => item.id !== id));
    }

    function calculateTotal() {
        return items.reduce((sum, item) => sum + item.ratePaise * item.quantity, 0);
    }

    async function handlePreview() {
        if (!customerName.trim()) {
            alert("Please enter customer name");
            return;
        }
        if (items.length === 0) {
            alert("Please add at least one service");
            return;
        }

        const invoice: Invoice = {
            id: String(Date.now()),
            billNo: billNo,
            date: date,
            customerName: customerName.trim(),
            items: items,
            totalPaise: calculateTotal(),
            createdAt: Date.now(),
        };

        try {
            await saveInvoice(invoice);
            // Reset form
            setCustomerName("");
            setItems([]);
            const newBillNumber = `INV${Date.now().toString().slice(-6)}`;
            setBillNo(newBillNumber);

            // Navigate to preview
            navigation.navigate("Preview");
        } catch (e) {
            alert("Error saving invoice. Please try again.");
            console.error("Save error:", e);
        }
    }

    const renderServiceItem = ({ item }: { item: Service }) => {
        return (
            <Pressable style={styles.serviceItem} onPress={() => addService(item)}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.serviceName}>{item.name}</Text>
                    <Text style={styles.serviceRate}>₹{(item.ratePaise / 100).toFixed(2)}</Text>
                </View>
                <Text style={styles.addIcon}>+</Text>
            </Pressable>
        );
    };

    const renderInvoiceItem = ({ item }: { item: InvoiceItem }) => {
        const total = item.ratePaise * item.quantity;
        return (
            <View style={styles.invoiceItem}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{item.serviceName}</Text>
                    <Text style={styles.itemRate}>₹{(item.ratePaise / 100).toFixed(2)} each</Text>
                </View>
                <View style={styles.qtyBox}>
                    <Text style={styles.qtyLabel}>Qty:</Text>
                    <TextInput
                        style={styles.qtyInput}
                        value={String(item.quantity)}
                        onChangeText={(txt) => updateQuantity(item.id, txt)}
                        keyboardType="numeric"
                    />
                </View>
                <View style={styles.totalBox}>
                    <Text style={styles.itemTotal}>₹{(total / 100).toFixed(2)}</Text>
                </View>
                <Pressable style={styles.deleteBtn} onPress={() => removeItem(item.id)}>
                    <Text style={styles.deleteText}>×</Text>
                </Pressable>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Invoice Details</Text>

                    <Text style={styles.label}>Bill No.</Text>
                    <TextInput
                        style={styles.input}
                        value={billNo}
                        onChangeText={setBillNo}
                        placeholder="INV001"
                        placeholderTextColor="#999"
                    />

                    <Text style={styles.label}>Date</Text>
                    <TextInput
                        style={styles.input}
                        value={date}
                        onChangeText={setDate}
                        placeholder="DD/MM/YYYY"
                        placeholderTextColor="#999"
                    />

                    <Text style={styles.label}>Customer Name</Text>
                    <TextInput
                        style={styles.input}
                        value={customerName}
                        onChangeText={setCustomerName}
                        placeholder="Enter customer name"
                        placeholderTextColor="#999"
                    />
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Items</Text>
                        <Pressable style={styles.addServiceBtn} onPress={openServicePicker}>
                            <Text style={styles.addServiceText}>+ Add Service</Text>
                        </Pressable>
                    </View>

                    {items.length === 0 ? (
                        <View style={styles.emptyBox}>
                            <Text style={styles.emptyText}>No items added yet</Text>
                            <Text style={styles.emptyHint}>Tap "+ Add Service" to begin</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={items}
                            keyExtractor={(item) => item.id}
                            renderItem={renderInvoiceItem}
                            scrollEnabled={false}
                        />
                    )}
                </View>

                {items.length > 0 && (
                    <View style={styles.totalSection}>
                        <Text style={styles.totalLabel}>Total Amount</Text>
                        <Text style={styles.totalAmount}>₹{(calculateTotal() / 100).toFixed(2)}</Text>
                    </View>
                )}

                <Pressable style={styles.previewBtn} onPress={handlePreview}>
                    <Text style={styles.previewBtnText}>Save & Preview Invoice</Text>
                </Pressable>
            </ScrollView>

            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalWrap}>
                    <View style={styles.modal}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Service</Text>
                            <Pressable onPress={() => setModalVisible(false)}>
                                <Text style={styles.closeBtn}>×</Text>
                            </Pressable>
                        </View>

                        <FlatList
                            data={services}
                            keyExtractor={(s) => s.id}
                            renderItem={renderServiceItem}
                            ListEmptyComponent={
                                <Text style={styles.emptyModal}>No services available</Text>
                            }
                        />
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#f8fafc" },
    container: { padding: 16, paddingBottom: 32 },
    section: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 8,
        elevation: 2,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
    },
    sectionTitle: { fontSize: 18, fontWeight: "800", color: "#111827", marginBottom: 12 },
    label: { fontSize: 14, fontWeight: "600", color: "#374151", marginTop: 12, marginBottom: 6 },
    input: {
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: "#111",
        backgroundColor: "#fff",
    },
    addServiceBtn: {
        backgroundColor: "#0b74ff",
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    addServiceText: { color: "#fff", fontWeight: "700", fontSize: 14 },
    emptyBox: {
        alignItems: "center",
        paddingVertical: 32,
    },
    emptyText: { fontSize: 16, color: "#6b7280", fontWeight: "600" },
    emptyHint: { fontSize: 13, color: "#9ca3af", marginTop: 4 },
    invoiceItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#f3f4f6",
    },
    itemName: { fontSize: 15, fontWeight: "700", color: "#111827" },
    itemRate: { fontSize: 12, color: "#6b7280", marginTop: 2 },
    qtyBox: { flexDirection: "row", alignItems: "center", marginLeft: 8 },
    qtyLabel: { fontSize: 13, color: "#6b7280", marginRight: 4 },
    qtyInput: {
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 6,
        width: 50,
        padding: 6,
        textAlign: "center",
        fontSize: 14,
        color: "#111",
    },
    totalBox: { marginLeft: 8, minWidth: 70, alignItems: "flex-end" },
    itemTotal: { fontSize: 15, fontWeight: "700", color: "#111827" },
    deleteBtn: {
        marginLeft: 8,
        width: 28,
        height: 28,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fee",
        borderRadius: 14,
    },
    deleteText: { fontSize: 22, color: "#dc2626", fontWeight: "700" },
    totalSection: {
        backgroundColor: "#0b74ff",
        borderRadius: 12,
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 16,
    },
    totalLabel: { fontSize: 16, fontWeight: "700", color: "#fff" },
    totalAmount: { fontSize: 24, fontWeight: "800", color: "#fff" },
    previewBtn: {
        backgroundColor: "#10b981",
        padding: 16,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 8,
    },
    previewBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
    modalWrap: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "flex-end",
    },
    modal: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: "70%",
        paddingBottom: Platform.OS === "ios" ? 34 : 16,
    },
    modalHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#f3f4f6",
    },
    modalTitle: { fontSize: 18, fontWeight: "800", color: "#111827" },
    closeBtn: { fontSize: 32, color: "#6b7280", fontWeight: "300" },
    serviceItem: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#f3f4f6",
    },
    serviceName: { fontSize: 16, fontWeight: "700", color: "#111827" },
    serviceRate: { fontSize: 13, color: "#6b7280", marginTop: 2 },
    addIcon: { fontSize: 28, color: "#0b74ff", fontWeight: "600" },
    emptyModal: { textAlign: "center", color: "#6b7280", padding: 32 },
});