import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Heart } from 'lucide-react';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const url = new URL(window.location.href);
        const type = url.searchParams.get('type');

        // Password recovery link → push to update password flow
        if (type === 'recovery') {
          navigate('/auth/update-password');
          return;
        }

        // ✅ Exchange the code in the URL for a session
        const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
        if (error) {
          console.error('Auth callback error (exchange):', error);
          navigate('/auth');
          return;
        }

        // All good → go home
        navigate('/');
      } catch (err) {
        console.error('Auth callback fatal:', err);
        navigate('/auth');
      }
    })();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-background flex items-center justify-center">
      <div className="text-center">
        <Heart className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
        <p className="text-muted-foreground">Memproses autentikasi...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
