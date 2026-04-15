import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { scoutService, authService } from '../../services/api';
import {
  ArrowLeft,
  Camera,
  Mail,
  Phone,
  MapPin,
  Calendar,
  User,
  Edit,
  Trophy,
  ClipboardCheck,
  Timer
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { toast } from 'sonner';

export default function ScoutProfile() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [profileData, setProfileData] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Timeline State
  const [timeline, setTimeline] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    dob: '',
    contact_number: '',
    district: '',
    province: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const user = authService.getCurrentUser();
        if (!user) {
          navigate('/');
          return;
        }
        setCurrentUser(user);

        // Use ID from URL if provided, otherwise use current user's ID
        const targetId = id || user.id;
        const data = await scoutService.getProfile(targetId);
        console.log("🔍 [DEBUG] Profile Data Received:", data);

        setProfileData(data);
        setFormData({
          name: data.full_name || data.name || '',
          email: data.email || '',
          dob: data.dob ? new Date(data.dob).toISOString().split('T')[0] : '',
          contact_number: data.contact_number || '',
          district: data.district || '',
          province: data.province || ''
        });

        // 🗓️ Fetch Timeline (New WOW Feature - Additive)
        try {
          const history = await scoutService.getTimeline(targetId);
          setTimeline(history);
        } catch (tErr) { console.error("History fetch optional failure:", tErr); }

      } catch (err) {
        console.error("Error fetching profile:", err);
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [navigate, id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await scoutService.updateProfile(profileData.id, formData);
      setProfileData(prev => ({ ...prev, ...formData }));
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (err) {
      console.error("Error updating profile:", err);
      toast.error("Failed to update profile", {
        description: err.response?.data?.message || "Internal server error"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const initials =
    (formData.name || profileData?.name || 'Scout')
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-green-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700 mb-4"></div>
        <p className="text-green-700 font-bold tracking-widest uppercase">Fetching Profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-50/30">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0B5D1E] to-[#084516] text-white py-12 px-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <User className="w-48 h-48 rotate-12" />
        </div>
        <div className="max-w-7xl mx-auto relative z-10">
          <Button
            onClick={() => {
              if (currentUser?.role === 'leader') {
                navigate('/leader/dashboard');
              } else {
                navigate('/scout/dashboard');
              }
            }}
            variant="ghost"
            className="text-green-100 mb-6 hover:text-white hover:bg-white/10 border border-white/20 rounded-full px-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <h1 className="text-5xl font-black tracking-tighter mb-2">My Profile</h1>
          <p className="text-green-100 text-xl font-medium opacity-90 italic">Manage your scout information and identity.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8 -mt-16 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Profile Card */}
          <Card className="shadow-2xl border-0 rounded-[2.5rem] overflow-hidden bg-white h-fit">
            <CardContent className="p-10 text-center">
              <div className="relative inline-block mb-8">
                <Avatar className="w-40 h-40 border-8 border-white shadow-2xl">
                  <AvatarImage src={profileData?.profile_photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profileData?.name}`} />
                  <AvatarFallback className="bg-[#0B5D1E] text-white text-5xl font-black">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                {currentUser?.id === profileData?.id && (
                  <button className="absolute bottom-2 right-2 w-12 h-12 bg-[#E6B800] hover:bg-amber-500 rounded-full flex items-center justify-center shadow-xl transition-all hover:scale-110 border-4 border-white">
                    <Camera className="w-6 h-6 text-white" />
                  </button>
                )}
              </div>

              <h2 className="text-3xl font-black text-gray-900 mb-1">{formData.name}</h2>
              <p className="text-gray-400 font-bold uppercase tracking-widest text-sm mb-6">Scout Code: {profileData?.scout_code || 'SLC-001'}</p>

              <div className="flex justify-center gap-3">
                <div className="px-5 py-2 bg-green-50 border border-green-100 rounded-full text-green-700 text-xs font-black uppercase tracking-widest">
                  Active Scout
                </div>
                <div className="px-5 py-2 bg-blue-50 border border-blue-100 rounded-full text-blue-700 text-xs font-black uppercase tracking-widest">
                  ID Verified
                </div>
              </div>

              {timeline.length > 0 && (
                <Button
                  variant="ghost"
                  className="mt-6 text-amber-600 font-bold hover:bg-amber-50 rounded-xl"
                  onClick={() => document.getElementById('scout-journey-timeline')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <Timer className="w-4 h-4 mr-2" />
                  View Journey Timeline
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Details */}
          <Card className="lg:col-span-2 shadow-2xl border-0 rounded-[2.5rem] bg-white overflow-hidden">
            <CardHeader className="bg-gray-50/50 p-10 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-2xl font-black text-gray-900">Personal Information</CardTitle>
                  <p className="text-gray-500 font-medium">Keep your records up-to-date.</p>
                </div>
                {currentUser?.id === profileData?.id && (
                  !isEditing ? (
                    <Button
                      onClick={() => setIsEditing(true)}
                      className="bg-[#0B5D1E] hover:bg-green-800 text-white font-black px-6 rounded-xl shadow-lg shadow-green-900/20"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                        className="rounded-xl px-6 font-bold"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-[#E6B800] hover:bg-amber-600 text-white font-black px-8 rounded-xl shadow-lg shadow-amber-900/20"
                      >
                        {isSaving ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  )
                )}
              </div>
            </CardHeader>

            <CardContent className="p-10 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <Label className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                  <User className="w-3 h-3" /> Full Name
                </Label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  readOnly={!isEditing}
                  className={`h-14 rounded-xl border-2 transition-all font-bold ${isEditing ? 'border-amber-400 bg-white shadow-inner focus:ring-amber-400' : 'bg-gray-50 border-transparent cursor-not-allowed'}`}
                />
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                  <Mail className="w-3 h-3" /> Email Address
                </Label>
                <Input
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  readOnly={!isEditing}
                  className={`h-14 rounded-xl border-2 transition-all font-bold ${isEditing ? 'border-amber-400 bg-white shadow-inner focus:ring-amber-400' : 'bg-gray-50 border-transparent cursor-not-allowed'}`}
                />
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                  <Calendar className="w-3 h-3" /> Date of Birth
                </Label>
                <Input
                  name="dob"
                  type="date"
                  value={formData.dob}
                  onChange={handleChange}
                  readOnly={!isEditing}
                  className={`h-14 rounded-xl border-2 transition-all font-bold ${isEditing ? 'border-amber-400 bg-white shadow-inner focus:ring-amber-400' : 'bg-gray-50 border-transparent cursor-not-allowed'}`}
                />
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                  <Phone className="w-3 h-3" /> Contact Number
                </Label>
                <Input
                  name="contact_number"
                  value={formData.contact_number}
                  onChange={handleChange}
                  readOnly={!isEditing}
                  className={`h-14 rounded-xl border-2 transition-all font-bold ${isEditing ? 'border-amber-400 bg-white shadow-inner focus:ring-amber-400' : 'bg-gray-50 border-transparent cursor-not-allowed'}`}
                />
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                  <MapPin className="w-3 h-3" /> District
                </Label>
                <Input
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  readOnly={!isEditing}
                  className={`h-14 rounded-xl border-2 transition-all font-bold ${isEditing ? 'border-amber-400 bg-white shadow-inner focus:ring-amber-400' : 'bg-gray-50 border-transparent cursor-not-allowed'}`}
                />
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                  <MapPin className="w-3 h-3" /> Province
                </Label>
                <Input
                  name="province"
                  value={formData.province}
                  onChange={handleChange}
                  readOnly={!isEditing}
                  className={`h-14 rounded-xl border-2 transition-all font-bold ${isEditing ? 'border-amber-400 bg-white shadow-inner focus:ring-amber-400' : 'bg-gray-50 border-transparent cursor-not-allowed'}`}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Real Progress Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10 mb-12">
          {/* Badges Earned */}
          <Card className="shadow-xl border-0 rounded-[2rem] bg-white hover:shadow-2xl transition-all group overflow-hidden">
            <CardContent className="p-8 flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Trophy className="w-10 h-10 text-amber-600" />
              </div>
              <p className="text-4xl font-black text-gray-900 mb-1">{profileData?.badges_earned || 0}</p>
              <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Badges Earned</p>
              <div className="w-full h-1 bg-amber-500 absolute bottom-0 left-0"></div>
            </CardContent>
          </Card>

          {/* Activities Completed */}
          <Card className="shadow-xl border-0 rounded-[2rem] bg-white hover:shadow-2xl transition-all group overflow-hidden">
            <CardContent className="p-8 flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ClipboardCheck className="w-10 h-10 text-green-600" />
              </div>
              <p className="text-4xl font-black text-gray-900 mb-1">{profileData?.activities_completed || 0}</p>
              <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Activities Completed</p>
              <div className="w-full h-1 bg-green-600 absolute bottom-0 left-0"></div>
            </CardContent>
          </Card>

          {/* Service Hours */}
          <Card className="shadow-xl border-0 rounded-[2rem] bg-white hover:shadow-2xl transition-all group overflow-hidden">
            <CardContent className="p-8 flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Timer className="w-10 h-10 text-blue-600" />
              </div>
              <p className="text-4xl font-black text-gray-900 mb-1">{profileData?.service_hours || 0}</p>
              <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Service Hours</p>
              <div className="w-full h-1 bg-blue-600 absolute bottom-0 left-0"></div>
            </CardContent>
          </Card>
        </div>

        {/* 🗓️ Scout Journey Timeline (Additve WOW Feature) */}
        {timeline.length > 0 && (
          <div id="scout-journey-timeline" className="mt-8 mb-20 animate-in fade-in slide-in-from-bottom-5 duration-700">
            <h3 className="text-3xl font-black text-gray-900 mb-10 flex items-center gap-3">
              <span className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-amber-600" />
              </span>
              Scout Journey Timeline
            </h3>

            <div className="relative border-l-4 border-gray-100 ml-6 pl-10 space-y-12">
              {timeline.map((event, idx) => (
                <div key={idx} className="relative group">
                  {/* Icon Node */}
                  <div className={`absolute -left-16 top-0 w-12 h-12 rounded-2xl border-4 border-white shadow-lg flex items-center justify-center transition-all group-hover:scale-110 ${event.record_type === 'badge' ? 'bg-amber-500 text-white' : 'bg-green-600 text-white'}`}>
                    {event.record_type === 'badge' ? <Trophy className="w-6 h-6" /> : <ClipboardCheck className="w-6 h-6" />}
                  </div>

                  {/* Content */}
                  <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 hover:border-amber-200 transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex gap-2">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${event.priority === 'high' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                          {event.record_type} milestone
                        </span>
                        {event.status && (
                           <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${event.status === 'COMPLETED' || event.status === 'VERIFIED' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                              {event.status}
                           </span>
                        )}
                      </div>
                      <span className="text-sm font-bold text-gray-400">
                        {new Date(event.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <h4 className="text-xl font-black text-gray-900">{event.title}</h4>
                    <p className="text-gray-500 font-medium mt-1">{event.description}</p>
                  </div>
                </div>
              ))}

              {/* Achievement End Marker */}
              <div className="p-4 bg-gray-50 rounded-2xl text-center border-2 border-dashed border-gray-200">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Beginning of Your Scout Adventure</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
