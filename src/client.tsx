'use client';

import React from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Curriculum } from './components/Curriculum';
import { BookingForm } from './components/BookingForm';
import { Footer } from './components/Footer';

export default function SwyftPainApp() {
  return (
    <div id="top" className="min-h-screen bg-paper text-ink dark:bg-[#0c0f24] dark:text-[#f0f3fe] font-sans transition-colors duration-200">
      <Header />
      <main>
        <Hero />
        <Curriculum />
        <BookingForm />
      </main>
      <Footer />
    </div>
  );
}
