import { useWishlistStore } from '../context/stores';
import { ProductCard, EmptyState } from '../components/common';
import { useNavigate } from 'react-router-dom';

export default function WishlistPage() {
  const { items } = useWishlistStore();
  const navigate  = useNavigate();
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-serif text-4xl mb-8">My <em>Wishlist</em></h1>
      {items.length === 0 ? (
        <EmptyState icon="♡" title="Your wishlist is empty" message="Save items you love while browsing our collection." action={() => navigate('/shop')} actionLabel="BROWSE COLLECTION" />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {items.map(item => item.product && <ProductCard key={item.id} product={item.product} />)}
        </div>
      )}
    </div>
  );
}
