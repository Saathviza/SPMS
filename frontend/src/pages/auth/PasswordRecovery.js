import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';

import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';

export default function PasswordRecovery() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-900">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-16 h-16 mx-auto text-green-600 mb-4" />
            <h2>Check your email</h2>
            <p className="mb-6">Reset link sent to <b>{email}</b></p>
            <Button onClick={() => navigate('/')}>Back to Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-emerald-900">
      <div className="w-full max-w-md">

        <Button onClick={() => navigate('/')} variant="ghost" className="text-white mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card>
          <CardHeader className="text-center">
            <Mail className="w-12 h-12 mx-auto text-amber-600" />
            <CardTitle>Password Recovery</CardTitle>
            <CardDescription>Reset your password</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <Button onClick={() => setSubmitted(true)} className="w-full">
              Send Reset Link
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
