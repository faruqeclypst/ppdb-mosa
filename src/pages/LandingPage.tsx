import React from 'react';
import { motion } from 'framer-motion';
import HeroSection from '../components/landingpage/HeroSection';
import FeaturesSection from '../components/landingpage/FeaturesSection';
import TestimonialsSection from '../components/landingpage/TestimonialsSection';
import CallToActionSection from '../components/landingpage/CallToActionSection';
import FAQSection from '../components/landingpage/FAQSection';

const LandingPage: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="overflow-hidden"
    >
      <HeroSection />
      <FeaturesSection />
      <TestimonialsSection />
      <FAQSection />
      <CallToActionSection />
    </motion.div>
  );
};

export default LandingPage; 