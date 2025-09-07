import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Heart } from 'lucide-react';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check URL parameters for recovery type
        const urlParams = new URLSearchParams(window.location.search);
        const type = urlParams.get('type');
        
        if (type === 'recovery') {
          // This is a password recovery, redirect to update password page
          navigate('/auth/update-password');
          return;
        }
        
        // Get session from URL
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          navigate('/auth');
          return;
        }

        if (data.session) {
          // User is authenticated, redirect to main app
          navigate('/');
        } else {
          // No session, redirect to auth page
          navigate('/auth');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/auth');
      }
    };

    handleAuthCallback();
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