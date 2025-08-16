import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/components/AuthProvider';
import { useNavigation } from '@/App';

export function Login() {
  const { navigate } = useNavigation();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const success = await login(formData.email, formData.password);
      if (success) {
        navigate({ page: 'dashboard' });
      } else {
        setError('Invalid email or password');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-800">
          🔐 Login
        </h1>
        <p className="text-lg text-gray-600">
          Sign in to save your calculation results
        </p>
      </div>

      {/* Login Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center">Welcome Back</CardTitle>
          <CardDescription className="text-center">
            Enter your email and password to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-base font-medium">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  handleInputChange('email', e.target.value)
                }
                placeholder="Enter your email"
                className="text-lg py-3"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-base font-medium">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  handleInputChange('password', e.target.value)
                }
                placeholder="Enter your password"
                className="text-lg py-3"
                required
              />
            </div>

            <Button 
              type="submit" 
              size="lg" 
              className="w-full text-lg py-6"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Signing In...
                </span>
              ) : (
                '🚀 Sign In'
              )}
            </Button>

            <div className="text-center space-y-4">
              <p className="text-gray-600">
                Don't have an account?{' '}
                <button 
                  type="button"
                  onClick={() => navigate({ page: 'register' })}
                  className="text-green-600 hover:text-green-700 font-medium underline"
                >
                  Create one here
                </button>
              </p>
              
              <div className="border-t pt-4">
                <p className="text-sm text-gray-500 mb-3">
                  Just want to try our calculators?
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => navigate({ page: 'home' })}
                  className="w-full"
                >
                  🧮 Use Calculators Without Account
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}