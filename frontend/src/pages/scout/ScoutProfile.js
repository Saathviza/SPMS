import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  ArrowLeft,
  Camera,
  Mail,
  Phone,
  MapPin,
  Calendar,
  User,
  Edit,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';

export default function ScoutProfile({ navigate, userData }) {
  const initials =
    userData?.name
      ?.split(' ')
      .map((n) => n[0])
      .join('') || 'S';

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-green-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0B5D1E] to-green-700 text-white py-6 px-6 shadow-lg">
        <Button
          onClick={() => navigate('scout-dashboard')}
          variant="ghost"
          className="text-white mb-3"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <h1>My Profile</h1>
        <p className="text-green-100">Manage your scout information</p>
      </div>

      <div className="max-w-5xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Card className="shadow-xl">
            <CardContent className="p-6 text-center">
              <div className="relative inline-block mb-4">
                <Avatar className="w-32 h-32 border-4 border-[#E6B800]">
                  <AvatarImage src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400" />
                  <AvatarFallback className="bg-[#0B5D1E] text-white text-3xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <button className="absolute bottom-0 right-0 w-10 h-10 bg-[#E6B800] rounded-full flex items-center justify-center">
                  <Camera className="w-5 h-5 text-white" />
                </button>
              </div>

              <h2>{userData?.name}</h2>
              <p className="text-gray-600">Scout ID: {userData?.scoutId}</p>

              <div className="mt-3 inline-block px-4 py-2 bg-green-100 border-2 border-[#0B5D1E] rounded-full">
                Active Scout
              </div>
            </CardContent>
          </Card>

          {/* Details */}
          <Card className="md:col-span-2 shadow-xl">
            <CardHeader className="bg-green-100">
              <div className="flex justify-between items-center">
                <CardTitle>Personal Information</CardTitle>
                <Button size="sm" className="bg-[#E6B800] text-white">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label><User className="inline w-4 h-4 mr-2" />Full Name</Label>
                <Input value={userData?.name} readOnly />
              </div>

              <div>
                <Label><Mail className="inline w-4 h-4 mr-2" />Email</Label>
                <Input value="kavindu.perera@scouts.lk" readOnly />
              </div>

              <div>
                <Label><Phone className="inline w-4 h-4 mr-2" />Contact</Label>
                <Input value="+94 77 123 4567" readOnly />
              </div>

              <div>
                <Label><Calendar className="inline w-4 h-4 mr-2" />DOB</Label>
                <Input value="2008-01-15" readOnly />
              </div>

              <div>
                <Label><MapPin className="inline w-4 h-4 mr-2" />Scout Group</Label>
                <Input value="Colombo Central Scouts" readOnly />
              </div>

              <div>
                <Label><MapPin className="inline w-4 h-4 mr-2" />District</Label>
                <Input value="Western Province" readOnly />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
