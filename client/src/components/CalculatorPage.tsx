import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { useAuth } from '@/components/AuthProvider';
import { useNavigation } from '@/App';
import type { Calculator, CalculationResult } from '../../../server/src/schema';

interface CalculatorPageProps {
  slug: string;
}

export function CalculatorPage({ slug }: CalculatorPageProps) {
  const { user } = useAuth();
  const { navigate } = useNavigation();
  
  const [calculator, setCalculator] = useState<Calculator | null>(null);
  const [inputs, setInputs] = useState<Record<string, number>>({});
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load calculator data
  const loadCalculator = useCallback(async () => {
    if (!slug) return;
    
    try {
      setIsLoading(true);
      const result = await trpc.calculators.getBySlug.query(slug);
      if (result) {
        setCalculator(result);
        // Initialize inputs with default values based on calculator type
        initializeDefaultInputs(result.formula_key);
      } else {
        setError('Calculator not found');
      }
    } catch (error) {
      console.error('Failed to load calculator:', error);
      setError('Failed to load calculator');
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadCalculator();
  }, [loadCalculator]);

  // Initialize default input values
  const initializeDefaultInputs = (formulaKey: string) => {
    const defaults: Record<string, Record<string, number>> = {
      'fertilizer-requirement': {
        area_ha: 0,
        dose_kg_per_ha: 100
      },
      'chicken-feed-daily': {
        chicken_count: 0,
        feed_kg_per_chicken_per_day: 0.12
      },
      'livestock-medicine-dosage': {
        weight_kg: 0,
        dose_mg_per_kg: 0,
        concentration_mg_per_ml: 0
      },
      'harvest-estimation': {
        area_ha: 0,
        yield_ton_per_ha: 5
      },
      'planting-cost': {
        area_ha: 0,
        cost_rp_per_ha: 1000000
      }
    };

    if (defaults[formulaKey]) {
      setInputs(defaults[formulaKey]);
    }
  };

  // Handle input changes
  const handleInputChange = (field: string, value: string) => {
    const numericValue = parseFloat(value) || 0;
    setInputs((prev: Record<string, number>) => ({
      ...prev,
      [field]: numericValue
    }));
    // Clear previous results and errors when inputs change
    setResult(null);
    setError(null);
    setSaveSuccess(false);
  };

  // Handle calculation
  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!calculator) return;

    setIsCalculating(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const calculationResult = await trpc.calculations.calculate.mutate({
        formulaKey: calculator.formula_key,
        inputs
      });
      setResult(calculationResult);
    } catch (error: any) {
      console.error('Calculation failed:', error);
      setError(error?.message || 'Calculation failed. Please check your inputs.');
    } finally {
      setIsCalculating(false);
    }
  };

  // Handle save result
  const handleSaveResult = async () => {
    if (!calculator || !result || !user) return;

    setIsSaving(true);
    try {
      await trpc.results.save.mutate({
        calculator_id: calculator.id,
        input_json: inputs,
        result_value: result.result_value,
        unit_label: result.unit_label
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save result:', error);
      setError('Failed to save result. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-2xl">Loading calculator...</div>
      </div>
    );
  }

  if (error && !calculator) {
    return (
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-red-600">Calculator Not Found</h1>
        <p className="text-xl text-gray-600">The requested calculator could not be found.</p>
        <Button onClick={() => navigate({ page: 'calculators' })}>
          ← Back to Calculators
        </Button>
      </div>
    );
  }

  if (!calculator) return null;

  const categoryIcon = calculator.category === 'farming' ? '🌾' : '🐄';
  const categoryColor = calculator.category === 'farming' 
    ? 'bg-green-100 text-green-800 border-green-200' 
    : 'bg-blue-100 text-blue-800 border-blue-200';

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-4">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
            {calculator.name}
          </h1>
          <Badge className={`${categoryColor} flex items-center gap-1`}>
            <span>{categoryIcon}</span>
            <span className="capitalize">{calculator.category}</span>
          </Badge>
        </div>
        <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
          {calculator.description}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">📝 Enter Values</CardTitle>
            <CardDescription>
              Fill in the required information to calculate your result
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCalculate} className="space-y-6">
              {renderInputFields(calculator.formula_key, inputs, handleInputChange)}
              
              <Button 
                type="submit" 
                size="lg" 
                className="w-full text-lg py-6"
                disabled={isCalculating}
              >
                {isCalculating ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Calculating...
                  </span>
                ) : (
                  '🧮 Calculate Result'
                )}
              </Button>

              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-800">
                    {error}
                  </AlertDescription>
                </Alert>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Result Display */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">📊 Result</CardTitle>
            <CardDescription>
              Your calculation result will appear here
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {result ? (
              <>
                <div className="text-center space-y-4">
                  <div className="text-5xl md:text-6xl font-bold text-green-600">
                    {formatResult(result.result_value)}
                  </div>
                  <div className="text-2xl md:text-3xl font-semibold text-gray-700">
                    {result.unit_label}
                  </div>
                  
                  {/* Additional info for medicine dosage */}
                  {result.additional_info?.volume_ml && (
                    <div className="border-t pt-4">
                      <p className="text-lg text-gray-600 mb-2">Volume needed:</p>
                      <div className="text-3xl font-bold text-blue-600">
                        {formatResult(result.additional_info.volume_ml)} ml
                      </div>
                    </div>
                  )}
                </div>

                {/* AdSlot below result */}
                <div className="my-6">
                  <div className="w-full min-h-[100px] bg-gray-50 border border-dashed border-gray-300 flex items-center justify-center text-sm text-gray-400 rounded">
                    📢 Ad Space (result)
                  </div>
                </div>

                {/* Save Result Button */}
                <div className="space-y-3">
                  {user ? (
                    <Button 
                      onClick={handleSaveResult}
                      variant="outline" 
                      size="lg" 
                      className="w-full"
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <span className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                          Saving...
                        </span>
                      ) : (
                        '💾 Save Result'
                      )}
                    </Button>
                  ) : (
                    <div className="text-center space-y-3">
                      <p className="text-sm text-gray-600">
                        Want to save your results?
                      </p>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => navigate({ page: 'login' })}
                          className="flex-1"
                        >
                          Login
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => navigate({ page: 'register' })}
                          className="flex-1"
                        >
                          Register
                        </Button>
                      </div>
                    </div>
                  )}

                  {saveSuccess && (
                    <Alert className="border-green-200 bg-green-50">
                      <AlertDescription className="text-green-800">
                        ✅ Result saved successfully! View it in your dashboard.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <div className="text-6xl mb-4">🤔</div>
                <p className="text-lg">Enter values and click Calculate to see your result</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Navigation */}
      <div className="flex justify-center gap-4">
        <Button variant="outline" onClick={() => navigate({ page: 'calculators' })}>
          ← All Calculators
        </Button>
        <Button variant="outline" onClick={() => navigate({ page: 'home' })}>
          🏠 Home
        </Button>
      </div>
    </div>
  );
}

