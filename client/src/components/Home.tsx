import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { useNavigation } from '@/App';
import type { Calculator } from '../../../server/src/schema';

export function Home() {
  const { navigate } = useNavigation();
  const [calculators, setCalculators] = useState<Calculator[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Calculator[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Load all calculators on component mount
  const loadCalculators = useCallback(async () => {
    try {
      const result = await trpc.calculators.getAll.query();
      setCalculators(result);
    } catch (error) {
      console.error('Failed to load calculators:', error);
    }
  }, []);

  useEffect(() => {
    loadCalculators();
  }, [loadCalculators]);

  // Handle search
  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const results = await trpc.calculators.search.query(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search effect
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, handleSearch]);

  // Group calculators by category
  const farmingCalculators = calculators.filter(calc => calc.category === 'farming');
  const livestockCalculators = calculators.filter(calc => calc.category === 'livestock');

  const displayCalculators = searchQuery.trim() ? searchResults : calculators;

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-6xl font-bold text-green-700">
          🌱 Farm & Livestock Calculators
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto">
          Simple, fast, and free calculators for farmers and livestock keepers
        </p>
      </div>

      {/* Search Bar */}
      <div className="max-w-2xl mx-auto">
        <div className="relative">
          <Input
            type="text"
            placeholder="Search calculators..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="text-lg py-6 pr-20"
          />
          {isSearching && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
            </div>
          )}
        </div>
        {searchQuery && (
          <p className="text-sm text-gray-500 mt-2">
            {searchResults.length} calculator{searchResults.length !== 1 ? 's' : ''} found
          </p>
        )}
      </div>

      {/* Results */}
      <div className="space-y-8">
        {searchQuery.trim() ? (
          // Search Results
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Search Results</h2>
            {searchResults.length === 0 && !isSearching ? (
              <div className="text-center py-12">
                <p className="text-xl text-gray-500">No calculators found for "{searchQuery}"</p>
                <Button
                  variant="outline"
                  onClick={() => setSearchQuery('')}
                  className="mt-4"
                >
                  Clear search
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayCalculators.map((calculator: Calculator) => (
                  <CalculatorCard 
                    key={calculator.id} 
                    calculator={calculator}
                    onNavigate={() => navigate({ page: 'calculator', slug: calculator.slug })}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          // Category Sections
          <>
            {/* Farming Section */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                  🌾 Farming Calculators
                </h2>
                <Badge variant="secondary" className="text-sm">
                  {farmingCalculators.length} tools
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {farmingCalculators.map((calculator: Calculator) => (
                  <CalculatorCard 
                    key={calculator.id} 
                    calculator={calculator}
                    onNavigate={() => navigate({ page: 'calculator', slug: calculator.slug })}
                  />
                ))}
              </div>
            </div>

            {/* Livestock Section */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                  🐄 Livestock Calculators
                </h2>
                <Badge variant="secondary" className="text-sm">
                  {livestockCalculators.length} tools
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {livestockCalculators.map((calculator: Calculator) => (
                  <CalculatorCard 
                    key={calculator.id} 
                    calculator={calculator}
                    onNavigate={() => navigate({ page: 'calculator', slug: calculator.slug })}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Call to Action */}
      <div className="text-center space-y-4 py-8">
        <p className="text-lg text-gray-600">
          Want to save your calculation results?
        </p>
        <div className="flex justify-center gap-4">
          <Button 
            size="lg" 
            onClick={() => navigate({ page: 'register' })}
          >
            Create Free Account
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            onClick={() => navigate({ page: 'calculators' })}
          >
            View All Calculators
          </Button>
        </div>
      </div>
    </div>
  );
}

// Calculator Card Component
interface CalculatorCardProps {
  calculator: Calculator;
  onNavigate: () => void;
}

function CalculatorCard({ calculator, onNavigate }: CalculatorCardProps) {
  const categoryIcon = calculator.category === 'farming' ? '🌾' : '🐄';
  const categoryColor = calculator.category === 'farming' 
    ? 'bg-green-100 text-green-800 border-green-200' 
    : 'bg-blue-100 text-blue-800 border-blue-200';

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={onNavigate}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-xl font-bold text-gray-800 leading-tight">
            {calculator.name}
          </CardTitle>
          <Badge className={`ml-2 ${categoryColor} flex items-center gap-1 shrink-0`}>
            <span>{categoryIcon}</span>
            <span className="capitalize text-xs">{calculator.category}</span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-base text-gray-600 mb-4">
          {calculator.description}
        </CardDescription>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-green-600">
            Result in {calculator.unit_label}
          </span>
          <span className="text-sm text-gray-400">
            Free to use →
          </span>
        </div>
      </CardContent>
    </Card>
  );
}