import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import { PageSpinner } from '../../components/common';
import toast from 'react-hot-toast';

export default function AdminMessages() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-messages'],
    queryFn:  () => api.get('/contact').then(r => r.data.data.messages),
  });

  const markRead = useMutation({
    mutationFn: (id) => api.put(`/contact/${id}/read`),
    onSuccess:  () => qc.invalidateQueries(['admin-messages']),
  });

  if (isLoading) return <PageSpinner />;
  const messages = data || [];
  const unread   = messages.filter(m => !m.isRead).length;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <h1 className="font-serif text-3xl">Messages</h1>
        {unread > 0 && (
          <span className="bg-[#C4A45A] text-[#1A0E00] text-xs font-bold px-2.5 py-1 rounded-full font-sans">
            {unread} unread
          </span>
        )}
      </div>

      {messages.length === 0 ? (
        <div className="bg-white border border-gray-200 p-16 text-center">
          <div className="text-4xl mb-3">💬</div>
          <p className="font-serif text-xl text-gray-400">No messages yet</p>
          <p className="text-gray-400 text-sm mt-1">Customer enquiries will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`bg-white border p-5 transition-all ${!msg.isRead ? 'border-[#C4A45A] border-l-4' : 'border-gray-200'}`}
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-serif text-lg font-semibold">{msg.name}</span>
                    {!msg.isRead && (
                      <span className="text-[10px] bg-[#C4A45A] text-[#1A0E00] px-2 py-0.5 font-bold font-sans">NEW</span>
                    )}
                    <span className="text-xs text-gray-400">{new Date(msg.createdAt).toLocaleDateString('en-NG', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3">
                    <a href={`mailto:${msg.email}`} className="text-sm text-[#C4A45A] hover:text-[#1A0E00] transition-colors">{msg.email}</a>
                    {msg.phone && <a href={`tel:${msg.phone}`} className="text-sm text-gray-500 hover:text-[#1A0E00] transition-colors">{msg.phone}</a>}
                    {msg.subject && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 font-sans">{msg.subject}</span>}
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 flex-shrink-0">
                  {!msg.isRead && (
                    <button
                      onClick={() => markRead.mutate(msg.id)}
                      className="text-xs border border-gray-300 text-gray-500 px-3 py-1.5 hover:border-[#C4A45A] hover:text-[#C4A45A] transition-all font-sans"
                    >
                      Mark Read
                    </button>
                  )}
                  <a
                    href={`mailto:${msg.email}?subject=Re: ${msg.subject || 'Your Enquiry'}`}
                    className="text-xs bg-[#1A0E00] text-white px-3 py-1.5 hover:bg-[#C4A45A] hover:text-[#1A0E00] transition-all font-sans text-center"
                  >
                    Reply
                  </a>
                  {msg.phone && (
                    <a
                      href={`https://wa.me/${msg.phone.replace(/[^0-9]/g, '')}?text=Hello ${msg.name}, thank you for contacting Àṣọ Òkè Royale.`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-xs bg-green-600 text-white px-3 py-1.5 hover:bg-green-700 transition-all font-sans text-center"
                    >
                      💬 WhatsApp
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
