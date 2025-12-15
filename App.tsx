import React, { useState } from 'react';
import { ViewState, PageView } from './types';
import { Header } from './components/Header';
import { LandingPage } from './components/LandingPage';
import { NaverSearchAds } from './components/NaverSearchAds';
import { NaverGFA } from './components/NaverGFA';
import { MetaAds } from './components/MetaAds';
import { GoogleAds } from './components/GoogleAds';
import { CoupangAds } from './components/CoupangAds';

const COLORS = {
  bg: 'bg-[#373938]',
  primary: 'text-[#F05519]',
};

const LoginScreen = ({ onLogin }: { onLogin: () => void }) => {
  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${COLORS.bg}`}>
      <div className="absolute inset-0 bg-black opacity-40"></div>
      <div className="relative z-10 w-full max-w-md p-8 bg-[#2d2f2e] rounded-xl shadow-2xl border border-gray-700 text-center">
        <h1 className="text-4xl font-bold mb-2 tracking-tighter">
          <span className="text-white">Ad</span><span className={COLORS.primary}>Ai</span><span className="text-white">An</span>
        </h1>
        <p className="text-gray-400 mb-8 text-sm uppercase tracking-widest">Advertising Data AI Analyzer</p>
        
        <p className="text-gray-300 mb-8 font-light">
          "다양한 계정의 광고 데이터를 학습한 AI에게<br/>
          광고 분석을 무료로 요청하세요."
        </p>

        <button 
          onClick={onLogin}
          className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 py-3 rounded-lg hover:bg-gray-100 transition-all duration-200 font-medium"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Google 계정으로 계속하기
        </button>
      </div>
    </div>
  );
};

export default function App() {
  const [viewState, setViewState] = useState<ViewState>(ViewState.LOGIN);
  const [currentPage, setCurrentPage] = useState<PageView>(PageView.LANDING);

  // Simple Router
  const renderContent = () => {
    switch (currentPage) {
      case PageView.LANDING:
        return <LandingPage />;
      case PageView.NAVER_SEARCH:
        return <NaverSearchAds />;
      case PageView.NAVER_GFA:
        return <NaverGFA />;
      case PageView.META:
        return <MetaAds />;
      case PageView.GOOGLE:
        return <GoogleAds />;
      case PageView.COUPANG:
        return <CoupangAds />;
      default:
        return <LandingPage />;
    }
  };

  return (
    <div className={`min-h-screen ${COLORS.bg} text-white`}>
      {viewState === ViewState.LOGIN && (
        <LoginScreen onLogin={() => setViewState(ViewState.APP)} />
      )}

      {viewState === ViewState.APP && (
        <>
          <Header currentPage={currentPage} setPage={setCurrentPage} />
          
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {renderContent()}
          </main>

          <footer className="border-t border-gray-700 mt-20 py-8 text-center text-gray-500 text-sm">
            <p>&copy; 2024 AdAiAn. All rights reserved.</p>
            <p className="mt-2 text-xs">본 서비스는 데모 버전입니다. 실제 광고 데이터는 서버에 저장되지 않습니다.</p>
          </footer>
        </>
      )}
    </div>
  );
}