import React, { useEffect, useState } from 'react';

const COLORS = {
  card: 'bg-[#454746]',
  primary: 'text-[#F05519]',
  primaryBg: 'bg-[#F05519]',
};

export const LandingPage = () => {
  // --- SEO & Schema Injection ---
  useEffect(() => {
    // 1. Title & Meta Tags
    document.title = "광고 성과 AI 분석 솔루션 - AdAiAn | 무료 인공지능 광고 분석";
    
    const updateMeta = (name: string, content: string) => {
      let element = document.querySelector(`meta[name="${name}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute('name', name);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    updateMeta('description', '광고 성과 인공지능 분석을 무료로 시작하세요. 네이버 검색광고, GFA, SNS 광고 데이터를 AI가 분석하여 매출 상승을 위한 실행 가이드를 제공합니다.');
    updateMeta('keywords', '광고 성과 인공지능 분석, 광고 성과 AI 분석, 마케팅 자동화, 광고 효율 최적화, 네이버 광고 분석');

    // 2. JSON-LD Schema (FAQ)
    const schemaId = 'schema-faq-landing';
    const oldSchema = document.getElementById(schemaId);
    if (oldSchema) oldSchema.remove();

    const schemaData = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "AdAiAn의 광고 성과 AI 분석은 정말 무료인가요?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "네, 현재 베타 서비스 기간 동안 AdAiAn의 모든 광고 성과 인공지능 분석 기능은 무료로 제공됩니다. 네이버 검색광고 및 GFA 데이터를 횟수 제한 없이 분석할 수 있습니다."
          }
        },
        {
          "@type": "Question",
          "name": "광고 성과 인공지능 분석은 어떤 데이터를 사용하나요?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "사용자가 직접 업로드한 광고 매체(네이버, 메타 등)의 엑셀 리포트(CSV) 데이터를 기반으로 분석합니다. 데이터는 분석 즉시 휘발되며 서버에 저장되지 않아 안전합니다."
          }
        },
        {
          "@type": "Question",
          "name": "AI 분석 결과는 얼마나 정확한가요?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "AdAiAn은 Google Gemini 최신 모델을 기반으로 하며, 수만 건의 광고 캠페인 데이터를 학습한 로직을 적용했습니다. 단순 통계를 넘어 성과 하락의 원인과 구체적인 해결책을 95% 이상의 논리적 정확도로 제안합니다."
          }
        },
        {
          "@type": "Question",
          "name": "대행사를 쓰고 있는데 이 툴이 필요한가요?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "네, 유용합니다. 대행사 리포트 외에 제3자의 객관적인 시각으로 광고 성과 AI 분석 결과를 받아보세요. 대행사가 놓친 키워드나 매체 효율 누수 지점을 찾아낼 수 있습니다."
          }
        }
      ]
    };

    const script = document.createElement('script');
    script.id = schemaId;
    script.type = 'application/ld+json';
    script.innerHTML = JSON.stringify(schemaData);
    document.head.appendChild(script);

    return () => {
      // Cleanup on unmount if needed, mostly fine to leave until next page change overwrites
    };
  }, []);

  // --- FAQ Data ---
  const faqList = [
    {
      q: "AI 분석 결과를 바로 적용할 수 있나요?",
      a: "네, 결과 리포트에는 '실행 액션(Action Items)' 섹션이 포함되어 있습니다. 어떤 키워드를 제외해야 하는지, 어떤 캠페인의 예산을 늘려야 하는지 구체적인 가이드를 제공합니다."
    },
    {
      q: "로그인이 필요한가요?",
      a: "간편한 Google 로그인을 통해 접속할 수 있으며, 별도의 회원가입 절차 없이 즉시 이용 가능합니다."
    },
    {
      q: "지원하는 광고 매체는 무엇인가요?",
      a: "현재 네이버 검색광고(Power Link)와 네이버 성과형 디스플레이(GFA)를 지원하며, 2026년까지 Meta(페이스북/인스타그램), 구글 광고 등으로 확장될 예정입니다."
    }
  ];

  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 animate-fade-in">
      <div className="text-center mb-16">
        <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
          <span className="text-white">Ad</span>
          <span className="text-gray-500 mx-1">+</span>
          <span className={COLORS.primary}>Ai</span>
          <span className="text-gray-500 mx-1">+</span>
          <span className="text-white">An</span>alyze
        </h1>
        <h2 className="text-2xl font-semibold text-gray-200 mb-6">
            "광고(Ad) 데이터를 AI가 분석(Analyze)합니다"
        </h2>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            비즈니스의 규모가 작아 전담 마케터나 데이터 분석가를 두기 어려우신가요?<br/>
            <strong>AdAiAn</strong>은 1인 셀러와 중소규모 비즈니스 대표님들이<br/>
            복잡한 <strong>광고 성과 인공지능 분석</strong>을 통해 매출을 극대화할 수 있도록 돕습니다.
        </p>
        
        {/* Analytical GIF Placeholder */}
        <div className="relative w-full max-w-3xl mx-auto aspect-video rounded-xl overflow-hidden shadow-2xl border border-gray-700 bg-black">
          <img 
            src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcTlxYmx4Ymx4Ymx4Ymx4Ymx4Ymx4Ymx4Ymx4Ymx4Ymx4Ym95ZCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/26tn33aiTi1jkl6H6/giphy.gif" 
            alt="AI Analyzing Data" 
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#2d2f2e] via-transparent to-transparent"></div>
          <div className="absolute bottom-6 left-0 right-0 text-center">
            <p className="text-sm font-mono text-green-400 animate-pulse">AI System Analysis In Progress...</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mt-16 mb-24">
        {[
          { title: "전문가 수준의 분석", desc: "단순 요약이 아닌 성과 변화의 원인과 구조적 문제를 진단합니다." },
          { title: "실행 중심 가이드", desc: "'무엇을 줄이고, 무엇을 늘려야 하는지' 명확한 액션을 제안합니다." },
          { title: "소상공인 맞춤 솔루션", desc: "복잡한 대행사 리포트 대신, 대표님이 꼭 봐야 할 핵심 지표만 보여드립니다." },
          { title: "안전한 데이터 처리", desc: "업로드된 데이터는 분석 즉시 메모리에서 삭제되며 서버에 저장되지 않습니다." }
        ].map((item, i) => (
          <div key={i} className={`p-6 rounded-xl ${COLORS.card} border border-gray-700 hover:border-gray-500 transition-colors`}>
            <h3 className="text-xl font-bold mb-2 text-white">{item.title}</h3>
            <p className="text-gray-400">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* SEO Optimized FAQ Section */}
      <section className="border-t border-gray-700 pt-16">
        <h3 className="text-3xl font-bold text-center text-white mb-2">자주 묻는 질문 (FAQ)</h3>
        <p className="text-center text-gray-400 mb-10">광고 성과 AI 분석에 대해 궁금한 점을 확인하세요.</p>
        
        <div className="max-w-3xl mx-auto space-y-4">
          {[
            {
              q: "AdAiAn의 광고 성과 AI 분석은 정말 무료인가요?",
              a: "네, 현재 베타 서비스 기간 동안 모든 기능은 무료로 제공됩니다. 횟수 제한 없이 이용하실 수 있습니다."
            },
            {
              q: "어떤 데이터를 준비해야 하나요?",
              a: "분석하고자 하는 광고 매체의 '다운로드 리포트(CSV/Excel)'만 있으면 됩니다. 개인정보는 포함되지 않은 순수 성과 데이터만 분석합니다."
            },
            {
               q: "AI 분석 결과는 얼마나 걸리나요?",
               a: "데이터 용량에 따라 다르지만, 보통 1~2분 내에 수만 줄의 데이터를 분석하여 리포트를 생성합니다."
            },
            ...faqList
          ].map((item, idx) => (
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
    </div>
  );
};