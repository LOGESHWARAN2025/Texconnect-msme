
import { useContext } from 'react';
import { LocalizationContext } from '../context/LocalizationContext';
import { translations } from '../constants';
import type { Language } from '../types';

const localeMap: Record<Language, string> = {
  en: 'en-IN',
  ta: 'ta-IN',
};

const dateOptions: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
};

const dateTimeOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
};

export const useLocalization = () => {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error('useLocalization must be used within a LocalizationProvider');
  }

  const { language, setLanguage } = context;

  const t = (key: string): string => {
    return translations[language][key] || key;
  };
  
  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ta' : 'en');
  }

  const formatDate = (dateString: string | Date): string => {
    try {
      const date = new Date(dateString);
      const locale = localeMap[language];
      return new Intl.DateTimeFormat(locale, dateOptions).format(date);
    } catch (error) {
      console.error('Invalid date string for formatting. Error:', (error as Error).message);
      return typeof dateString === 'string' ? dateString : '';
    }
  };

  const formatDateTime = (dateString: string | Date): string => {
    try {
        const date = new Date(dateString);
        const locale = localeMap[language];
        return new Intl.DateTimeFormat(locale, dateTimeOptions).format(date);
    } catch (error) {
        console.error(`Invalid date string for formatting: '${dateString}'. Error: ${(error as Error).message}`);
        return typeof dateString === 'string' ? dateString : '';
    }
  };

  return { language, setLanguage: toggleLanguage, t, currentLanguage: language, formatDate, formatDateTime };
};
