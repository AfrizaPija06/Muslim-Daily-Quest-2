
import React from 'react';
import { NAVIGATION_LINKS, COLORS } from '../constants';

interface NavbarProps {
  scrolled: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ scrolled }) => {
  return (
    <nav 
      className={`fixed w-full z-50 transition-all duration-500 py-4 ${
        scrolled 
          ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-100 py-3' 
          : 'bg-transparent py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-[#6B0F1A] flex items-center justify-center rounded-sm">
            <span className="text-white font-bold text-xl">S</span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className={`font-bold tracking-tighter text-xl ${scrolled ? 'text-[#1A0407]' : 'text-white'}`}>
              SHARED VALUE
            </span>
            <span className={`text-[10px] tracking-[0.3em] font-semibold uppercase ${scrolled ? 'text-[#6B0F1A]' : 'text-white/80'}`}>
              INDONESIA
            </span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-10">
          {NAVIGATION_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className={`text-sm font-medium tracking-wide transition-colors duration-300 hover:text-[#6B0F1A] ${
                scrolled ? 'text-[#1e293b]' : 'text-white/90'
              }`}
            >
              {link.label}
            </a>
          ))}
          <button className={`px-6 py-2.5 rounded-sm text-sm font-bold transition-all duration-300 ${
            scrolled 
              ? 'bg-[#6B0F1A] text-white hover:bg-[#8D1B2D]' 
              : 'bg-white text-[#6B0F1A] hover:bg-[#FDFBF7]'
          }`}>
            CONSULT NOW
          </button>
        </div>

        <button className="md:hidden text-[#1e293b]">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
