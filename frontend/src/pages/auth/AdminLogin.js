import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { ArrowLeft, Shield } from 'lucide-react';
import { authService } from '../../services/api';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) return;
    setError('');

    try {
      const data = await authService.login(email, password);
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/admin/dashboard');
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Professional mountain silhouette background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2000")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-purple-900/70 via-gray-900/80 to-black/90" />

      <div className="relative z-10 w-full max-w-md px-6">
        <Button onClick={() => navigate('/')} variant="ghost" className="text-white mb-4 hover:bg-white/10">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Portal
        </Button>

        <Card className="bg-white/95 backdrop-blur-md shadow-2xl">
          <CardHeader className="text-center">
            <Shield className="mx-auto text-[#E6B800] mb-2" size={48} />
            <CardTitle className="text-2xl text-[#0B5D1E]">Admin Control Login</CardTitle>
            <CardDescription>System administration and management</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">{error}</div>}

            <div>
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div>
              <Label>Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>

            <Button onClick={handleLogin} className="w-full bg-[#0B5D1E] text-white hover:bg-[#084516]">
              Login as Admin
            </Button>

            <div className="text-center text-sm">
              <button onClick={() => navigate('/password-recovery')} className="underline text-gray-600 hover:text-[#0B5D1E]">
                Forgot Password?
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
