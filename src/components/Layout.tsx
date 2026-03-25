import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, BarChart3, Users, LogOut, Store as StoreIcon, UserCircle, ChevronLeft, ChevronRight, Menu } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

export const Layout: React.FC = () => {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const navItems = [
    { path: '/', label: 'Planos', icon: Home },
    ...(profile?.role === 'admin'
      ? [
          { path: '/dashboard', label: 'Dashboard', icon: BarChart3 },
          { path: '/users', label: 'Usuários', icon: Users },
          { path: '/stores', label: 'Lojas', icon: StoreIcon },
        ]
      : []),
    { path: '/profile', label: 'Meu Perfil', icon: UserCircle },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20 md:pb-0 md:flex-row">
      {/* Top Header (Mobile) */}
      <header className="bg-white shadow-sm sticky top-0 z-40 md:hidden border-b border-gray-100">
        <div className="px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="PEX INTERFERIR" className="w-8 h-8" />
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">PEX INTERFERIR</h1>
          </div>
          <button 
            onClick={signOut} 
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
            title="Sair"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Sidebar (Desktop) */}
      <aside 
        className={`hidden md:flex flex-col bg-white shadow-md h-screen sticky top-0 transition-all duration-300 ease-in-out z-20 relative ${
          isSidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className={`p-4 border-b flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} h-[73px]`}>
          <div className={`flex items-center gap-3 overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
            <img src="/logo.svg" alt="PEX INTERFERIR" className="w-10 h-10 flex-shrink-0" />
            <h1 className="text-xl font-bold text-gray-900 leading-tight whitespace-nowrap">PEX<br/>INTERFERIR</h1>
          </div>
          {isSidebarCollapsed && (
            <img src="/logo.svg" alt="PEX INTERFERIR" className="w-10 h-10 flex-shrink-0 absolute" />
          )}
        </div>
        
        <button 
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute -right-3 top-6 bg-white border border-gray-200 rounded-full p-1 shadow-sm text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors z-30"
          title={isSidebarCollapsed ? "Expandir menu" : "Recolher menu"}
        >
          {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                title={isSidebarCollapsed ? item.label : undefined}
                className={`flex items-center px-4 py-3 rounded-xl transition-colors ${
                  isSidebarCollapsed ? 'justify-center' : 'space-x-3'
                } ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className={`whitespace-nowrap transition-all duration-300 ${
                  isSidebarCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100 block'
                }`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop Header */}
        <header className="hidden md:flex items-center justify-end px-8 py-4 bg-white border-b sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <UserCircle className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-700 font-medium">{profile?.name}</span>
            </div>
            <div className="w-px h-6 bg-gray-200"></div>
            <button
              onClick={signOut}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>

      {/* Bottom Navigation (Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center z-50 pb-[env(safe-area-inset-bottom)] px-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 py-2 my-1 rounded-2xl transition-all ${
                isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className={`p-1.5 rounded-full transition-all duration-300 ${isActive ? 'bg-blue-100 scale-110' : 'bg-transparent'}`}>
                <Icon className={`w-5 h-5 ${isActive ? 'fill-blue-600' : ''}`} />
              </div>
              <span className={`text-[10px] mt-1 font-medium transition-all ${isActive ? 'text-blue-700 font-bold' : ''}`}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