// Helper function to render input fields based on calculator type
function renderInputFields(
  formulaKey: string, 
  inputs: Record<string, number>, 
  handleInputChange: (field: string, value: string) => void
) {
  switch (formulaKey) {
    case 'fertilizer-requirement':
      return (
        <>
          <div className="space-y-2">
            <Label htmlFor="area_ha" className="text-base font-medium">
              Farm Area (hectares)
            </Label>
            <Input
              id="area_ha"
              type="number"
              step="0.1"
              min="0.1"
              value={inputs.area_ha || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                handleInputChange('area_ha', e.target.value)
              }
              placeholder="Enter farm area"
              className="text-lg py-3"
              required
            />
            <p className="text-sm text-gray-500">How many hectares do you want to fertilize?</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="dose_kg_per_ha" className="text-base font-medium">
              Fertilizer Dose (kg per hectare)
            </Label>
            <Input
              id="dose_kg_per_ha"
              type="number"
              step="1"
              min="1"
              value={inputs.dose_kg_per_ha || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                handleInputChange('dose_kg_per_ha', e.target.value)
              }
              placeholder="Default: 100 kg/ha"
              className="text-lg py-3"
              required
            />
            <p className="text-sm text-gray-500">Recommended dosage per hectare (default: 100 kg/ha)</p>
          </div>
        </>
      );

    case 'chicken-feed-daily':
      return (
        <>
          <div className="space-y-2">
            <Label htmlFor="chicken_count" className="text-base font-medium">
              Number of Chickens
            </Label>
            <Input
              id="chicken_count"
              type="number"
              min="1"
              value={inputs.chicken_count || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                handleInputChange('chicken_count', e.target.value)
              }
              placeholder="Enter number of chickens"
              className="text-lg py-3"
              required
            />
            <p className="text-sm text-gray-500">How many chickens do you have?</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="feed_kg_per_chicken_per_day" className="text-base font-medium">
              Feed per Chicken (kg per day)
            </Label>
            <Input
              id="feed_kg_per_chicken_per_day"
              type="number"
              step="0.01"
              min="0.01"
              value={inputs.feed_kg_per_chicken_per_day || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                handleInputChange('feed_kg_per_chicken_per_day', e.target.value)
              }
              placeholder="Default: 0.12 kg/day"
              className="text-lg py-3"
              required
            />
            <p className="text-sm text-gray-500">Daily feed amount per chicken (default: 0.12 kg/day)</p>
          </div>
        </>
      );

    case 'livestock-medicine-dosage':
      return (
        <>
          <div className="space-y-2">
            <Label htmlFor="weight_kg" className="text-base font-medium">
              Animal Weight (kg)
            </Label>
            <Input
              id="weight_kg"
              type="number"
              step="0.1"
              min="0.1"
              value={inputs.weight_kg || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                handleInputChange('weight_kg', e.target.value)
              }
              placeholder="Enter animal weight"
              className="text-lg py-3"
              required
            />
            <p className="text-sm text-gray-500">Weight of the animal to be treated</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="dose_mg_per_kg" className="text-base font-medium">
              Medicine Dose (mg per kg body weight)
            </Label>
            <Input
              id="dose_mg_per_kg"
              type="number"
              step="0.1"
              min="0.1"
              value={inputs.dose_mg_per_kg || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                handleInputChange('dose_mg_per_kg', e.target.value)
              }
              placeholder="Enter recommended dose"
              className="text-lg py-3"
              required
            />
            <p className="text-sm text-gray-500">Check medicine label for recommended mg per kg</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="concentration_mg_per_ml" className="text-base font-medium">
              Medicine Concentration (mg per ml) - Optional
            </Label>
            <Input
              id="concentration_mg_per_ml"
              type="number"
              step="0.1"
              min="0.1"
              value={inputs.concentration_mg_per_ml || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                handleInputChange('concentration_mg_per_ml', e.target.value)
              }
              placeholder="Enter if you want volume calculation"
              className="text-lg py-3"
            />
            <p className="text-sm text-gray-500">If provided, we'll calculate the volume (ml) needed</p>
          </div>
        </>
      );

    case 'harvest-estimation':
      return (
        <>
          <div className="space-y-2">
            <Label htmlFor="area_ha" className="text-base font-medium">
              Farm Area (hectares)
            </Label>
            <Input
              id="area_ha"
              type="number"
              step="0.1"
              min="0.1"
              value={inputs.area_ha || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                handleInputChange('area_ha', e.target.value)
              }
              placeholder="Enter planted area"
              className="text-lg py-3"
              required
            />
            <p className="text-sm text-gray-500">Total planted area in hectares</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="yield_ton_per_ha" className="text-base font-medium">
              Expected Yield (tons per hectare)
            </Label>
            <Input
              id="yield_ton_per_ha"
              type="number"
              step="0.1"
              min="0.1"
              value={inputs.yield_ton_per_ha || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                handleInputChange('yield_ton_per_ha', e.target.value)
              }
              placeholder="Default: 5 ton/ha"
              className="text-lg py-3"
              required
            />
            <p className="text-sm text-gray-500">Expected harvest per hectare (default: 5 tons/ha)</p>
          </div>
        </>
      );

    case 'planting-cost':
      return (
        <>
          <div className="space-y-2">
            <Label htmlFor="area_ha" className="text-base font-medium">
              Farm Area (hectares)
            </Label>
            <Input
              id="area_ha"
              type="number"
              step="0.1"
              min="0.1"
              value={inputs.area_ha || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                handleInputChange('area_ha', e.target.value)
              }
              placeholder="Enter planting area"
              className="text-lg py-3"
              required
            />
            <p className="text-sm text-gray-500">Area to be planted in hectares</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="cost_rp_per_ha" className="text-base font-medium">
              Cost per Hectare (Rupiah)
            </Label>
            <Input
              id="cost_rp_per_ha"
              type="number"
              min="1000"
              value={inputs.cost_rp_per_ha || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                handleInputChange('cost_rp_per_ha', e.target.value)
              }
              placeholder="Default: Rp 1,000,000/ha"
              className="text-lg py-3"
              required
            />
            <p className="text-sm text-gray-500">Planting cost per hectare (default: Rp 1,000,000/ha)</p>
          </div>
        </>
      );

    default:
      return null;
  }
}

// Helper function to format result numbers
function formatResult(value: number): string {
  // Format large numbers with commas and limit decimal places
  if (value >= 1000000) {
    return value.toLocaleString('id-ID', { maximumFractionDigits: 0 });
  } else if (value >= 1000) {
    return value.toLocaleString('id-ID', { maximumFractionDigits: 1 });
  } else {
    return value.toLocaleString('id-ID', { maximumFractionDigits: 2 });
  }
}