'use client'

import { createContext, useContext, ReactNode } from 'react';

interface LocaleContextType {
  locale: string;
  messages: any;
  t: (key: string, namespace?: string) => string;
}

const LocaleContext = createContext<LocaleContextType | null>(null);

export function LocaleProvider({ 
  children, 
  locale, 
  messages 
}: { 
  children: ReactNode;
  locale: string;
  messages: any;
}) {
  const t = (key: string, namespace: string = 'home') => {
    const keys = key.split('.');
    let value = messages[namespace];
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key; // 返回原始key如果找不到翻译
      }
    }
    
    return typeof value === 'string' ? value : key;
  };

  return (
    <LocaleContext.Provider value={{ locale, messages, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context.locale;
}

export function useTranslations(namespace: string = 'home') {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useTranslations must be used within a LocaleProvider');
  }
  
  return (key: string) => context.t(key, namespace);
}
