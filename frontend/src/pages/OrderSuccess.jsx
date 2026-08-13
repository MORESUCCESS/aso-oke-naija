import { Link, useSearchParams } from 'react-router-dom';
export default function OrderSuccess() {
  const [sp] = useSearchParams();
  const ref  = sp.get('ref');
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="text-6xl mb-6">🎉</div>
        <h1 className="font-serif text-4xl mb-3">Order <em>Placed!</em></h1>
        {ref && <p className="text-[#9B8B6E] mb-2">Reference: <strong className="text-[#1A0E00]">{ref}</strong></p>}
        <p className="text-[#9B8B6E] mb-8 leading-relaxed">Thank you! Our team will contact you within 24 hours to confirm delivery.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/account/orders" className="btn-primary text-xs">VIEW MY ORDERS</Link>
          <Link to="/shop" className="btn-outline text-xs">CONTINUE SHOPPING</Link>
        </div>
      </div>
    </div>
  );
}
