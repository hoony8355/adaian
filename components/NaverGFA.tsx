import React, { useState, useRef, useEffect } from 'react';
import { UploadedFiles, AnalysisResult, GFACreativeStat, GFAAudienceStat } from '../types';
import { analyzeNaverGFAData } from '../services/naverGFAService';
import { getRemainingDailyLimit, incrementDailyLimit, auth } from '../services/firebase';
import { UploadIcon, CheckIcon, ChartIcon, AlertIcon } from './Icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const COLORS = {
  bg: 'bg-[#373938]',
  card: 'bg-[#454746]',
  primary: 'text-[#03C75A]', // Naver Green
  primaryBg: 'bg-[#03C75A]',
  secondary: 'text-[#F05519]',
};

// --- HELPER COMPONENTS ---

const formatCurrency = (value: number) => new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(value);
const formatNumber = (value: number) => new Intl.NumberFormat('ko-KR').format(value);

const LoadingScreen = () => {
    const [messageIndex, setMessageIndex] = useState(0);
    const messages = [
      "성과형 디스플레이(GFA) 데이터를 분석하고 있습니다...",
      "소재별 피로도(Frequency)를 체크하고 있습니다...",
      "어떤 연령대 타겟이 비효율적인지 찾고 있습니다...",
      "잠시만 기다려주세요, 거의 다 됐습니다..."
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
          <div className="w-16 h-16 border-4 border-gray-700 border-t-[#03C75A] rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-2 h-2 bg-[#03C75A] rounded-full animate-pulse"></div>
          </div>
        </div>
        <h3 className="text-xl font-bold text-white mt-8 mb-2 px-4 text-center">
             {messages[messageIndex]}
        </h3>
        <p className="text-gray-400 text-sm">GFA는 데이터 양이 많아 분석에 시간이 조금 더 걸릴 수 있습니다.</p>
      </div>
    );
};

