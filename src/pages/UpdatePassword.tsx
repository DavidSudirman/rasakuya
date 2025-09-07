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

    const processRecovery = async () => {
      try {
        // Try to exchange code for session first (recommended approach)
        const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
        
        if (!error) {
          console.log('Recovery session established via exchangeCodeForSession');
          setRecoverySessionReady(true);
          // Clean the URL
          window.history.replaceState({}, document.title, window.location.pathname);
          return;
        }
        
        console.log('No code exchange needed, checking for existing session');
        
        // Check if there's already a valid session
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          console.log('Existing session found:', session);
          setRecoverySessionReady(true);
          return;
        }
        
        // If no session after 3 seconds, show error and redirect
        setTimeout(() => {
          toast({
            title: 'Link tidak valid',
            description: 'Link reset password tidak valid atau sudah kedaluwarsa.',
            variant: 'destructive',
          });
          navigate('/auth/forgot-password');
        }, 3000);
        
      } catch (error) {
        console.error('Recovery processing error:', error);
        toast({
          title: 'Error',
          description: 'Terjadi kesalahan saat memproses link reset password.',
          variant: 'destructive',
        });
        navigate('/auth/forgot-password');
      }
    };

    processRecovery();

    // Set up auth state listener for any auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event, 'Session:', !!session);
      
      if (event === 'PASSWORD_RECOVERY' && session) {
        setRecoverySessionReady(true);
      } else if (event === 'SIGNED_OUT') {
        setRecoverySessionReady(false);
      }
    });

    return () => {
      subscription.unsubscribe();
      if (redirectTimeout) clearTimeout(redirectTimeout);
    };
  }, [navigate, toast]);

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