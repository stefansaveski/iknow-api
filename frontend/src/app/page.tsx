"use client"

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, 
  faLock, 
  faEye, 
  faEyeSlash,
  faSignInAlt,
  faGraduationCap
} from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import { login } from '@/lib/auth';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function LoginPage() {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const session = await login({ email: formData.email, password: formData.password });
      // Admins previously fell through to /students, where they have no
      // enrolments and every page renders empty.
      const home =
        session.role === 'Professor' ? '/professor'
        : session.role === 'Admin'   ? '/admin'
        : '/students';
      window.location.href = home;
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4">
      <div className="min-h-screen ">
        {/* Login Form */}
        <div className="flex items-center justify-center min-h-[calc(100vh-160px)] p-4">
          <div className="w-full max-w-5xl">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[24rem_28rem_24rem] lg:items-start lg:justify-center">
              {/* Sticky Notes */}
              <div className="w-full flex flex-col gap-4">
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl shadow-sm p-5">
                  <div className="text-sm font-bold text-card-foreground mb-2">{t('login_student_title')}</div>
                  <div className="text-xs text-card-foreground whitespace-pre-wrap">
                    {t('login_student_example')}
                  </div>
                  <div className="mt-3 text-xs text-blue-600 font-medium">
                    {t('login_demo_note')}
                  </div>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl shadow-sm p-5">
                  <div className="text-sm font-bold text-card-foreground mb-2">{t('login_professor_title')}</div>
                  <div className="text-xs text-card-foreground whitespace-pre-wrap">
                    {t('login_professor_example')}
                  </div>
                  <div className="mt-3 text-xs text-blue-600 font-medium">
                    {t('login_demo_note')}
                  </div>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl shadow-sm p-5">
                  <div className="text-sm font-bold text-card-foreground mb-2">{t('login_admin_title')}</div>
                  <div className="text-xs text-card-foreground whitespace-pre-wrap">
                    {t('login_admin_example')}
                  </div>
                  <div className="mt-3 text-xs text-blue-600 font-medium">
                    {t('login_demo_note')}
                  </div>
                </div>
              </div>

              {/* Login Card Column */}
              <div className="w-full max-w-md lg:max-w-none lg:w-[28rem] mx-auto">
                {/* Login Card */}
                <div className="bg-card rounded-2xl shadow-xl border border-border overflow-hidden">
                {/* Header */}
                <div className="bg-primary text-white px-8 py-6 text-center">
              <div className="mb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-lg">
                  <FontAwesomeIcon icon={faUser} className="text-2xl text-[#0272D1]" />
                </div>
              </div>
              <h1 className="text-2xl font-bold mb-2">{t('login_welcome')}</h1>
              <p className="text-blue-100 text-sm">
                {t('login_subtitle')}
              </p>
            </div>

            {/* Form */}
            <div className="p-8">
              {/* Language Switcher above email field, centered */}
              <div className="flex justify-center mb-6">
                <LanguageSwitcher />
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-muted-foreground mb-2">
                    {t('login_email_label')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FontAwesomeIcon icon={faUser} className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                      placeholder={t('login_email_placeholder')}
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-muted-foreground mb-2">
                    {t('login_password_label')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FontAwesomeIcon icon={faLock} className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-12 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                      placeholder={t('login_password_placeholder')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <FontAwesomeIcon 
                        icon={showPassword ? faEyeSlash : faEye} 
                        className="h-4 w-4" 
                      />
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember"
                      name="remember"
                      type="checkbox"
                      className="h-4 w-4 text-primary focus:ring-primary border-input rounded"
                    />
                    <label htmlFor="remember" className="ml-2 block text-sm text-muted-foreground">
                      {t('login_remember_me')}
                    </label>
                  </div>
                  <button
                    type="button"
                    className="text-sm text-primary hover:text-blue-700 font-medium transition-colors"
                  >
                    {t('login_forgot_password')}
                  </button>
                </div>

                {errorMessage && (
                  <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {t(errorMessage) || errorMessage}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary hover:bg-blue-700 disabled:opacity-60 disabled:hover:bg-primary text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  <FontAwesomeIcon icon={faSignInAlt} className="h-4 w-4" />
                  {isSubmitting ? t('login_button_loading') : t('login_button')}
                </button>
              </form>
            </div>

            {/* Footer */}
            <div className="bg-accent px-8 py-4 border-t border-border">
              <p className="text-center text-sm text-muted-foreground">
                {t('login_no_account')}{' '}
                <button className="text-primary hover:text-blue-700 font-medium transition-colors">
                  {t('login_contact_admin')}
                </button>
              </p>
            </div>
                </div>

                {/* Additional Info */}
                <div className="mt-6 text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-card bg-opacity-80 rounded-lg shadow-sm">
                    <FontAwesomeIcon icon={faGraduationCap} className="text-primary" />
                    <span className="text-sm text-muted-foreground">
                      {t('login_footer')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right spacer column (keeps login centered) */}
              <div className="hidden lg:block" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}