import React, { useState, useEffect } from 'react';
import { ViewState, PageView } from './types';
import { Header } from './components/Header';
import { LandingPage } from './components/LandingPage';
import { NaverSearchAds } from './components/NaverSearchAds';
import { NaverGFA } from './components/NaverGFA';
import { MetaAds } from './components/MetaAds';
import { GoogleAds } from './components/GoogleAds';
import { CoupangAds } from './components/CoupangAds';
import { auth, loginWithGoogle, logout } from './services/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

const COLORS = {
  bg: 'bg-[#373938]',
  primary: 'text-[#F05519]',
};

// Define URL Routes for SEO friendly navigation
const ROUTES: Record<string, PageView> = {
  '/': PageView.LANDING,
  '/naver-search-analyzer': PageView.NAVER_SEARCH,
  '/naver-gfa-analyzer': PageView.NAVER_GFA,
  '/meta-ads-analyzer': PageView.META,
  '/google-ads-analyzer': PageView.GOOGLE,
  '/coupang-ads-analyzer': PageView.COUPANG,
};

// Helper to find path by page view
const getPathByPage = (page: PageView): string => {
  return Object.keys(ROUTES).find(key => ROUTES[key] === page) || '/';
};

// --- API Key Modal Component ---
const ApiKeyModal = ({ onSave }: { onSave: (key: string) => void }) => {
  const [inputKey, setInputKey] = useState('');

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#2d2f2e] p-8 rounded-xl border border-gray-700 shadow-2xl max-w-md w-full">
        <h2 className="text-xl font-bold text-white mb-4">API Key 설정 필요</h2>
        <p className="text-gray-400 text-sm mb-6 leading-relaxed">
          분석을 진행하려면 <strong>Google Gemini API Key</strong>가 필요합니다.<br/>
          <span className="text-xs text-gray-500">(입력한 키는 브라우저에 안전하게 저장됩니다.)</span>
        </p>
        <input
          type="password"
          value={inputKey}
          onChange={(e) => setInputKey(e.target.value)}
          placeholder="AI Studio API Key 입력"
          className="w-full bg-[#373938] border border-gray-600 rounded p-3 text-white mb-4 focus:border-[#F05519] focus:outline-none focus:ring-1 focus:ring-[#F05519]"
        />
        <div className="flex justify-between items-center">
            <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noreferrer"
                className="text-xs text-gray-400 hover:text-white underline"
            >
                키 발급받으러 가기
            </a>
            <button
              onClick={() => {
                  if(inputKey.trim()) onSave(inputKey.trim());
              }}
              disabled={!inputKey.trim()}
              className="px-6 py-2 bg-[#F05519] text-white rounded font-bold hover:bg-[#d44612] disabled:opacity-50 transition-colors"
            >
              저장하기
            </button>
        </div>
      </div>
    </div>
  );
};

const LoginScreen = ({ onLogin, isLoading }: { onLogin: () => void, isLoading: boolean }) => {
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
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 py-3 rounded-lg hover:bg-gray-100 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="animate-pulse">Google 로그인 중...</span>
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google 계정으로 시작하기
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default function App() {
  const [viewState, setViewState] = useState<ViewState>(ViewState.LOGIN);
  const [currentPage, setCurrentPage] = useState<PageView>(PageView.LANDING);
  const [user, setUser] = useState<User | null>(null);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  
  // API Key State Management
  const [apiKey, setApiKey] = useState<string>('');
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);

  // Initialize API Key Logic
  useEffect(() => {
    const envKey = process.env.API_KEY;
    if (envKey && envKey.trim() !== '') {
      setApiKey(envKey);
      setShowApiKeyModal(false);
    } else {
      const storedKey = localStorage.getItem('GEMINI_API_KEY');
      if (storedKey) {
        setApiKey(storedKey);
        setShowApiKeyModal(false);
      }
    }
  }, []);

  // --- ROUTING LOGIC ---
  useEffect(() => {
    // 1. Initial Load: Set Page based on URL
    const currentPath = window.location.pathname;
    // Simple matching logic
    let matchedPage = PageView.LANDING;
    // Check exact match first
    if (ROUTES[currentPath]) {
        matchedPage = ROUTES[currentPath];
    } else {
        // Fallback or fuzzy match could go here, for now default to Landing
        // If logged in, maybe we want to preserve the URL? 
        // We will handle navigation updates below.
    }
    setCurrentPage(matchedPage);

    // 2. Handle Browser Back/Forward buttons
    const handlePopState = () => {
      const path = window.location.pathname;
      const page = ROUTES[path] || PageView.LANDING;
      setCurrentPage(page);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Function to change page and URL
  const navigateTo = (page: PageView) => {
    const path = getPathByPage(page);
    window.history.pushState({}, '', path);
    setCurrentPage(page);
    window.scrollTo(0, 0); // Scroll to top on navigation
  };

  // Firebase Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setViewState(ViewState.APP);
        const envKey = process.env.API_KEY;
        const storedKey = localStorage.getItem('GEMINI_API_KEY');
        if ((!envKey || envKey.trim() === '') && !storedKey) {
            setShowApiKeyModal(true);
        }
      } else {
        setUser(null);
        setViewState(ViewState.LOGIN);
      }
      setIsLoginLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSaveApiKey = (key: string) => {
    localStorage.setItem('GEMINI_API_KEY', key);
    setApiKey(key);
    setShowApiKeyModal(false);
  };

  const handleLogin = async () => {
    setIsLoginLoading(true);
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error("Login Error:", error);
      alert("로그인에 실패했습니다. 팝업 차단을 확인하거나 다시 시도해주세요.");
      setIsLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setViewState(ViewState.LOGIN);
      navigateTo(PageView.LANDING); // Go back to landing on logout
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  // Simple Router
  const renderContent = () => {
    switch (currentPage) {
      case PageView.LANDING:
        return <LandingPage />;
      case PageView.NAVER_SEARCH:
        return <NaverSearchAds apiKey={apiKey} />;
      case PageView.NAVER_GFA:
        return <NaverGFA apiKey={apiKey} />;
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
        <LoginScreen onLogin={handleLogin} isLoading={isLoginLoading} />
      )}

      {viewState === ViewState.APP && (
        <>
          {showApiKeyModal && <ApiKeyModal onSave={handleSaveApiKey} />}

          <Header currentPage={currentPage} setPage={navigateTo} />
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex justify-end">
            <div className="flex items-center gap-3 text-sm text-gray-400">
               {user?.photoURL ? (
                 <img src={user.photoURL} alt="Profile" className="w-6 h-6 rounded-full border border-gray-600" />
               ) : (
                 <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center text-xs">U</div>
               )}
               <span>{user?.displayName || "User"}님 환영합니다.</span>
               <button onClick={handleLogout} className="underline hover:text-white">로그아웃</button>
            </div>
          </div>

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {renderContent()}
          </main>

          <footer className="border-t border-gray-700 mt-20 py-8 text-center text-gray-500 text-sm">
            <p>&copy; 2024 AdAiAn. All rights reserved.</p>
            <p className="mt-2 text-xs">본 서비스에 사용되는 실제 광고 데이터는 서버에 저장되지 않습니다.</p>
          </footer>
        </>
      )}
    </div>
  );
}