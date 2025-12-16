import React, { useState, useEffect, useRef } from 'react';
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
import emailjs from '@emailjs/browser';

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

// --- Contact Modal Component ---
const ContactModal = ({ onClose, userEmail }: { onClose: () => void, userEmail?: string }) => {
  const form = useRef<HTMLFormElement>(null);
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const sendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);

    const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID; 
    const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
        alert("이메일 발송 설정이 완료되지 않았습니다. 관리자에게 문의해주세요.");
        setIsSending(false);
        return;
    }

    if (form.current) {
      emailjs.sendForm(SERVICE_ID, TEMPLATE_ID, form.current, PUBLIC_KEY)
        .then((result) => {
            console.log(result.text);
            setIsSent(true);
            setIsSending(false);
            setTimeout(() => {
                onClose();
            }, 2000);
        }, (error) => {
            console.log(error.text);
            alert("메시지 전송에 실패했습니다. 잠시 후 다시 시도해주세요.");
            setIsSending(false);
        });
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-[#2d2f2e] w-full max-w-md rounded-xl border border-gray-700 shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-gray-700 flex justify-between items-center">
            <h3 className="text-xl font-bold text-white">문의 / 건의사항</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>
        
        {isSent ? (
            <div className="p-10 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h4 className="text-xl font-bold text-white mb-2">전송 완료!</h4>
                <p className="text-gray-400">소중한 의견 감사합니다.<br/>빠른 시일 내에 답변 드리겠습니다.</p>
            </div>
        ) : (
            <form ref={form} onSubmit={sendEmail} className="p-6 space-y-4">
                <div>
                    <label className="block text-sm text-gray-400 mb-1">이름 / 닉네임</label>
                    <input type="text" name="from_name" required className="w-full bg-[#373938] border border-gray-600 rounded p-3 text-white focus:border-[#F05519] focus:outline-none" placeholder="홍길동" />
                </div>
                <div>
                    <label className="block text-sm text-gray-400 mb-1">이메일 (답변 받으실 곳)</label>
                    <input type="email" name="reply_to" defaultValue={userEmail} required className="w-full bg-[#373938] border border-gray-600 rounded p-3 text-white focus:border-[#F05519] focus:outline-none" placeholder="example@email.com" />
                </div>
                <div>
                    <label className="block text-sm text-gray-400 mb-1">문의 내용</label>
                    <textarea name="message" required rows={5} className="w-full bg-[#373938] border border-gray-600 rounded p-3 text-white focus:border-[#F05519] focus:outline-none resize-none" placeholder="건의사항이나 궁금한 점을 적어주세요."></textarea>
                </div>
                <button 
                    type="submit" 
                    disabled={isSending}
                    className="w-full py-3 bg-[#F05519] hover:bg-[#d44612] text-white font-bold rounded-lg transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                >
                    {isSending ? <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span> : <span>보내기</span>}
                </button>
            </form>
        )}
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
  const [showContactModal, setShowContactModal] = useState(false);

  // --- ROUTING LOGIC ---
  useEffect(() => {
    const currentPath = window.location.pathname;
    let matchedPage = PageView.LANDING;
    if (ROUTES[currentPath]) {
        matchedPage = ROUTES[currentPath];
    }
    setCurrentPage(matchedPage);

    const handlePopState = () => {
      const path = window.location.pathname;
      const page = ROUTES[path] || PageView.LANDING;
      setCurrentPage(page);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (page: PageView) => {
    const path = getPathByPage(page);
    window.history.pushState({}, '', path);
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setViewState(ViewState.APP);
      } else {
        setUser(null);
        setViewState(ViewState.LOGIN);
      }
      setIsLoginLoading(false);
    });

    return () => unsubscribe();
  }, []);

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
      navigateTo(PageView.LANDING);
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

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
        <LoginScreen onLogin={handleLogin} isLoading={isLoginLoading} />
      )}

      {viewState === ViewState.APP && (
        <>
          {showContactModal && <ContactModal onClose={() => setShowContactModal(false)} userEmail={user?.email || ''} />}

          <Header 
            currentPage={currentPage} 
            setPage={navigateTo} 
            onOpenContact={() => setShowContactModal(true)}
          />
          
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