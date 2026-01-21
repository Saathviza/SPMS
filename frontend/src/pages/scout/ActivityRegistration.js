import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { ArrowLeft, Calendar, MapPin, Clock, Search } from "lucide-react";
import { toast } from "sonner";
import { ImageWithFallback } from "../figma/ImageWithFallback";

function ActivityRegistration({ navigate }) {
  const [searchQuery, setSearchQuery] = useState("");

  const activities = [
    {
      id: 1,
      name: "Wilderness Survival Camp",
      date: "Oct 20, 2025",
      time: "08:00 AM",
      location: "Sinharaja Forest Reserve",
      category: "Camping",
      emoji: "⛺",
      image:
        "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1080",
    },
    {
      id: 2,
      name: "First Aid Workshop",
      date: "Oct 22, 2025",
      time: "02:00 PM",
      location: "Colombo Scout Hall",
      category: "Training",
      emoji: "⛑️",
      image:
        "https://images.unsplash.com/photo-1580281658629-30f5f6fddbe7?w=1080",
    },
    {
      id: 3,
      name: "Community Clean-Up Drive",
      date: "Oct 25, 2025",
      time: "07:00 AM",
      location: "Galle Beach",
      category: "Service",
      emoji: "🌊",
      image:
        "https://images.unsplash.com/photo-1506784365847-bbad939e9335?w=1080",
    },
  ];

  const handleRegister = (activityName) => {
    toast.success(`Successfully registered for ${activityName}`, {
      description: "Waiting for leader approval.",
    });
  };

  const filteredActivities = activities.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-green-50">
      <div className="bg-green-700 text-white p-6">
        <Button variant="ghost" onClick={() => navigate("scout-dashboard")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <h1>Activity Registration</h1>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" />
              <Input
                className="pl-10"
                placeholder="Search activities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-3 gap-6">
          {filteredActivities.map((a) => (
            <Card key={a.id}>
              <ImageWithFallback
                src={a.image}
                alt={a.name}
                className="h-40 w-full object-cover"
              />
              <CardHeader>
                <CardTitle>{a.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" /> {a.date}
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2" /> {a.time}
                </div>
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-2" /> {a.location}
                </div>
                <Button
                  className="w-full"
                  onClick={() => handleRegister(a.name)}
                >
                  Register
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ActivityRegistration;
