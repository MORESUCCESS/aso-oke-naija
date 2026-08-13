import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore, useCartStore } from '../../context/stores';
import api, { formatNaira } from '../../utils/api';
import toast from 'react-hot-toast';

// ── ICONS ──────────────────────────────────────────────────────
const SearchIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>;
const UserIcon   = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const BagIcon    = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>;
const HeartIcon  = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>;
const MenuIcon   = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>;
const CloseIcon  = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const TrashIcon  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;

const NAV_LINKS = [
  { label: 'Shop', href: '/shop' },
  { label: 'Bridal / Aso Ebi', href: '/shop?category=bridal-sets' },
  { label: 'Custom Orders', href: '/contact' },
  { label: 'Our Story', href: '/about' },
];

// ── CART DRAWER ────────────────────────────────────────────────
function CartDrawer({ open, onClose }) {
  const { items, subtotal, updateItem, removeItem } = useCartStore();
  const navigate = useNavigate();

  return (
    <>
      <div onClick={onClose} className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} />
      <aside className={`fixed top-0 right-0 h-full w-full max-w-sm bg-[#FDFBF7] z-50 flex flex-col shadow-2xl transition-transform duration-500 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 bg-[#1A0E00] border-b-2 border-[#C4A45A]">
          <h3 className="font-serif text-xl text-[#FDFBF7]">Your Cart ({items.length})</h3>
          <button onClick={onClose} className="text-[#FDFBF7]/70 hover:text-[#FDFBF7]"><CloseIcon /></button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-5 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#F5E6C8] flex items-center justify-center"><BagIcon /></div>
              <p className="font-serif text-xl">Your cart is empty</p>
              <p className="text-sm text-[#9B8B6E]">Discover our handcrafted collections</p>
              <button onClick={() => { onClose(); navigate('/shop'); }} className="btn-primary text-xs px-6 py-3">SHOP NOW</button>
            </div>
          ) : items.map(item => (
            <div key={item.id} className="flex gap-3 pb-4 border-b border-[#EDE0C0]">
              <Link to={`/shop/${item.product?.slug}`} onClick={onClose}>
                <img src={item.product?.image || '/placeholder.jpg'} alt={item.product?.name} className="w-16 h-20 object-cover bg-[#F5E6C8]" />
              </Link>
              <div className="flex-1">
                <Link to={`/shop/${item.product?.slug}`} onClick={onClose}>
                  <p className="font-serif text-sm font-semibold line-clamp-1 hover:text-[#C4A45A] transition-colors">{item.product?.name}</p>
                </Link>
                {item.variant && <p className="text-xs text-[#9B8B6E] mt-0.5">{item.variant.name}</p>}
                <p className="text-[#C4A45A] font-display text-base mt-1">{formatNaira(item.unitPrice)}</p>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center border border-[#EDE0C0]">
                    <button onClick={() => item.quantity > 1 ? updateItem(item.id, item.quantity - 1) : removeItem(item.id)} className="w-7 h-7 text-[#9B8B6E] hover:bg-[#F5E6C8] transition-colors text-sm">−</button>
                    <span className="w-8 text-center text-sm">{item.quantity}</span>
                    <button onClick={() => updateItem(item.id, item.quantity + 1)} className="w-7 h-7 text-[#9B8B6E] hover:bg-[#F5E6C8] transition-colors text-sm">+</button>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="text-[#9B8B6E] hover:text-[#8B1A1A] transition-colors"><TrashIcon /></button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t-2 border-[#EDE0C0] bg-[#F5E6C8] p-5">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-[#9B8B6E] font-medium">Subtotal</span>
              <span className="font-serif text-xl font-bold">{formatNaira(subtotal)}</span>
            </div>
            <p className="text-xs text-[#9B8B6E] mb-4">Shipping calculated at checkout</p>
            <button onClick={() => { onClose(); navigate('/checkout'); }} className="w-full btn-dark justify-center py-4 text-sm">
              PROCEED TO CHECKOUT
            </button>
            <button onClick={() => { onClose(); navigate('/cart'); }} className="w-full btn-ghost justify-center py-2 text-sm mt-2 text-[#9B8B6E]">
              View Full Cart
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

// ── NAVBAR ─────────────────────────────────────────────────────
export default function MainLayout() {
  const { pathname } = useLocation();
  const navigate     = useNavigate();
  const [scrolled,   setScrolled]   = useState(false);
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [cartOpen,   setCartOpen]   = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ,    setSearchQ]    = useState('');
  const { user, logout, isAdmin }   = useAuthStore();
  const { totalItems, openCart }    = useCartStore();

  const { data: settingsData } = useQuery({
    queryKey: ['public-settings'],
    queryFn:  () => api.get('/settings/public').then(r => r.data.data.settings),
    staleTime: 1000 * 60 * 10,
  });

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => { setMenuOpen(false); setCartOpen(false); }, [pathname]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQ.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQ.trim())}`);
      setSearchOpen(false);
      setSearchQ('');
    }
  };

  const siteName = settingsData?.site_name || 'Àṣọ Òkè Royale';
  const phone    = settingsData?.phone || '';

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── ANNOUNCEMENT BAR ── */}
      <div className="bg-[#1A0E00] text-[#FDFBF7] py-2.5 px-4 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 text-xs">
          <span className="hidden md:flex items-center gap-2 text-white/60">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            WORLDWIDE SHIPPING VIA DHL
          </span>
          <p className="text-center tracking-[0.2em] text-[#C4A45A]/90 font-medium">✦ BESPOKE BRIDAL CONSULTATIONS AVAILABLE ✦</p>
          {phone && (
            <a href={`tel:${phone}`} className="hidden md:block text-white/60 hover:text-[#C4A45A] transition-colors tracking-wide">{phone}</a>
          )}
        </div>
      </div>

      {/* ── SEARCH BAR ── */}
      {searchOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center pt-24 px-4">
          <div className="w-full max-w-2xl">
            <form onSubmit={handleSearch} className="flex">
              <input
                autoFocus
                type="text" value={searchQ} onChange={e => setSearchQ(e.target.value)}
                placeholder="Search for gele, etu, sanyan, bridal..."
                className="flex-1 px-6 py-5 text-lg bg-[#FDFBF7] outline-none font-sans text-[#1A0E00] placeholder-[#9B8B6E]"
              />
              <button type="submit" className="bg-[#C4A45A] text-[#1A0E00] px-8 font-semibold text-sm tracking-widest font-sans hover:bg-[#1A0E00] hover:text-[#C4A45A] transition-all duration-300">SEARCH</button>
            </form>
            <button onClick={() => setSearchOpen(false)} className="mt-4 text-white/70 hover:text-white text-sm flex items-center gap-2 mx-auto"><CloseIcon /> Close</button>
          </div>
        </div>
      )}

      {/* ── NAVBAR ── */}
      <nav className={`sticky top-0 z-30 transition-all duration-300 ${scrolled ? 'bg-[#FDFBF7]/97 backdrop-blur-sm shadow-md' : 'bg-[#FDFBF7]'} border-b border-[#EDE0C0]`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Mobile menu toggle */}
            <button onClick={() => setMenuOpen(true)} className="lg:hidden text-[#1A0E00] hover:text-[#C4A45A] transition-colors p-1">
              <MenuIcon />
            </button>

            {/* Desktop nav left */}
            <div className="hidden lg:flex items-center gap-8">
              {NAV_LINKS.slice(0, 2).map(l => (
                <Link key={l.label} to={l.href} className="text-sm font-medium text-[#1A0E00]/75 hover:text-[#1A0E00] transition-colors relative group tracking-wide">
                  {l.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-px bg-[#C4A45A] group-hover:w-full transition-all duration-300" />
                </Link>
              ))}
            </div>

            {/* Logo */}
            <Link to="/" className="absolute left-1/2 -translate-x-1/2 text-center">
              <span className="font-serif text-xl sm:text-2xl font-bold tracking-[0.2em] text-[#1A0E00]">{siteName}</span>
              <span className="block text-[9px] tracking-[0.3em] text-[#9B8B6E] -mt-0.5 font-display">LUXURY ASO OKE</span>
            </Link>

            {/* Desktop nav right */}
            <div className="hidden lg:flex items-center gap-8">
              {NAV_LINKS.slice(2).map(l => (
                <Link key={l.label} to={l.href} className="text-sm font-medium text-[#1A0E00]/75 hover:text-[#1A0E00] transition-colors relative group tracking-wide">
                  {l.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-px bg-[#C4A45A] group-hover:w-full transition-all duration-300" />
                </Link>
              ))}
            </div>

            {/* Icons */}
            <div className="flex items-center gap-3 text-[#1A0E00]">
              <button onClick={() => setSearchOpen(true)} className="hover:text-[#C4A45A] transition-colors p-1 hidden sm:block"><SearchIcon /></button>
              {user ? (
                <div className="relative group">
                  <button className="hover:text-[#C4A45A] transition-colors p-1"><UserIcon /></button>
                  <div className="absolute right-0 top-full mt-2 w-44 bg-[#1A0E00] border border-[#C4A45A]/20 shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 z-20">
                    <Link to="/account"         className="block px-4 py-3 text-sm text-white/75 hover:text-[#C4A45A] hover:bg-white/5 border-b border-white/5 transition-colors">My Account</Link>
                    <Link to="/account/orders"  className="block px-4 py-3 text-sm text-white/75 hover:text-[#C4A45A] hover:bg-white/5 border-b border-white/5 transition-colors">My Orders</Link>
                    <Link to="/account/wishlist" className="block px-4 py-3 text-sm text-white/75 hover:text-[#C4A45A] hover:bg-white/5 border-b border-white/5 transition-colors">Wishlist</Link>
                    {isAdmin() && <Link to="/admin" className="block px-4 py-3 text-sm text-[#C4A45A] hover:bg-white/5 border-b border-white/5 transition-colors">Admin Panel</Link>}
                    <button onClick={logout} className="block w-full text-left px-4 py-3 text-sm text-white/75 hover:text-red-400 hover:bg-white/5 transition-colors">Logout</button>
                  </div>
                </div>
              ) : (
                <Link to="/login" className="hover:text-[#C4A45A] transition-colors p-1"><UserIcon /></Link>
              )}
              <button onClick={() => setCartOpen(true)} className="relative hover:text-[#C4A45A] transition-colors p-1">
                <BagIcon />
                {totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[#C4A45A] text-[#1A0E00] text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center font-sans">{totalItems}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── MOBILE MENU ── */}
      <>
        <div onClick={() => setMenuOpen(false)} className={`fixed inset-0 bg-black/40 z-40 lg:hidden transition-opacity duration-300 ${menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} />
        <div className={`fixed top-0 left-0 h-full w-72 bg-[#1A0E00] z-50 flex flex-col transition-transform duration-500 lg:hidden ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
            <span className="font-serif text-[#FDFBF7] text-lg tracking-widest">{siteName}</span>
            <button onClick={() => setMenuOpen(false)} className="text-white/70 hover:text-white"><CloseIcon /></button>
          </div>
          <nav className="flex-1 px-4 pt-6 space-y-1">
            {[...NAV_LINKS, { label: 'Cart', href: '/cart' }, ...(user ? [{ label: 'My Account', href: '/account' }, { label: 'My Orders', href: '/account/orders' }] : [{ label: 'Login', href: '/login' }, { label: 'Register', href: '/register' }])].map(l => (
              <Link key={l.label} to={l.href} className="block py-3 px-3 text-white/75 hover:text-[#C4A45A] font-serif text-lg border-b border-white/5 transition-colors">{l.label}</Link>
            ))}
          </nav>
        </div>
      </>

      {/* Cart drawer */}
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />

      {/* ── PAGE CONTENT ── */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* ── FOOTER ── */}
      <footer className="bg-[#1A0E00] text-[#FDFBF7]">
        {/* Newsletter */}
        <div className="border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div>
                <span className="section-label">THE INNER CIRCLE</span>
                <h3 className="font-serif text-4xl text-[#FDFBF7] mb-3">Join Our Circle</h3>
                <p className="text-white/50 text-sm max-w-sm leading-relaxed">First access to new collections, private sales, and exclusive invitations.</p>
              </div>
              <form className="flex" onSubmit={e => { e.preventDefault(); toast.success('Thank you for subscribing!'); e.target.reset(); }}>
                <input type="email" required placeholder="Your email address" className="flex-1 bg-white/8 border border-white/15 text-white placeholder-white/35 px-5 py-4 text-sm outline-none focus:border-[#C4A45A] transition-colors" />
                <button type="submit" className="bg-[#C4A45A] text-[#1A0E00] text-xs tracking-[0.2em] font-bold px-8 hover:bg-[#FDFBF7] transition-all duration-300 whitespace-nowrap font-sans">JOIN</button>
              </form>
            </div>
          </div>
        </div>

        {/* Links */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            <div className="col-span-2 lg:col-span-1">
              <div className="mb-4">
                <span className="font-serif text-xl font-bold tracking-widest">{siteName}</span>
                <span className="block text-[9px] tracking-[0.3em] text-[#9B8B6E] mt-0.5 font-display">LUXURY ASO OKE</span>
              </div>
              <p className="text-white/45 text-sm leading-relaxed max-w-xs">Honoring the legacy of Yoruba master weavers in Iseyin, Oyo State — where every thread carries centuries of cultural heritage.</p>
              {settingsData?.whatsapp && (
                <a href={`https://wa.me/${settingsData.whatsapp}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 mt-5 text-sm text-[#C4A45A] hover:text-[#FDFBF7] transition-colors">
                  <span>💬</span> WhatsApp Us
                </a>
              )}
            </div>
            {[
              { title: 'COLLECTIONS', links: [['Shop All', '/shop'], ['Bridal Sets', '/shop?category=bridal-sets'], ['Gele', '/shop?category=gele'], ['Etu', '/shop?category=etu'], ['Sanyan', '/shop?category=sanyan'], ['Aso Ebi', '/shop?category=aso-ebi']] },
              { title: 'ACCOUNT',     links: [['Login', '/login'], ['Register', '/register'], ['My Orders', '/account/orders'], ['Wishlist', '/account/wishlist'], ['Contact Us', '/contact']] },
              { title: 'INFORMATION', links: [['About Us', '/about'], ['Shipping Policy', '/contact'], ['Returns', '/contact'], ['Size Guide', '/contact'], ['Track Order', '/account/orders']] },
            ].map(col => (
              <div key={col.title}>
                <h5 className="text-xs tracking-[0.25em] text-[#C4A45A] font-medium mb-5 font-display">{col.title}</h5>
                <ul className="space-y-2.5">
                  {col.links.map(([label, href]) => (
                    <li key={label}><Link to={href} className="text-sm text-white/50 hover:text-[#FDFBF7] transition-colors">{label}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-white/30 text-xs">
            <p>© {new Date().getFullYear()} {siteName}. All rights reserved.</p>
            <p>Made with ♥ in honour of the weavers of Iseyin, Oyo State</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
