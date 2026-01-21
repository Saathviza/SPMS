import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { ArrowLeft, Award, CheckCircle, Clock, Trophy } from 'lucide-react';
import { Progress } from '../../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';

export default function BadgeProgress({ navigate, userData }) {
  const badges = {
    completed: [
      { name: 'First Aid', level: 'Advanced', date: 'Oct 12, 2025', color: 'from-red-500 to-red-600', emoji: '⛑️' },
      { name: 'Camping', level: 'Expert', date: 'Oct 8, 2025', color: 'from-green-500 to-green-600', emoji: '⛺' },
      { name: 'Navigation', level: 'Intermediate', date: 'Sep 25, 2025', color: 'from-blue-500 to-blue-600', emoji: '🧭' },
      { name: 'Environmental Conservation', level: 'Advanced', date: 'Sep 15, 2025', color: 'from-emerald-500 to-emerald-600', emoji: '🌿' },
    ],
    pending: [
      { name: 'Leadership', level: 'Advanced', progress: 75, requirements: '3 of 4 requirements met', emoji: '👨‍💼' },
      { name: 'Community Service', level: 'Expert', progress: 60, requirements: '15 of 25 hours completed', emoji: '🤝' },
    ],
    eligible: [
      { name: "Chief Commissioner's Award", progress: 90, color: 'from-[#E6B800] to-amber-600' },
      { name: "President's Scout Award", progress: 85, color: 'from-purple-600 to-purple-700' },
    ],
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-green-100">
      {/* Header */}
      <div
        className="bg-gradient-to-r from-[#0B5D1E] to-green-700 text-white py-6 px-4 md:px-8 shadow-lg"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(11, 93, 30, 0.95), rgba(5, 150, 105, 0.95)), url(https://images.unsplash.com/photo-1673734609283-4154fa4be954?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080)',
          backgroundSize: 'cover',
          backgroundBlendMode: 'overlay',
        }}
      >
        <div className="max-w-7xl mx-auto">
          <Button
            onClick={() => navigate('scout-dashboard')}
            variant="ghost"
            className="mb-4 text-white hover:text-[#E6B800] hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-white mb-2">Badge Progress & Results</h1>
          <p className="text-green-100">
            Track your achievements and badge journey
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard icon={Award} value="12" label="Badges Earned" gradient="from-[#E6B800] to-amber-600" />
          <StatCard icon={Clock} value="2" label="In Progress" gradient="from-yellow-500 to-amber-500" />
          <StatCard icon={Trophy} value="2" label="Awards Eligible" gradient="from-purple-500 to-purple-600" />
          <StatCard icon={CheckCircle} value="85%" label="Overall Progress" gradient="from-blue-500 to-blue-600" />
        </div>

        {/* Tabs */}
        <Card className="shadow-xl">
          <CardContent className="p-6">
            <Tabs defaultValue="completed">
              <TabsList className="grid grid-cols-3 mb-6">
                <TabsTrigger value="completed">Completed</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="eligible">Eligible Awards</TabsTrigger>
              </TabsList>

              {/* Completed */}
              <TabsContent value="completed">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {badges.completed.map((badge, i) => (
                    <Card key={i} className="hover:scale-105 transition-all">
                      <CardContent className="p-6 text-center">
                        <div className={`w-24 h-24 bg-gradient-to-br ${badge.color} rounded-full mx-auto flex items-center justify-center mb-4`}>
                          <span className="text-4xl">{badge.emoji}</span>
                        </div>
                        <h3 className="text-gray-900">{badge.name}</h3>
                        <p className="text-gray-600">{badge.level}</p>
                        <p className="text-gray-500">{badge.date}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Pending */}
              <TabsContent value="pending">
                <div className="space-y-6">
                  {badges.pending.map((badge, i) => (
                    <Card key={i}>
                      <CardContent className="p-6">
                        <div className="flex justify-between mb-2">
                          <div>
                            <h3 className="text-gray-900">{badge.name}</h3>
                            <p className="text-gray-600">{badge.level}</p>
                          </div>
                          <span className="text-yellow-700">{badge.progress}%</span>
                        </div>
                        <Progress value={badge.progress} className="h-3 mb-2" />
                        <p className="text-gray-600">{badge.requirements}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Eligible */}
              <TabsContent value="eligible">
                <div className="space-y-6">
                  {badges.eligible.map((award, i) => (
                    <Card key={i}>
                      <CardContent className="p-6">
                        <h3 className="text-gray-900 mb-2">{award.name}</h3>
                        <Progress value={award.progress} className="h-3 mb-4" />
                        <Button
                          onClick={() => navigate('award-eligibility')}
                          className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white"
                        >
                          Check Eligibility
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* Small reusable stat card */
function StatCard({ icon: Icon, value, label, gradient }) {
  return (
    <Card className="shadow-lg">
      <CardContent className="p-6 text-center">
        <div className={`w-16 h-16 bg-gradient-to-br ${gradient} rounded-full mx-auto flex items-center justify-center mb-3`}>
          <Icon className="w-8 h-8 text-white" />
        </div>
        <p className="text-gray-900">{value}</p>
        <p className="text-gray-600">{label}</p>
      </CardContent>
    </Card>
  );
}
