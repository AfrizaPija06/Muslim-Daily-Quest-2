
import React from 'react';

const Hero: React.FC = () => {
  return (
    <section className="relative h-screen min-h-[700px] flex items-center overflow-hidden">
      {/* Background Image with sophisticated overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=2000" 
          alt="Sustainable Community" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1A0407]/95 via-[#1A0407]/70 to-transparent"></div>
        {/* Abstract decorative element */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-[#6B0F1A]/10 backdrop-blur-[2px] transform skew-x-[-12deg] translate-x-20"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
        <div className="max-w-3xl">
          <div className="flex items-center gap-4 mb-6 animate-fadeIn">
            <span className="h-px w-12 bg-[#8D1B2D]"></span>
            <span className="text-[#8D1B2D] font-bold tracking-[0.2em] text-sm uppercase">ESTABLISHED 2012</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif text-white leading-tight mb-8">
            Redefining <br />
            <span className="italic text-[#8D1B2D]">Corporate</span> <br />
            Responsibility
          </h1>
          
          <p className="text-lg md:text-xl text-white/70 font-light leading-relaxed mb-12 max-w-xl">
            Empowering Indonesian enterprises to create sustainable value that resonates across communities through strategic, results-driven CSR initiatives.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-5">
            <button className="px-10 py-5 bg-[#6B0F1A] text-white font-bold tracking-widest text-sm hover:bg-[#8D1B2D] transition-all duration-300 shadow-xl rounded-sm">
              OUR STRATEGY
            </button>
            <button className="px-10 py-5 border border-white/30 text-white font-bold tracking-widest text-sm hover:bg-white hover:text-[#1A0407] transition-all duration-300 backdrop-blur-sm rounded-sm">
              VIEW PROJECTS
            </button>
          </div>
        </div>
      </div>
      
      {/* Scroll indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce opacity-50">
        <div className="w-px h-12 bg-white"></div>
        <span className="text-white text-[10px] tracking-[0.3em] font-semibold uppercase">SCROLL</span>
      </div>
    </section>
  );
};

export default Hero;
