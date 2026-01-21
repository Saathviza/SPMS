import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';

import { ArrowLeft, Award } from 'lucide-react';

import { authService } from '../../services/api';

export default function ScoutLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) return;
    setError('');

    try {
      const data = await authService.login(email, password);

      // Store auth data
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      localStorage.setItem('user', JSON.stringify(data.user));

      navigate('/scout/dashboard');
    } catch (err) {
      console.error(err);
      setError('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background with forest and sunrise */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2000")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-green-900/70 via-green-800/60 to-black/80" />

      {/* Scout emblem watermark */}
      <div className="absolute bottom-10 right-10 opacity-10 z-0">
        <Award size={200} className="text-white" />
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
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
            <Award className="mx-auto text-[#E6B800] mb-2" size={48} />
            <CardTitle className="text-2xl text-[#0B5D1E]">Scout Login</CardTitle>
            <CardDescription className="text-sm italic">"Be Prepared — Begin Your Adventure"</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="scout@example.com"
              />
            </div>

            <div>
              <Label>Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <Button
              onClick={handleLogin}
              className="w-full bg-[#0B5D1E] text-white hover:bg-[#084516] transition-all duration-300"
            >
              Login
            </Button>

            <div className="text-center text-sm space-y-2">
              <button
                onClick={() => navigate('/password-recovery')}
                className="underline text-gray-600 hover:text-[#0B5D1E]"
              >
                Forgot Password?
              </button>
              <div className="text-gray-500">
                New Scout?{' '}
                <button
                  onClick={() => navigate('/scout-registration')}
                  className="underline text-[#0B5D1E] font-semibold hover:text-[#E6B800]"
                >
                  Create Account
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

