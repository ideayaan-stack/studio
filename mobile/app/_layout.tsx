import "../global.css";
import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider, useTheme } from "../lib/theme";

function AppContent() {
    const { isDark } = useTheme();
    return (
        <SafeAreaProvider>
            <Slot />
            <StatusBar style={isDark ? "light" : "dark"} />
        </SafeAreaProvider>
    );
}

export default function Layout() {
    return (
        <ThemeProvider>
            <AppContent />
        </ThemeProvider>
    );
}
