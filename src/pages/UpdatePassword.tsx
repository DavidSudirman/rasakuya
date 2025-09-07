import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Heart, Sparkles, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const UpdatePassword = () => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [recoverySessionReady, setRecoverySessionReady] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    let redirectTimeout: NodeJS.Timeout;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event, 'Session:', session);
      
      if (event === 'PASSWORD_RECOVERY' && session) {
        console.log('Recovery session established:', session);
        setRecoverySessionReady(true);
        // Clean the URL after recovery session is established
        setTimeout(() => {
          window.history.replaceState({}, document.title, window.location.pathname);
        }, 100);
      } else if (event === 'SIGNED_OUT') {
        setRecoverySessionReady(false);
      } else if (event === 'INITIAL_SESSION' && !session && window.location.hash) {
        // Process recovery tokens if present in hash
        const params = new URLSearchParams(window.location.hash.slice(1));
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const type = params.get('type');
        
        console.log('Hash params:', { accessToken: !!accessToken, refreshToken: !!refreshToken, type });
        
        if (type === 'recovery' && accessToken && refreshToken) {
          try {
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });
          } catch (error) {
            console.error('Error setting session:', error);
          }
        }
      }
    });

    // If no recovery happens within 5 seconds and no hash, redirect
    redirectTimeout = setTimeout(() => {
      if (!recoverySessionReady && !window.location.hash) {
        toast({
          title: 'Link tidak valid',
          description: 'Link reset password tidak valid atau sudah kedaluwarsa.',
          variant: 'destructive',
        });
        navigate('/auth/forgot-password');
      }
    }, 5000);

    return () => {
      subscription.unsubscribe();
      if (redirectTimeout) clearTimeout(redirectTimeout);
    };
  }, [navigate, toast, recoverySessionReady]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      toast({ title: 'Error', description: 'Silakan masukkan kata sandi baru.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      // Get current session and log it for debugging
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('Current session:', session);
      console.log('Session error:', sessionError);
      console.log('Recovery session ready:', recoverySessionReady);

      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        console.log('Update user error:', error);
        throw error;
      }

      toast({ title: 'Berhasil!', description: 'Kata sandi berhasil diperbarui. Silakan login kembali.' });

      // End the recovery session and send user to login
      await supabase.auth.signOut();
      navigate('/auth');
    } catch (error: any) {
      console.log('Password update failed:', error);
      toast({
        title: 'Error',
        description: error.message || 'Gagal memperbarui kata sandi. Silakan coba lagi.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Heart className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">RasakuYa!</h1>
            <Sparkles className="h-6 w-6 text-primary-glow" />
          </div>
          <p className="text-muted-foreground">Buat password baru Anda</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl">Password Baru</CardTitle>
            <CardDescription>Masukkan password baru untuk akun Anda</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password Baru</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Masukkan password baru"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
                {loading ? 'Menyimpan...' : 'Simpan Kata Sandi'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UpdatePassword;