import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { ArrowLeft, UploadCloud } from 'lucide-react';
import { authService } from '../../services/api';

export default function ScoutRegistration() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    scout_group: '',
    district: '',
    date_of_birth: '',
    gender: '',
    contact_number: '',
    email: '',
    nic: '',
    username: '',
    password: '',
    confirmPassword: '',
    profile_photo: null,
    id_proof: null
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [scoutGroups, setScoutGroups] = useState([]);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const groups = await authService.getPublicGroups();
        setScoutGroups(groups);
      } catch (err) {
        console.error("Failed to fetch scout groups:", err);
      }
    };
    fetchGroups();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, [e.target.name]: e.target.files[0] });
    }
  };

  const calculateAge = (dob) => {
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('email', formData.email);
      submitData.append('username', formData.username);
      submitData.append('password', formData.password);
      submitData.append('date_of_birth', formData.date_of_birth);
      submitData.append('age', calculateAge(formData.date_of_birth));
      submitData.append('group_id', formData.scout_group || 1);
      submitData.append('contact_number', formData.contact_number || '');
      submitData.append('nic', formData.nic || '');
      submitData.append('district', formData.district || '');
      submitData.append('province', formData.district || '');
      submitData.append('gender', formData.gender);
      
      if (formData.profile_photo) {
        submitData.append('profile_photo', formData.profile_photo);
      }

      await authService.registerScout(submitData);

      navigate('/registration-success', {
        state: { name: formData.name }
      });
    } catch (err) {
      console.error('Registration error:', err);
      if (err.response) {
        const { message, error } = err.response.data;
        setError(error || message || 'Registration failed');
      } else if (err.request) {
        setError('Server is unreachable');
      } else {
        setError('Unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden py-12">
      {/* Background Image Setup */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage:
            'url("https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2670")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      />
      {/* Light Overlay to ensure background is bright but text is readable */}
      <div className="absolute inset-0 z-0 bg-white/10 backdrop-blur-[1px]" />

      {/* Header Container */}
      <div className="relative z-10 w-full max-w-4xl px-4 md:px-0 mb-6 flex flex-col items-center text-center">
        <div className="w-full flex justify-start mb-6">
          <button
            onClick={() => navigate('/')}
            className="text-white hover:text-gray-200 flex items-center text-sm font-medium transition-colors filter drop-shadow-md"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </button>
        </div>
        
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white drop-shadow-md mb-2">
          Join the Sri Lanka Scout Community
        </h1>
        <p className="text-lg md:text-xl font-light text-white/95 drop-shadow-md">
          Begin your journey to excellence and adventure
        </p>
      </div>

      {/* Main Form Card */}
      <div className="relative z-10 w-full max-w-4xl px-4 md:px-0">
        <Card className="bg-white/95 backdrop-blur-md shadow-2xl border-0 rounded-2xl overflow-hidden">
          <CardHeader className="text-center pt-8 pb-4">
            <CardTitle className="text-lg md:text-xl font-bold text-[#0B5D1E] tracking-wide">
              Scout Registration Form
            </CardTitle>
            <CardDescription className="text-gray-500 font-medium">
              Your Scout Leader will verify and activate your account
            </CardDescription>
          </CardHeader>

          <CardContent className="px-6 md:px-10 pb-8 mt-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-300 rounded-md shadow-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-8 gap-y-5">
                {/* Row 1 */}
                <div className="space-y-1.5">
                  <Label className="text-gray-700 font-semibold text-sm">Full Name *</Label>
                  <Input 
                    name="name" 
                    placeholder="Enter your full name" 
                    value={formData.name} 
                    onChange={handleChange} 
                    required 
                    className="bg-gray-50 border-gray-200 focus:border-[#0B5D1E] focus:ring-[#0B5D1E]" 
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-gray-700 font-semibold text-sm">Scout Group *</Label>
                  <select
                    name="scout_group"
                    value={formData.scout_group}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5D1E] focus:border-[#0B5D1E]"
                  >
                    <option value="" disabled>Select your scout group</option>
                    {scoutGroups.map(group => (
                      <option key={group.id} value={group.id}>{group.group_name} ({group.district})</option>
                    ))}
                  </select>
                </div>

                {/* Row 2 */}
                <div className="space-y-1.5">
                  <Label className="text-gray-700 font-semibold text-sm">District / Province *</Label>
                  <Input 
                    name="district" 
                    placeholder="Enter your district" 
                    value={formData.district} 
                    onChange={handleChange} 
                    required 
                    className="bg-gray-50 border-gray-200 focus:border-[#0B5D1E] focus:ring-[#0B5D1E]" 
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-gray-700 font-semibold text-sm">Date of Birth *</Label>
                  <Input 
                    type="date" 
                    name="date_of_birth" 
                    value={formData.date_of_birth} 
                    onChange={handleChange} 
                    required 
                    className="bg-gray-50 border-gray-200 text-gray-700 focus:border-[#0B5D1E] focus:ring-[#0B5D1E]" 
                  />
                </div>

                {/* Row 3 */}
                <div className="space-y-1.5">
                  <Label className="text-gray-700 font-semibold text-sm block mb-2">Gender *</Label>
                  <div className="flex items-center space-x-6 h-10 px-1">
                    <label className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
                      <input 
                        type="radio" 
                        name="gender" 
                        value="Male" 
                        checked={formData.gender === 'Male'} 
                        onChange={handleChange} 
                        className="text-[#0B5D1E] focus:ring-[#0B5D1E] cursor-pointer" 
                        required 
                      />
                      <span>Male</span>
                    </label>
                    <label className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
                      <input 
                        type="radio" 
                        name="gender" 
                        value="Female" 
                        checked={formData.gender === 'Female'} 
                        onChange={handleChange} 
                        className="text-[#0B5D1E] focus:ring-[#0B5D1E] cursor-pointer" 
                      />
                      <span>Female</span>
                    </label>
                    <label className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
                      <input 
                        type="radio" 
                        name="gender" 
                        value="Other" 
                        checked={formData.gender === 'Other'} 
                        onChange={handleChange} 
                        className="text-[#0B5D1E] focus:ring-[#0B5D1E] cursor-pointer" 
                      />
                      <span>Other</span>
                    </label>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-gray-700 font-semibold text-sm">Contact Number *</Label>
                  <Input 
                    name="contact_number" 
                    placeholder="+94 XX XXX XXXX" 
                    value={formData.contact_number} 
                    onChange={handleChange} 
                    required 
                    className="bg-gray-50 border-gray-200 focus:border-[#0B5D1E] focus:ring-[#0B5D1E]" 
                  />
                </div>

                {/* Row 4 */}
                <div className="space-y-1.5">
                  <Label className="text-gray-700 font-semibold text-sm">Email Address *</Label>
                  <Input 
                    type="email" 
                    name="email" 
                    placeholder="your.email@example.com" 
                    value={formData.email} 
                    onChange={handleChange} 
                    required 
                    className="bg-gray-50 border-gray-200 focus:border-[#0B5D1E] focus:ring-[#0B5D1E]" 
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-gray-700 font-semibold text-sm">NIC / School ID *</Label>
                  <Input 
                    name="nic" 
                    placeholder="Enter your NIC or School ID" 
                    value={formData.nic} 
                    onChange={handleChange} 
                    required 
                    className="bg-gray-50 border-gray-200 focus:border-[#0B5D1E] focus:ring-[#0B5D1E]" 
                  />
                </div>

                {/* Row 5 */}
                <div className="space-y-1.5">
                  <Label className="text-gray-700 font-semibold text-sm">Username *</Label>
                  <Input 
                    name="username" 
                    placeholder="Choose a username" 
                    value={formData.username} 
                    onChange={handleChange} 
                    required 
                    className="bg-gray-50 border-gray-200 focus:border-[#0B5D1E] focus:ring-[#0B5D1E]" 
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-gray-700 font-semibold text-sm">Password *</Label>
                  <Input 
                    type="password" 
                    name="password" 
                    placeholder="Create a password" 
                    value={formData.password} 
                    onChange={handleChange} 
                    required 
                    className="bg-gray-50 border-gray-200 focus:border-[#0B5D1E] focus:ring-[#0B5D1E]" 
                  />
                </div>

                {/* Row 6 */}
                <div className="space-y-1.5">
                  <Label className="text-gray-700 font-semibold text-sm">Confirm Password *</Label>
                  <Input 
                    type="password" 
                    name="confirmPassword" 
                    placeholder="Re-enter your password" 
                    value={formData.confirmPassword} 
                    onChange={handleChange} 
                    required 
                    className="bg-gray-50 border-gray-200 focus:border-[#0B5D1E] focus:ring-[#0B5D1E]" 
                  />
                </div>
                <div className="space-y-1.5 flex flex-col h-[72px]">
                  <Label className="text-gray-700 font-semibold text-sm mb-1">Upload Profile Photo</Label>
                  <label className="flex-1 flex flex-col items-center justify-center w-full border-2 border-dashed border-gray-300 rounded-md bg-gray-50 hover:bg-gray-100 hover:border-gray-400 cursor-pointer transition-all p-2">
                    <div className="flex items-center space-x-2 text-gray-500">
                      <UploadCloud className="w-5 h-5 text-gray-400" />
                      <span className="text-sm font-medium">
                        {formData.profile_photo ? formData.profile_photo.name : "Click to upload photo"}
                      </span>
                    </div>
                    <input type="file" name="profile_photo" onChange={handleFileChange} className="hidden" accept="image/*" />
                  </label>
                </div>

                {/* Row 7 is removed as ID proof is no longer required at registration */}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-8 gap-y-4 pt-4 border-t border-gray-100">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#0B5D1E] hover:bg-[#084516] text-white py-6 rounded-md shadow-md text-base"
                >
                  {loading ? 'Registering…' : 'Register Now'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/')}
                  className="w-full py-6 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md text-base shadow-sm bg-white"
                >
                  Cancel / Back to Login
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
