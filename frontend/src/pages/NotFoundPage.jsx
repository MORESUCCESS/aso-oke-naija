import { Link } from 'react-router-dom';
export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <div className="font-display text-[150px] text-[#EDE0C0] leading-none">404</div>
      <h1 className="font-serif text-4xl mt-4 mb-3">Page <em>Not Found</em></h1>
      <p className="text-[#9B8B6E] mb-8 max-w-sm">The page you are looking for doesn't exist or has been moved.</p>
      <Link to="/" className="btn-primary text-xs">GO HOME</Link>
    </div>
  );
}
