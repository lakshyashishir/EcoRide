'use client';

import { useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import Navbar from '@/components/layout/Navbar';
// import Footer from '@/components/layout/Footer';
import WebsiteHomePage from '@/components/pages/WebsiteHomePage';
import ProcessingPage from '@/components/pages/ProcessingPage';
import SuccessPage from '@/components/pages/SuccessPage';
import WebsiteRewardsPage from '@/components/pages/WebsiteRewardsPage';
import WebsiteDashboardPage from '@/components/pages/WebsiteDashboardPage';
import JourneyHistory from '@/components/JourneyHistory';
import Leaderboard from '@/components/Leaderboard';

export default function Home() {
  const [currentPage, setCurrentPage] = useState('home');
  const { wallet } = useWallet();

  // Protected routes that require wallet connection
  const protectedRoutes = ['dashboard', 'history', 'rewards', 'leaderboard'];

  const handleNavigation = (page: string) => {
    // If trying to access protected route without wallet, redirect to home
    if (protectedRoutes.includes(page) && !wallet.isConnected) {
      setCurrentPage('home');
      return;
    }
    setCurrentPage(page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <WebsiteHomePage onNavigate={handleNavigation} />;
      case 'processing':
        return <ProcessingPage onNavigate={handleNavigation} />;
      case 'success':
        return <SuccessPage onNavigate={handleNavigation} />;
      case 'rewards':
        return <WebsiteRewardsPage onNavigate={handleNavigation} />;
      case 'dashboard':
        return <WebsiteDashboardPage onNavigate={handleNavigation} />;
      case 'history':
        return (
          <div className="min-h-screen bg-card">
            <div className="container mx-auto px-4 py-12">
              <div className="max-w-7xl mx-auto">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">Journey History</h1>
                <JourneyHistory />
              </div>
            </div>
          </div>
        );
      case 'leaderboard':
        return (
          <div className="min-h-screen bg-card">
            <div className="container mx-auto px-4 py-12">
              <div className="max-w-7xl mx-auto">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">Community Leaderboard</h1>
                <Leaderboard onNavigate={handleNavigation} />
              </div>
            </div>
          </div>
        );
      default:
        return <WebsiteHomePage onNavigate={handleNavigation} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onNavigate={handleNavigation} currentSection={currentPage} />
      <main className="flex-1">
        {renderPage()}
      </main>
      {/* <Footer /> */}
    </div>
  );
}