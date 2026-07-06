import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <section className="hero-panel">
      <h1 className="page-heading">Page not found</h1>
      <p className="page-intro">The page you are looking for does not exist.</p>
      <p className="mt-6">
        <Link to="/" className="text-link px-3 py-2 text-sm">
          Back to Home
        </Link>
      </p>
    </section>
  );
}
