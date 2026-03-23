import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, BarChart3, Users, LogOut } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

export const Layout: React.FC = () => {
  const { profile, signOut } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Planos', icon: Home },
    ...(profile?.role === 'admin'
      ? [
          { path: '/dashboard', label: 'Dashboard', icon: BarChart3 },
          { path: '/users', label: 'Usuários', icon: Users },
        ]
      : []),
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-16 md:pb-0 md:flex-row">
      {/* Top Header (Mobile) */}
      <header className="bg-white shadow-sm sticky top-0 z-10 md:hidden">
        <div className="px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">Planos de Ação</h1>
          <button onClick={signOut} className="text-gray-500 hover:text-gray-700">
            <LogOut className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 bg-white shadow-md min-h-screen sticky top-0">
        <div className="p-4 border-b">
          <h1 className="text-2xl font-bold text-gray-900">Planos de Ação</h1>
          <p className="text-sm text-gray-500 mt-1">Olá, {profile?.name}</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t">
          <button
            onClick={signOut}
            className="flex items-center space-x-3 px-4 py-3 w-full text-left text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <Outlet />
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around items-center z-10 pb-safe">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center py-3 px-4 ${
                isActive ? 'text-blue-600' : 'text-gray-500'
              }`}
            >
              <Icon className={`w-6 h-6 ${isActive ? 'fill-blue-100' : ''}`} />
              <span className="text-[10px] mt-1 font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
