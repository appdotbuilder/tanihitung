import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { useAuth } from '@/components/AuthProvider';
import { useNavigation } from '@/App';
import type { UserHistory } from '../../../server/src/schema';

export function Dashboard() {
  const { user } = useAuth();
  const { navigate } = useNavigation();
  const [history, setHistory] = useState<UserHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const result = await trpc.results.getHistory.query();
      setHistory(result);
    } catch (error) {
      console.error('Failed to load history:', error);
      setError('Failed to load calculation history');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleDelete = async (resultId: number) => {
    if (!user) return;
    
    setDeleteId(resultId);
    try {
      await trpc.results.delete.mutate({ result_id: resultId });
      setHistory((prev: UserHistory[]) => prev.filter((item: UserHistory) => item.id !== resultId));
      setSuccessMessage('Calculation result deleted successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Failed to delete result:', error);
      setError('Failed to delete result');
    } finally {
      setDeleteId(null);
    }
  };

  const handleExportCSV = async () => {
    if (!user) return;
    
    setIsExporting(true);
    try {
      const csvData = await trpc.results.exportCSV.query();
      
      // Create download link
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `tanihitung-history-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      setSuccessMessage('History exported successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Failed to export CSV:', error);
      setError('Failed to export history');
    } finally {
      setIsExporting(false);
    }
  };

  const clearMessage = () => {
    setError(null);
    setSuccessMessage(null);
  };

  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              📊 Your Dashboard
            </h1>
            <p className="text-lg text-gray-600">
              Welcome back, {user.name}! Here are your saved calculation results.
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => navigate({ page: 'home' })}
            >
              🧮 New Calculation
            </Button>
            <Button 
              onClick={handleExportCSV}
              disabled={isExporting || history.length === 0}
              className="flex items-center gap-2"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Exporting...
                </>
              ) : (
                <>📄 Export CSV</>
              )}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="text-2xl">📈</div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{history.length}</p>
                  <p className="text-sm text-gray-600">Total Calculations</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="text-2xl">🌾</div>
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {history.filter((h: UserHistory) => h.calculator_slug.includes('fertilizer') || h.calculator_slug.includes('harvest') || h.calculator_slug.includes('planting')).length}
                  </p>
                  <p className="text-sm text-gray-600">Farming Calcs</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="text-2xl">🐄</div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">
                    {history.filter((h: UserHistory) => h.calculator_slug.includes('chicken') || h.calculator_slug.includes('medicine')).length}
                  </p>
                  <p className="text-sm text-gray-600">Livestock Calcs</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800 flex items-center justify-between">
            {error}
            <Button variant="ghost" size="sm" onClick={clearMessage}>×</Button>
          </AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800 flex items-center justify-between">
            ✅ {successMessage}
            <Button variant="ghost" size="sm" onClick={clearMessage}>×</Button>
          </AlertDescription>
        </Alert>
      )}

      {/* History Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            📋 Calculation History
          </CardTitle>
          <CardDescription>
            Your saved calculation results. Click on any calculator name to use it again.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              <span className="ml-3 text-lg">Loading your history...</span>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="text-6xl">🤷‍♂️</div>
              <div>
                <p className="text-xl text-gray-500 mb-4">No calculations saved yet</p>
                <p className="text-gray-600 mb-6">
                  Use our calculators and save your results to see them here
                </p>
                <Button onClick={() => navigate({ page: 'home' })}>
                  🧮 Start Calculating
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-32">Date</TableHead>
                    <TableHead>Calculator</TableHead>
                    <TableHead>Input Summary</TableHead>
                    <TableHead className="text-right">Result</TableHead>
                    <TableHead className="w-20">Unit</TableHead>
                    <TableHead className="w-20">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((item: UserHistory) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-sm">
                        {item.created_at.toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </TableCell>
                      <TableCell>
                        <button 
                          onClick={() => navigate({ page: 'calculator', slug: item.calculator_slug })}
                          className="font-medium text-green-600 hover:text-green-700 hover:underline text-left"
                        >
                          {item.calculator_name}
                        </button>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {item.input_summary}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {formatResult(item.result_value)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {item.unit_label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                          disabled={deleteId === item.id}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          {deleteId === item.id ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600"></div>
                          ) : (
                            '🗑️'
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-6">
          <h3 className="font-semibold text-green-800 mb-4">🚀 Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              onClick={() => navigate({ page: 'calculator', slug: 'fertilizer-requirement' })}
              className="justify-start"
            >
              🌱 Calculate Fertilizer
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate({ page: 'calculator', slug: 'chicken-feed-daily' })}
              className="justify-start"
            >
              🐔 Chicken Feed
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate({ page: 'calculator', slug: 'harvest-estimation' })}
              className="justify-start"
            >
              🌾 Harvest Estimation
            </Button>
          </div>
          <div className="mt-4 pt-4 border-t border-green-200">
            <Button onClick={() => navigate({ page: 'calculators' })}>
              🔍 View All Calculators
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper function to format result numbers
function formatResult(value: number): string {
  if (value >= 1000000) {
    return value.toLocaleString('id-ID', { maximumFractionDigits: 0 });
  } else if (value >= 1000) {
    return value.toLocaleString('id-ID', { maximumFractionDigits: 1 });
  } else {
    return value.toLocaleString('id-ID', { maximumFractionDigits: 2 });
  }
}