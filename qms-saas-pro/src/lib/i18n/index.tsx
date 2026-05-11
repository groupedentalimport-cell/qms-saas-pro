
import React, { createContext, useContext, useState, useMemo } from 'react';
import type { Locale, TranslationStrings } from './types';
import { en } from './en';
import { fr } from './fr';

const translations: Record<Locale, TranslationStrings> = { en, fr };

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TranslationStrings;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

// Default locale detection — French by default since the app is primarily French
function getDefaultLocale(): Locale {
  if (typeof navigator !== 'undefined') {
    const lang = navigator.language.split('-')[0];
    if (lang === 'en') return 'en';
  }
  return 'fr';
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>(getDefaultLocale());

  const t = useMemo(() => translations[locale], [locale]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

export function useTranslation() {
  const { t } = useI18n();
  return t;
}
