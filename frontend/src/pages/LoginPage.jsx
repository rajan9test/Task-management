import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import AuthLayout from '../components/AuthLayout.jsx';
import Alert from '../components/ui/Alert.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import { isValidEmail } from '../utils/validation.js';

function validate({ email, password }) {
  const errors = {};
  if (!email.trim()) errors.email = 'Email is required';
  else if (!isValidEmail(email)) errors.email = 'Invalid email format';
  if (!password) errors.password = 'Password is required';
  return errors;
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [flash, setFlash] = useState(location.state?.flash ?? null);
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const clientErrors = validate(form);
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length > 0) return;

    setIsSubmitting(true);
    setServerError('');
    setFlash(null);
    try {
      await login(form.email.trim(), form.password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setServerError(err.message);
      if (err.errors) setErrors(err.errors);
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Login" subtitle="Welcome back! Log in to see your tasks.">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {flash && (
          <Alert type={flash.type} onDismiss={() => setFlash(null)}>
            {flash.message}
          </Alert>
        )}
        <Alert type="error">{serverError}</Alert>
        <Input
          id="email"
          name="email"
          type="email"
          label="Email"
          autoComplete="email"
          value={form.email}
          onChange={handleChange}
          error={errors.email}
          required
        />
        <Input
          id="password"
          name="password"
          type="password"
          label="Password"
          autoComplete="current-password"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
          required
        />
        <Button type="submit" className="w-full" isLoading={isSubmitting} loadingText="Logging in…">
          Login
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="font-medium text-indigo-600 hover:underline">
          Register
        </Link>
      </p>
    </AuthLayout>
  );
}
