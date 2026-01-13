
import React from 'react';

const Services: React.FC = () => {
  const services = [
    {
      title: "Strategic CSR Design",
      desc: "Architecting purpose-driven programs that align with core corporate values while meeting local development needs.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04M12 21.355l7.117-7.117A9 9 0 104.883 14.238L12 21.355z" />
        </svg>
      )
    },
    {
      title: "Impact Measurement",
      desc: "Scientific evaluation of social return on investment (SROI) using global standards to prove tangible outcomes.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      title: "Stakeholder Engagement",
      desc: "Bridging the gap between corporations, government bodies, and local communities through expert mediation.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      title: "ESG Integration",
      desc: "Guiding organizations through the complexities of Environmental, Social, and Governance compliance and reporting.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    }
  ];

  return (
    <section id="services" className="py-24 bg-[#FDFBF7]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <span className="text-[#6B0F1A] font-bold tracking-[0.3em] text-xs uppercase mb-4 block">EXPERT CONSULTANCY</span>
          <h2 className="text-4xl md:text-5xl font-serif text-[#1A0407] mb-6">Our Premium Services</h2>
          <div className="w-20 h-1 bg-[#6B0F1A] mx-auto"></div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((s, idx) => (
            <div key={idx} className="bg-white p-10 border border-gray-100 hover:border-[#6B0F1A]/20 transition-all duration-500 hover:-translate-y-2 group shadow-sm hover:shadow-2xl flex flex-col items-start rounded-sm">
              <div className="text-[#6B0F1A] mb-8 bg-[#6B0F1A]/5 p-4 rounded-sm group-hover:bg-[#6B0F1A] group-hover:text-white transition-all duration-500">
                {s.icon}
              </div>
              <h3 className="text-xl font-bold text-[#1A0407] mb-4 group-hover:text-[#6B0F1A] transition-colors">{s.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-8 flex-grow">
                {s.desc}
              </p>
              <a href="#" className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-[#1A0407] hover:text-[#6B0F1A] transition-colors uppercase">
                Explore Detailed <span className="transform group-hover:translate-x-1 transition-transform">→</span>
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
