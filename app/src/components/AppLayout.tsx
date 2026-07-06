import { NavLink, Outlet } from 'react-router-dom';

const navLinkClassName = ({ isActive }: { isActive: boolean }) =>
  [
    'rounded px-3 py-2 text-sm font-medium transition-colors',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900',
    isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100',
  ].join(' ');

export default function AppLayout() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
          <p className="text-lg font-semibold text-slate-900">Demo Shop</p>
          <nav aria-label="Main">
            <ul className="flex flex-wrap items-center gap-1">
              <li>
                <NavLink to="/" end className={navLinkClassName}>
                  Home
                </NavLink>
              </li>
              <li>
                <NavLink to="/products" className={navLinkClassName}>
                  Products
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/cart"
                  className={navLinkClassName}
                  aria-label="Cart, 0 items"
                >
                  Cart (0)
                </NavLink>
              </li>
              <li>
                <NavLink to="/login" className={navLinkClassName}>
                  Login
                </NavLink>
              </li>
            </ul>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-12">
        <Outlet />
      </main>
    </div>
  );
}
