import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api, { formatNaira } from '../utils/api';
import { ProductCard } from '../components/common';

function useFadeIn(threshold = 0.12) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

function FadeIn({ children, delay = 0, className = '' }) {
  const [ref, visible] = useFadeIn();
  return (
    <div ref={ref} className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

const OCCASIONS = [
  { title: 'Traditional Bridal Sets', sub: 'Complete Bride & Groom', tag: 'Most Requested', cat: 'bridal-sets', color: '#8B1A4A', img: 'https://images.unsplash.com/photo-1590736704728-f4730bb30770?w=800&q=80' },
  { title: 'Aso Ebi Packages', sub: 'Family & Group Orders', tag: 'Bulk Pricing', cat: 'aso-ebi', color: '#1A5C3A', img: 'https://images.unsplash.com/photo-1583330568492-0028b0df5a10?w=800&q=80' },
  { title: 'Individual Pieces', sub: 'Gele, Ipele & Filà', tag: 'Single Items', cat: 'gele', color: '#3D2B1F', img: 'https://images.unsplash.com/photo-1571513722275-4b41940f54b8?w=800&q=80' },
];

const STEPS = [
  { n: '01', icon: '🪡', title: 'Select Motif', desc: 'Choose from 200+ ancestral Yoruba weave patterns in our archive.' },
  { n: '02', icon: '🎨', title: 'Choose Thread Palette', desc: 'Curate your colour story from silk, cotton, and 24K metallic threads.' },
  { n: '03', icon: '📐', title: 'Input Measurements', desc: 'Our digital form captures every dimension for a perfect ceremonial fit.' },
  { n: '04', icon: '🧵', title: 'Weaving Begins', desc: 'Our master weavers in Iseyin craft your piece over 7–21 working days.' },
];

export default function HomePage() {
  const navigate   = useNavigate();
  const [tIdx, setTIdx] = useState(0);

  const { data: productsData } = useQuery({
    queryKey: ['home-featured'],
    queryFn:  () => api.get('/products?featured=true&limit=8').then(r => r.data.data),
  });
  const { data: catsData } = useQuery({
    queryKey: ['home-categories'],
    queryFn:  () => api.get('/categories').then(r => r.data.data),
  });
  const { data: settings } = useQuery({
    queryKey: ['public-settings'],
    queryFn:  () => api.get('/settings/public').then(r => r.data.data.settings),
    staleTime: 600000,
  });

  const testimonials = [
    { q: 'I wore Àṣọ Òkè Royale on my wedding day and I have never felt more like royalty. Every thread told a story.', name: 'Adunola O.', loc: 'Lagos, Nigeria' },
    { q: 'The attention to detail is extraordinary. Our entire Aso Ebi family of 40 looked absolutely stunning.', name: 'Mrs. Funke A.', loc: 'London, UK' },
    { q: 'From consultation to delivery — the experience was world-class. Truly a luxury house in every sense.', name: 'Chioma N.', loc: 'Houston, TX' },
  ];

  useEffect(() => {
    const t = setInterval(() => setTIdx(p => (p + 1) % testimonials.length), 5000);
    return () => clearInterval(t);
  }, []);

  const products    = productsData?.products || [];
  const categories  = catsData?.categories  || [];
  const heroTitle   = settings?.hero_title   || 'Woven in Gold & Thread';
  const heroSub     = settings?.hero_subtitle || "Authentic hand-woven Aso Oke from Nigeria's finest artisans.";
  const whatsapp    = settings?.whatsapp     || '';

  return (
    <div>
      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-[#1A0E00]">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1590736704728-f4730bb30770?w=1800&q=85" alt="Luxury Aso Oke" className="w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1A0E00]/90 via-[#1A0E00]/60 to-transparent" />
        </div>
        <div className="absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(90deg,rgba(196,164,90,.04) 0,rgba(196,164,90,.04) 1px,transparent 1px,transparent 64px)' }} />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full">
          <div className="max-w-2xl">
            <div className="flex items-center gap-4 mb-6">
              <span className="w-10 h-px bg-[#C4A45A]" />
              <span className="section-label">HANDCRAFTED IN ISEYIN, OYO STATE</span>
            </div>
            <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold text-[#FDFBF7] leading-[1.04] mb-6">
              {heroTitle.split(',').map((part, i) => (
                <span key={i}>{i === 1 ? <em className="text-[#C4A45A] not-italic">{part}</em> : part}{i === 0 ? ',' : ''}<br /></span>
              ))}
            </h1>
            <p className="text-white/65 text-lg leading-relaxed mb-10 max-w-lg">{heroSub}</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/shop" className="btn-primary group">
                EXPLORE COLLECTIONS
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:translate-x-1 transition-transform"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12,5 19,12 12,19"/></svg>
              </Link>
              {whatsapp && (
                <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className="btn-outline border-white/40 text-white hover:border-[#C4A45A] hover:text-[#C4A45A] hover:bg-transparent">
                  💬 BOOK CONSULTATION
                </a>
              )}
            </div>
            {/* Stats */}
            <div className="flex gap-8 mt-14 flex-wrap">
              {[['500+','Unique Patterns'],['30+','Master Weavers'],['12K+','Happy Customers']].map(([n, l]) => (
                <div key={l} className="border-l-2 border-[#C4A45A]/30 pl-4">
                  <span className="font-serif text-3xl text-[#C4A45A] block">{n}</span>
                  <span className="font-display text-[10px] tracking-[0.3em] text-white/40">{l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30">
          <span className="text-[9px] tracking-[0.3em] font-display">SCROLL</span>
          <div className="w-px h-10 bg-gradient-to-b from-white/30 to-transparent animate-pulse" />
        </div>
      </section>

      {/* ── TRUST STRIP ── */}
      <div className="bg-[#F5E6C8] border-y border-[#EDE0C0]">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-center">
            {['✦  Master Weavers with 40+ Years Experience','✦  Ships to 80+ Countries via DHL','✦  7–21 Day Bespoke Turnaround','✦  Authentic Yoruba Heritage Patterns'].map(t => (
              <span key={t} className="text-[11px] tracking-[0.12em] text-[#7A6A52] font-medium">{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── CATEGORIES (from DB) ── */}
      {categories.length > 0 && (
        <section className="bg-[#1A0E00] py-20 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <FadeIn>
              <div className="mb-12">
                <span className="section-label">BROWSE BY TYPE</span>
                <h2 className="font-serif text-4xl sm:text-5xl text-[#FDFBF7]">Our <em>Collections</em></h2>
              </div>
            </FadeIn>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              {categories.map((cat, i) => (
                <FadeIn key={cat.id} delay={i * 80}>
                  <Link to={`/shop?category=${cat.slug}`} className="group relative overflow-hidden aspect-category block border border-white/10 hover:border-[#C4A45A]/50 transition-all duration-300">
                    {cat.image
                      ? <img src={cat.image} alt={cat.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-106 absolute inset-0" />
                      : <div className="absolute inset-0 flex items-center justify-center text-4xl" style={{ background: cat.color || '#1A0E00' }}>✦</div>
                    }
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1A0E00]/90 via-[#1A0E00]/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <h3 className="font-serif text-[#FDFBF7] text-base font-semibold leading-tight">{cat.name}</h3>
                      {cat._count && <span className="text-[10px] text-[#C4A45A] font-display tracking-widest">{cat._count.products} PIECES</span>}
                    </div>
                  </Link>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── SHOP BY OCCASION ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <FadeIn>
          <div className="text-center mb-14">
            <span className="section-label">CURATED FOR EVERY CEREMONY</span>
            <h2 className="section-title mb-4">Shop by <em>Occasion</em></h2>
            <p className="text-[#9B8B6E] max-w-md mx-auto text-sm leading-relaxed">From intimate ceremonies to grand traditional weddings — find the collection that speaks to your celebration.</p>
          </div>
        </FadeIn>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
          {OCCASIONS.map((occ, i) => (
            <FadeIn key={occ.title} delay={i * 100}>
              <Link to={`/shop?category=${occ.cat}`} className="group relative overflow-hidden block" style={{ minHeight: 480 }}>
                <img src={occ.img} alt={occ.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 absolute inset-0" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1A0E00]/88 via-[#1A0E00]/20 to-transparent" />
                <div className="absolute inset-0 flex flex-col justify-end p-7">
                  <span className="self-start text-[10px] tracking-[0.2em] text-white px-3 py-1 mb-4 font-sans font-semibold" style={{ background: occ.color }}>{occ.tag}</span>
                  <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-1">{occ.title}</h3>
                  <p className="text-white/65 text-sm mb-5">{occ.sub}</p>
                  <span className="self-start text-[#C4A45A] text-xs tracking-[0.18em] font-semibold border-b border-[#C4A45A] pb-0.5 group-hover:gap-3 flex items-center gap-1 transition-all duration-300 font-sans">
                    EXPLORE ›
                  </span>
                </div>
              </Link>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── FEATURED PRODUCTS ── */}
      {products.length > 0 && (
        <section className="bg-[#F5E6C8] py-20 lg:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <FadeIn>
              <div className="flex items-end justify-between mb-12">
                <div>
                  <span className="section-label">HANDPICKED FOR YOU</span>
                  <h2 className="section-title">Featured <em>Pieces</em></h2>
                </div>
                <Link to="/shop" className="hidden sm:flex items-center gap-2 text-sm font-medium text-[#9B8B6E] hover:text-[#1A0E00] transition-colors font-sans">
                  View All →
                </Link>
              </div>
            </FadeIn>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 lg:gap-8">
              {products.slice(0, 8).map((p, i) => (
                <FadeIn key={p.id} delay={i * 80}>
                  <ProductCard product={p} />
                </FadeIn>
              ))}
            </div>
            <div className="text-center mt-12">
              <Link to="/shop" className="btn-dark">VIEW ALL COLLECTIONS</Link>
            </div>
          </div>
        </section>
      )}

      {/* ── BESPOKE ── */}
      <section className="bg-[#1A0E00] py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <FadeIn>
              <div>
                <span className="section-label">THE BESPOKE EXPERIENCE</span>
                <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-[#FDFBF7] leading-tight mb-6">
                  Your Threads,<br /><em>Your Legacy.</em>
                </h2>
                <p className="text-white/55 text-base leading-relaxed mb-8 max-w-md">
                  Our bespoke service connects you directly with master weavers in Iseyin. Every thread, motif, and measurement tailored exclusively to you.
                </p>
                {whatsapp
                  ? <a href={`https://wa.me/${whatsapp}?text=Hello! I'd like to book a bespoke consultation.`} target="_blank" rel="noopener noreferrer" className="btn-outline">💬 BOOK A CONSULTATION</a>
                  : <Link to="/contact" className="btn-outline">BOOK A CONSULTATION</Link>
                }
              </div>
            </FadeIn>
            <div className="grid grid-cols-2 gap-4">
              {STEPS.map((s, i) => (
                <FadeIn key={s.n} delay={i * 80}>
                  <div className="bg-white/5 border border-white/10 p-5 hover:border-[#C4A45A]/40 transition-all duration-300 group">
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-2xl">{s.icon}</span>
                      <span className="font-serif text-4xl text-white/10 font-bold leading-none">{s.n}</span>
                    </div>
                    <h4 className="font-serif text-[#FDFBF7] text-base font-semibold mb-2">{s.title}</h4>
                    <p className="text-white/45 text-sm leading-relaxed">{s.desc}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="bg-[#F5E6C8] py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-12">
              <span className="section-label">WORN WITH PRIDE</span>
              <h2 className="section-title">Our Clients <em>Speak</em></h2>
            </div>
          </FadeIn>
          <div className="max-w-3xl mx-auto text-center relative min-h-40">
            {testimonials.map((t, i) => (
              <div key={i} className={`transition-all duration-700 ${i === tIdx ? 'opacity-100 translate-y-0 relative' : 'opacity-0 translate-y-4 absolute inset-0 pointer-events-none'}`}>
                <div className="font-serif text-[#C4A45A] text-6xl leading-none mb-4">"</div>
                <blockquote className="font-serif text-2xl sm:text-3xl font-medium text-[#1A0E00] leading-relaxed mb-8 italic">{t.q}</blockquote>
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#C4A45A] flex items-center justify-center text-[#1A0E00] font-bold font-serif">{t.name[0]}</div>
                  <div className="text-left">
                    <p className="font-semibold text-[#1A0E00] text-sm">{t.name}</p>
                    <p className="text-[#9B8B6E] text-xs">{t.loc}</p>
                  </div>
                </div>
              </div>
            ))}
            <div className="flex justify-center gap-2 mt-10">
              {testimonials.map((_, i) => (
                <button key={i} onClick={() => setTIdx(i)} className={`transition-all duration-300 rounded-full ${i === tIdx ? 'w-6 h-2 bg-[#C4A45A]' : 'w-2 h-2 bg-[#C4A45A]/30 hover:bg-[#C4A45A]/60'}`} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
