import React, { useState, type FormEvent } from 'react';
import { LANGS } from '../data/languages.ts';
import type { InquiryState, InquiryFormData } from '../types/index.ts';
import { sendInquiryEmail } from '../action.tsx';
import { StatusIndicator } from './StatusIndicator.tsx';

export function BookingForm() {
  const [selectedLangs, setSelectedLangs] = useState<string[]>([]);
  const [inquiryState, setInquiryState] = useState<InquiryState>({ status: 'idle' });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const toggleLang = (id: string) => {
    setSelectedLangs((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const data: InquiryFormData = {
      name: String(formData.get('name') || ''),
      email: String(formData.get('email') || ''),
      languages: selectedLangs,
      message: String(formData.get('message') || ''),
    };

    setIsSubmitting(true);
    setInquiryState({ status: 'loading' });

    try {
      const response = await sendInquiryEmail(data);
      if (response.success && response.details && response.inquiryId) {
        setInquiryState({
          status: 'success',
          message: response.message,
          timestamp: response.timestamp,
          inquiryId: response.inquiryId,
          details: response.details,
        });
      } else {
        setInquiryState({
          status: 'error',
          message:
            response.message ||
            'Could not deliver email. Please check your SMTP configuration in .env.',
        });
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'A connection error occurred. Please check your network and try again.';
      setInquiryState({
        status: 'error',
        message: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setInquiryState({ status: 'idle' });
    setSelectedLangs([]);
  };

  return (
    <section id="book" className="mx-auto max-w-6xl px-6 py-16 scroll-mt-12">
      <div className="rounded-3xl bg-white p-8 border border-ink/10 shadow-sm dark:bg-ink/70 dark:border-white/10 lg:p-12 transition-colors">
        <div className="grid gap-10 lg:grid-cols-2">
          {/* Left Column: Context */}
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-ink dark:text-white sm:text-4xl">
              Get in touch
            </h2>
            <p className="mt-4 leading-relaxed text-mute dark:text-white/70">
              Tell me what you are working on or trying to learn. No automatic
              subscriptions, upfront paywalls, or rigid video courses.
            </p>

            <div className="mt-6 rounded-2xl bg-sun/20 p-5 text-sm text-ink dark:bg-sun/10 dark:text-white">
              <strong>Direct Email Booking:</strong> After receiving your request, I will reply with available time slots for a 20-minute intro call.
            </div>
          </div>

          {/* Right Column: Form or Reactive Indicator */}
          <div>
            {inquiryState.status === 'success' ? (
              <StatusIndicator state={inquiryState} onReset={handleReset} />
            ) : (
              <div className="space-y-4">
                {inquiryState.status === 'error' && (
                  <StatusIndicator state={inquiryState} onReset={handleReset} />
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="form-name"
                      className="block text-xs font-bold uppercase tracking-wider text-mute dark:text-white/70"
                    >
                      Your Name
                    </label>
                    <input
                      required
                      id="form-name"
                      name="name"
                      type="text"
                      disabled={isSubmitting}
                      placeholder="Jane Doe"
                      className="mt-1.5 w-full rounded-xl border border-ink/15 bg-paper/30 px-4 py-3 text-sm text-ink focus:border-brand focus:outline-none dark:bg-white/5 dark:border-white/15 dark:text-white dark:focus:border-sun transition disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="form-email"
                      className="block text-xs font-bold uppercase tracking-wider text-mute dark:text-white/70"
                    >
                      Email Address
                    </label>
                    <input
                      required
                      id="form-email"
                      name="email"
                      type="email"
                      disabled={isSubmitting}
                      placeholder="jane@example.com"
                      className="mt-1.5 w-full rounded-xl border border-ink/15 bg-paper/30 px-4 py-3 text-sm text-ink focus:border-brand focus:outline-none dark:bg-white/5 dark:border-white/15 dark:text-white dark:focus:border-sun transition disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-mute dark:text-white/70">
                      Languages Interested In
                    </label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {LANGS.map((lang) => {
                        const active = selectedLangs.includes(lang.id);
                        return (
                          <button
                            type="button"
                            key={lang.id}
                            disabled={isSubmitting}
                            onClick={() => toggleLang(lang.id)}
                            className={`cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                              active
                                ? 'bg-brand text-white shadow-sm ring-2 ring-brand/30 dark:ring-sun/50'
                                : 'border border-ink/15 bg-white text-ink hover:border-ink/40 dark:bg-white/5 dark:text-white/80 dark:border-white/15 dark:hover:border-white/40'
                            } disabled:opacity-50`}
                          >
                            {lang.kind === 'spoken' ? lang.flag : lang.icon} {lang.id}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="form-message"
                      className="block text-xs font-bold uppercase tracking-wider text-mute dark:text-white/70"
                    >
                      Goals / Current Level
                    </label>
                    <textarea
                      id="form-message"
                      name="message"
                      rows={3}
                      disabled={isSubmitting}
                      placeholder="e.g. Preparing for technical interviews in TypeScript, or learning Japanese for an upcoming relocation."
                      className="mt-1.5 w-full rounded-xl border border-ink/15 bg-paper/30 px-4 py-3 text-sm text-ink focus:border-brand focus:outline-none dark:bg-white/5 dark:border-white/15 dark:text-white dark:focus:border-sun transition disabled:opacity-50"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="cursor-pointer flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#2b2ed8] active:scale-[0.99] disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        <span>Sending Inquiry...</span>
                      </>
                    ) : (
                      <span>Send Inquiry</span>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
