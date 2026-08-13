import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';
import { ProductCard, Pagination, PageSpinner, EmptyState, PageHero } from '../components/common';

const SORT_OPTIONS = [
  { value: 'createdAt_desc', label: 'Newest First' },
  { value: 'price_asc',      label: 'Price: Low → High' },
  { value: 'price_desc',     label: 'Price: High → Low' },
  { value: 'name_asc',       label: 'Name: A – Z' },
];

export default function ShopPage() {
  const [sp, setSp] = useSearchParams();
  const [view,  setView]  = useState('grid');
  const [showF, setShowF] = useState(false);

  const page     = parseInt(sp.get('page')     || '1');
  const category = sp.get('category') || '';
  const search   = sp.get('search')   || '';
  const sort     = sp.get('sort')     || 'createdAt_desc';
  const minPrice = sp.get('minPrice') || '';
  const maxPrice = sp.get('maxPrice') || '';

  const { data: catsData } = useQuery({ queryKey: ['categories'], queryFn: () => api.get('/categories').then(r => r.data.data) });
  const { data, isLoading } = useQuery({
    queryKey: ['products', page, category, search, sort, minPrice, maxPrice],
    queryFn:  () => {
      const params = new URLSearchParams({ page, limit: 12, sort, ...(category && { category }), ...(search && { search }), ...(minPrice && { minPrice }), ...(maxPrice && { maxPrice }) });
      return api.get(`/products?${params}`).then(r => r.data.data);
    },
    keepPreviousData: true,
  });

  const setParam = (key, val) => { const n = new URLSearchParams(sp); if (val) n.set(key, val); else n.delete(key); n.delete('page'); setSp(n); };
  const setPage  = (p)        => { const n = new URLSearchParams(sp); n.set('page', p); setSp(n); };

  const products   = data?.products   || [];
  const pagination = data?.pagination || {};
  const categories = catsData?.categories || [];

  const FilterSidebar = () => (
    <div className="space-y-6">
      <div>
        <h4 className="font-display text-xs tracking-[0.2em] text-[#9B8B6E] mb-3">CATEGORIES</h4>
        <div className="space-y-1">
          <button onClick={() => setParam('category', '')} className={`block w-full text-left px-3 py-2 text-sm transition-colors ${!category ? 'bg-[#1A0E00] text-[#FDFBF7]' : 'hover:bg-[#F5E6C8] text-[#1A0E00]'}`}>All Products</button>
          {categories.map(c => (
            <button key={c.id} onClick={() => setParam('category', c.slug)} className={`block w-full text-left px-3 py-2 text-sm transition-colors ${category === c.slug ? 'bg-[#1A0E00] text-[#FDFBF7]' : 'hover:bg-[#F5E6C8] text-[#1A0E00]'}`}>
              {c.name} {c._count && <span className="text-[10px] text-[#9B8B6E] ml-1">({c._count.products})</span>}
            </button>
          ))}
        </div>
      </div>
      <div>
        <h4 className="font-display text-xs tracking-[0.2em] text-[#9B8B6E] mb-3">PRICE RANGE (₦)</h4>
        <div className="grid grid-cols-2 gap-2">
          <input type="number" placeholder="Min" defaultValue={minPrice} onBlur={e => setParam('minPrice', e.target.value)} className="input-field text-sm py-2" />
          <input type="number" placeholder="Max" defaultValue={maxPrice} onBlur={e => setParam('maxPrice', e.target.value)} className="input-field text-sm py-2" />
        </div>
      </div>
      {(category || search || minPrice || maxPrice) && (
        <button onClick={() => setSp({})} className="w-full text-sm text-[#8B1A1A] border border-[#8B1A1A] py-2 hover:bg-[#8B1A1A] hover:text-white transition-all font-sans">
          ✕ Clear Filters
        </button>
      )}
    </div>
  );

  return (
    <div>
      <PageHero label="OUR COLLECTION" title={search ? `Search: "${search}"` : category ? categories.find(c => c.slug === category)?.name || 'Shop' : 'All Products'} subtitle="Authentic hand-woven Aso Oke from master weavers in Iseyin, Oyo State." />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex gap-8">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-56 flex-shrink-0"><FilterSidebar /></aside>

          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <button onClick={() => setShowF(!showF)} className="lg:hidden flex items-center gap-2 text-sm border border-[#EDE0C0] px-4 py-2 hover:border-[#C4A45A] transition-colors font-sans">
                  ⚙ Filters
                </button>
                <p className="text-sm text-[#9B8B6E]">
                  {pagination.total ? `${pagination.total} product${pagination.total !== 1 ? 's' : ''}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <select value={sort} onChange={e => setParam('sort', e.target.value)} className="select-field text-sm py-2 w-48">
                  {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <div className="hidden sm:flex border border-[#EDE0C0]">
                  {['grid','list'].map(v => (
                    <button key={v} onClick={() => setView(v)} className={`px-3 py-2 text-sm transition-colors ${view === v ? 'bg-[#1A0E00] text-white' : 'text-[#9B8B6E] hover:text-[#1A0E00]'}`}>
                      {v === 'grid' ? '⊞' : '≡'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile filter dropdown */}
            {showF && <div className="lg:hidden mb-6 p-5 border border-[#EDE0C0] bg-[#FDFBF7]"><FilterSidebar /></div>}

            {/* Products */}
            {isLoading ? <PageSpinner /> : products.length === 0 ? (
              <EmptyState icon="🛍" title="No products found" message="Try adjusting your filters or search terms." action={() => setSp({})} actionLabel="CLEAR FILTERS" />
            ) : (
              <>
                <div className={view === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-5' : 'space-y-4'}>
                  {products.map(p => <ProductCard key={p.id} product={p} view={view} />)}
                </div>
                <Pagination page={pagination.page} pages={pagination.pages} onPage={setPage} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
