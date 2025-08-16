import React, { useState, useEffect } from 'react';
import { trpc } from '@/utils/trpc';

// Components
import { Layout } from '@/components/Layout';
import { Home } from '@/components/Home';
import { CalculatorsList } from '@/components/CalculatorsList';
import { CalculatorPage } from '@/components/CalculatorPage';
import { Login } from '@/components/Login';
import { Register } from '@/components/Register';
import { Dashboard } from '@/components/Dashboard';
import { AuthProvider, useAuth } from '@/components/AuthProvider';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Simple router state management
type Route = 
  | { page: 'home' }
  | { page: 'calculators' }
  | { page: 'calculator'; slug: string }
  | { page: 'login' }
  | { page: 'register' }
  | { page: 'dashboard' };

// Create a simple navigation context
const NavigationContext = React.createContext<{
  currentRoute: Route;
  navigate: (route: Route) => void;
}>({
  currentRoute: { page: 'home' },
  navigate: () => {}
});

export const useNavigation = () => React.useContext(NavigationContext);

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const { navigate } = useNavigation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto text-center space-y-4 py-12">
        <h2 className="text-2xl font-bold text-gray-800">Login Required</h2>
        <p className="text-gray-600">Please log in to access this page.</p>
        <button 
          onClick={() => navigate({ page: 'login' })}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return <>{children}</>;
}

function AppContent() {
  const [currentRoute, setCurrentRoute] = useState<Route>({ page: 'home' });

  const navigate = (route: Route) => {
    setCurrentRoute(route);
    // Update URL without page refresh
    const path = routeToPath(route);
    window.history.pushState({}, '', path);
  };

  // Handle browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      const route = pathToRoute(window.location.pathname);
      setCurrentRoute(route);
    };
    
    window.addEventListener('popstate', handlePopState);
    
    // Set initial route based on current URL
    const initialRoute = pathToRoute(window.location.pathname);
    setCurrentRoute(initialRoute);
    
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const renderCurrentPage = () => {
    switch (currentRoute.page) {
      case 'home':
        return <Home />;
      case 'calculators':
        return <CalculatorsList />;
      case 'calculator':
        return <CalculatorPage slug={currentRoute.slug} />;
      case 'login':
        return <Login />;
      case 'register':
        return <Register />;
      case 'dashboard':
        return (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        );
      default:
        return <Home />;
    }
  };

  return (
    <NavigationContext.Provider value={{ currentRoute, navigate }}>
      <Layout>
        {renderCurrentPage()}
      </Layout>
    </NavigationContext.Provider>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}

// Helper functions to convert between routes and paths
function routeToPath(route: Route): string {
  switch (route.page) {
    case 'home':
      return '/';
    case 'calculators':
      return '/calculators';
    case 'calculator':
      return `/calculators/${route.slug}`;
    case 'login':
      return '/login';
    case 'register':
      return '/register';
    case 'dashboard':
      return '/dashboard';
    default:
      return '/';
  }
}

function pathToRoute(path: string): Route {
  if (path === '/') return { page: 'home' };
  if (path === '/calculators') return { page: 'calculators' };
  if (path === '/login') return { page: 'login' };
  if (path === '/register') return { page: 'register' };
  if (path === '/dashboard') return { page: 'dashboard' };
  
  // Check for calculator page
  const calculatorMatch = path.match(/^\/calculators\/(.+)$/);
  if (calculatorMatch) {
    return { page: 'calculator', slug: calculatorMatch[1] };
  }
  
  return { page: 'home' };
}

export default App;