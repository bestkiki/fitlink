import React from 'react';
import Hero from '../components/Hero';
import Features from '../components/Features';
import Testimonials from '../components/Testimonials';
import CTA from '../components/CTA';
import { Page } from '../UnauthenticatedApp';
import HealthInfoPromo from '../components/HealthInfoPromo';

interface LandingPageProps {
  onNavigate: (page: Page) => void;
  onNavigateToHealthInfo: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, onNavigateToHealthInfo }) => {
  return (
    <>
      <Hero onNavigate={() => onNavigate('signup')} />
      <Features />
      <HealthInfoPromo onNavigate={onNavigateToHealthInfo} />
      <Testimonials />
      <CTA onNavigate={() => onNavigate('signup')} />
    </>
  );
};

export default LandingPage;