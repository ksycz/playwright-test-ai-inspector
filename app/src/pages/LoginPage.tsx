import { useId, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { sanitizeRedirectPath } from '@/utils/auth';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const usernameId = useId();
  const passwordId = useId();
  const usernameErrorId = useId();
  const passwordErrorId = useId();
  const formErrorId = useId();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [formError, setFormError] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextUsernameError = username.trim() ? '' : 'Username is required';
    const nextPasswordError = password.trim() ? '' : 'Password is required';

    setUsernameError(nextUsernameError);
    setPasswordError(nextPasswordError);
    setFormError('');

    if (nextUsernameError || nextPasswordError) {
      return;
    }

    const isAuthenticated = login(username.trim(), password);

    if (!isAuthenticated) {
      setFormError('Invalid username or password');
      return;
    }

    const redirectPath = sanitizeRedirectPath(searchParams.get('redirect'));
    navigate(redirectPath, { replace: true });
  };

  return (
    <>
      <h1 className="page-heading">Log in</h1>
      <p className="page-intro">Sign in to continue to checkout.</p>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="surface-card mt-8 max-w-md space-y-6 p-6"
      >
        {formError ? (
          <p
            id={formErrorId}
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {formError}
          </p>
        ) : null}

        <div>
          <label htmlFor={usernameId} className="block text-sm font-medium text-brand-900">
            Username
          </label>
          <input
            id={usernameId}
            name="username"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            aria-invalid={usernameError ? true : undefined}
            aria-describedby={usernameError ? usernameErrorId : undefined}
            className="input-field"
          />
          {usernameError ? (
            <p id={usernameErrorId} className="mt-2 text-sm text-red-700">
              {usernameError}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor={passwordId} className="block text-sm font-medium text-brand-900">
            Password
          </label>
          <input
            id={passwordId}
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={passwordError ? true : undefined}
            aria-describedby={passwordError ? passwordErrorId : undefined}
            className="input-field"
          />
          {passwordError ? (
            <p id={passwordErrorId} className="mt-2 text-sm text-red-700">
              {passwordError}
            </p>
          ) : null}
        </div>

        <button type="submit" className="btn-primary">
          Log in
        </button>
      </form>
    </>
  );
}
