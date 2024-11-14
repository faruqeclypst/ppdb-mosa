import React from 'react';
import HeroSection from '../components/landingpage/HeroSection';
import FeaturesSection from '../components/landingpage/FeaturesSection';
import TestimonialsSection from '../components/landingpage/TestimonialsSection';
import CallToActionSection from '../components/landingpage/CallToActionSection';

const LandingPage: React.FC = () => {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <TestimonialsSection />
      <CallToActionSection />
    </>
  );
};

export default LandingPage; 