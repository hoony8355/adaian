import React from 'react';

export const CoupangAds = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in text-center px-4">
      <div className="w-20 h-20 bg-gray-800 rounded-2xl flex items-center justify-center mb-6 border border-gray-700">
        <span className="text-4xl">🚀</span>
      </div>
      <h2 className="text-3xl font-bold text-white mb-4">Coupang 광고 분석</h2>
      <p className="text-gray-400 mb-8 max-w-md">
        쿠팡 판매자 센터(Wing)의 광고 데이터를 분석하여 ROAS를 최적화하는 기능을 준비 중입니다.
      </p>
      <div className="inline-flex items-center px-4 py-2 bg-gray-700 border border-gray-600 rounded-full text-gray-300 font-medium text-sm">
        📅 2026년 오픈 예정
      </div>
    </div>
  );
};