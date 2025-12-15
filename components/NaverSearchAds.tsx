import React, { useState, useRef, useEffect } from 'react';
import { UploadedFiles, AnalysisResult, KeywordStat } from '../types';
import { analyzeNaverSearchData } from '../services/naverSearchService';
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
      <h3 className="text-xl font-bold text-whitemt-8 mt-8 mb-2 min-h-[28px] text-center px-4">
        {messages[messageIndex]}
      </h3>
      <p className="text-gray-400 text-sm">약 2-3분 정도 소요됩니다. 잠시만 기다려주세요.</p>
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
    <div className="mt-12 border-t border-gray-700 pt-8 animate-fade-in">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-lg font-bold text-white mb-6 hover:text-[#F05519] transition-colors"
      >
        <span className="flex items-center gap-2">
          <span className="text-[#F05519]">📘</span> 데이터 추출 가이드 (열기/닫기)
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
            정확한 AI 분석을 위해 네이버 검색광고 보고서를 아래 가이드에 맞춰 다운로드해주세요.
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
              <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-700 min-h-[150px]">
                  <img 
                    src={step.imgSrc} 
                    alt={`${step.title} 설정 예시`} 
                    className="w-full h-auto object-contain"
                    onError={handleImageError}
                  />
              </div>
            </div>
          ))}
          <div className="bg-[#454746] rounded-xl p-6 border border-red-900/30">
              <h4 className="text-lg font-bold mb-2 text-white flex items-center gap-2">
                <span className="text-red-500">⚠️</span> 데이터 용량 초과 경고가 뜰 경우
              </h4>
              <p className="text-gray-300 mb-4 text-sm">
                데이터 추출 시 경고가 뜬다면, <strong>비용이 0원인 키워드를 제외</strong>하고 다운로드해주세요.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                   <p className="text-xs text-gray-400">1. 경고 메시지 발생 시</p>
                   <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-700 min-h-[100px]">
                      <img src="/guide_images/guide4.png" alt="경고" className="w-full h-auto object-contain" onError={handleImageError} />
                   </div>
                </div>
                <div className="space-y-2">
                   <p className="text-xs text-gray-400">2. 필터 설정 (총비용 {'>'} 0원)</p>
                   <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-700 min-h-[100px]">
                      <img src="/guide_images/guide5.png" alt="필터" className="w-full h-auto object-contain" onError={handleImageError} />
                   </div>
                </div>
              </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DataTable = ({ title, headers, children }: { title: string; headers: string[]; children?: React.ReactNode }) => (
  <div className={`${COLORS.card} p-6 rounded-xl border border-gray-700 overflow-hidden`}>
    <h3 className="text-lg font-bold text-white mb-4">{title}</h3>
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left text-gray-400">
        <thead className="text-xs text-gray-200 uppercase bg-gray-700/50">
          <tr>
            {headers.map((h, i) => (
              <th key={i} scope="col" className="px-4 py-3 whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {children}
        </tbody>
      </table>
    </div>
  </div>
);

const KeywordsTable = ({ keywords }: { keywords: KeywordStat[] }) => {
  const [showAll, setShowAll] = useState(false);
  const itemsToShow = showAll ? keywords : keywords.slice(0, 20);
  
  return (
    <div className={`${COLORS.card} p-6 rounded-xl border border-gray-700 overflow-hidden`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-white">비용 기준 상위 키워드</h3>
        {keywords.length > 20 && (
          <button 
            onClick={() => setShowAll(!showAll)}
            className="text-xs px-3 py-1.5 rounded border border-gray-600 hover:bg-gray-700 text-gray-300 transition-colors"
          >
            {showAll ? '접기 (Top 20)' : `더 보기 (전체 ${keywords.length}개)`}
          </button>
        )}
      </div>
      <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
        <table className="w-full text-sm text-left text-gray-400">
          <thead className="text-xs text-gray-200 uppercase bg-gray-700/50 sticky top-0">
            <tr>
              <th scope="col" className="px-4 py-3">키워드</th>
              <th scope="col" className="px-4 py-3 text-right">총비용</th>
              <th scope="col" className="px-4 py-3 text-right">매출액</th>
              <th scope="col" className="px-4 py-3 text-right">ROAS</th>
              <th scope="col" className="px-4 py-3 text-right">클릭수</th>
              <th scope="col" className="px-4 py-3 text-right">전환수</th>
            </tr>
          </thead>
          <tbody>
            {itemsToShow.map((kw, i) => (
              <tr key={i} className="border-b border-gray-700 hover:bg-gray-700/30 transition-colors">
                <td className="px-4 py-3 font-medium text-white truncate max-w-[200px]">{kw.keyword}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(kw.cost)}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(kw.revenue)}</td>
                <td className={`px-4 py-3 text-right font-bold ${kw.roas >= 200 ? 'text-green-400' : 'text-red-400'}`}>
                  {kw.roas}%
                </td>
                <td className="px-4 py-3 text-right">{formatNumber(kw.clicks)}</td>
                <td className="px-4 py-3 text-right">{formatNumber(kw.conversions)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ResultDashboard = ({ result }: { result: AnalysisResult }) => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "총 광고비", value: result.summary.totalCost, change: result.summary.costChange, positive: false },
          { label: "총 매출액", value: result.summary.totalRevenue, change: "", positive: true },
          { label: "평균 ROAS", value: result.summary.totalRoas, change: result.summary.roasChange, positive: true },
          { label: "총 전환수", value: result.summary.totalConversions, change: "", positive: true },
        ].map((stat, i) => (
            <div key={i} className={`${COLORS.card} p-5 rounded-lg border border-gray-700`}>
              <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
              <div className="flex items-end justify-between">
                <span className="text-2xl font-bold text-white">{stat.value}</span>
                {stat.change && (
                  <span className={`text-sm font-medium ${stat.change.includes('+') ? (stat.positive ? 'text-green-400' : 'text-red-400') : (stat.positive ? 'text-red-400' : 'text-green-400')}`}>
                    {stat.change}
                  </span>
                )}
              </div>
            </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`${COLORS.card} p-6 rounded-xl border border-gray-700 lg:col-span-2`}>
          <div className="flex items-center gap-2 mb-6">
            <ChartIcon />
            <h3 className="text-lg font-bold text-white">주간 성과 트렌드 (ROAS & Cost)</h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={result.trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#555" vertical={false} />
                <XAxis dataKey="name" stroke="#999" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" stroke="#999" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="#999" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#333', borderColor: '#555', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="roas" name="ROAS (%)" stroke="#F05519" strokeWidth={2} dot={{r:4}} activeDot={{r:6}} />
                <Line yAxisId="right" type="monotone" dataKey="cost" name="Cost" stroke="#8884d8" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className={`${COLORS.card} p-6 rounded-xl border border-gray-700`}>
           <div className="flex items-center gap-2 mb-6">
            <h3 className="text-lg font-bold text-white">디바이스별 ROAS</h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={result.performanceByDevice}>
                 <CartesianGrid strokeDasharray="3 3" stroke="#555" vertical={false} />
                 <XAxis dataKey="name" stroke="#999" />
                 <YAxis stroke="#999" />
                 <Tooltip cursor={{fill: '#55555550'}} contentStyle={{ backgroundColor: '#333', borderColor: '#555', color: '#fff' }} />
                 <Bar dataKey="value" name="ROAS" fill="#F05519" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <DataTable title="주간 데이터 요약" headers={["주차", "비용", "매출", "ROAS", "클릭수", "전환수"]}>
          {result.weeklyStats?.map((stat, i) => (
            <tr key={i} className="border-b border-gray-700 hover:bg-gray-700/30 transition-colors">
              <td className="px-4 py-3 font-medium text-white">{stat.date}</td>
              <td className="px-4 py-3">{formatCurrency(stat.cost)}</td>
              <td className="px-4 py-3">{formatCurrency(stat.revenue)}</td>
              <td className={`px-4 py-3 font-bold ${stat.roas >= 200 ? 'text-green-400' : 'text-red-400'}`}>{stat.roas}%</td>
              <td className="px-4 py-3">{formatNumber(stat.clicks)}</td>
              <td className="px-4 py-3">{formatNumber(stat.conversions)}</td>
            </tr>
          ))}
        </DataTable>
        <DataTable title="캠페인별 성과" headers={["캠페인명", "비용", "매출", "ROAS", "클릭수"]}>
          {result.campaignStats?.map((stat, i) => (
            <tr key={i} className="border-b border-gray-700 hover:bg-gray-700/30 transition-colors">
              <td className="px-4 py-3 font-medium text-white">{stat.name}</td>
              <td className="px-4 py-3">{formatCurrency(stat.cost)}</td>
              <td className="px-4 py-3">{formatCurrency(stat.revenue)}</td>
              <td className={`px-4 py-3 font-bold ${stat.roas >= 200 ? 'text-green-400' : 'text-red-400'}`}>{stat.roas}%</td>
              <td className="px-4 py-3">{formatNumber(stat.clicks)}</td>
            </tr>
          ))}
        </DataTable>
        <DataTable title="디바이스/지면별 성과" headers={["디바이스", "지면", "비용", "매출", "ROAS", "클릭수"]}>
          {result.deviceStats?.map((stat, i) => (
            <tr key={i} className="border-b border-gray-700 hover:bg-gray-700/30 transition-colors">
              <td className="px-4 py-3 font-medium text-white">{stat.device}</td>
              <td className="px-4 py-3 text-gray-300">{stat.placement}</td>
              <td className="px-4 py-3">{formatCurrency(stat.cost)}</td>
              <td className="px-4 py-3">{formatCurrency(stat.revenue)}</td>
              <td className={`px-4 py-3 font-bold ${stat.roas >= 200 ? 'text-green-400' : 'text-red-400'}`}>{stat.roas}%</td>
              <td className="px-4 py-3">{formatNumber(stat.clicks)}</td>
            </tr>
          ))}
        </DataTable>
        <KeywordsTable keywords={result.topKeywords || []} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className={`${COLORS.card} p-6 rounded-xl border border-gray-700`}>
            <h3 className="text-lg font-bold text-white mb-4">💡 AI 상세 인사이트</h3>
            <div className="space-y-4">
              {result.insights.map((insight, i) => (
                <div key={i} className="bg-[#2d2f2e] p-4 rounded-lg border-l-2 border-[#F05519]">
                   <div className="flex justify-between items-center mb-1">
                      <h4 className="font-bold text-white">{insight.title}</h4>
                      <span className={`text-[10px] uppercase px-2 py-0.5 rounded ${
                        insight.severity === 'high' ? 'bg-red-900 text-red-200' : 'bg-gray-700 text-gray-300'
                      }`}>{insight.severity}</span>
                   </div>
                   <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-line">{insight.description}</p>
                </div>
              ))}
            </div>
         </div>
         <div className={`${COLORS.card} p-6 rounded-xl border border-gray-700`}>
            <div className="flex items-center gap-2 mb-4">
               <SearchIcon />
               <h3 className="text-lg font-bold text-white">키워드 제안</h3>
            </div>
            <div className="mb-6">
              <h4 className="text-sm text-green-400 font-bold mb-2 uppercase tracking-wide">확장 추천 (Opportunities)</h4>
              <div className="flex flex-wrap gap-2">
                {result.keywordOpportunities?.map((kw, i) => (
                  <span key={i} className="bg-green-900/30 text-green-200 text-xs px-3 py-1.5 rounded-full border border-green-900/50">{kw}</span>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm text-red-400 font-bold mb-2 uppercase tracking-wide">제외 추천 (Negative)</h4>
              <div className="flex flex-wrap gap-2">
                {result.negativeKeywords?.map((kw, i) => (
                  <span key={i} className="bg-red-900/30 text-red-200 text-xs px-3 py-1.5 rounded-full border border-red-900/50">{kw}</span>
                ))}
              </div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#2d2f2e] border border-red-900/30 p-6 rounded-xl">
          <div className="flex items-center gap-2 mb-4">
            <div className="text-red-500"><AlertIcon /></div>
            <h3 className="text-xl font-bold text-white">핵심 문제점 (Critical Issues)</h3>
          </div>
          <ul className="space-y-3">
            {result.criticalIssues.map((issue, i) => (
              <li key={i} className="flex items-start gap-3 text-gray-300">
                <span className="bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded mt-0.5 whitespace-nowrap">Issue {i+1}</span>
                <span className="text-sm leading-relaxed whitespace-pre-line">{issue}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-[#2d2f2e] border border-green-900/30 p-6 rounded-xl">
          <div className="flex items-center gap-2 mb-4">
            <div className="text-green-500"><CheckIcon /></div>
            <h3 className="text-xl font-bold text-white">실행 액션 (Immediate Actions)</h3>
          </div>
          <ul className="space-y-3">
            {result.actionItems.map((action, i) => (
              <li key={i} className="flex items-start gap-3 text-gray-300">
                <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded mt-0.5 whitespace-nowrap">Action {i+1}</span>
                <span className="text-sm leading-relaxed whitespace-pre-line">{action}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      <div className="text-center pt-8 pb-12">
        <button onClick={() => window.print()} className="text-gray-400 hover:text-white underline text-sm">
          PDF 리포트로 저장하기 (브라우저 인쇄)
        </button>
      </div>
    </div>
  );
};

// --- FAQ SECTION COMPONENT ---
const FAQSection = () => {
    const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
    
    const faqs = [
        {
            q: "네이버 검색광고 분석기는 어떤 데이터를 분석하나요?",
            a: "캠페인별 성과, 키워드(검색어) 효율, 그리고 PC/모바일 디바이스별 성과 데이터를 종합적으로 분석하여 최적화 포인트를 찾아냅니다."
        },
        {
            q: "분석하려면 어떤 리포트를 다운로드해야 하나요?",
            a: "네이버 광고 시스템에서 1. 캠페인 리포트(주별), 2. 광고그룹/매체 리포트, 3. 검색어 리포트 3가지를 CSV형태로 다운로드하시면 됩니다."
        },
        {
            q: "대행사 없이 직접 최적화가 가능한가요?",
            a: "네, AdAiAn은 '비용은 높지만 전환이 없는 키워드'를 자동으로 식별하고, '제외 키워드' 추천을 통해 광고비 누수를 즉시 막을 수 있도록 돕습니다."
        },
        {
            q: "분석 결과에서 ROAS 개선 방법을 알려주나요?",
            a: "단순 통계가 아닌 AI가 직접 진단한 '실행 액션'을 제공합니다. 예: '모바일 입찰가 20% 하향 조정 필요', '키워드 [OOO] OFF 권장' 등 구체적인 가이드를 드립니다."
        }
    ];

    const toggleFaq = (index: number) => {
        setOpenFaqIndex(openFaqIndex === index ? null : index);
    };

    return (
        <section className="mt-16 border-t border-gray-700 pt-16 mb-24">
            <h3 className="text-2xl font-bold text-center text-white mb-2">네이버 검색광고 분석 자주 묻는 질문</h3>
            <p className="text-center text-gray-400 mb-8">검색광고 최적화에 대해 궁금한 점을 확인하세요.</p>
            <div className="max-w-3xl mx-auto space-y-4">
                {faqs.map((item, idx) => (
                    <div key={idx} className="border border-gray-700 rounded-lg bg-[#373938] overflow-hidden">
                        <button
                            onClick={() => toggleFaq(idx)}
                            className="w-full px-6 py-4 text-left flex justify-between items-center focus:outline-none hover:bg-gray-700/50 transition-colors"
                        >
                            <span className="font-medium text-white">{item.q}</span>
                            <span className={`transform transition-transform ${openFaqIndex === idx ? 'rotate-180' : ''} text-[#F05519]`}>
                                ▼
                            </span>
                        </button>
                        {openFaqIndex === idx && (
                            <div className="px-6 py-4 bg-[#454746] text-gray-300 text-sm leading-relaxed border-t border-gray-700 animate-fade-in">
                                {item.a}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </section>
    );
};

// --- MAIN COMPONENT ---

interface NaverSearchAdsProps {
  apiKey: string;
}

export const NaverSearchAds = ({ apiKey }: NaverSearchAdsProps) => {
  const [files, setFiles] = useState<UploadedFiles>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  
  // --- SEO Optimization ---
  useEffect(() => {
    document.title = "네이버 검색광고 분석기 - AdAiAn | 파워링크 AI 진단 & 최적화";
    
    const updateMeta = (name: string, content: string) => {
      let element = document.querySelector(`meta[name="${name}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute('name', name);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    updateMeta('description', '네이버 검색광고(파워링크) 성과를 AI가 무료로 분석해드립니다. 키워드 효율 진단, ROAS 최적화, 제외 키워드 추천까지 한 번에 확인하세요.');
    updateMeta('keywords', '네이버 검색광고 분석기, 파워링크 분석, 검색광고 최적화, 키워드 광고 분석, 네이버 광고 ROAS');

    // Schema Markup for FAQ
    const schemaId = 'schema-faq-search';
    const oldSchema = document.getElementById(schemaId);
    if (oldSchema) oldSchema.remove();

    const schemaData = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "네이버 검색광고 분석기는 어떤 데이터를 분석하나요?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "캠페인 리포트, 키워드(검색어) 리포트, 그리고 디바이스별 성과 데이터를 종합 분석하여 비용 누수 지점과 기회 요인을 찾아냅니다."
          }
        },
        {
          "@type": "Question",
          "name": "대행사 없이 직접 최적화가 가능한가요?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "네, AdAiAn은 AI가 직접 '제외해야 할 키워드'와 '입찰가를 조정해야 할 캠페인'을 구체적으로 알려주므로 초보자도 쉽게 성과를 개선할 수 있습니다."
          }
        }
      ]
    };

    const script = document.createElement('script');
    script.id = schemaId;
    script.type = 'application/ld+json';
    script.innerHTML = JSON.stringify(schemaData);
    document.head.appendChild(script);

  }, []);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; 

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const handleAnalyze = async () => {
    if (!files.campaign || !files.device || !files.keywords) {
      alert("모든 데이터 파일을 업로드해주세요.");
      return;
    }

    const totalSize = files.campaign.size + files.device.size + files.keywords.size;
    if (totalSize > MAX_FILE_SIZE) {
       alert("업로드하는 과정에서 너무 데이터가 큽니다. 기간조정이나 비용필터를통해 데이터를 간소화 해주세요.");
       return;
    }

    setIsAnalyzing(true);
    try {
      const [campaignText, deviceText, keywordText] = await Promise.all([
        readFileAsText(files.campaign),
        readFileAsText(files.device),
        readFileAsText(files.keywords)
      ]);
      const data = await analyzeNaverSearchData(campaignText, deviceText, keywordText, apiKey);
      setResult(data);
    } catch (error) {
      console.error(error);
      alert("AI 분석 생성에 실패했습니다.\n\n업로드하는 과정에서 너무 데이터가 큽니다. 기간조정이나 비용필터를통해 데이터를 간소화 해주세요.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setFiles({});
  };

  return (
    <div className="animate-fade-in">
      {!result && !isAnalyzing && (
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">네이버 검색광고 분석기</h1>
            <p className="text-gray-400">네이버 검색광고 관리자에서 다운로드한 3가지 리포트를 업로드해주세요.</p>
            <div className="mt-4 bg-[#454746] p-4 rounded text-sm text-gray-300 border border-gray-600 space-y-2">
              <p className="flex items-start gap-2">
                <span className="text-[#F05519] font-bold">✓</span>
                <span>모든 데이터는 <strong>최근 30일 기준</strong>을 권장합니다.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-[#F05519] font-bold">✓</span>
                <span>데이터가 너무 많아 업로드가 실패할 경우 기간을 줄여 다시 업로드해주세요.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-yellow-500 font-bold">!</span>
                <span>네이버 광고 전환은 '구매' 기준입니다. 전환 데이터가 없으면 분석 정확도가 낮아질 수 있습니다.</span>
              </p>
            </div>
          </div>
          <div className="grid gap-4 mb-8">
            <FileUploadZone 
              label="1. 캠페인 구조 성과 (.csv)" 
              subtext="캠페인 유형, 캠페인, 주별 구분\n(총비용/노출수/클릭수/전환수/매출/ROAS)"
              file={files.campaign}
              onFileSelect={(f) => setFiles(prev => ({...prev, campaign: f}))}
            />
            <FileUploadZone 
              label="2. 디바이스/지면 분석 (.csv)" 
              subtext="캠페인, 광고그룹, PC/모바일, 검색/콘텐츠 구분\n(총비용/노출수/클릭수/전환수/매출/ROAS)"
              file={files.device}
              onFileSelect={(f) => setFiles(prev => ({...prev, device: f}))}
            />
            <FileUploadZone 
              label="3. 검색어 분석 (.csv)" 
              subtext="캠페인 유형, 검색어 구분\n(검색어가 너무 많을 경우 비용 0원 검색어는 제외 후 업로드 권장)"
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
                : `${COLORS.primaryBg} text-white hover:opacity-90 shadow-lg`}
            `}
          >
            AI 분석 실행하기
          </button>
          <DataGuide />
          
          {/* FAQ Section */}
          <FAQSection />
        </div>
      )}
      {isAnalyzing && <LoadingScreen />}
      {result && (
        <>
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold">분석 결과 리포트</h2>
              <p className="text-gray-400 text-sm">AdAiAn AI generated analysis</p>
            </div>
            <button onClick={handleReset} className="text-sm px-4 py-2 rounded border border-gray-600 hover:bg-gray-700 text-gray-300">
              새로운 데이터 분석
            </button>
          </div>
          <ResultDashboard result={result} />
        </>
      )}
    </div>
  );
};