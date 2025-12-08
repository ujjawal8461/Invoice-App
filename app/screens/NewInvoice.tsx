// app/screens/Home.tsx  (change filename/title for other screens)
import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'NewInvoice'>;

export default function NewInvoice({ navigation }: Props) {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>New Invocie</Text>
            <Button title="Create New Invoice" onPress={() => navigation.navigate('NewInvoice')} />
            <Button title="Services" onPress={() => navigation.navigate('Services')} />
            <Button title="Settings" onPress={() => navigation.navigate('Settings')} />
            <Button title="Preview (debug)" onPress={() => navigation.navigate('Preview')} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
    title: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
});
