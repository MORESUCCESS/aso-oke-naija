import { Link } from 'react-router-dom';
import { useCartStore, useWishlistStore } from '../../context/stores';
import { formatNaira } from '../../utils/api';

// ── SPINNER ───────────────────────────────────────────────────
export function Spinner({ size = 'md', color = 'gold' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  const colors = { gold: 'border-[#C4A45A]', white: 'border-white', dark: 'border-[#1A0E00]' };
  return (
    <div className={`${sizes[size]} border-2 ${colors[color]} border-t-transparent rounded-full animate-spin`} />
  );
}

export function PageSpinner() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" />
        <p className="text-[#9B8B6E] text-sm tracking-widest font-display">LOADING...</p>
      </div>
    </div>
  );
}

// ── STAR RATING ───────────────────────────────────────────────
export function StarRating({ rating = 0, size = 'sm', showCount, count }) {
  const sizes = { sm: 'text-sm', md: 'text-base', lg: 'text-lg' };
  return (
    <div className={`flex items-center gap-1 ${sizes[size]}`}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={i <= Math.round(rating) ? 'text-[#C4A45A]' : 'text-[#EDE0C0]'}>★</span>
      ))}
      {showCount && count !== undefined && (
        <span className="text-[#9B8B6E] text-xs ml-1">({count})</span>
      )}
    </div>
  );
}

