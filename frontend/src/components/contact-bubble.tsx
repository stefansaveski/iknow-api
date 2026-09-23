"use client"

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faTimes, faPaperPlane, faSpinner } from '@fortawesome/free-solid-svg-icons';

export default function ContactBubble() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    // Simulate sending
    await new Promise((r) => setTimeout(r, 1200));
    setIsSending(false);
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setIsOpen(false);
      setForm({ name: '', email: '', subject: '', message: '' });
    }, 2500);
  };

  return (
    <>
      {/* Floating bubble */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-primary hover:bg-blue-700 text-white px-5 py-3 rounded-full shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
        aria-label={t('contact_us', 'Контактирај нè')}
      >
        <FontAwesomeIcon icon={faEnvelope} className="w-5 h-5" />
        <span className="font-medium text-sm">{t('contact_us', 'Контактирај нè')}</span>
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Modal */}
      <div
        className={`fixed z-50 bottom-6 right-6 w-[380px] max-w-[calc(100vw-2rem)] bg-card border border-border rounded-2xl shadow-2xl transition-all duration-300 origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}
      >
        {/* Modal header */}
        <div className="bg-primary text-white rounded-t-2xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FontAwesomeIcon icon={faEnvelope} className="w-5 h-5" />
            <h2 className="text-lg font-bold">{t('contact_us', 'Контактирај нè')}</h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white/80 hover:text-white transition-colors p-1"
            aria-label={t('close', 'Затвори')}
          >
            <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
          </button>
        </div>

        {/* Modal body */}
        <div className="p-6">
          {sent ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <FontAwesomeIcon icon={faPaperPlane} className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-card-foreground mb-1">
                {t('contact_sent_title', 'Пораката е испратена!')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t('contact_sent_desc', 'Ќе ви одговориме наскоро.')}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  {t('contact_name', 'Име и презиме')}
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={form.name}
                  onChange={handleChange}
                  placeholder={t('contact_name_placeholder', 'Вашето име')}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-card text-card-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  {t('contact_email', 'Е-пошта')}
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder={t('contact_email_placeholder', 'example@email.com')}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-card text-card-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  {t('contact_subject', 'Наслов')}
                </label>
                <input
                  type="text"
                  name="subject"
                  required
                  value={form.subject}
                  onChange={handleChange}
                  placeholder={t('contact_subject_placeholder', 'Тема на пораката')}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-card text-card-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  {t('contact_message', 'Порака')}
                </label>
                <textarea
                  name="message"
                  required
                  rows={3}
                  value={form.message}
                  onChange={handleChange}
                  placeholder={t('contact_message_placeholder', 'Напишете ја вашата порака...')}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-card text-card-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSending}
                className="w-full bg-primary hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSending ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin" />
                    {t('contact_sending', 'Испраќа...')}
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faPaperPlane} className="w-4 h-4" />
                    {t('contact_send', 'Испрати')}
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
