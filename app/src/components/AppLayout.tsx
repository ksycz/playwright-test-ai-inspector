import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';

const navLinkClassName = ({ isActive }: { isActive: boolean }) =>
  [
    'inline-flex min-h-11 items-center rounded px-3 py-2 text-sm font-medium transition-colors',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900',
    isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100',
  ].join(' ');

const navButtonClassName =
  'inline-flex min-h-11 items-center rounded px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900';

function cartAriaLabel(totalItems: number) {
  const itemLabel = totalItems === 1 ? 'item' : 'items';
  return `Cart, ${totalItems} ${itemLabel}`;
}

export default function AppLayout() {
  const { totalItems } = useCart();
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
                    aria-label={cartAriaLabel(totalItems)}
                  >
                    Cart ({totalItems})
                  </NavLink>
                </li>
                {isAuthenticated && user ? (
                  <>
                    <li className="inline-flex min-h-11 items-center px-3 py-2 text-sm text-slate-700">
                      Welcome, {user.username}
                    </li>
                    <li>
                      <button type="button" onClick={logout} className={navButtonClassName}>
                        Log out
                      </button>
                    </li>
                  </>
                ) : (
                  <li>
                    <NavLink to="/login" className={navLinkClassName}>
                      Login
                    </NavLink>
                  </li>
                )}
              </ul>
            </nav>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
        <Outlet />
      </main>
    </div>
  );
}
