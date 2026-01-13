
import React from 'react';

const About: React.FC = () => {
  return (
    <section id="about" className="py-24 bg-[#1A0407] overflow-hidden relative">
      <div className="absolute top-0 right-0 w-1/2 h-full opacity-10">
        <div className="grid grid-cols-6 gap-2 rotate-12 -translate-y-20">
          {Array.from({ length: 36 }).map((_, i) => (
            <div key={i} className="aspect-square bg-[#8D1B2D]"></div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 items-center gap-16 relative z-10">
        <div className="order-2 md:order-1">
          <div className="relative group">
            <div className="absolute -inset-4 border border-[#8D1B2D]/30 translate-x-4 translate-y-4 group-hover:translate-x-6 group-hover:translate-y-6 transition-transform duration-500"></div>
            <img 
              src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=1000" 
              alt="Team Workshop" 
              className="relative z-10 rounded-sm shadow-2xl grayscale hover:grayscale-0 transition-all duration-700"
            />
            <div className="absolute bottom-10 left-10 z-20 bg-[#6B0F1A] p-8 hidden lg:block">
              <p className="text-white text-3xl font-serif italic mb-2">12+ Years</p>
              <p className="text-white/70 text-[10px] tracking-[0.2em] font-bold uppercase">of Strategic Excellence</p>
            </div>
          </div>
        </div>

        <div className="order-1 md:order-2">
          <span className="text-[#8D1B2D] font-bold tracking-[0.3em] text-xs uppercase mb-4 block">WHO WE ARE</span>
          <h2 className="text-4xl md:text-5xl font-serif text-white mb-8 leading-tight">
            Elevating Social <br />
            Responsibility to a <br />
            <span className="text-[#8D1B2D] italic">Competitive Advantage</span>
          </h2>
          <p className="text-white/60 leading-relaxed mb-6">
            Shared Value Indonesia was founded on the principle that business success and social progress are inextricably linked. We don't just "do CSR" — we integrate impact into your business DNA.
          </p>
          <p className="text-white/60 leading-relaxed mb-10">
            Our team of specialists brings together decades of experience across international development, corporate strategy, and local community leadership to deliver solutions that are culturally relevant and globally competitive.
          </p>
          
          <div className="grid grid-cols-2 gap-8 mb-10">
            <div>
              <h4 className="text-white font-bold mb-2">Our Vision</h4>
              <p className="text-white/40 text-xs leading-relaxed">To lead Indonesia's transition towards a truly sustainable corporate landscape.</p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-2">Our Mission</h4>
              <p className="text-white/40 text-xs leading-relaxed">Providing high-fidelity strategic frameworks for lasting social impact.</p>
            </div>
          </div>

          <button className="flex items-center gap-4 text-white font-bold tracking-widest text-xs uppercase group">
            LEARN MORE ABOUT US
            <span className="w-12 h-px bg-[#8D1B2D] group-hover:w-20 transition-all duration-300"></span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default About;
