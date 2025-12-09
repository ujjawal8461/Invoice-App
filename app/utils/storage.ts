import AsyncStorage from "@react-native-async-storage/async-storage";

export async function saveJSON<T>(key: string, value: T): Promise<void> {
    try {
        const s = JSON.stringify(value);
        await AsyncStorage.setItem(key, s);
    } catch (e) {
        console.warn("saveJSON error", e);
        throw e;
    }
}

export async function loadJSON<T>(key: string, fallback: T): Promise<T> {
    try {
        const s = await AsyncStorage.getItem(key);
        if (!s) return fallback;
        return JSON.parse(s) as T;
    } catch (e) {
        console.warn("loadJSON error", e);
        return fallback;
    }
}
