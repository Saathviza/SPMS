import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { ArrowLeft, CheckCircle, Clock, Trophy, Download, Share2 } from 'lucide-react';
import { Progress } from '../../components/ui/progress';


export default function AwardEligibility({ navigate, userData }) {
  const eligibilityProgress = 85;

  const requirements = [
    { name: 'Required Badges Completed', status: 'completed', icon: CheckCircle, color: 'text-green-600' },
    { name: 'Service Hours Logged', status: 'completed', icon: CheckCircle, color: 'text-green-600' },
    { name: 'Leadership Training', status: 'completed', icon: CheckCircle, color: 'text-green-600' },
    { name: 'Final Review Pending', status: 'pending', icon: Clock, color: 'text-yellow-600' },
  ];

  const awardDetails = [
    { category: 'Badges', required: 15, completed: 14, percentage: 93 },
    { category: 'Service Hours', required: 100, completed: 95, percentage: 95 },
    { category: 'Activities', required: 20, completed: 18, percentage: 90 },
    { category: 'Leadership Projects', required: 3, completed: 2, percentage: 67 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-amber-50">
      {/* Header */}
      <div
        className="bg-gradient-to-r from-purple-700 to-[#E6B800] text-white py-6 px-4 md:px-8 shadow-lg"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(126, 34, 206, 0.95), rgba(230, 184, 0, 0.95)), url(https://images.unsplash.com/photo-1739121890104-d8472a50a4eb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080)',
          backgroundSize: 'cover',
          backgroundBlendMode: 'overlay',
        }}
      >
        <div className="max-w-7xl mx-auto">
          <Button
            onClick={() => navigate('scout-dashboard')}
            variant="ghost"
            className="mb-4 text-white hover:text-amber-200 hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-white mb-2">Award Eligibility</h1>
          <p className="text-purple-100">
            Track your progress towards the President's Scout Award
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Overall Progress */}
        <Card className="mb-8 shadow-2xl border-2 border-[#E6B800]/50">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <div className="inline-block p-6 bg-gradient-to-br from-purple-600 to-[#E6B800] rounded-full mb-4 shadow-2xl">
                <Trophy className="w-16 h-16 text-white" />
              </div>
              <h2 className="text-purple-900 mb-2">President's Scout Award</h2>
              <p className="text-gray-600">
                You're {eligibilityProgress}% there!
              </p>
            </div>

            <div className="max-w-2xl mx-auto">
              <div className="flex justify-between mb-2">
                <span className="text-gray-700">Overall Progress</span>
                <span className="text-purple-700">
                  {eligibilityProgress}%
                </span>
              </div>
              <Progress value={eligibilityProgress} className="h-4 mb-6" />

              <div className="bg-gradient-to-r from-purple-50 to-amber-50 rounded-lg p-6 border-2 border-purple-200 relative">
                <div className="absolute top-0 right-0 text-8xl opacity-10">🏆</div>
                <p className="text-purple-900 text-center italic relative z-10">
                  "You're almost there, Scout — Great achievements begin with small acts."
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Requirements */}
        <Card className="mb-8 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-purple-100 to-amber-100">
            <CardTitle className="text-purple-900">
              Requirements Checklist
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {requirements.map((req, index) => {
              const Icon = req.icon;
              return (
                <div
                  key={index}
                  className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-purple-50"
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-6 h-6 ${req.color}`} />
                    <span className="text-gray-900">{req.name}</span>
                  </div>
                  <span
                    className={`px-4 py-1 rounded-full ${req.status === 'completed'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                      }`}
                  >
                    {req.status === 'completed' ? 'Completed' : 'In Progress'}
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Breakdown */}
        <Card className="mb-8 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-purple-100 to-amber-100">
            <CardTitle className="text-purple-900">
              Detailed Progress Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {awardDetails.map((detail, index) => (
              <div
                key={index}
                className="p-6 bg-gradient-to-br from-gray-50 to-purple-50 rounded-lg border-2 border-purple-100"
              >
                <h3 className="text-gray-900 mb-3">{detail.category}</h3>
                <div className="flex items-baseline space-x-2 mb-2">
                  <span className="text-purple-700">{detail.completed}</span>
                  <span className="text-gray-500">/ {detail.required}</span>
                </div>
                <Progress value={detail.percentage} className="h-2 mb-2" />
                <p className="text-gray-600">
                  {detail.percentage}% Complete
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Button className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6">
            <Download className="w-5 h-5 mr-2" />
            Generate Eligibility Report
          </Button>

          <Button
            onClick={() => navigate('celebration')}
            className="bg-gradient-to-r from-purple-600 to-[#E6B800] text-white p-6"
          >
            <Trophy className="w-5 h-5 mr-2" />
            Celebrate Progress
          </Button>

          <Button className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6">
            <Share2 className="w-5 h-5 mr-2" />
            Share Achievement
          </Button>
        </div>

        {/* Motivation */}
        <Card className="mt-8 shadow-xl border-2 border-[#E6B800]/50">
          <CardContent className="p-8 text-center">
            <h3 className="text-purple-900 mb-4">Keep Going!</h3>
            <p className="text-gray-700 mb-4">
              You're on the path to Sri Lanka's highest scouting honor.
            </p>
            <Button
              onClick={() => navigate('activity-registration')}
              className="bg-gradient-to-r from-[#0B5D1E] to-green-700 text-white"
            >
              View Available Activities
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
