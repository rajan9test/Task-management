import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../api/auth.js';
import AuthLayout from '../components/AuthLayout.jsx';
import Alert from '../components/ui/Alert.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import { isValidEmail } from '../utils/validation.js';

function validate({ name, email, password, confirmPassword }) {
  const errors = {};
  if (!name.trim()) errors.name = 'Name is required';
  if (!email.trim()) errors.email = 'Email is required';
  else if (!isValidEmail(email)) errors.email = 'Invalid email format';
  if (!password) errors.password = 'Password is required';
  else if (password.length < 6) errors.password = 'Password must be at least 6 characters';
  if (!confirmPassword) errors.confirmPassword = 'Please confirm your password';
  else if (confirmPassword !== password) errors.confirmPassword = 'Passwords do not match';
  return errors;
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
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
    try {
      await register({ name: form.name.trim(), email: form.email.trim(), password: form.password });
      navigate('/login', {
        replace: true,
        state: { flash: { type: 'success', message: 'Account created. Please log in.' } },
      });
    } catch (err) {
      setServerError(err.message);
      if (err.errors) setErrors(err.errors);
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Create your account" subtitle="Start organising your assignments and deadlines.">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Alert type="error">{serverError}</Alert>
        <Input
          id="name"
          name="name"
          label="Name"
          autoComplete="name"
          maxLength={100}
          value={form.name}
          onChange={handleChange}
          error={errors.name}
          required
        />
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
          autoComplete="new-password"
          maxLength={72}
          value={form.password}
          onChange={handleChange}
          error={errors.password}
          required
        />
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          label="Confirm Password"
          autoComplete="new-password"
          maxLength={72}
          value={form.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          required
        />
        <Button type="submit" className="w-full" isLoading={isSubmitting} loadingText="Creating account…">
          Create Account
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-indigo-600 hover:underline">
          Login
        </Link>
      </p>
    </AuthLayout>
  );
}