const GFAExampleReportModal = ({ onClose }: { onClose: () => void }) => {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-[#2d2f2e] w-full max-w-4xl max-h-[90vh] rounded-xl border border-gray-600 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-white">📊 GFA 분석 리포트 예시</h2>
            <p className="text-sm text-gray-400">성과형 디스플레이 광고의 소재/타겟 심층 분석 결과입니다.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-6">
          {/* 1. 요약 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#454746] p-4 rounded-lg border border-gray-700">
               <p className="text-gray-400 text-xs">총 매출액</p>
               <p className="text-lg font-bold text-white">₩8,450,000</p>
            </div>
            <div className="bg-[#454746] p-4 rounded-lg border border-gray-700">
               <p className="text-gray-400 text-xs">평균 ROAS</p>
               <p className="text-lg font-bold text-[#03C75A]">285%</p>
            </div>
             <div className="bg-[#454746] p-4 rounded-lg border border-gray-700">
               <p className="text-gray-400 text-xs">총 전환수</p>
               <p className="text-lg font-bold text-white">142건</p>
            </div>
             <div className="bg-[#454746] p-4 rounded-lg border border-gray-700">
               <p className="text-gray-400 text-xs">CPM</p>
               <p className="text-lg font-bold text-white">₩6,500</p>
            </div>
          </div>

          {/* 2. 퍼널 진단 (Mock Visual) */}
          <div className="bg-[#454746] p-6 rounded-xl border border-gray-700">
              <h3 className="font-bold text-white mb-4">📢 퍼널(Funnel) 진단</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-center">
                  <div className="bg-[#2d2f2e] p-2 rounded">
                      <span className="text-xs text-gray-400">CPM</span><br/>
                      <span className="font-bold text-white">Good</span>
                  </div>
                   <div className="bg-[#2d2f2e] p-2 rounded border border-red-500/50">
                      <span className="text-xs text-gray-400">CTR</span><br/>
                      <span className="font-bold text-red-400">1.2% (Low)</span>
                  </div>
                   <div className="bg-[#2d2f2e] p-2 rounded">
                      <span className="text-xs text-gray-400">CPC</span><br/>
                      <span className="font-bold text-white">₩350</span>
                  </div>
                   <div className="bg-[#2d2f2e] p-2 rounded border border-[#03C75A]/50">
                      <span className="text-xs text-gray-400">CVR</span><br/>
                      <span className="font-bold text-[#03C75A]">3.5% (High)</span>
                  </div>
                   <div className="bg-[#2d2f2e] p-2 rounded">
                      <span className="text-xs text-gray-400">ROAS</span><br/>
                      <span className="font-bold text-white">285%</span>
                  </div>
              </div>
              <div className="mt-4 text-sm text-gray-300 bg-gray-900/50 p-3 rounded">
                  <strong>AI 진단:</strong> 클릭률(CTR)이 낮지만 전환율(CVR)은 우수합니다. 이는 <strong>소재(이미지) 매력도가 떨어짐</strong>을 의미합니다. 소재만 개선하면 ROAS가 350% 이상으로 상승할 잠재력이 있습니다.
              </div>
          </div>

          {/* 3. 소재 분석 예시 */}
          <div className="bg-[#454746] p-6 rounded-xl border border-gray-700">
              <h3 className="font-bold text-white mb-4">🏆 소재(Creative) 효율 분석</h3>
              <table className="w-full text-sm text-left text-gray-400">
                <thead className="bg-gray-700/50 text-xs uppercase">
                    <tr><th className="p-2">소재명</th><th className="p-2">비용</th><th className="p-2">ROAS</th><th className="p-2">빈도</th></tr>
                </thead>
                <tbody>
                    <tr className="border-b border-gray-700">
                        <td className="p-2 text-white">Review_Image_01</td>
                        <td className="p-2">₩500,000</td>
                        <td className="p-2 text-[#03C75A] font-bold">420%</td>
                        <td className="p-2">1.5</td>
                    </tr>
                    <tr className="border-b border-gray-700">
                        <td className="p-2 text-white">Event_Banner_B</td>
                        <td className="p-2">₩800,000</td>
                        <td className="p-2 text-red-400 font-bold">95%</td>
                        <td className="p-2 text-red-400 font-bold">4.2</td>
                    </tr>
                </tbody>
              </table>
              <div className="mt-2 text-xs text-red-300">
                 * Event_Banner_B는 빈도(Frequency)가 4.2회로 높아져 효율이 급감했습니다. 교체가 시급합니다.
              </div>
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

const FileUploadZone = ({ label, subtext, file, onFileSelect }: { label: string, subtext: string, file?: File, onFileSelect: (f: File) => void }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    return (
        <div 
            className={`relative border-2 border-dashed rounded-lg p-6 cursor-pointer group transition-all
            ${file ? 'border-[#03C75A] bg-[#03C75A]/5' : 'border-gray-600 hover:border-gray-400 hover:bg-gray-700'}`}
            onClick={() => inputRef.current?.click()}
        >
            <input type="file" className="hidden" ref={inputRef} accept=".csv,.xlsx,.xls" onChange={(e) => e.target.files?.[0] && onFileSelect(e.target.files[0])} />
            <div className="flex flex-col items-center justify-center text-center">
                {file ? (
                    <>
                        <div className="bg-[#03C75A] rounded-full p-2 mb-2"><CheckIcon /></div>
                        <p className="text-sm font-medium text-white truncate max-w-[200px]">{file.name}</p>
                    </>
                ) : (
                    <>
                        <div className="text-gray-400 mb-2 group-hover:text-white"><UploadIcon /></div>
                        <p className="text-sm font-medium text-gray-300">{label}</p>
                        <p className="text-[11px] text-gray-500 mt-1 whitespace-pre-line">{subtext}</p>
                    </>
                )}
            </div>
        </div>
    );
};

const GFADataGuide = () => {
    const [isOpen, setIsOpen] = useState(false);
    
    // GFA Combination Guide Steps
    const steps = [
      {
        title: "1. 캠페인/퍼널 분석용",
        desc: "일자별 추이와 퍼널 단계별 전환율을 분석합니다.",
        settings: "분석 단위: 캠페인 / 기간: 일(Daily)",
        metrics: "총 비용, 노출, 클릭, CTR, CPC, CPM, 구매완료수, 전환 매출액, ROAS",
        imgSrc: "/gfa_guide_images/guide1.png"
      },
      {
        title: "2. 소재(Creative) 분석용",
        desc: "소재별 피로도와 효율을 분석합니다.",
        settings: "분석 단위: 광고 소재 / 기간: 전체",
        metrics: "기본 지표 + 도달(Reach), 도달비용, 노출빈도(Frequency)",
        imgSrc: "/gfa_guide_images/guide2.png"
      },
      {
        title: "3. 타겟(Audience) 분석용",
        desc: "광고 그룹별 연령/성별 효율을 분석합니다.",
        settings: "분석 단위: 광고 그룹, 오디언스(성별/연령) / 기간: 전체",
        metrics: "총 비용, 노출, 클릭, CTR, CPC, CPM, 구매완료수, 전환 매출액, ROAS",
        imgSrc: "/gfa_guide_images/guide3.png"
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
            <span class="text-[10px] mt-1 text-gray-600 block">프로젝트 최상위의 public 폴더 안에 gfa_guide_images 폴더가 있는지 확인해주세요.</span>
          </div>
        `;
      }
    };
  
    return (
      <div className="mt-12 border-t border-gray-700 pt-8 animate-fade-in">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between text-lg font-bold text-white mb-6 hover:text-[#03C75A] transition-colors"
        >
          <span className="flex items-center gap-2">
            <span className="text-[#03C75A]">📘</span> GFA 데이터 추출 가이드 (열기/닫기)
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
              정확한 GFA 분석을 위해 아래 3가지 조합으로 리포트를 다운로드해주세요.
            </p>
            {steps.map((step, idx) => (
              <div key={idx} className="bg-[#454746] rounded-xl p-6 border border-gray-600">
                <h4 className="text-lg font-bold mb-2 text-white">{step.title}</h4>
                <p className="text-gray-300 mb-4 text-sm">{step.desc}</p>
                <div className="bg-gray-800/50 p-4 rounded mb-6 text-sm text-gray-300 border border-gray-700">
                    <div className="mb-2">
                      <span className="text-[#03C75A] font-bold mr-2">📌 기본 설정:</span> 
                      <span className="font-mono text-xs text-gray-400">{step.settings}</span>
                    </div>
                    <div>
                      <span className="text-[#03C75A] font-bold mr-2">📊 지표 설정:</span> 
                      <span className="font-mono text-xs text-gray-400">{step.metrics}</span>
                    </div>
                </div>
                <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-700 min-h-[150px] group relative">
                    <div className="absolute top-2 right-2 bg-black/70 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                       마우스 오버시 확대
                    </div>
                    <img 
                      src={step.imgSrc} 
                      alt={`${step.title} 설정 예시`} 
                      className="w-full h-auto object-contain transition-transform duration-300 ease-in-out group-hover:scale-[1.7] cursor-zoom-in origin-center"
                      onError={handleImageError}
                    />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

const FunnelCard = ({ label, value, subLabel }: { label: string, value: string, subLabel?: string }) => (
    <div className="bg-[#2d2f2e] p-4 rounded-lg border border-gray-700 flex flex-col items-center text-center relative">
        <span className="text-gray-400 text-xs uppercase mb-1">{label}</span>
        <span className="text-xl font-bold text-white">{value}</span>
        {subLabel && <span className="text-[10px] text-gray-500 mt-1">{subLabel}</span>}
        {/* Connector Line */}
        <div className="hidden md:block absolute top-1/2 -right-3 w-4 h-[2px] bg-gray-700 transform -translate-y-1/2 last:hidden"></div>
    </div>
);

const CreativeTable = ({ creatives }: { creatives: GFACreativeStat[] }) => {
    const [showAll, setShowAll] = useState(false);
    // Client-side sort by cost descending to ensure consistency
    const sortedCreatives = [...creatives].sort((a, b) => b.cost - a.cost);
    const data = showAll ? sortedCreatives : sortedCreatives.slice(0, 10);
    
    return (
        <div className={`${COLORS.card} p-6 rounded-xl border border-gray-700 overflow-hidden`}>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white">🏆 소재(Creative) 성과 분석 (비용순)</h3>
                <button onClick={() => setShowAll(!showAll)} className="text-xs px-3 py-1.5 rounded border border-gray-600 text-gray-300">
                    {showAll ? '접기' : '더 보기'}
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-400">
                    <thead className="text-xs text-gray-200 uppercase bg-gray-700/50">
                        <tr>
                            <th className="px-4 py-3">소재명</th>
                            <th className="px-4 py-3 text-right">비용</th>
                            <th className="px-4 py-3 text-right">ROAS</th>
                            <th className="px-4 py-3 text-right">CTR</th>
                            <th className="px-4 py-3 text-right">빈도</th>
                            <th className="px-4 py-3 text-right">도달수</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((item, i) => (
                            <tr key={i} className="border-b border-gray-700 hover:bg-gray-700/30 transition-colors">
                                <td className="px-4 py-3 text-white truncate max-w-[150px]">{item.creativeName}</td>
                                <td className="px-4 py-3 text-right font-mono">{formatCurrency(item.cost)}</td>
                                <td className={`px-4 py-3 text-right font-bold ${item.roas >= 200 ? 'text-[#03C75A]' : item.roas < 100 ? 'text-red-400' : 'text-yellow-400'}`}>
                                    {item.roas.toFixed(0)}%
                                </td>
                                <td className="px-4 py-3 text-right">{item.ctr.toFixed(2)}%</td>
                                <td className={`px-4 py-3 text-right ${item.frequency >= 4 ? 'text-red-400 font-bold' : ''}`}>{item.frequency.toFixed(1)}</td>
                                <td className="px-4 py-3 text-right">{formatNumber(item.reach)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const AudienceTable = ({ title, stats }: { title: string, stats: GFAAudienceStat[] }) => {
    // Sort by Cost
    const sorted = [...stats].sort((a,b) => b.cost - a.cost).slice(0, 5);
    
    return (
        <div className={`${COLORS.card} p-5 rounded-xl border border-gray-700`}>
            <h4 className="font-bold text-white mb-4">{title}</h4>
            <div className="space-y-3">
                {sorted.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                         <div className="flex flex-col">
                             <span className="text-white font-medium">{item.segment}</span>
                             <span className="text-xs text-gray-500">{formatCurrency(item.cost)}</span>
                         </div>
                         <div className="text-right">
                             <span className={`font-bold ${item.roas >= 200 ? 'text-[#03C75A]' : 'text-gray-400'}`}>{item.roas.toFixed(0)}%</span>
                             <div className="text-[10px] text-gray-500">ROAS</div>
                         </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const GFADashboard = ({ result }: { result: AnalysisResult }) => {
    return (
        <div className="space-y-8 animate-fade-in">
             {/* Summary & Funnel */}
             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className={`${COLORS.card} p-5 rounded-lg border border-gray-700`}>
                     <p className="text-gray-400 text-sm">총 광고비</p>
                     <p className="text-2xl font-bold text-white">{result.summary.totalCost}</p>
                  </div>
                   <div className={`${COLORS.card} p-5 rounded-lg border border-gray-700`}>
                     <p className="text-gray-400 text-sm">총 매출액</p>
                     <p className="text-2xl font-bold text-white">{result.summary.totalRevenue}</p>
                  </div>
                   <div className={`${COLORS.card} p-5 rounded-lg border border-gray-700`}>
                     <p className="text-gray-400 text-sm">ROAS</p>
                     <p className="text-2xl font-bold text-[#03C75A]">{result.summary.totalRoas}</p>
                  </div>
                   <div className={`${COLORS.card} p-5 rounded-lg border border-gray-700`}>
                     <p className="text-gray-400 text-sm">전환수</p>
                     <p className="text-2xl font-bold text-white">{result.summary.totalConversions}</p>
                  </div>
             </div>

             {/* Funnel Analysis */}
             {result.funnelAnalysis && (
                <div className={`${COLORS.card} p-6 rounded-xl border border-gray-700`}>
                    <h3 className="text-lg font-bold text-white mb-6">📢 퍼널(Funnel) 진단</h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <FunnelCard label="CPM (노출단가)" value={formatCurrency(result.funnelAnalysis.cpm)} />
                        <FunnelCard label="CTR (클릭률)" value={`${result.funnelAnalysis.ctr.toFixed(2)}%`} />
                        <FunnelCard label="CPC (클릭단가)" value={formatCurrency(result.funnelAnalysis.cpc)} />
                        <FunnelCard label="CVR (전환율)" value={`${result.funnelAnalysis.cvr.toFixed(2)}%`} />
                        <FunnelCard label="ROAS" value={`${result.funnelAnalysis.roas.toFixed(0)}%`} />
                    </div>
                    <div className="mt-6 bg-[#2d2f2e] p-4 rounded border border-gray-600">
                         <span className="text-[#03C75A] font-bold mr-2">AI 진단:</span>
                         <span className="text-gray-300 text-sm leading-relaxed">{result.funnelAnalysis.diagnosis}</span>
                    </div>
                </div>
             )}

             {/* Trend Chart */}
             <div className={`${COLORS.card} p-6 rounded-xl border border-gray-700 h-[350px]`}>
                 <h3 className="text-lg font-bold text-white mb-4">일별 성과 트렌드</h3>
                 <ResponsiveContainer width="100%" height="100%">
                   <LineChart data={result.trendData}>
                     <CartesianGrid strokeDasharray="3 3" stroke="#555" vertical={false} />
                     <XAxis dataKey="name" stroke="#999" fontSize={12} tickLine={false} axisLine={false} />
                     <YAxis stroke="#999" fontSize={12} tickLine={false} axisLine={false} />
                     <Tooltip contentStyle={{ backgroundColor: '#333', borderColor: '#555', color: '#fff' }} />
                     <Line type="monotone" dataKey="roas" stroke="#03C75A" strokeWidth={2} dot={{r:3}} name="ROAS" />
                     <Line type="monotone" dataKey="cost" stroke="#8884d8" strokeWidth={2} dot={false} name="Cost" />
                   </LineChart>
                 </ResponsiveContainer>
             </div>

             {/* Creative & Audience Analysis */}
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                     {result.creativeStats && <CreativeTable creatives={result.creativeStats} />}
                </div>
                <div className="space-y-6">
                     {result.audienceAgeStats && <AudienceTable title="연령별 효율 (Top 5)" stats={result.audienceAgeStats} />}
                     {result.audienceMediaStats && <AudienceTable title="매체/OS별 효율 (Top 5)" stats={result.audienceMediaStats} />}
                </div>
             </div>

             {/* Issues & Actions */}
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
        </div>
    );
};

export const NaverGFA = ({ onUsageUpdated }: { onUsageUpdated?: () => void }) => {
    const [files, setFiles] = useState<UploadedFiles>({});
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [showExample, setShowExample] = useState(false);

    useEffect(() => {
        document.title = "네이버 GFA 성과 분석기 - AdAiAn | 성과형 디스플레이 광고 분석";
        
        const updateMeta = (name: string, content: string) => {
            let element = document.querySelector(`meta[name="${name}"]`);
            if (!element) {
                element = document.createElement('meta');
                element.setAttribute('name', name);
                document.head.appendChild(element);
            }
            element.setAttribute('content', content);
        };

        updateMeta('description', '네이버 GFA(성과형 디스플레이) 광고 성과를 AI가 무료로 분석합니다. 소재 효율, 타겟 오디언스 분석을 통해 ROAS를 극대화하세요.');
        updateMeta('keywords', '네이버 GFA 분석, 성과형 디스플레이 광고, GFA 소재 분석, 타겟팅 최적화, 배너 광고 효율');

        // Dynamic Canonical Tag
        const DOMAIN = "https://www.adaian.net";
        let linkCanonical = document.querySelector("link[rel='canonical']");
        if (!linkCanonical) {
            linkCanonical = document.createElement("link");
            linkCanonical.setAttribute("rel", "canonical");
            document.head.appendChild(linkCanonical);
        }
        linkCanonical.setAttribute("href", `${DOMAIN}/naver-gfa-analyzer`);

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

        if (!files.gfaCampaign || !files.gfaCreative || !files.gfaAudience) {
            alert("3가지 데이터 파일을 모두 업로드해주세요.");
            return;
        }
        setIsAnalyzing(true);
        try {
            // --- DAILY LIMIT CHECK (READ ONLY) ---
            if (auth.currentUser) {
                const remaining = await getRemainingDailyLimit(auth.currentUser.uid);
                if (remaining <= 0) {
                    alert("일일 보고서 생성 횟수(2회)를 모두 소진했습니다. 내일 다시 이용해주세요.");
                    setIsAnalyzing(false);
                    return;
                }
            }
            // -------------------------

            const [campText, creativeText, audienceText] = await Promise.all([
                readFileAsText(files.gfaCampaign),
                readFileAsText(files.gfaCreative),
                readFileAsText(files.gfaAudience)
            ]);

            const data = await analyzeNaverGFAData(campText, creativeText, audienceText);
            setResult(data);

            // --- SUCCESS: INCREMENT LIMIT & UPDATE UI ---
            if (auth.currentUser) {
                await incrementDailyLimit(auth.currentUser.uid);
                if (onUsageUpdated) onUsageUpdated();
            }

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
            {showExample && <GFAExampleReportModal onClose={() => setShowExample(false)} />}
            
            {!result && !isAnalyzing && (
                <>
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold mb-2 text-white">Naver GFA 분석기</h1>
                        <p className="text-gray-400">성과형 디스플레이(GFA)의 캠페인, 소재, 타겟 보고서를 업로드하세요.</p>
                        <div className="mt-4 bg-[#454746] p-4 rounded text-sm text-gray-300 border border-gray-600">
                           <p className="flex items-center gap-2">
                             <span className="text-[#03C75A] font-bold">!</span>
                             <span>캠페인(일별), 소재(전체), 오디언스(전체) 리포트가 필요합니다.</span>
                           </p>
                        </div>
                    </div>

                    <div className="grid gap-4 mb-8">
                        <FileUploadZone 
                           label="1. 캠페인 리포트 (일별)" 
                           subtext="날짜별 성과 추이 분석용\n(설정: 캠페인 / 일별)"
                           file={files.gfaCampaign}
                           onFileSelect={(f) => setFiles(prev => ({...prev, gfaCampaign: f}))}
                        />
                        <FileUploadZone 
                           label="2. 소재 리포트 (전체)" 
                           subtext="이미지/카피 효율 분석용\n(설정: 소재 / 전체 기간)"
                           file={files.gfaCreative}
                           onFileSelect={(f) => setFiles(prev => ({...prev, gfaCreative: f}))}
                        />
                        <FileUploadZone 
                           label="3. 오디언스 리포트 (전체)" 
                           subtext="연령/성별/매체 타겟 분석용\n(설정: 오디언스 / 전체 기간)"
                           file={files.gfaAudience}
                           onFileSelect={(f) => setFiles(prev => ({...prev, gfaAudience: f}))}
                        />
                    </div>

                    <button
                        onClick={handleAnalyze}
                        disabled={!files.gfaCampaign || !files.gfaCreative || !files.gfaAudience}
                        className={`w-full py-4 rounded-lg font-bold text-lg transition-all
                            ${(!files.gfaCampaign || !files.gfaCreative || !files.gfaAudience)
                                ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                                : `bg-[#03C75A] text-white hover:bg-[#02b351] shadow-lg shadow-green-900/20`}
                        `}
                    >
                        AI 분석 실행하기
                    </button>
                    
                    <GFADataGuide />

                     <div className="mt-8 flex justify-center">
                        <button 
                            onClick={() => setShowExample(true)}
                            className="flex items-center gap-2 px-6 py-3 rounded-full border border-gray-600 hover:border-[#03C75A] text-gray-300 hover:text-white transition-all bg-[#2d2f2e] shadow-lg"
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
                            <h2 className="text-2xl font-bold text-white">GFA 분석 리포트</h2>
                            <p className="text-gray-400 text-sm">AI Analysis for Performance Display Ads</p>
                        </div>
                        <button onClick={handleReset} className="text-sm px-4 py-2 rounded border border-gray-600 hover:bg-gray-700 text-gray-300">
                        새로운 데이터 분석
                        </button>
                    </div>
                    <GFADashboard result={result} />
                </>
            )}
        </div>
    );
};