// ── PRODUCT CARD ──────────────────────────────────────────────
export function ProductCard({ product, view = 'grid' }) {
  const { addToCart } = useCartStore();
  const { toggle, isInWishlist } = useWishlistStore();

  const primaryImage = product.primaryImage || product.images?.[0]?.url || null;
  const inWish       = isInWishlist(product.id);
  const isOnSale     = product.comparePrice && parseFloat(product.comparePrice) > parseFloat(product.price);
  const discount     = isOnSale
    ? Math.round(((parseFloat(product.comparePrice) - parseFloat(product.price)) / parseFloat(product.comparePrice)) * 100)
    : null;

  const handleAddCart = (e) => {
    e.preventDefault();
    addToCart(product.id, null, 1, {
      id:       product.id,
      name:     product.name,
      slug:     product.slug,
      price:    parseFloat(product.price),
      image:    primaryImage,
      stock:    product.stock,
      category: product.category?.name,
    });
  };

  if (view === 'list') {
    return (
      <Link to={`/shop/${product.slug}`} className="flex gap-5 p-4 bg-white border border-[#EDE0C0] hover:border-[#C4A45A] transition-all duration-300 group">
        <div className="w-24 h-32 flex-shrink-0 overflow-hidden bg-[#F5E6C8]">
          {primaryImage
            ? <img src={primaryImage} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            : <div className="w-full h-full flex items-center justify-center text-3xl">✦</div>
          }
        </div>
        <div className="flex-1 flex flex-col justify-between py-1">
          <div>
            {product.category && <p className="text-[10px] tracking-[0.2em] text-[#C4A45A] font-display mb-1">{product.category.name.toUpperCase()}</p>}
            <h3 className="font-serif text-lg font-semibold text-[#1A0E00] mb-1">{product.name}</h3>
            {product.avgRating && <StarRating rating={parseFloat(product.avgRating)} showCount count={product.reviewCount} />}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-xl text-[#C4A45A]">{formatNaira(product.price)}</span>
              {isOnSale && <span className="text-sm text-[#9B8B6E] line-through">{formatNaira(product.comparePrice)}</span>}
            </div>
            <button onClick={handleAddCart} className="text-xs tracking-widest border border-[#1A0E00] px-5 py-2 hover:bg-[#1A0E00] hover:text-[#FDFBF7] transition-all duration-300 font-sans font-medium">ADD TO CART</button>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div className="group relative">
      {/* Image */}
      <Link to={`/shop/${product.slug}`} className="block relative overflow-hidden aspect-product bg-[#F5E6C8] mb-3">
        {primaryImage
          ? <img src={primaryImage} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
          : <div className="w-full h-full flex items-center justify-center text-5xl text-[#EDE0C0]">✦</div>
        }
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.badge && <span className="badge-dark text-[9px]">{product.badge}</span>}
          {discount && <span className="badge-red text-[9px]">-{discount}%</span>}
          {product.stock === 0 && <span className="badge bg-gray-700 text-white text-[9px]">SOLD OUT</span>}
        </div>
        {/* Wishlist */}
        <button
          onClick={(e) => { e.preventDefault(); toggle(product.id); }}
          className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${inWish ? 'bg-[#8B1A1A] text-white' : 'bg-white/80 text-[#1A0E00] opacity-0 group-hover:opacity-100'}`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill={inWish ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
        {/* Quick add */}
        {product.stock > 0 && (
          <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <button onClick={handleAddCart} className="w-full bg-[#1A0E00] text-[#FDFBF7] text-xs tracking-[0.2em] py-3 hover:bg-[#C4A45A] hover:text-[#1A0E00] transition-all duration-300 font-sans font-semibold">
              ADD TO CART
            </button>
          </div>
        )}
      </Link>

      {/* Info */}
      <div>
        {product.category && (
          <p className="text-[10px] tracking-[0.2em] text-[#C4A45A] font-display mb-0.5">{product.category.name.toUpperCase()}</p>
        )}
        <Link to={`/shop/${product.slug}`}>
          <h3 className="font-serif text-base font-semibold text-[#1A0E00] mb-1.5 line-clamp-1 hover:text-[#C4A45A] transition-colors">{product.name}</h3>
        </Link>
        {product.avgRating && <StarRating rating={parseFloat(product.avgRating)} showCount count={product.reviewCount} />}
        {/* Color swatches */}
        {product.variants?.filter(v => v.type === 'color').length > 0 && (
          <div className="flex items-center gap-1.5 mt-1.5">
            {product.variants.filter(v => v.type === 'color').slice(0, 5).map((v, i) => (
              <div key={i} title={v.name} className="w-3.5 h-3.5 rounded-full border border-white ring-1 ring-[#EDE0C0] hover:ring-[#C4A45A] transition-all cursor-pointer" style={{ background: v.value }} />
            ))}
            {product.variants.filter(v => v.type === 'color').length > 5 && (
              <span className="text-[10px] text-[#9B8B6E]">+{product.variants.filter(v => v.type === 'color').length - 5}</span>
            )}
          </div>
        )}
        <div className="flex items-baseline gap-2 mt-2">
          <span className="font-display text-lg text-[#1A0E00]">{formatNaira(product.price)}</span>
          {isOnSale && <span className="text-sm text-[#9B8B6E] line-through">{formatNaira(product.comparePrice)}</span>}
        </div>
      </div>
    </div>
  );
}

// ── PAGINATION ────────────────────────────────────────────────
export function Pagination({ page, pages, onPage }) {
  if (pages <= 1) return null;
  const range = Array.from({ length: pages }, (_, i) => i + 1);
  return (
    <div className="flex items-center justify-center gap-2 mt-12">
      <button onClick={() => onPage(page - 1)} disabled={page === 1} className="w-10 h-10 border border-[#EDE0C0] flex items-center justify-center text-[#9B8B6E] hover:border-[#C4A45A] hover:text-[#C4A45A] disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200">
        ‹
      </button>
      {range.map(p => (
        <button key={p} onClick={() => onPage(p)} className={`w-10 h-10 border flex items-center justify-center text-sm font-medium transition-all duration-200 font-sans ${p === page ? 'bg-[#1A0E00] text-[#FDFBF7] border-[#1A0E00]' : 'border-[#EDE0C0] text-[#9B8B6E] hover:border-[#C4A45A] hover:text-[#C4A45A]'}`}>
          {p}
        </button>
      ))}
      <button onClick={() => onPage(page + 1)} disabled={page === pages} className="w-10 h-10 border border-[#EDE0C0] flex items-center justify-center text-[#9B8B6E] hover:border-[#C4A45A] hover:text-[#C4A45A] disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200">
        ›
      </button>
    </div>
  );
}

// ── EMPTY STATE ───────────────────────────────────────────────
export function EmptyState({ icon = '✦', title, message, action, actionLabel }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-5xl mb-4 text-[#EDE0C0]">{icon}</div>
      <h3 className="font-serif text-2xl mb-2 text-[#1A0E00]">{title}</h3>
      <p className="text-[#9B8B6E] text-sm max-w-xs mb-6">{message}</p>
      {action && (
        <button onClick={action} className="btn-primary text-xs px-8 py-3">{actionLabel}</button>
      )}
    </div>
  );
}

// ── PAGE HERO ─────────────────────────────────────────────────
export function PageHero({ label, title, subtitle, bg = '#1A0E00' }) {
  return (
    <div className="page-hero" style={{ background: bg }}>
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(90deg,#C4A45A 0,#C4A45A 1px,transparent 1px,transparent 64px),repeating-linear-gradient(0deg,#C4A45A 0,#C4A45A 1px,transparent 1px,transparent 64px)' }} />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {label && <span className="section-label">{label}</span>}
        <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-[#FDFBF7] leading-tight">{title}</h1>
        {subtitle && <p className="text-white/55 mt-3 text-base max-w-xl">{subtitle}</p>}
      </div>
    </div>
  );
}

// ── ADMIN TABLE ───────────────────────────────────────────────
export function AdminTable({ columns, data, onRow }) {
  return (
    <div className="bg-white border border-gray-200 overflow-hidden rounded-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {columns.map(col => (
                <th key={col.key} className="text-left px-4 py-3 text-[10px] tracking-[0.2em] text-gray-500 font-semibold font-display whitespace-nowrap">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.length === 0 ? (
              <tr><td colSpan={columns.length} className="text-center py-16 text-gray-400 text-sm italic">No records found.</td></tr>
            ) : data.map((row, i) => (
              <tr key={row.id || i} onClick={() => onRow?.(row)} className={`transition-colors ${onRow ? 'cursor-pointer hover:bg-amber-50/60' : ''}`}>
                {columns.map(col => (
                  <td key={col.key} className="px-4 py-3.5 text-sm text-gray-700 whitespace-nowrap">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── STATUS BADGE ──────────────────────────────────────────────
export function StatusBadge({ status }) {
  const map = {
    PENDING:    'bg-amber-100 text-amber-700',
    CONFIRMED:  'bg-blue-100 text-blue-700',
    PROCESSING: 'bg-purple-100 text-purple-700',
    SHIPPED:    'bg-indigo-100 text-indigo-700',
    DELIVERED:  'bg-green-100 text-green-700',
    CANCELLED:  'bg-red-100 text-red-700',
    REFUNDED:   'bg-gray-100 text-gray-600',
    PAID:       'bg-green-100 text-green-700',
    UNPAID:     'bg-amber-100 text-amber-700',
    FAILED:     'bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-block px-2.5 py-1 text-[10px] tracking-widest font-semibold rounded-sm font-sans ${map[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}

// ── ADMIN STAT CARD ───────────────────────────────────────────
export function StatCard({ label, value, icon, trend, color = 'gold' }) {
  const colors = {
    gold:  'border-l-[#C4A45A]',
    green: 'border-l-green-500',
    blue:  'border-l-blue-500',
    red:   'border-l-red-500',
  };
  return (
    <div className={`bg-white border border-gray-200 border-l-4 ${colors[color]} p-5 rounded-sm`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs tracking-[0.15em] text-gray-400 font-display mb-2">{label}</p>
          <p className="font-display text-3xl text-gray-800">{value}</p>
          {trend && <p className="text-xs text-green-600 mt-1 font-medium">{trend}</p>}
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  );
}
