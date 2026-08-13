import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { Spinner } from '../components/common';

export default function PaymentVerify() {
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying | success | failed
  const [order,  setOrder]  = useState(null);
  const [error,  setError]  = useState('');

  useEffect(() => {
    const gateway = sp.get('gateway');
    const ref     = sp.get('ref') || sp.get('reference') || sp.get('trxref');
    const txId    = sp.get('transaction_id');
    if (!ref) { setStatus('failed'); setError('No payment reference found.'); return; }

    const verify = async () => {
      try {
        let data;
        if (gateway === 'flutterwave') {
          const res = await api.get(`/payments/flutterwave/verify/${ref}?transaction_id=${txId}`);
          data = res.data;
        } else {
          const res = await api.get(`/payments/paystack/verify/${ref}`);
          data = res.data;
        }
        setOrder(data.data.order);
        setStatus('success');
        setTimeout(() => navigate(`/account/orders/${data.data.order.orderRef}`), 3000);
      } catch (err) {
        setStatus('failed');
        setError(err.response?.data?.message || 'Payment verification failed.');
      }
    };
    verify();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {status === 'verifying' && (
          <div className="flex flex-col items-center gap-4">
            <Spinner size="lg" />
            <h2 className="font-serif text-2xl">Verifying Payment...</h2>
            <p className="text-[#9B8B6E] text-sm">Please wait while we confirm your payment.</p>
          </div>
        )}
        {status === 'success' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center text-4xl">✅</div>
            <h2 className="font-serif text-3xl text-green-700">Payment Successful!</h2>
            <p className="text-[#9B8B6E]">Order <strong className="text-[#1A0E00]">{order?.orderRef}</strong> confirmed.</p>
            <p className="text-sm text-[#9B8B6E]">Redirecting to your order...</p>
            <Link to={`/account/orders/${order?.orderRef}`} className="btn-primary text-xs">VIEW ORDER</Link>
          </div>
        )}
        {status === 'failed' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center text-4xl">❌</div>
            <h2 className="font-serif text-3xl text-red-700">Payment Failed</h2>
            <p className="text-[#9B8B6E] text-sm">{error}</p>
            <div className="flex gap-3">
              <Link to="/checkout" className="btn-primary text-xs">TRY AGAIN</Link>
              <Link to="/account/orders" className="btn-outline text-xs">MY ORDERS</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
