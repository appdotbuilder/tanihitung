import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/components/AuthProvider';
import { useNavigation } from '@/App';

export function Register() {
  const { navigate } = useNavigation();
  const { register } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
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

  const validateForm = (): string | null => {
    if (!formData.name.trim()) {
      return 'Name is required';
    }
    if (!formData.email.trim()) {
      return 'Email is required';
    }
    if (formData.password.length < 6) {
      return 'Password must be at least 6 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      return 'Passwords do not match';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const success = await register(formData.name, formData.email, formData.password);
      if (success) {
        navigate({ page: 'dashboard' });
      } else {
        setError('Registration failed. Email might already be in use.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-800">
          📝 Register
        </h1>
        <p className="text-lg text-gray-600">
          Create your free account to save calculation results
        </p>
      </div>

      {/* Registration Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center">Create Account</CardTitle>
          <CardDescription className="text-center">
            Join thousands of farmers using our calculators
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
              <Label htmlFor="name" className="text-base font-medium">
                Full Name
              </Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  handleInputChange('name', e.target.value)
                }
                placeholder="Enter your full name"
                className="text-lg py-3"
                required
              />
            </div>

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
                placeholder="Create a password (min 6 characters)"
                className="text-lg py-3"
                required
              />
              <p className="text-sm text-gray-500">
                Must be at least 6 characters long
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-base font-medium">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  handleInputChange('confirmPassword', e.target.value)
                }
                placeholder="Confirm your password"
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
                  Creating Account...
                </span>
              ) : (
                '🌱 Create Free Account'
              )}
            </Button>

            <div className="text-center space-y-4">
              <p className="text-gray-600">
                Already have an account?{' '}
                <button 
                  type="button"
                  onClick={() => navigate({ page: 'login' })}
                  className="text-green-600 hover:text-green-700 font-medium underline"
                >
                  Sign in here
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

      {/* Benefits */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-green-800 mb-3">✨ What you get with an account:</h3>
          <ul className="space-y-2 text-sm text-green-700">
            <li className="flex items-center gap-2">
              <span>💾</span> Save all your calculation results
            </li>
            <li className="flex items-center gap-2">
              <span>📊</span> View your calculation history
            </li>
            <li className="flex items-center gap-2">
              <span>📄</span> Export results to CSV
            </li>
            <li className="flex items-center gap-2">
              <span>🆓</span> Always free, no hidden costs
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}