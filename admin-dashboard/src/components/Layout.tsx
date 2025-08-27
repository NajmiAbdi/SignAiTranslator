import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Database,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Activity,
} from 'lucide-react';
import { supabase } from '../services/supabase';

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/users', icon: Users, label: 'Users' },
  { path: '/datasets', icon: Database, label: 'Datasets' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const NavItem = ({ path, icon: Icon, label }: { path: string; icon: any; label: string }) => {
    const isActive = location.pathname === path;
    
    return (
      <Link
        to={path}
        className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
          isActive
            ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-600'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}
        onClick={() => setSidebarOpen(false)}
      >
        <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-primary-600' : 'text-gray-400'}`} />
        {label}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <div className="flex items-center">
            <Activity className="h-8 w-8 text-primary-600" />
            <span className="ml-2 text-lg font-semibold text-gray-900 hidden sm:block">Admin Panel</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 lg:hidden"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="mt-8 px-4 space-y-2">
          {navItems.map((item) => (
            <NavItem key={item.path} {...item} />
          ))}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-gray-200">
          <button
            onClick={handleSignOut}
            className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 py-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 lg:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500 hidden sm:block">
                Sign Language Translator Admin
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          <div className="fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}