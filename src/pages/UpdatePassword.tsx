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
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const initRecoverySession = async () => {
      try {
        // Must be present for recovery links
        if (!window.location.hash) throw new Error('No hash');

        // Make sure it's a recovery link
        const params = new URLSearchParams(window.location.hash.slice(1));
        const type = params.get('type');
        if (type !== 'recovery') throw new Error('Not a recovery link');

        // Process the hash and get session
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session) throw error || new Error('No session');

        // Optional: clean the URL so the hash with token disappears
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch {
        toast({
          title: 'Link tidak valid',
          description: 'Link reset password tidak valid atau sudah kedaluwarsa.',
          variant: 'destructive',
        });
        navigate('/auth/forgot-password');
      }
    };

    initRecoverySession();
  }, [navigate, toast]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      toast({ title: 'Error', description: 'Silakan masukkan kata sandi baru.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      toast({ title: 'Berhasil!', description: 'Kata sandi berhasil diperbarui. Silakan login kembali.' });

      // (Optional) end the recovery session and send user to login
      await supabase.auth.signOut();
      navigate('/auth');
    } catch {
      toast({
        title: 'Error',
        description: 'Link reset password tidak valid atau sudah kedaluwarsa.',
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