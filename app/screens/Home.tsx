import React from "react";
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    SafeAreaView,
    StatusBar,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

const HomeButton = ({
    title,
    subtitle,
    onPress,
}: {
    title: string;
    subtitle?: string;
    onPress: () => void;
}) => {
    return (
        <Pressable style={styles.card} onPress={onPress}>
            <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{title}</Text>
                {subtitle ? <Text style={styles.cardSubtitle}>{subtitle}</Text> : null}
            </View>
            <Text style={styles.chev}>{">"}</Text>
        </Pressable>
    );
};

export default function Home({ navigation }: Props) {
    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar barStyle="dark-content" />
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.appTitle}>Invoice App</Text>
                <Text style={styles.appDesc}>Fast invoices on your phone — no laptop needed.</Text>

                <View style={{ height: 18 }} />

                <HomeButton
                    title="+ Create New Invoice"
                    subtitle="Add items, preview and export PDF"
                    onPress={() => navigation.navigate("NewInvoice")}
                />

                <HomeButton
                    title="🛠 Services"
                    subtitle="Manage service names & prices"
                    onPress={() => navigation.navigate("Services")}
                />

                <HomeButton
                    title="📄 Recent Invoices"
                    subtitle="View or resend previous invoices"
                    onPress={() => navigation.navigate("Preview")}
                />

                <HomeButton
                    title="⚙️ Settings"
                    subtitle="Your business details & defaults"
                    onPress={() => navigation.navigate("Settings")}
                />

                <View style={{ height: 28 }} />

                <Text style={styles.footer}>
                    Tip: Press <Text style={{ fontWeight: "700" }}>Create New Invoice</Text> to start.
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#f3f4f6" },
    container: {
        padding: 16,
        alignItems: "stretch",
    },
    appTitle: {
        fontSize: 28,
        fontWeight: "800",
        color: "#111827",
        marginTop: 8,
    },
    appDesc: {
        fontSize: 14,
        color: "#6b7280",
        marginTop: 6,
    },
    card: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#ffffff",
        padding: 14,
        borderRadius: 12,
        marginTop: 12,
        // shadow (iOS)
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowOffset: { width: 0, height: 6 },
        shadowRadius: 12,
        // elevation (Android)
        elevation: 3,
    },
    cardTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
    cardSubtitle: { fontSize: 12, color: "#6b7280", marginTop: 4 },
    chev: { fontSize: 20, color: "#9ca3af", marginLeft: 8 },
    footer: { color: "#6b7280", textAlign: "center", marginTop: 6, fontSize: 13 },
});
