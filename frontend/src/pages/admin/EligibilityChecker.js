import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { ArrowLeft, Search, CheckCircle, XCircle, Download } from 'lucide-react';

export default function EligibilityChecker({ navigate, userData }) {
  const [scoutId, setScoutId] = useState('');
  const [result, setResult] = useState(null);

  const handleCheck = () => {
    if (scoutId) {
      // Mock result
      setResult({
        scoutId: scoutId,
        name: 'Kavindu Perera',
        eligible: scoutId.includes('1') || scoutId.includes('2'),
        badges: 14,
        requiredBadges: 15,
        serviceHours: 95,
        requiredHours: 100,
        activities: 18,
        requiredActivities: 20,
        percentage: 85,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-green-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0B5D1E] to-green-700 text-white py-6 px-4 md:px-8 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <Button
            onClick={() => navigate('admin-dashboard')}
            variant="ghost"
            className="mb-4 text-white hover:text-[#E6B800] hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin Dashboard
          </Button>
          <h1 className="text-white mb-2">Award Eligibility Checker</h1>
          <p className="text-green-100">
            Check scout eligibility for awards and badges
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        {/* Search */}
        <Card className="mb-8 shadow-2xl border-2 border-[#E6B800]/50">
          <CardHeader className="bg-gradient-to-r from-[#0B5D1E] to-green-700 text-white">
            <CardTitle>Enter Scout ID</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <Label htmlFor="scoutId" className="block mb-2">
              Scout ID Number
            </Label>
            <div className="flex gap-3">
              <Input
                id="scoutId"
                placeholder="Enter Scout ID (e.g., SL2024001)"
                value={scoutId}
                onChange={(e) => setScoutId(e.target.value)}
                className="flex-1 border-2 border-gray-300 focus:border-[#0B5D1E]"
                onKeyPress={(e) => e.key === 'Enter' && handleCheck()}
              />
              <Button
                onClick={handleCheck}
                className="bg-gradient-to-r from-[#0B5D1E] to-green-700 text-white"
              >
                <Search className="w-4 h-4 mr-2" />
                Check
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Result */}
        {result && (
          <Card
            className={`shadow-2xl border-4 ${
              result.eligible ? 'border-green-400' : 'border-red-400'
            }`}
          >
            <CardHeader
              className={
                result.eligible
                  ? 'bg-gradient-to-r from-green-100 to-emerald-100'
                  : 'bg-gradient-to-r from-red-100 to-orange-100'
              }
            >
              <div className="flex justify-between items-center">
                <CardTitle>
                  Eligibility Result
                </CardTitle>
                {result.eligible ? (
                  <CheckCircle className="w-10 h-10 text-green-600" />
                ) : (
                  <XCircle className="w-10 h-10 text-red-600" />
                )}
              </div>
            </CardHeader>

            <CardContent className="p-8 space-y-6">
              {/* Info */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <p className="text-gray-600">Scout Name</p>
                  <p className="text-gray-900">{result.name}</p>
                </div>
                <div>
                  <p className="text-gray-600">Scout ID</p>
                  <p className="text-gray-900">{result.scoutId}</p>
                </div>
              </div>

              {/* Status */}
              <div
                className={`p-6 rounded-lg text-center ${
                  result.eligible
                    ? 'bg-green-100 border-2 border-green-400'
                    : 'bg-red-100 border-2 border-red-400'
                }`}
              >
                <h3 className="mb-2">
                  {result.eligible ? '✅ Eligible' : '❌ Not Eligible'}
                </h3>
                <p>
                  {result.eligible
                    ? "Meets President's Scout Award requirements"
                    : 'More requirements must be completed'}
                </p>
              </div>

              {/* Breakdown */}
              <div className="space-y-4">
                {[
                  ['Badges', result.badges, result.requiredBadges],
                  ['Service Hours', result.serviceHours, result.requiredHours],
                  ['Activities', result.activities, result.requiredActivities],
                ].map(([label, val, req], i) => (
                  <div key={i} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span>{label}</span>
                      {val >= req ? (
                        <CheckCircle className="text-green-600" />
                      ) : (
                        <XCircle className="text-red-600" />
                      )}
                    </div>
                    <p className="text-gray-600">
                      {val} / {req}
                    </p>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <Button className="flex-1 bg-blue-600 text-white">
                  <Download className="w-4 h-4 mr-2" />
                  Generate Report
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate('admin-dashboard')}
                >
                  Back
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Help */}
        {!result && (
          <Card className="border-2 border-blue-100">
            <CardContent className="p-8">
              <h3 className="mb-4">How to use</h3>
              <ol className="space-y-2">
                <li>1. Enter Scout ID</li>
                <li>2. Click Check Eligibility</li>
                <li>3. Review requirements</li>
                <li>4. Generate report if needed</li>
              </ol>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
