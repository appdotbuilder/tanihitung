import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/AuthProvider';
import { useNavigation } from '@/App';
import { AdSlot } from '@/components/AdSlot';

interface LayoutProps {
  children: React.ReactNode;
}

function SafeAdSlot({ position, className }: { position: 'top' | 'bottom' | 'result'; className?: string }) {
  try {
    return <AdSlot position={position} className={className} />;
  } catch (error) {
    console.warn('AdSlot error:', error);
    return (
      <div className={`w-full ${className || ''}`}>
        <div className="w-full min-h-[100px] bg-gray-50 border border-dashed border-gray-300 flex items-center justify-center text-sm text-gray-400">
          📢 Ad Space ({position})
        </div>
      </div>
    );
  }
}

export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const { navigate } = useNavigation();

  const handleLogout = () => {
    logout();
    navigate({ page: 'home' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        {/* Top AdSlot */}
        <SafeAdSlot position="top" className="border-b border-gray-100" />
        
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate({ page: 'home' })}
                className="text-2xl font-bold text-green-700 hover:text-green-800"
              >
                🌱 TaniHitung
              </button>
              <nav className="hidden sm:flex gap-4">
                <button 
                  onClick={() => navigate({ page: 'calculators' })}
                  className="text-gray-600 hover:text-green-700 font-medium"
                >
                  Calculators
                </button>
              </nav>
            </div>

            <div className="flex items-center gap-2">
              {user ? (
                <>
                  <span className="text-sm text-gray-600 mr-2">Hi, {user.name}!</span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => navigate({ page: 'dashboard' })}
                  >
                    Dashboard
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleLogout}>
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => navigate({ page: 'login' })}
                  >
                    Login
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => navigate({ page: 'register' })}
                  >
                    Register
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Mobile Navigation */}
          <nav className="sm:hidden mt-4 flex gap-4">
            <button 
              onClick={() => navigate({ page: 'calculators' })}
              className="text-gray-600 hover:text-green-700 font-medium"
            >
              All Calculators
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        {/* Bottom AdSlot */}
        <SafeAdSlot position="bottom" className="border-b border-gray-100" />
        
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-gray-600">
            <p className="text-sm">
              🌱 TaniHitung - Simple Farm & Livestock Calculators
            </p>
            <p className="text-xs mt-2">
              All calculators are free to use. Save results by creating an account.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}