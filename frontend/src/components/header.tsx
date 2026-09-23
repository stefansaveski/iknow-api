"use client"

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import Image from 'next/image';

import { useEffect, useState } from 'react';
import { getAccessToken, clearAuthTokens } from '@/lib/auth';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import { apiUrl } from '@/lib/api';

const Header = () => {

  const [userName, setUserName] = useState<string>('');
  const { t } = useTranslation();

  useEffect(() => {
    async function fetchUser() {
      const token = getAccessToken();
      if (!token) return;
      try {
        const response = await fetch(apiUrl('/api/user/getUser'), {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) return;
        const data = await response.json();
        // Try both student and professor shape
        if (data?.personalInfo) {
          const p = data.personalInfo;
          setUserName([p.firstName, p.middleName, p.lastName].filter(Boolean).join(' '));
        }
      } catch {}
    }
    fetchUser();
    return () => {};
  }, []);

  const handleLogout = () => {
    clearAuthTokens();
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  return (
    <header className="bg-card shadow-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 gap-4 sm:gap-0">
          {/* Left side - Logos and University Info */}
          <div className="flex items-center gap-2 justify-center sm:justify-start">
            {/* UKIM Logo */}
            <div className="flex-shrink-0">
              <Image
                src="/ukim-logo.png"
                alt="UKIM Logo"
                width={40}
                height={40}
                className="h-10 w-auto"
              />
            </div>
            {/* FINKI Logo */}
            <div className="flex-shrink-0">
              <Image
                src="/finki-logo.png"
                alt="FINKI Logo"
                width={40}
                height={40}
                className="h-10 w-auto"
              />
            </div>
            {/* University Text */}
            <div className="hidden sm:block">
              <div className="text-card-foreground font-medium text-sm">
                {t('university')}
              </div>
              <div className="text-muted-foreground text-sm">
                {t('faculty')}
              </div>
            </div>
          </div>
          {/* Right side - User Profile */}
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 w-full sm:w-auto justify-center sm:justify-end">
            {/* Language Switcher - now left of user info */}
            <div className="sm:mr-2 w-full sm:w-auto flex justify-center sm:justify-end">
              <LanguageSwitcher />
            </div>
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-center sm:justify-end">
              {/* User Avatar */}
              <div className="hidden sm:flex items-center justify-center w-10 h-10 bg-primary text-primary-foreground rounded-full">
                <FontAwesomeIcon icon={faUser} className="text-sm" />
              </div>
              {/* User Name */}
              <div className="hidden sm:block text-card-foreground font-medium">
                {userName || '...'}
              </div>
              {/* Logout Button - more stylish and full width on mobile */}
              <button
                className="w-full sm:w-auto ml-0 sm:ml-2 px-4 py-2 border-2 border-primary text-primary bg-card rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-accent transition-all duration-200 shadow-sm"
                onClick={handleLogout}
              >
                <svg xmlns='http://www.w3.org/2000/svg' className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1' /></svg>
                {t('logout')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
