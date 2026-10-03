import { useAuth } from '../context/AuthContext.jsx';
import Button from './ui/Button.jsx';

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <h1 className="text-lg font-semibold text-slate-900">Student Task Manager</h1>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-slate-600 sm:inline">Hi, {user?.name}</span>
          <Button variant="secondary" onClick={() => logout()}>
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
