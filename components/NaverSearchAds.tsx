import React, { useState, useRef, useEffect } from 'react';
import { UploadedFiles, AnalysisResult, KeywordStat } from '../types';
import { analyzeNaverSearchData } from '../services/naverSearchService';
import { getRemainingDailyLimit, incrementDailyLimit, auth } from '../services/firebase';
import { UploadIcon, CheckIcon, ChartIcon, AlertIcon, SearchIcon } from './Icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

const COLORS = {
  bg: 'bg-[#373938]',
  card: 'bg-[#454746]',
  primary: 'text-[#F05519]',
  primaryBg: 'bg-[#F05519]',
  textMain: 'text-white',
  textMuted: 'text-gray-400',
  border: 'border-gray-600',
};

// --- HELPER FUNCTIONS ---
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(value);
};

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('ko-KR').format(value);
};

// --- SUB COMPONENTS (Local) ---

const GuideImage = ({ src, alt }: { src: string, alt: string }) => {
  const [transformOrigin, setTransformOrigin] = useState('center center');

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setTransformOrigin(`${x}% ${y}%`);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.style.display = 'none';
    const parent = e.currentTarget.parentElement;
    if (parent) {
      parent.innerHTML = `
        <div class="flex flex-col items-center justify-center p-8 text-center text-gray-500">
          <svg class="w-10 h-10 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
          </svg>
          <span class="text-xs font-mono">이미지 로드 실패</span>
          <span class="text-[10px] mt-1 text-gray-600 block">프로젝트 최상위의 public 폴더 안에 guide_images 폴더가 있는지 확인해주세요.</span>
        </div>
      `;
    }
  };

  return (
    <div 
      className="bg-gray-900 rounded-lg overflow-hidden border border-gray-700 min-h-[150px] group relative cursor-zoom-in"
      onMouseMove={handleMouseMove}
    >
        <div className="absolute top-2 right-2 bg-black/70 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
           마우스를 움직여 확대/이동
        </div>
        <img 
          src={src} 
          alt={alt} 
          className="w-full h-auto object-contain transition-transform duration-100 ease-out group-hover:scale-[2]"
          style={{ transformOrigin }}
          onError={handleImageError}
        />
    </div>
  );
};

