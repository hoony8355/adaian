import React from 'react';
import { PageView } from '../types';

const COLORS = {
  primary: 'text-[#F05519]',
};

interface HeaderProps {
  currentPage: PageView;
  setPage: (page: PageView) => void;
}

export const Header = ({ currentPage, setPage }: HeaderProps) => {
  const navItems = [
    { label: 'Naver 검색광고', value: PageView.NAVER_SEARCH },
    { label: 'Naver GFA', value: PageView.NAVER_GFA },
    { label: 'Meta', value: PageView.META },
    { label: 'Google', value: PageView.GOOGLE },
    { label: 'Coupang', value: PageView.COUPANG },
  ];

  return (
    <nav className="w-full border-b border-gray-700 bg-[#2d2f2e] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center cursor-pointer" onClick={() => setPage(PageView.LANDING)}>
             <span className="text-2xl font-bold tracking-tighter">
                <span className="text-white">Ad</span>
                <span className="text-[#F05519]">Ai</span>
                <span className="text-white">An</span>
             </span>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-2">
              {navItems.map((item) => (
                <button
                  key={item.value}
                  onClick={() => setPage(item.value)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentPage === item.value
                      ? 'bg-gray-800 text-white border border-gray-600'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-500 to-yellow-500 shadow-lg border border-gray-600"></div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};