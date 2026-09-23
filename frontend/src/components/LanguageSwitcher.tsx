"use client";
import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="flex gap-2 items-center">
      <button
        onClick={() => changeLanguage('mk')}
        className={`px-3 py-1 rounded border-2 text-sm font-semibold transition-all duration-150 ${i18n.language === 'mk' ? 'border-primary text-primary bg-accent' : 'border-border text-muted-foreground bg-card hover:border-primary hover:text-primary'}`}
        aria-label="Macedonian"
      >
        MK
      </button>
      <button
        onClick={() => changeLanguage('en')}
        className={`px-3 py-1 rounded border-2 text-sm font-semibold transition-all duration-150 ${i18n.language === 'en' ? 'border-primary text-primary bg-accent' : 'border-border text-muted-foreground bg-card hover:border-primary hover:text-primary'}`}
        aria-label="English"
      >
        EN
      </button>
    </div>
  );
}
