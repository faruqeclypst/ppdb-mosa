import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ref, get } from 'firebase/database';
import { db } from '../firebase/config';
import HeroSection from '../components/landingpage/HeroSection';
import AboutSection from '../components/landingpage/AboutSection';
import AchievementSection from '../components/landingpage/AchievementSection';
import FeaturesSection from '../components/landingpage/FeaturesSection';
import TestimonialsSection from '../components/landingpage/TestimonialsSection';
import CallToActionSection from '../components/landingpage/CallToActionSection';
import FAQSection from '../components/landingpage/FAQSection';
import type { PPDBSettings } from '../types/settings';

const LandingPage: React.FC = () => {
  const [settings, setSettings] = useState<PPDBSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settingsRef = ref(db, 'settings/ppdb');
      const snapshot = await get(settingsRef);
      
      if (snapshot.exists()) {
        setSettings(snapshot.val());
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="overflow-hidden"
    >
      <HeroSection settings={settings} />
      <AboutSection />
      <AchievementSection />
      <FeaturesSection />
      <TestimonialsSection />
      <FAQSection />
      <CallToActionSection />
    </motion.div>
  );
};

export default LandingPage; 