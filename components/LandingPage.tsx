import React from 'react';

const COLORS = {
  card: 'bg-[#454746]',
  primary: 'text-[#F05519]',
  primaryBg: 'bg-[#F05519]',
};

export const LandingPage = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12 animate-fade-in">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
          <span className="text-white">Ad</span>
          <span className="text-gray-500 mx-1">+</span>
          <span className={COLORS.primary}>Ai</span>
          <span className="text-gray-500 mx-1">+</span>
          <span className="text-white">An</span>alyze
        </h2>
        <h3 className="text-2xl font-semibold text-gray-200 mb-6">
            "광고(Ad) 데이터를 AI가 분석(Analyze)합니다"
        </h3>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            비즈니스의 규모가 작아 전담 마케터나 데이터 분석가를 두기 어려우신가요?<br/>
            <strong>AdAiAn</strong>은 1인 셀러와 중소규모 비즈니스 대표님들이<br/>
            복잡한 광고 데이터를 쉽게 이해하고 효율을 극대화할 수 있도록 만들어졌습니다.
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

      <div className="grid md:grid-cols-2 gap-6 mt-16">
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
    </div>
  );
};