import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { useNavigation } from '@/App';
import type { Calculator } from '../../../server/src/schema';

type CategoryFilter = 'all' | 'farming' | 'livestock';

export function CalculatorsList() {
  const { navigate } = useNavigation();
  const [calculators, setCalculators] = useState<Calculator[]>([]);
  const [filteredCalculators, setFilteredCalculators] = useState<Calculator[]>([]);
  const [activeFilter, setActiveFilter] = useState<CategoryFilter>('all');
  const [isLoading, setIsLoading] = useState(true);

  const loadCalculators = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.calculators.getAll.query();
      setCalculators(result);
      setFilteredCalculators(result);
    } catch (error) {
      console.error('Failed to load calculators:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCalculators();
  }, [loadCalculators]);

  // Filter calculators based on active filter
  const handleFilterChange = useCallback((filter: CategoryFilter) => {
    setActiveFilter(filter);
    if (filter === 'all') {
      setFilteredCalculators(calculators);
    } else {
      setFilteredCalculators(calculators.filter((calc: Calculator) => calc.category === filter));
    }
  }, [calculators]);

  // Update filtered calculators when calculators change
  useEffect(() => {
    handleFilterChange(activeFilter);
  }, [calculators, activeFilter, handleFilterChange]);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Farm & Livestock Calculators</h1>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-800">
          🧮 All Calculators
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Choose from our collection of simple farming and livestock calculators
        </p>
      </div>

      {/* Category Filters */}
      <div className="flex justify-center">
        <div className="flex flex-wrap gap-2 bg-gray-100 p-2 rounded-lg">
          <Button
            variant={activeFilter === 'all' ? 'default' : 'ghost'}
            onClick={() => handleFilterChange('all')}
            className="flex items-center gap-2"
          >
            📊 All ({calculators.length})
          </Button>
          <Button
            variant={activeFilter === 'farming' ? 'default' : 'ghost'}
            onClick={() => handleFilterChange('farming')}
            className="flex items-center gap-2"
          >
            🌾 Farming ({calculators.filter((c: Calculator) => c.category === 'farming').length})
          </Button>
          <Button
            variant={activeFilter === 'livestock' ? 'default' : 'ghost'}
            onClick={() => handleFilterChange('livestock')}
            className="flex items-center gap-2"
          >
            🐄 Livestock ({calculators.filter((c: Calculator) => c.category === 'livestock').length})
          </Button>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-center">
        <p className="text-lg text-gray-600">
          {filteredCalculators.length} calculator{filteredCalculators.length !== 1 ? 's' : ''} available
        </p>
      </div>

      {/* Calculators Grid */}
      {filteredCalculators.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl text-gray-500">No calculators found for the selected category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCalculators.map((calculator: Calculator) => (
            <CalculatorCard 
              key={calculator.id} 
              calculator={calculator}
              onNavigate={() => navigate({ page: 'calculator', slug: calculator.slug })}
            />
          ))}
        </div>
      )}

      {/* Back to Home */}
      <div className="text-center py-8">
        <Button 
          variant="outline" 
          size="lg" 
          onClick={() => navigate({ page: 'home' })}
        >
          ← Back to Home
        </Button>
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
    <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col" onClick={onNavigate}>
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
      <CardContent className="flex-1 flex flex-col">
        <CardDescription className="text-base text-gray-600 mb-4 flex-1">
          {calculator.description}
        </CardDescription>
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <span className="text-sm font-medium text-green-600">
            Result in {calculator.unit_label}
          </span>
          <span className="text-sm text-gray-400 flex items-center gap-1">
            Free to use →
          </span>
        </div>
      </CardContent>
    </Card>
  );
}