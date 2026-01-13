
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer id="contact" className="bg-[#1A0407] pt-24 pb-12 text-white/80">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-16 mb-24">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-8">
              <div className="w-8 h-8 bg-white flex items-center justify-center rounded-sm">
                <span className="text-[#6B0F1A] font-bold text-lg">S</span>
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-bold tracking-tighter text-lg text-white">SHARED VALUE</span>
                <span className="text-[8px] tracking-[0.3em] font-semibold uppercase text-white/50">INDONESIA</span>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-white/40 mb-8 max-w-xs">
              Indonesia's leading boutique consultancy for strategic corporate social responsibility and sustainable impact.
            </p>
            <div className="flex gap-4">
              {['ln', 'tw', 'ig', 'fb'].map(social => (
                <a key={social} href="#" className="w-10 h-10 border border-white/10 rounded-sm flex items-center justify-center hover:bg-[#6B0F1A] hover:border-[#6B0F1A] transition-all">
                  <span className="text-[10px] uppercase font-bold">{social}</span>
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold tracking-[0.2em] text-xs uppercase mb-8">SERVICES</h4>
            <ul className="space-y-4 text-sm">
              <li><a href="#" className="hover:text-[#8D1B2D] transition-colors">CSR Strategy</a></li>
              <li><a href="#" className="hover:text-[#8D1B2D] transition-colors">Impact Measurement</a></li>
              <li><a href="#" className="hover:text-[#8D1B2D] transition-colors">Stakeholder Engagement</a></li>
              <li><a href="#" className="hover:text-[#8D1B2D] transition-colors">ESG Compliance</a></li>
              <li><a href="#" className="hover:text-[#8D1B2D] transition-colors">Community Audits</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold tracking-[0.2em] text-xs uppercase mb-8">OFFICE</h4>
            <p className="text-sm leading-loose text-white/40">
              Grand Indonesia Menara BCA, 50th Fl.<br />
              Jl. M.H. Thamrin No. 1<br />
              Jakarta Pusat, 10310<br />
              Indonesia
            </p>
          </div>

          <div>
            <h4 className="text-white font-bold tracking-[0.2em] text-xs uppercase mb-8">WORK WITH US</h4>
            <p className="text-sm text-white/40 mb-6 italic">Ready to transform your impact?</p>
            <a href="mailto:hello@sharedvalue.id" className="text-lg font-serif text-white hover:text-[#8D1B2D] transition-colors underline underline-offset-8 decoration-[#8D1B2D]">
              hello@sharedvalue.id
            </a>
            <div className="mt-8">
              <p className="text-sm text-white/40 mb-2">Speak to a Senior Partner:</p>
              <p className="text-sm font-bold">+62 21 500 888</p>
            </div>
          </div>
        </div>

        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] tracking-[0.2em] font-bold uppercase text-white/20">
          <p>© 2024 SHARED VALUE INDONESIA. ALL RIGHTS RESERVED.</p>
          <div className="flex gap-8">
            <a href="#" className="hover:text-white/50">PRIVACY POLICY</a>
            <a href="#" className="hover:text-white/50">TERMS OF SERVICE</a>
            <a href="#" className="hover:text-white/50">COOKIE SETTINGS</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
