import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../context/stores';
import { formatNaira } from '../utils/api';
import { EmptyState } from '../components/common';

export default function CartPage() {
  const { items, subtotal, updateItem, removeItem, clearCart } = useCartStore();
  const navigate = useNavigate();
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-serif text-4xl mb-8">Shopping <em>Cart</em></h1>
      {items.length === 0 ? (
        <EmptyState icon="🛍" title="Your cart is empty" message="Add items to your cart to see them here." action={() => navigate('/shop')} actionLabel="SHOP NOW" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-4">
            {items.map(item => (
              <div key={item.id} className="flex gap-5 bg-white border border-[#EDE0C0] p-4">
                <Link to={`/shop/${item.product?.slug}`}><img src={item.product?.image || '/placeholder.jpg'} alt="" className="w-20 h-24 object-cover bg-[#F5E6C8]" /></Link>
                <div className="flex-1">
                  <Link to={`/shop/${item.product?.slug}`} className="font-serif text-lg hover:text-[#C4A45A] transition-colors">{item.product?.name}</Link>
                  {item.variant && <p className="text-xs text-[#9B8B6E] mt-0.5">{item.variant.name}</p>}
                  <p className="font-display text-lg text-[#C4A45A] mt-1">{formatNaira(item.unitPrice)}</p>
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center border border-[#EDE0C0]">
                      <button onClick={() => item.quantity > 1 ? updateItem(item.id, item.quantity - 1) : removeItem(item.id)} className="w-9 h-9 text-[#9B8B6E] hover:bg-[#F5E6C8] transition-colors">−</button>
                      <span className="w-10 text-center text-sm">{item.quantity}</span>
                      <button onClick={() => updateItem(item.id, item.quantity + 1)} className="w-9 h-9 text-[#9B8B6E] hover:bg-[#F5E6C8] transition-colors">+</button>
                    </div>
                    <button onClick={() => removeItem(item.id)} className="text-xs text-[#9B8B6E] hover:text-[#8B1A1A] transition-colors font-sans">Remove</button>
                  </div>
                </div>
                <p className="font-display text-lg">{formatNaira(item.subtotal)}</p>
              </div>
            ))}
            <button onClick={clearCart} className="text-sm text-[#9B8B6E] hover:text-[#8B1A1A] transition-colors font-sans">✕ Clear Cart</button>
          </div>
          <div className="bg-white border border-[#EDE0C0] p-6 h-fit sticky top-24">
            <h2 className="font-serif text-xl mb-5 pb-4 border-b border-[#EDE0C0]">Order Summary</h2>
            <div className="space-y-2 text-sm mb-6">
              <div className="flex justify-between text-[#9B8B6E]"><span>Subtotal</span><span>{formatNaira(subtotal)}</span></div>
              <div className="flex justify-between text-[#9B8B6E]"><span>Shipping</span><span>Calculated at checkout</span></div>
              <div className="flex justify-between font-bold text-lg pt-3 border-t border-[#EDE0C0] font-serif"><span>Subtotal</span><span className="font-display">{formatNaira(subtotal)}</span></div>
            </div>
            <button onClick={() => navigate('/checkout')} className="btn-dark w-full justify-center py-4 text-sm">PROCEED TO CHECKOUT</button>
            <Link to="/shop" className="block text-center text-xs text-[#9B8B6E] mt-4 hover:text-[#1A0E00] transition-colors font-sans">← Continue Shopping</Link>
          </div>
        </div>
      )}
    </div>
  );
}
