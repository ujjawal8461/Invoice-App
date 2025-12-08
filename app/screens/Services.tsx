// app/screens/Services.tsx
import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Pressable,
    Modal,
    TextInput,
    SafeAreaView,
    Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Simple Service type (no tax)
 */
export type Service = {
    id: string;
    name: string;
    ratePaise: number; // stored as paise (integer)
};

const STORAGE_KEY = "services_v1";

/**
 * Helper wrappers (small and local to this file for clarity)
 */
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
async function saveServices(list: Service[]) {
    try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
        console.warn("saveServices error:", e);
    }
}

export default function ServicesScreen() {
    const [services, setServices] = useState<Service[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [editing, setEditing] = useState<Service | null>(null);
    const [name, setName] = useState("");
    const [rate, setRate] = useState(""); // rupees string

    // load once
    useEffect(() => {
        (async () => {
            const loaded = await loadServices();
            setServices(loaded);
        })();
    }, []);

    // persist when services change
    useEffect(() => {
        (async () => {
            await saveServices(services);
        })();
    }, [services]);

    function openAdd() {
        setEditing(null);
        setName("");
        setRate("");
        setModalVisible(true);
    }

    function openEdit(s: Service) {
        setEditing(s);
        setName(s.name);
        setRate((s.ratePaise / 100).toFixed(2));
        setModalVisible(true);
    }

    function saveCurrent() {
        if (!name.trim()) {
            // simple inline validation
            alert("Please provide a service name.");
            return;
        }
        const rateNum = Math.round(parseFloat(rate || "0") * 100); // paise integer

        if (editing) {
            setServices(prev =>
                prev.map(p => (p.id === editing.id ? { ...p, name: name.trim(), ratePaise: rateNum } : p))
            );
        } else {
            const newItem: Service = {
                id: String(Date.now()),
                name: name.trim(),
                ratePaise: rateNum,
            };
            setServices(prev => [newItem, ...prev]);
        }

        setModalVisible(false);
    }

    // --------- FIXED DELETE: direct state update inline ----------
    function handleDelete(id: string) {
        console.log("Deleting id:", id);
        setServices(prev => {
            const updated = prev.filter(x => x.id !== id);
            console.log("After delete, count:", updated.length);
            // persist immediately (optional redundancy)
            saveServices(updated).catch(err => console.warn("save after delete failed", err));
            return updated;
        });
    }
    // ------------------------------------------------------------

    const renderItem = ({ item }: { item: Service }) => {
        return (
            <View style={styles.row}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.meta}>₹{(item.ratePaise / 100).toFixed(2)}</Text>
                </View>

                <Pressable style={styles.smallBtn} onPress={() => openEdit(item)}>
                    <Text style={styles.smallBtnText}>Edit</Text>
                </Pressable>

                <Pressable
                    style={[styles.smallBtn, { marginLeft: 8 }]}
                    onPress={() => {
                        // direct delete without Alert for reliability
                        handleDelete(item.id);
                    }}
                >
                    <Text style={[styles.smallBtnText, { color: "crimson" }]}>Delete</Text>
                </Pressable>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.headerRow}>
                <Text style={styles.title}>Services</Text>
                <Pressable style={styles.addBtn} onPress={openAdd}>
                    <Text style={styles.addBtnText}>+ Add</Text>
                </Pressable>
            </View>

            <FlatList
                data={services}
                keyExtractor={s => s.id}
                renderItem={renderItem}
                contentContainerStyle={{ padding: 12 }}
                ListEmptyComponent={<Text style={styles.empty}>No services yet — tap + Add to create one.</Text>}
            />

            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalWrap}>
                    <View style={styles.modal}>
                        <Text style={styles.modalTitle}>{editing ? "Edit Service" : "Add Service"}</Text>

                        <Text style={styles.label}>Name</Text>
                        <TextInput
                            style={styles.input}
                            value={name}
                            onChangeText={setName}
                            placeholder="e.g. AC Repair"
                            placeholderTextColor="#999"
                        />

                        <Text style={styles.label}>Rate (₹)</Text>
                        <TextInput
                            style={styles.input}
                            value={rate}
                            onChangeText={setRate}
                            keyboardType={Platform.OS === "ios" ? "numbers-and-punctuation" : "numeric"}
                            placeholder="e.g. 499.00"
                            placeholderTextColor="#999"
                        />

                        <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 12 }}>
                            <Pressable style={styles.modalBtn} onPress={() => setModalVisible(false)}>
                                <Text style={styles.modalBtnText}>Cancel</Text>
                            </Pressable>
                            <Pressable style={[styles.modalBtn, { backgroundColor: "#0b74ff", marginLeft: 8 }]} onPress={saveCurrent}>
                                <Text style={[styles.modalBtnText, { color: "#fff" }]}>{editing ? "Save" : "Add"}</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#f8fafc" },
    headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 12 },
    title: { fontSize: 22, fontWeight: "800", color: "#111827" },
    addBtn: { backgroundColor: "#0b74ff", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
    addBtnText: { color: "#fff", fontWeight: "700" },
    row: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        padding: 12,
        borderRadius: 10,
        marginBottom: 10,
        shadowColor: "#000",
        shadowOpacity: 0.04,
        shadowOffset: { width: 0, height: 6 },
        shadowRadius: 8,
        elevation: 2,
    },
    name: { fontSize: 16, fontWeight: "700", color: "#111827" },
    meta: { color: "#6b7280", marginTop: 4 },
    smallBtn: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: "#eef2ff" },
    smallBtnText: { color: "#0b74ff", fontWeight: "700" },

    modalWrap: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "center", padding: 20 },
    modal: { backgroundColor: "#fff", borderRadius: 12, padding: 16 },
    modalTitle: { fontSize: 18, fontWeight: "800", marginBottom: 8 },
    label: { marginTop: 8, color: "#374151", fontWeight: "600" },
    input: {
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 8,
        padding: 8,
        marginTop: 6,
        backgroundColor: "#fff",
        color: "#111",
    },
    modalBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: "#f3f4f6" },
    modalBtnText: { fontWeight: "700" },

    empty: { textAlign: "center", color: "#6b7280", marginTop: 18 },
});
