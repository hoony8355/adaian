import React, { useState, useEffect, useRef } from 'react';
import { ViewState, PageView } from './types';
import { Header } from './components/Header';
import { LandingPage } from './components/LandingPage';
import { NaverSearchAds } from './components/NaverSearchAds';
import { NaverGFA } from './components/NaverGFA';
import { MetaAds } from './components/MetaAds';
import { GoogleAds } from './components/GoogleAds';
import { CoupangAds } from './components/CoupangAds';
import { auth, loginWithGoogle, logout, getRemainingDailyLimit } from './services/firebase';
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

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageView>(PageView.LANDING);
  const [user, setUser] = useState<User | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [remainingUsage, setRemainingUsage] = useState<number | null>(null);

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
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Fetch usage
        const usage = await getRemainingDailyLimit(currentUser.uid);
        setRemainingUsage(usage);
      } else {
        setUser(null);
        setRemainingUsage(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const refreshUsage = async () => {
    if (user) {
        const usage = await getRemainingDailyLimit(user.uid);
        setRemainingUsage(usage);
    }
  };

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error("Login Error:", error);
      alert("로그인에 실패했습니다. 팝업 차단을 확인하거나 다시 시도해주세요.");
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
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
        return <NaverSearchAds onUsageUpdated={refreshUsage} />;
      case PageView.NAVER_GFA:
        return <NaverGFA onUsageUpdated={refreshUsage} />;
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
      {showContactModal && <ContactModal onClose={() => setShowContactModal(false)} userEmail={user?.email || ''} />}

      <Header 
        currentPage={currentPage} 
        setPage={navigateTo} 
        onOpenContact={() => setShowContactModal(true)}
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
        remainingUsage={remainingUsage}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>

      <footer className="border-t border-gray-700 mt-20 py-8 text-center text-gray-500 text-sm">
        <p>&copy; 2024 AdAiAn. All rights reserved.</p>
        <p className="mt-2 text-xs">본 서비스에 사용되는 실제 광고 데이터는 서버에 저장되지 않습니다.</p>
      </footer>
    </div>
  );
}
