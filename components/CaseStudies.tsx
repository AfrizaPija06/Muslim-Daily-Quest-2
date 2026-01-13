
import React from 'react';

const CaseStudies: React.FC = () => {
  const cases = [
    {
      title: "Sustainable Agriculture 2.0",
      client: "Bumi Agro Corp",
      tag: "Community Development",
      image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=800"
    },
    {
      title: "Maritime Education Initiative",
      client: "Oceanic Logistics",
      tag: "Education",
      image: "https://images.unsplash.com/photo-1544652478-6653e09f18a2?auto=format&fit=crop&q=80&w=800"
    },
    {
      title: "Renewable Energy Access",
      client: "Nusantara Power",
      tag: "Infrastructure",
      image: "https://images.unsplash.com/photo-1466611653911-95281773ad90?auto=format&fit=crop&q=80&w=800"
    }
  ];

  return (
    <section id="cases" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
          <div className="max-w-xl">
            <span className="text-[#6B0F1A] font-bold tracking-[0.3em] text-xs uppercase mb-4 block">PORTFOLIO</span>
            <h2 className="text-4xl md:text-5xl font-serif text-[#1A0407]">Proven Impact Stories</h2>
          </div>
          <button className="text-[10px] font-bold tracking-[0.3em] text-[#6B0F1A] border-b border-[#6B0F1A] pb-2 uppercase hover:text-[#8D1B2D] transition-colors">
            VIEW ALL CASE STUDIES
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-10">
          {cases.map((c, idx) => (
            <div key={idx} className="group cursor-pointer">
              <div className="relative h-[400px] mb-6 overflow-hidden rounded-sm">
                <img 
                  src={c.image} 
                  alt={c.title} 
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
                />
                <div className="absolute inset-0 bg-[#6B0F1A]/0 group-hover:bg-[#6B0F1A]/40 transition-all duration-500"></div>
                <div className="absolute bottom-6 left-6 right-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                  <div className="bg-white p-6 shadow-xl">
                    <p className="text-[10px] font-bold tracking-[0.2em] text-[#6B0F1A] uppercase mb-1">{c.tag}</p>
                    <h4 className="text-lg font-bold text-[#1A0407]">{c.title}</h4>
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center group-hover:translate-x-2 transition-transform duration-300">
                <h4 className="text-lg font-bold text-[#1A0407] group-hover:text-[#6B0F1A] transition-colors">{c.client}</h4>
                <div className="w-10 h-10 border border-gray-100 flex items-center justify-center rounded-full group-hover:bg-[#6B0F1A] group-hover:text-white transition-all duration-500">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                   </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CaseStudies;
