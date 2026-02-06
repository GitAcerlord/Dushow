"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Mic2, Instagram, Linkedin, Twitter, Youtube } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-[#0F172A] text-slate-300 py-20 px-6 md:px-20 border-t border-slate-800">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <div className="bg-[#6C2BD9] p-1.5 rounded-lg">
              <Mic2 className="text-white w-5 h-5" />
            </div>
            <span className="text-2xl font-black text-white tracking-tighter">DUSHOW</span>
          </div>
          <p className="text-sm leading-relaxed text-slate-400">
            A maior plataforma de conexão e confiança para o mercado de eventos da América Latina. Tecnologia a serviço da arte e da segurança.
          </p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-[#6C2BD9] transition-colors"><Instagram size={20} /></a>
            <a href="#" className="hover:text-[#6C2BD9] transition-colors"><Twitter size={20} /></a>
            <a href="#" className="hover:text-[#6C2BD9] transition-colors"><Linkedin size={20} /></a>
            <a href="#" className="hover:text-[#6C2BD9] transition-colors"><Youtube size={20} /></a>
          </div>
        </div>

        <div>
          <h4 className="font-black text-white mb-6 uppercase text-xs tracking-widest">Plataforma</h4>
          <ul className="space-y-4 text-sm font-medium">
            <li><Link to="/client/discovery" className="hover:text-[#6C2BD9] transition-colors">Buscar Artistas</Link></li>
            <li><Link to="/services" className="hover:text-[#6C2BD9] transition-colors">Nossos Serviços</Link></li>
            <li><Link to="/register" className="hover:text-[#6C2BD9] transition-colors">Criar Perfil Profissional</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-black text-white mb-6 uppercase text-xs tracking-widest">Suporte & Legal</h4>
          <ul className="space-y-4 text-sm font-medium">
            <li><a href="#" className="hover:text-[#6C2BD9] transition-colors">Central de Ajuda</a></li>
            <li><a href="#" className="hover:text-[#6C2BD9] transition-colors">Termos de Uso</a></li>
            <li><a href="#" className="hover:text-[#6C2BD9] transition-colors">Privacidade</a></li>
            <li><a href="#" className="hover:text-[#6C2BD9] transition-colors">Segurança do Pagamento</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-black text-white mb-6 uppercase text-xs tracking-widest">Newsletter</h4>
          <p className="text-xs text-slate-400 mb-4">Receba dicas de produção e novidades do mercado.</p>
          <div className="flex gap-2">
            <input 
              type="email" 
              placeholder="Seu e-mail" 
              className="bg-slate-800 border-none rounded-xl px-4 py-2 text-sm w-full focus:ring-2 focus:ring-[#6C2BD9] outline-none" 
            />
            <button className="bg-[#6C2BD9] hover:bg-[#5b24b8] text-white px-4 py-2 rounded-xl font-bold text-sm transition-colors">OK</button>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto pt-12 mt-12 border-t border-slate-800 text-center text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">
        © 2024 DUSHOW SAAS • TECNOLOGIA PARA EVENTOS • TODOS OS DIREITOS RESERVADOS
      </div>
    </footer>
  );
};

export default Footer;