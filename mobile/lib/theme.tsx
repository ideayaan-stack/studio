import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'nativewind';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: 'system',
    setTheme: () => { },
    isDark: false,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const { colorScheme, setColorScheme } = useColorScheme();
    const [theme, setThemeState] = useState<Theme>('system');

    useEffect(() => {
        // Load saved theme
        AsyncStorage.getItem('user-theme').then((savedTheme) => {
            if (savedTheme) {
                setThemeState(savedTheme as Theme);
                setColorScheme(savedTheme as Theme);
            }
        });
        // Force light mode for now per user request
        setColorScheme('light');
    }, []);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        setColorScheme(newTheme);
        AsyncStorage.setItem('user-theme', newTheme);
    };

    const isDark = false; // Forced light mode

    return (
        <ThemeContext.Provider value={{ theme, setTheme, isDark }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);
