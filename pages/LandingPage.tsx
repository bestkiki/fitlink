import React from 'react';
import Hero from '../components/Hero';
import Features from '../components/Features';
import Testimonials from '../components/Testimonials';
import CTA from '../components/CTA';
import { Page } from '../UnauthenticatedApp';

interface LandingPageProps {
  onNavigate: (page: Page) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  return (
    <>
      <Hero onNavigate={() => onNavigate('signup')} />
      <Features />
      <Testimonials />
      <CTA onNavigate={() => onNavigate('signup')} />
    </>
  );
};

export default LandingPage;
