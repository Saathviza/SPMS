import { useState } from 'react';
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
import { ArrowLeft, UserPlus } from 'lucide-react';
import { authService } from '../../services/api';

export default function ScoutRegistration() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    district: '',
    province: '',
    date_of_birth: '',
    gender: '',
    contact_number: '',
    nic: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        date_of_birth: formData.date_of_birth,
        age: calculateAge(formData.date_of_birth),
        group_id: 1, // default group for now
        contact_number: formData.contact_number || null,
        nic: formData.nic || null,
        district: formData.district || null,
        province: formData.province || null,
        gender: formData.gender
      };

      await authService.registerScout(payload);

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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden py-12">
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage:
            'url("https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=2000")',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
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

        <Card className="bg-white/95 backdrop-blur-md shadow-2xl">
          <CardHeader className="text-center">
            <UserPlus className="mx-auto text-[#E6B800] mb-2" size={48} />
            <CardTitle className="text-2xl text-[#0B5D1E]">
              Scout Registration
            </CardTitle>
            <CardDescription>
              Join the Sri Lanka Scout Community
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
                  {error}
                </div>
              )}

              <Input name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} required />
              <Input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
              <Input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required />
              <Input type="password" name="confirmPassword" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleChange} required />
              <Input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} required />
              <Input name="district" placeholder="District" value={formData.district} onChange={handleChange} />
              <Input name="province" placeholder="Province" value={formData.province} onChange={handleChange} />
              <Input name="contact_number" placeholder="Contact Number" value={formData.contact_number} onChange={handleChange} />
              <Input name="nic" placeholder="NIC / School ID" value={formData.nic} onChange={handleChange} />

              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0B5D1E] hover:bg-[#084516] text-white"
              >
                {loading ? 'Registering…' : 'Register Now'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

