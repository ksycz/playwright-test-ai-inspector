import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <>
      <h1 className="text-3xl font-semibold">Page not found</h1>
      <p className="mt-4 text-slate-600">The page you are looking for does not exist.</p>
      <p className="mt-6">
        <Link
          to="/"
          className="rounded px-3 py-2 text-sm font-medium text-slate-900 underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
        >
          Back to Home
        </Link>
      </p>
    </>
  );
}
