'use client'

import { useTranslation } from './TranslationProvider'

export default function LanguageSwitcher() {
  const { locale, setLocale, t, availableLocales } = useTranslation()
  const optionLabels = {
    en: t('language.options.en'),
    pt: t('language.options.pt')
  }

  return (
    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
      <span>{t('language.label')}:</span>
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value)}
        className="border border-gray-300 rounded px-2 py-1 bg-white text-gray-800"
      >
        {availableLocales.map((code) => (
          <option key={code} value={code}>
            {optionLabels[code] || code.toUpperCase()}
          </option>
        ))}
      </select>
    </label>
  )
}
