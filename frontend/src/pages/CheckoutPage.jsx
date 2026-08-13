import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore, useAuthStore } from '../context/stores';
import api, { formatNaira } from '../utils/api';
import toast from 'react-hot-toast';

const NIGERIAN_STATES = ['Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno','Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara','International'];

export default function CheckoutPage() {
  const navigate  = useNavigate();
  const { items, subtotal, clearCart } = useCartStore();
  const { user }  = useAuthStore();
  const [loading, setLoading]   = useState(false);
  const [coupon,  setCoupon]    = useState('');
  const [discount,setDiscount]  = useState(0);
  const [gateway, setGateway]   = useState('paystack');
  const [form,    setForm]      = useState({
    firstName: user?.firstName || '', lastName: user?.lastName || '',
    email: user?.email || '', phone: '',
    street: '', city: '', state: 'Lagos', country: 'Nigeria', notes: '',
  });
  const [shippingFee, setShippingFee] = useState(3500);

  const handleStateChange = async (state) => {
    setForm(f => ({ ...f, state }));
    try {
      const { data } = await api.post('/shipping/calculate', { state, orderAmount: subtotal });
      setShippingFee(data.data.fee);
    } catch { setShippingFee(3500); }
  };

  const applyCoupon = async () => {
    if (!coupon) return;
    try {
      const { data } = await api.post('/coupons/validate', { code: coupon, orderAmount: subtotal });
      setDiscount(data.data.discount);
      toast.success(`Coupon applied! You save ${formatNaira(data.data.discount)}`);
    } catch (err) { toast.error(err.response?.data?.message || 'Invalid coupon.'); }
  };

  const total = Math.max(0, subtotal + shippingFee - discount);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!items.length) { toast.error('Your cart is empty.'); return; }
    setLoading(true);
    try {
      const orderItems = items.map(i => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity }));
      const { data } = await api.post('/orders', {
        items: orderItems,
        shippingName:    `${form.firstName} ${form.lastName}`,
        shippingPhone:   form.phone,
        shippingEmail:   form.email,
        shippingStreet:  form.street,
        shippingCity:    form.city,
        shippingState:   form.state,
        shippingCountry: form.country,
        shippingNotes:   form.notes,
        couponCode:      coupon || undefined,
        paymentMethod:   gateway,
      });
      const orderId = data.data.order.id;

      if (gateway === 'paystack') {
        const pay = await api.post('/payments/paystack/init', { orderId });
        window.location.href = pay.data.data.authorizationUrl;
      } else {
        const pay = await api.post('/payments/flutterwave/init', { orderId });
        window.location.href = pay.data.data.paymentLink;
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Order failed. Please try again.');
      setLoading(false);
    }
  };

  if (!items.length) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <p className="font-serif text-2xl">Your cart is empty</p>
      <button onClick={() => navigate('/shop')} className="btn-primary text-xs">SHOP NOW</button>
    </div>
  );

  const F = ({ label, name, type = 'text', required, children }) => (
    <div>
      <label className="font-display text-[10px] tracking-[0.2em] text-[#9B8B6E] block mb-1.5">{label.toUpperCase()}{required && ' *'}</label>
      {children || <input type={type} name={name} value={form[name]} onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))} required={required} className="input-field" />}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="font-serif text-4xl mb-8">Checkout</h1>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left */}
          <div className="lg:col-span-2 space-y-8">
            {/* Shipping */}
            <div className="bg-white border border-[#EDE0C0] p-6">
              <h2 className="font-serif text-xl mb-5 pb-4 border-b border-[#EDE0C0]">Shipping Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <F label="First Name" name="firstName" required />
                <F label="Last Name"  name="lastName"  required />
                <F label="Email"      name="email" type="email" required />
                <F label="Phone"      name="phone" type="tel"   required />
                <div className="col-span-2"><F label="Street Address" name="street" required /></div>
                <F label="City" name="city" required />
                <F label="State" name="state" required>
                  <select value={form.state} onChange={e => handleStateChange(e.target.value)} required className="select-field">
                    {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </F>
                <div className="col-span-2"><F label="Order Notes (Optional)" name="notes">
                  <textarea name="notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} className="input-field resize-none" placeholder="Special instructions..." />
                </F></div>
              </div>
            </div>

            {/* Payment */}
            <div className="bg-white border border-[#EDE0C0] p-6">
              <h2 className="font-serif text-xl mb-5 pb-4 border-b border-[#EDE0C0]">Payment Method</h2>
              <div className="space-y-3">
                {[['paystack','Paystack','Cards, Bank Transfer, USSD','🟢'],['flutterwave','Flutterwave','Cards, Mobile Money, Bank Transfer','🔵']].map(([id,name,desc,emoji]) => (
                  <label key={id} className={`flex items-center gap-4 p-4 border-2 cursor-pointer transition-all ${gateway === id ? 'border-[#C4A45A] bg-[#F5E6C8]/40' : 'border-[#EDE0C0] hover:border-[#C4A45A]/50'}`}>
                    <input type="radio" name="gateway" value={id} checked={gateway === id} onChange={() => setGateway(id)} className="accent-[#C4A45A]" />
                    <span className="text-2xl">{emoji}</span>
                    <div>
                      <p className="font-semibold text-sm">{name}</p>
                      <p className="text-xs text-[#9B8B6E]">{desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <div className="bg-white border border-[#EDE0C0] p-6 sticky top-24">
              <h2 className="font-serif text-xl mb-5 pb-4 border-b border-[#EDE0C0]">Order Summary</h2>
              <div className="space-y-3 mb-5">
                {items.map(item => (
                  <div key={item.id} className="flex gap-3">
                    <img src={item.product?.image || '/placeholder.jpg'} alt="" className="w-12 h-14 object-cover bg-[#F5E6C8] flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium line-clamp-1">{item.product?.name}</p>
                      {item.variant && <p className="text-xs text-[#9B8B6E]">{item.variant.name}</p>}
                      <p className="text-xs text-[#9B8B6E]">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-display">{formatNaira(item.subtotal)}</p>
                  </div>
                ))}
              </div>

              {/* Coupon */}
              <div className="flex gap-0 mb-5">
                <input type="text" value={coupon} onChange={e => setCoupon(e.target.value.toUpperCase())} placeholder="Coupon code" className="input-field text-sm py-2.5 flex-1" />
                <button type="button" onClick={applyCoupon} className="bg-[#1A0E00] text-[#FDFBF7] px-4 text-xs tracking-widest font-display hover:bg-[#C4A45A] hover:text-[#1A0E00] transition-all">APPLY</button>
              </div>

              {/* Totals */}
              <div className="space-y-2 text-sm border-t border-[#EDE0C0] pt-4">
                <div className="flex justify-between text-[#9B8B6E]"><span>Subtotal</span><span>{formatNaira(subtotal)}</span></div>
                <div className="flex justify-between text-[#9B8B6E]"><span>Shipping</span><span>{shippingFee === 0 ? 'FREE' : formatNaira(shippingFee)}</span></div>
                {discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-{formatNaira(discount)}</span></div>}
                <div className="flex justify-between font-bold text-lg border-t border-[#C4A45A] pt-3 mt-2 font-serif">
                  <span>Total</span><span className="font-display text-[#C4A45A]">{formatNaira(total)}</span>
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-dark w-full justify-center py-4 mt-5 text-sm disabled:opacity-60 disabled:cursor-not-allowed">
                {loading ? '⏳ PROCESSING...' : `✦ PAY ${formatNaira(total)}`}
              </button>
              <p className="text-xs text-[#9B8B6E] text-center mt-3">🔒 Secured by {gateway === 'paystack' ? 'Paystack' : 'Flutterwave'}</p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
