import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api, { formatNaira } from '../utils/api';
import { useCartStore, useWishlistStore } from '../context/stores';
import { StarRating, ProductCard, PageSpinner } from '../components/common';

export default function ProductPage() {
  const { slug }     = useParams();
  const navigate     = useNavigate();
  const { addToCart } = useCartStore();
  const { toggle, isInWishlist } = useWishlistStore();

  const [qty,        setQty]       = useState(1);
  const [selVariant, setSelVariant]= useState(null);
  const [selImage,   setSelImage]  = useState(0);
  const [tab,        setTab]       = useState('description');

  const { data, isLoading, error } = useQuery({
    queryKey: ['product', slug],
    queryFn:  () => api.get(`/products/${slug}`).then(r => r.data.data),
  });

  if (isLoading) return <PageSpinner />;
  if (error || !data?.product) return (
    <div className="min-h-screen flex items-center justify-center flex-col gap-4">
      <p className="font-serif text-2xl">Product not found.</p>
      <Link to="/shop" className="btn-primary text-xs">BACK TO SHOP</Link>
    </div>
  );

  const { product, related } = data;
  const images   = product.images || [];
  const variants = product.variants || [];
  const colors   = variants.filter(v => v.type === 'color');
  const inWish   = isInWishlist(product.id);
  const isOnSale = product.comparePrice && parseFloat(product.comparePrice) > parseFloat(product.price);
  const price    = selVariant?.price ? parseFloat(selVariant.price) : parseFloat(product.price);

  const handleAddCart = () => {
    addToCart(product.id, selVariant?.id || null, qty, {
      id: product.id, name: product.name, slug: product.slug,
      price, image: images[selImage]?.url || images[0]?.url,
      stock: product.stock, category: product.category?.name,
    });
  };

  const handleBuyNow = () => { handleAddCart(); navigate('/checkout'); };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-[#9B8B6E] mb-8 font-sans">
        <Link to="/" className="hover:text-[#C4A45A]">Home</Link> /
        <Link to="/shop" className="hover:text-[#C4A45A]">Shop</Link> /
        {product.category && <><Link to={`/shop?category=${product.category.slug}`} className="hover:text-[#C4A45A]">{product.category.name}</Link> /</>}
        <span className="text-[#1A0E00]">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 mb-16">
        {/* Images */}
        <div>
          <div className="relative aspect-square bg-[#F5E6C8] overflow-hidden mb-3 border border-[#EDE0C0]">
            {images[selImage]
              ? <img src={images[selImage].url} alt={product.name} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-6xl text-[#EDE0C0]">✦</div>
            }
            {product.badge && <span className="absolute top-4 left-4 badge-dark">{product.badge}</span>}
            {isOnSale && <span className="absolute top-4 right-4 badge-red">SALE</span>}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto scrollbar-thin">
              {images.map((img, i) => (
                <button key={i} onClick={() => setSelImage(i)} className={`w-16 h-16 flex-shrink-0 overflow-hidden border-2 transition-all ${i === selImage ? 'border-[#C4A45A]' : 'border-transparent hover:border-[#EDE0C0]'}`}>
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          {product.category && <Link to={`/shop?category=${product.category.slug}`} className="section-label hover:text-[#1A0E00] transition-colors">{product.category.name.toUpperCase()}</Link>}
          <h1 className="font-serif text-3xl sm:text-4xl font-bold mb-3">{product.name}</h1>
          <div className="flex items-center gap-3 mb-4">
            {product.avgRating && <StarRating rating={parseFloat(product.avgRating)} showCount count={product.reviewCount} size="md" />}
            {product.sku && <span className="text-xs text-[#9B8B6E] font-sans">SKU: {product.sku}</span>}
          </div>
          <div className="flex items-baseline gap-3 mb-6">
            <span className="font-display text-3xl text-[#C4A45A]">{formatNaira(price)}</span>
            {isOnSale && <span className="text-lg text-[#9B8B6E] line-through">{formatNaira(product.comparePrice)}</span>}
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[['Fabric',    product.fabric], ['Technique', product.technique], ['Origin', product.origin], ['Length', product.yards]].filter(([, v]) => v).map(([l, v]) => (
              <div key={l} className="bg-[#F5E6C8] border border-[#EDE0C0] p-3">
                <span className="font-display text-[10px] tracking-[0.2em] text-[#9B8B6E] block mb-0.5">{l.toUpperCase()}</span>
                <span className="text-sm font-medium">{v}</span>
              </div>
            ))}
          </div>

          {/* Color variants */}
          {colors.length > 0 && (
            <div className="mb-5">
              <p className="font-display text-[10px] tracking-[0.2em] text-[#9B8B6E] mb-2">
                COLOR{selVariant ? `: ${selVariant.name}` : ''}
              </p>
              <div className="flex flex-wrap gap-2">
                {colors.map(v => (
                  <button key={v.id} onClick={() => setSelVariant(selVariant?.id === v.id ? null : v)} title={v.name}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${selVariant?.id === v.id ? 'border-[#1A0E00] scale-110' : 'border-white ring-1 ring-[#EDE0C0] hover:ring-[#C4A45A]'}`}
                    style={{ background: v.value }}>
                    {selVariant?.id === v.id && <span className="flex items-center justify-center h-full text-white text-xs">✓</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="mb-6">
            <p className="font-display text-[10px] tracking-[0.2em] text-[#9B8B6E] mb-2">QUANTITY</p>
            <div className="flex items-center border border-[#EDE0C0] w-32">
              <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-10 h-11 text-[#9B8B6E] hover:bg-[#F5E6C8] transition-colors text-lg">−</button>
              <span className="flex-1 text-center text-sm font-medium">{qty}</span>
              <button onClick={() => setQty(q => Math.min(product.stock, q + 1))} className="w-10 h-11 text-[#9B8B6E] hover:bg-[#F5E6C8] transition-colors text-lg">+</button>
            </div>
            <p className="text-xs text-[#9B8B6E] mt-1 font-sans">{product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 mb-6">
            <button onClick={handleAddCart} disabled={product.stock === 0} className="btn-primary w-full justify-center py-4 disabled:opacity-40 disabled:cursor-not-allowed">
              {product.stock === 0 ? 'OUT OF STOCK' : 'ADD TO CART'}
            </button>
            <button onClick={handleBuyNow} disabled={product.stock === 0} className="btn-dark w-full justify-center py-4 disabled:opacity-40">BUY NOW</button>
            <button onClick={() => toggle(product.id)} className={`w-full border py-3 text-sm tracking-widest font-sans transition-all duration-300 ${inWish ? 'border-[#8B1A1A] text-[#8B1A1A] bg-red-50' : 'border-[#EDE0C0] text-[#9B8B6E] hover:border-[#C4A45A] hover:text-[#C4A45A]'}`}>
              {inWish ? '♥ SAVED TO WISHLIST' : '♡ ADD TO WISHLIST'}
            </button>
          </div>

          {/* Guarantee strip */}
          <div className="grid grid-cols-2 gap-2 border-t border-[#EDE0C0] pt-5">
            {[['✦','Authentic Certified'],['🚚','Nationwide Delivery'],['↩','7-Day Returns'],['🔒','Secure Checkout']].map(([i, l]) => (
              <div key={l} className="flex items-center gap-2 text-xs text-[#9B8B6E]"><span>{i}</span><span>{l}</span></div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#EDE0C0] mb-8">
        <div className="flex gap-0">
          {['description','reviews'].map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-8 py-4 text-sm tracking-widest font-display transition-all border-b-2 ${tab === t ? 'border-[#C4A45A] text-[#1A0E00]' : 'border-transparent text-[#9B8B6E] hover:text-[#1A0E00]'}`}>
              {t.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      {tab === 'description' ? (
        <div className="max-w-2xl">
          <p className="text-[#9B8B6E] leading-relaxed">{product.description}</p>
        </div>
      ) : (
        <div className="max-w-2xl">
          {product.reviews?.length === 0 ? (
            <p className="text-[#9B8B6E] italic">No reviews yet. Be the first to review this product.</p>
          ) : product.reviews?.map(r => (
            <div key={r.id} className="border-b border-[#EDE0C0] pb-5 mb-5">
              <div className="flex items-center gap-3 mb-2">
                <StarRating rating={r.rating} />
                <span className="font-semibold text-sm">{r.user.firstName} {r.user.lastName}</span>
              </div>
              {r.title && <p className="font-medium text-sm mb-1">{r.title}</p>}
              <p className="text-[#9B8B6E] text-sm">{r.body}</p>
            </div>
          ))}
        </div>
      )}

      {/* Related */}
      {related?.length > 0 && (
        <div className="mt-20">
          <h2 className="font-serif text-3xl mb-8">You May Also <em>Like</em></h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
            {related.slice(0, 4).map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}
    </div>
  );
}