const LoadingScreen = () => {
  const [messageIndex, setMessageIndex] = useState(0);
  const messages = [
    "AdAiAn은 다중 AI 분석 기술로 리포트를 생성하고 있어요...",
    "인공지능끼리 토론하며 광고를 분석하고 있어요...",
    "데이터에 이상이 없는지 확인하고 있어요...",
    "화장실에 한번 다녀오시면 그사이에 분석해둘게요...",
    "데이터 양이 많아 꼼꼼히 살펴보고 있습니다..."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-gray-700 border-t-[#F05519] rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
           <div className="w-2 h-2 bg-[#F05519] rounded-full animate-pulse"></div>
        </div>
      </div>
      <h3 className="text-xl font-bold text-white mt-8 mb-2 min-h-[28px] text-center px-4">
        {messages[messageIndex]}
      </h3>
      <p className="text-gray-400 text-sm">약 2-3분 정도 소요됩니다. 잠시만 기다려주세요.</p>
    </div>
  );
};

const ExampleReportModal = ({ onClose }: { onClose: () => void }) => {
  const dummyTrendData = [
    { name: '1주차', roas: 250, cost: 800000 },
    { name: '2주차', roas: 310, cost: 850000 },
    { name: '3주차', roas: 280, cost: 900000 },
    { name: '4주차', roas: 420, cost: 750000 },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-[#2d2f2e] w-full max-w-4xl max-h-[90vh] rounded-xl border border-gray-600 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-white">📊 분석 리포트 예시 미리보기</h2>
            <p className="text-sm text-gray-400">실제 분석 완료 시 아래와 같은 리포트가 제공됩니다.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="overflow-y-auto p-6 space-y-6">
          {/* 1. 요약 카드 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#454746] p-4 rounded-lg border border-gray-700">
               <p className="text-gray-400 text-xs">총 매출액</p>
               <p className="text-lg font-bold text-white">₩15,400,000</p>
            </div>
            <div className="bg-[#454746] p-4 rounded-lg border border-gray-700">
               <p className="text-gray-400 text-xs">평균 ROAS</p>
               <p className="text-lg font-bold text-[#F05519]">420%</p>
            </div>
            <div className="bg-[#454746] p-4 rounded-lg border border-gray-700">
               <p className="text-gray-400 text-xs">총 비용</p>
               <p className="text-lg font-bold text-white">₩3,660,000</p>
            </div>
             <div className="bg-[#454746] p-4 rounded-lg border border-gray-700">
               <p className="text-gray-400 text-xs">ROAS 변화</p>
               <p className="text-lg font-bold text-green-400">+15% 🔼</p>
            </div>
          </div>

          {/* 2. 핵심 문제 & 액션 */}
          <div className="grid md:grid-cols-2 gap-4">
             <div className="bg-[#2d2f2e] border border-red-900/50 p-4 rounded-lg">
                <h4 className="font-bold text-red-400 mb-2 flex items-center gap-2">⚠️ 핵심 문제점 (Critical)</h4>
                <ul className="text-sm text-gray-300 space-y-2">
                   <li>• '모바일' 매체의 클릭 비용이 PC 대비 3배 높지만 전환율은 1/2 수준입니다.</li>
                   <li>• 키워드 [원피스], [여름옷]에서 50만원의 비용이 발생했으나 전환은 0건입니다.</li>
                </ul>
             </div>
             <div className="bg-[#2d2f2e] border border-green-900/50 p-4 rounded-lg">
                <h4 className="font-bold text-green-400 mb-2 flex items-center gap-2">🚀 실행 가이드 (Action)</h4>
                <ul className="text-sm text-gray-300 space-y-2">
                   <li>• 모바일 입찰 가중치를 현재 150%에서 100%로 하향 조정하세요.</li>
                   <li>• 성과가 없는 [원피스] 키워드를 '제외 키워드'로 등록하여 예산을 방어하세요.</li>
                </ul>
             </div>
          </div>

          {/* 3. 차트 예시 */}
          <div className="bg-[#454746] p-4 rounded-lg border border-gray-700">
             <h4 className="font-bold text-white mb-4">주간 성과 트렌드</h4>
             <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dummyTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#555" vertical={false} />
                    <XAxis dataKey="name" stroke="#999" fontSize={10} />
                    <YAxis stroke="#999" fontSize={10} />
                    <Line type="monotone" dataKey="roas" stroke="#F05519" strokeWidth={2} dot={{r:3}} />
                    <Line type="monotone" dataKey="cost" stroke="#8884d8" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
             </div>
          </div>

          <div className="bg-[#F05519]/10 p-4 rounded-lg text-center">
             <p className="text-[#F05519] text-sm font-bold">
               "실제 분석에서는 사용자의 데이터를 기반으로 더 구체적인 인사이트와 키워드 추천이 제공됩니다."
             </p>
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-700 flex justify-end">
           <button onClick={onClose} className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded font-medium">닫기</button>
        </div>
      </div>
    </div>
  );
};

const FileUploadZone = ({ 
  label, 
  subtext,
  file, 
  onFileSelect,
  accept = ".csv,.xlsx,.xls"
}: { 
  label: string; 
  subtext?: string;
  file?: File; 
  onFileSelect: (f: File) => void; 
  accept?: string;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  return (
    <div 
      className={`relative border-2 border-dashed rounded-lg p-6 transition-all cursor-pointer group
        ${file ? 'border-green-500 bg-green-500/5' : 'border-gray-600 hover:border-gray-400 hover:bg-gray-700'}
      `}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input 
        type="file" 
        className="hidden" 
        ref={inputRef} 
        accept={accept}
        onChange={(e) => e.target.files?.[0] && onFileSelect(e.target.files[0])} 
      />
      
      <div className="flex flex-col items-center justify-center text-center">
        {file ? (
          <>
            <div className="bg-green-500 rounded-full p-2 mb-2">
              <CheckIcon />
            </div>
            <p className="text-sm font-medium text-white truncate max-w-[200px]">{file.name}</p>
            <p className="text-xs text-green-400 mt-1">업로드 완료</p>
          </>
        ) : (
          <>
            <div className="text-gray-400 mb-2 group-hover:text-white transition-colors">
              <UploadIcon />
            </div>
            <p className="text-sm font-medium text-gray-300">{label}</p>
            {subtext && <p className="text-[11px] text-gray-500 mt-1 max-w-[90%] mx-auto whitespace-pre-line">{subtext}</p>}
          </>
        )}
      </div>
    </div>
  );
};

const DataGuide = () => {
  const [isOpen, setIsOpen] = useState(false);
  const steps = [
    {
      title: "1. 캠페인 구조 성과",
      desc: "월-일 기준의 4주 (28일) 데이터를 권장드립니다. (예: 월요일 시작 ~ 일요일 종료)",
      settings: "캠페인 유형, 캠페인, 주별",
      metrics: "총비용, 노출수, 클릭수, 전환수, 전환매출액, 광고수익률",
      imgSrc: "/guide_images/guide1.png"
    },
    {
      title: "2. 디바이스/지면 분석",
      desc: "위와 동일한 기간의 데이터를 권장드립니다.",
      settings: "캠페인 유형, 캠페인, 광고그룹, PC/모바일 매체, 검색/콘텐츠 매체",
      metrics: "총비용, 노출수, 클릭수, 전환수, 전환매출액, 광고수익률",
      imgSrc: "/guide_images/guide2.png"
    },
    {
      title: "3. 검색어 분석",
      desc: "위와 동일한 기간의 데이터를 권장드립니다.",
      settings: "캠페인 유형, 캠페인, 검색어",
      metrics: "총비용, 노출수, 클릭수, 전환수, 전환매출액, 광고수익률",
      imgSrc: "/guide_images/guide3.png"
    }
  ];

  return (
    <div className="mt-12 border-t border-gray-700 pt-8 animate-fade-in">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-lg font-bold text-white mb-6 hover:text-[#F05519] transition-colors"
      >
        <span className="flex items-center gap-2">
          <span className="text-[#F05519] 📘">데이터 추출 가이드 (열기/닫기)</span>
        </span>
        <svg 
          className={`w-6 h-6 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="space-y-12 pb-10">
          <p className="text-gray-400 text-sm mb-6">
            AdAiAn은 아래 3가지 리포트 조합에 최적화되어 있습니다.<br/>
            정확한 분석을 위해 <span className="text-[#F05519]">"다운로드 리포트"</span> 기능을 이용해주세요.
          </p>
          {steps.map((step, idx) => (
            <div key={idx} className="bg-[#454746] rounded-xl p-6 border border-gray-600">
              <h4 className="text-lg font-bold mb-2 text-white">{step.title}</h4>
              <p className="text-gray-300 mb-4 text-sm">{step.desc}</p>
              
              <div className="bg-gray-800/50 p-4 rounded mb-6 text-sm text-gray-300 border border-gray-700">
                  <div className="mb-2">
                    <span className="text-[#F05519] font-bold mr-2">📌 기본 설정:</span> 
                    <span className="font-mono text-xs text-gray-400">{step.settings}</span>
                  </div>
                  <div>
                    <span className="text-[#F05519] font-bold mr-2">📊 지표 설정:</span> 
                    <span className="font-mono text-xs text-gray-400">{step.metrics}</span>
                  </div>
              </div>
              
              <GuideImage src={step.imgSrc} alt={`${step.title} 설정 예시`} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- KEYWORD TABLE COMPONENT ---
const KeywordTable = ({ keywords }: { keywords: KeywordStat[] }) => {
  const [showAll, setShowAll] = useState(false);
  // Sort descending by cost
  const sortedKeywords = [...keywords].sort((a, b) => b.cost - a.cost);
  const data = showAll ? sortedKeywords : sortedKeywords.slice(0, 10);
  
  return (
    <div className={`${COLORS.card} p-6 rounded-xl border border-gray-700 overflow-hidden`}>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <SearchIcon />
          <h3 className="text-lg font-bold text-white">🔥 고비용 키워드 분석 (비용순)</h3>
        </div>
        <button 
          onClick={() => setShowAll(!showAll)}
          className="text-xs px-3 py-1.5 rounded border border-gray-600 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
        >
          {showAll ? '접기' : '더 보기'}
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-400">
          <thead className="text-xs text-gray-200 uppercase bg-gray-700/50">
            <tr>
              <th className="px-4 py-3">키워드</th>
              <th className="px-4 py-3 text-right">비용</th>
              <th className="px-4 py-3 text-right">ROAS</th>
              <th className="px-4 py-3 text-right">클릭수</th>
              <th className="px-4 py-3 text-right">전환수</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, i) => (
              <tr key={i} className="border-b border-gray-700 hover:bg-gray-700/30 transition-colors">
                <td className="px-4 py-3 font-medium text-white truncate max-w-[150px]">{item.keyword}</td>
                <td className="px-4 py-3 text-right font-mono">{formatCurrency(item.cost)}</td>
                <td className={`px-4 py-3 text-right font-bold ${item.roas >= 400 ? 'text-[#03C75A]' : item.roas < 150 ? 'text-red-400' : 'text-yellow-400'}`}>
                    {item.roas.toFixed(0)}%
                </td>
                <td className="px-4 py-3 text-right">{formatNumber(item.clicks)}</td>
                <td className="px-4 py-3 text-right">{formatNumber(item.conversions)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- DASHBOARD COMPONENT ---
const Dashboard = ({ result }: { result: AnalysisResult }) => {
  return (
    <div className="space-y-8 animate-fade-in">
       {/* 1. Executive Summary */}
       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className={`${COLORS.card} p-5 rounded-lg border border-gray-700`}>
             <p className="text-gray-400 text-sm">총 광고비</p>
             <p className="text-2xl font-bold text-white">{result.summary.totalCost}</p>
             <p className="text-xs text-gray-500 mt-1">{result.summary.costChange}</p>
          </div>
          <div className={`${COLORS.card} p-5 rounded-lg border border-gray-700`}>
             <p className="text-gray-400 text-sm">총 매출액</p>
             <p className="text-2xl font-bold text-white">{result.summary.totalRevenue}</p>
          </div>
          <div className={`${COLORS.card} p-5 rounded-lg border border-gray-700`}>
             <p className="text-gray-400 text-sm">평균 ROAS</p>
             <p className={`text-2xl font-bold ${result.summary.roasChange.includes('-') ? 'text-red-400' : 'text-[#03C75A]'}`}>{result.summary.totalRoas}</p>
             <p className="text-xs text-gray-500 mt-1">{result.summary.roasChange}</p>
          </div>
          <div className={`${COLORS.card} p-5 rounded-lg border border-gray-700`}>
             <p className="text-gray-400 text-sm">총 전환수</p>
             <p className="text-2xl font-bold text-white">{result.summary.totalConversions}</p>
          </div>
       </div>

       {/* 2. Charts Row */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Trend Line Chart */}
          <div className="lg:col-span-2 bg-[#454746] p-6 rounded-xl border border-gray-700 h-[350px]">
             <div className="flex items-center gap-2 mb-4">
               <ChartIcon />
               <h3 className="text-lg font-bold text-white">주간 성과 트렌드 (ROAS)</h3>
             </div>
             <ResponsiveContainer width="100%" height="100%">
               <LineChart data={result.trendData}>
                 <CartesianGrid strokeDasharray="3 3" stroke="#555" vertical={false} />
                 <XAxis dataKey="name" stroke="#999" fontSize={12} tickLine={false} axisLine={false} />
                 <YAxis stroke="#999" fontSize={12} tickLine={false} axisLine={false} />
                 <Tooltip contentStyle={{ backgroundColor: '#333', borderColor: '#555', color: '#fff' }} />
                 <Line type="monotone" dataKey="roas" stroke="#F05519" strokeWidth={2} dot={{r:3}} activeDot={{r:6}} />
               </LineChart>
             </ResponsiveContainer>
          </div>

          {/* Device Breakdown Bar Chart */}
          <div className="bg-[#454746] p-6 rounded-xl border border-gray-700 h-[350px]">
             <h3 className="text-lg font-bold text-white mb-4">디바이스별 ROAS 비교</h3>
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={result.performanceByDevice}>
                 <CartesianGrid strokeDasharray="3 3" stroke="#555" vertical={false} />
                 <XAxis dataKey="name" stroke="#999" fontSize={12} />
                 <YAxis stroke="#999" fontSize={12} />
                 <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: '#333', borderColor: '#555', color: '#fff' }} />
                 <Bar dataKey="value" fill="#F05519" radius={[4, 4, 0, 0]} name="ROAS (%)" barSize={40} />
               </BarChart>
             </ResponsiveContainer>
          </div>
       </div>

       {/* 3. Keywords Table */}
       {result.topKeywords && <KeywordTable keywords={result.topKeywords} />}

       {/* 4. Action Items & Issues */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#2d2f2e] border border-red-900/30 p-6 rounded-xl">
              <div className="flex items-center gap-2 mb-4">
                 <AlertIcon />
                 <h3 className="text-xl font-bold text-white">⚠️ 핵심 문제 (Critical Issues)</h3>
              </div>
              <ul className="space-y-3">
                 {result.criticalIssues.map((issue, i) => (
                    <li key={i} className="flex items-start gap-3 text-gray-300 text-sm">
                       <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded text-xs mt-0.5 whitespace-nowrap font-bold min-w-[60px] text-center">Issue {i+1}</span>
                       <span className="leading-relaxed">{issue}</span>
                    </li>
                 ))}
              </ul>
          </div>
          <div className="bg-[#2d2f2e] border border-green-900/30 p-6 rounded-xl">
              <div className="flex items-center gap-2 mb-4">
                 <CheckIcon />
                 <h3 className="text-xl font-bold text-white">🚀 실행 액션 (Action Plan)</h3>
              </div>
              <ul className="space-y-3">
                 {result.actionItems.map((action, i) => (
                    <li key={i} className="flex items-start gap-3 text-gray-300 text-sm">
                       <span className="bg-[#03C75A]/20 text-[#03C75A] px-2 py-0.5 rounded text-xs mt-0.5 whitespace-nowrap font-bold min-w-[65px] text-center">Action {i+1}</span>
                       <span className="leading-relaxed">{action}</span>
                    </li>
                 ))}
              </ul>
          </div>
       </div>

       {/* Print Button */}
       <div className="text-center pt-8 pb-12">
          <button onClick={() => window.print()} className="text-gray-400 hover:text-white underline text-sm">
             PDF 리포트로 저장하기 (브라우저 인쇄)
          </button>
       </div>
    </div>
  );
};

export const NaverSearchAds = ({ onUsageUpdated }: { onUsageUpdated?: () => void }) => {
    const [files, setFiles] = useState<UploadedFiles>({});
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [showExample, setShowExample] = useState(false);

    // --- SEO Optimization ---
    useEffect(() => {
        document.title = "네이버 검색광고 분석기 - AdAiAn | 키워드 광고 성과 최적화";
        
        const updateMeta = (name: string, content: string) => {
            let element = document.querySelector(`meta[name="${name}"]`);
            if (!element) {
                element = document.createElement('meta');
                element.setAttribute('name', name);
                document.head.appendChild(element);
            }
            element.setAttribute('content', content);
        };

        updateMeta('description', '네이버 검색광고(파워링크) 성과를 AI가 무료로 분석합니다. 비효율 키워드 발굴, 디바이스 최적화, ROAS 상승 전략을 제안합니다.');
        updateMeta('keywords', '네이버 검색광고 분석, 파워링크 최적화, 키워드 광고 분석, ROAS 개선, 검색광고 자동화');

        // Dynamic Canonical Tag
        const DOMAIN = "https://www.adaian.net";
        let linkCanonical = document.querySelector("link[rel='canonical']");
        if (!linkCanonical) {
            linkCanonical = document.createElement("link");
            linkCanonical.setAttribute("rel", "canonical");
            document.head.appendChild(linkCanonical);
        }
        linkCanonical.setAttribute("href", `${DOMAIN}/naver-search-analyzer`);

    }, []);

    const readFileAsText = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsText(file);
      });
    };

    const handleAnalyze = async () => {
        // --- AUTH CHECK BEFORE ANALYZE ---
        if (!auth.currentUser) {
            alert("상세 분석을 위해서는 로그인이 필요합니다.\n우측 상단의 로그인 버튼을 눌러주세요.");
            // We can't auto-trigger popup here easily without context, but alert guides them.
            return;
        }

        if (!files.campaign || !files.device || !files.keywords) {
            alert("3가지 데이터 파일을 모두 업로드해주세요.");
            return;
        }
        setIsAnalyzing(true);
        try {
            // --- DAILY LIMIT CHECK (READ ONLY) ---
            const remaining = await getRemainingDailyLimit(auth.currentUser.uid);
            if (remaining <= 0) {
              alert("일일 보고서 생성 횟수(2회)를 모두 소진했습니다. 내일 다시 이용해주세요.");
              setIsAnalyzing(false);
              return;
            }
            // -------------------------

            const [campaignText, deviceText, keywordText] = await Promise.all([
                readFileAsText(files.campaign),
                readFileAsText(files.device),
                readFileAsText(files.keywords)
            ]);
            const data = await analyzeNaverSearchData(campaignText, deviceText, keywordText);
            setResult(data);

            // --- SUCCESS: INCREMENT LIMIT & UPDATE UI ---
            await incrementDailyLimit(auth.currentUser.uid);
            if (onUsageUpdated) onUsageUpdated();

        } catch (error) {
            console.error(error);
            alert("AI 분석 생성에 실패했습니다. (횟수는 차감되지 않습니다.)\n파일 형식을 확인하거나 잠시 후 다시 시도해주세요.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleReset = () => {
        setResult(null);
        setFiles({});
    };

    return (
        <div className="animate-fade-in max-w-4xl mx-auto">
            {showExample && <ExampleReportModal onClose={() => setShowExample(false)} />}
            
            {!result && !isAnalyzing && (
                <>
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold mb-2 text-white">네이버 검색광고 분석기</h1>
                        <p className="text-gray-400">네이버 광고 시스템에서 다운로드한 3가지 엑셀(CSV) 파일을 업로드해주세요.</p>
                        <div className="mt-4 bg-[#454746] p-4 rounded text-sm text-gray-300 border border-gray-600">
                           <p className="flex items-center gap-2">
                             <span className="text-[#F05519] font-bold">!</span>
                             <span>최근 28일(4주) 데이터를 권장합니다. 개인정보는 절대 저장되지 않습니다.</span>
                           </p>
                        </div>
                    </div>

                    {/* Important Notice for First Time Users */}
                    <div className="mb-8 p-5 bg-orange-500/10 border border-orange-500/50 rounded-lg flex flex-col md:flex-row items-start md:items-center gap-4 animate-pulse-slow">
                        <div className="text-3xl">📢</div>
                        <div>
                            <h3 className="font-bold text-orange-400 text-lg mb-1">
                                최초 사용자 필독: 데이터 양식을 확인해주세요!
                            </h3>
                            <p className="text-sm text-gray-300 leading-relaxed">
                                정확한 AI 분석을 위해 <strong>아래 가이드와 동일한 형식(열 순서, 항목)</strong>의 엑셀 파일이 필요합니다.<br/>
                                <span className="text-gray-400 text-xs">양식이 다를 경우 분석이 실패하거나 엉뚱한 결과가 나올 수 있으니, 꼭 <span className="text-orange-400 underline cursor-pointer" onClick={() => document.querySelector('.guide-trigger')?.scrollIntoView({behavior: 'smooth'})}>데이터 추출 가이드</span>를 참고해주세요.</span>
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-4 mb-8">
                        <FileUploadZone 
                           label="1. 캠페인/주별 리포트" 
                           subtext="캠페인 이름, 기간(주) 포함\n(트렌드 분석용)"
                           file={files.campaign}
                           onFileSelect={(f) => setFiles(prev => ({...prev, campaign: f}))}
                        />
                        <FileUploadZone 
                           label="2. 디바이스/지면 리포트" 
                           subtext="PC/모바일, 검색/콘텐츠 구분 포함\n(매체 효율 분석용)"
                           file={files.device}
                           onFileSelect={(f) => setFiles(prev => ({...prev, device: f}))}
                        />
                        <FileUploadZone 
                           label="3. 검색어(키워드) 리포트" 
                           subtext="검색어별 성과 데이터 포함\n(키워드 발굴/제외용)"
                           file={files.keywords}
                           onFileSelect={(f) => setFiles(prev => ({...prev, keywords: f}))}
                        />
                    </div>

                    <button
                        onClick={handleAnalyze}
                        disabled={!files.campaign || !files.device || !files.keywords}
                        className={`w-full py-4 rounded-lg font-bold text-lg transition-all
                            ${(!files.campaign || !files.device || !files.keywords) 
                                ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                                : `bg-[#F05519] text-white hover:bg-[#d44612] shadow-lg shadow-orange-900/20`}
                        `}
                    >
                        AI 분석 실행하기
                    </button>
                    
                    <div className="guide-trigger">
                         <DataGuide />
                    </div>

                    {/* Report Example Trigger */}
                    <div className="mt-8 flex justify-center">
                        <button 
                            onClick={() => setShowExample(true)}
                            className="flex items-center gap-2 px-6 py-3 rounded-full border border-gray-600 hover:border-[#F05519] text-gray-300 hover:text-white transition-all bg-[#2d2f2e] shadow-lg"
                        >
                            <span className="text-xl">📊</span>
                            <span className="font-medium">분석 결과 예시 보기</span>
                        </button>
                    </div>
                </>
            )}

            {isAnalyzing && <LoadingScreen />}

            {result && (
                <>
                     <div className="flex justify-between items-center mb-8">
                        <div>
                        <h2 className="text-2xl font-bold text-white">분석 결과 리포트</h2>
                        <p className="text-gray-400 text-sm">AI Analysis based on Campaign, Device, Keyword Data</p>
                        </div>
                        <button onClick={handleReset} className="text-sm px-4 py-2 rounded border border-gray-600 hover:bg-gray-700 text-gray-300">
                        새로운 데이터 분석
                        </button>
                    </div>
                    <Dashboard result={result} />
                </>
            )}
        </div>
    );
};