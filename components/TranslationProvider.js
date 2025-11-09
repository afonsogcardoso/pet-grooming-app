'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import en from '@/locales/en.json'
import pt from '@/locales/pt.json'

const translations = { en, pt }
const localeMap = { en: 'en-US', pt: 'pt-PT' }

const TranslationContext = createContext(null)

const LOCAL_STORAGE_KEY = 'pet-grooming-locale'

function getValueFromObject(obj, path) {
  return path.reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj)
}

function formatTemplate(template, variables = {}) {
  if (typeof template !== 'string') return template
  return template.replace(/{{(.*?)}}/g, (_, token) => {
    const trimmed = token.trim()
    return variables[trimmed] !== undefined ? variables[trimmed] : ''
  })
}

export function TranslationProvider({ children }) {
  const [locale, setLocale] = useState('pt')

  useEffect(() => {
    const stored =
      typeof window !== 'undefined' ? window.localStorage.getItem(LOCAL_STORAGE_KEY) : null
    if (stored && translations[stored]) {
      setLocale(stored)
    }
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LOCAL_STORAGE_KEY, locale)
    }
  }, [locale])

  const t = (key, variables = {}) => {
    const path = key.split('.')
    const localeValue = getValueFromObject(translations[locale], path)
    const fallbackValue = getValueFromObject(translations.en, path)
    const value = localeValue ?? fallbackValue ?? key
    return typeof value === 'string' ? formatTemplate(value, variables) : value
  }

  const value = useMemo(
    () => ({
      locale,
      resolvedLocale: localeMap[locale] || 'en-US',
      setLocale,
      t,
      availableLocales: Object.keys(translations)
    }),
    [locale]
  )

  return <TranslationContext.Provider value={value}>{children}</TranslationContext.Provider>
}

export function useTranslation() {
  const context = useContext(TranslationContext)
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider')
  }
  return context
}
