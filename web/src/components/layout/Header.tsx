import { useAuthStore } from '../../store/authStore';

interface HeaderProps { title: string }

export function Header({ title }: HeaderProps) {
  const { user } = useAuthStore();
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
      <div className="text-sm text-gray-500">{user?.location ?? 'Rwanda'}</div>
    </header>
  );
}
