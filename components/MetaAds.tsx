import React from 'react';

export const MetaAds = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in text-center px-4">
      <div className="w-20 h-20 bg-gray-800 rounded-2xl flex items-center justify-center mb-6 border border-gray-700">
        <span className="text-4xl">♾️</span>
      </div>
      <h2 className="text-3xl font-bold text-white mb-4">Meta(Facebook/Instagram) 분석</h2>
      <p className="text-gray-400 mb-8 max-w-md">
        페이스북 및 인스타그램 광고 성과를 극대화할 수 있는 AI 분석 모델을 학습 중입니다.
      </p>
      <div className="inline-flex items-center px-4 py-2 bg-[#F05519]/20 border border-[#F05519] rounded-full text-[#F05519] font-medium text-sm">
        🚀 2026년 1월 오픈 예정
      </div>
    </div>
  );
};