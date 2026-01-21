import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { ArrowLeft, UserPlus } from 'lucide-react';
import axios from 'axios';

export default function ScoutRegistration() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    scout_group: '',
    district: '',
    province: '',
    date_of_birth: '',
    gender: '',
    contact_number: '',
    nic: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
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
      await axios.post('http://localhost:4000/api/auth/register', formData);
      navigate('/registration-success', { state: { name: formData.name } });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden py-12">
      {/* Background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=2000")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-green-900/80 via-green-800/70 to-black/90" />

      <div className="relative z-10 w-full max-w-4xl px-6">
        <Button
          onClick={() => navigate('/')}
          variant="ghost"
          className="text-white mb-4 hover:bg-white/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Portal
        </Button>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left side - Form */}
          <Card className="bg-white/95 backdrop-blur-md shadow-2xl">
            <CardHeader className="text-center">
              <UserPlus className="mx-auto text-[#E6B800] mb-2" size={48} />
              <CardTitle className="text-2xl text-[#0B5D1E]">Scout Registration</CardTitle>
              <CardDescription className="text-sm">Join the Sri Lanka Scout Community</CardDescription>
              <p className="text-xs text-gray-500 mt-2 italic">
                Your Scout Leader will verify and activate your account
              </p>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
                    {error}
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Full Name *</Label>
                    <Input name="name" value={formData.name} onChange={handleChange} required />
                  </div>

                  <div>
                    <Label>Email *</Label>
                    <Input type="email" name="email" value={formData.email} onChange={handleChange} required />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Password *</Label>
                    <Input type="password" name="password" value={formData.password} onChange={handleChange} required />
                  </div>

                  <div>
                    <Label>Confirm Password *</Label>
                    <Input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Scout Group</Label>
                    <Input name="scout_group" value={formData.scout_group} onChange={handleChange} />
                  </div>

                  <div>
                    <Label>Date of Birth *</Label>
                    <Input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} required />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>District</Label>
                    <Input name="district" value={formData.district} onChange={handleChange} />
                  </div>

                  <div>
                    <Label>Province</Label>
                    <Input name="province" value={formData.province} onChange={handleChange} />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Gender *</Label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-md"
                      required
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <Label>Contact Number</Label>
                    <Input name="contact_number" value={formData.contact_number} onChange={handleChange} />
                  </div>
                </div>

                <div>
                  <Label>NIC / School ID</Label>
                  <Input name="nic" value={formData.nic} onChange={handleChange} />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#0B5D1E] text-white hover:bg-[#084516] transition-all duration-300"
                >
                  {loading ? 'Registering...' : 'Register Now'}
                </Button>

                <div className="text-center text-sm text-gray-600">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/scout-login')}
                    className="underline text-[#0B5D1E] font-semibold hover:text-[#E6B800]"
                  >
                    Login
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Right side - Image */}
          <div className="hidden md:flex flex-col justify-center items-center text-white space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4">Begin Your Journey</h2>
              <p className="text-lg text-gray-200">
                Join thousands of scouts across Sri Lanka in developing leadership, outdoor skills, and community service.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full max-w-md">
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-lg text-center">
                <p className="text-3xl font-bold text-[#E6B800]">10,000+</p>
                <p className="text-sm">Active Scouts</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-lg text-center">
                <p className="text-3xl font-bold text-[#E6B800]">500+</p>
                <p className="text-sm">Scout Groups</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-lg text-center">
                <p className="text-3xl font-bold text-[#E6B800]">100+</p>
                <p className="text-sm">Badges Available</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-lg text-center">
                <p className="text-3xl font-bold text-[#E6B800]">75</p>
                <p className="text-sm">Years of Service</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
