import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import en from '@/translations/en.json';
import vi from '@/translations/vi.json';

export type Language = 'en' | 'vi';
type TranslationsType = typeof en;

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const translations: Record<Language, TranslationsType> = { en, vi };

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<Language>(() => {
        // Check localStorage on initial load
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('app-language');
            if (saved === 'en' || saved === 'vi') {
                return saved;
            }
        }
        return 'en';
    });

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('app-language', lang);
    };

    // Also sync to localStorage on mount if needed
    useEffect(() => {
        const saved = localStorage.getItem('app-language');
        if (!saved) {
            localStorage.setItem('app-language', language);
        }
    }, []);

    /**
     * Translation function - retrieves nested translation by dot notation key
     * Example: t('nav.dashboard') returns the dashboard navigation label
     */
    const t = (key: string): string => {
        const keys = key.split('.');
        let value: unknown = translations[language];

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = (value as Record<string, unknown>)[k];
            } else {
                // Return key as fallback if translation not found
                console.warn(`Translation missing for key: ${key}`);
                return key;
            }
        }

        return typeof value === 'string' ? value : key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

/**
 * Hook to access language context
 * @returns {LanguageContextType} Object with language, setLanguage, and t function
 */
export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
