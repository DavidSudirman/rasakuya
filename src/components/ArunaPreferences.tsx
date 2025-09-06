import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Settings, Save, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface ArunaPreferencesProps {
  onClose?: () => void;
}

export const ArunaPreferences: React.FC<ArunaPreferencesProps> = ({ onClose }) => {
  const [preferences, setPreferences] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const { user } = useAuth();

  useEffect(() => {
    loadPreferences();
  }, [user]);

  const loadPreferences = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('aruna_preferences')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data?.aruna_preferences) {
        setPreferences(data.aruna_preferences);
      }
    } catch (error) {
      console.error('Error loading ARUNA preferences:', error);
      toast({
        title: t('common.error'),
        description: language === 'id' ? 'Gagal memuat preferensi ARUNA' : 'Failed to load ARUNA preferences',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          aruna_preferences: preferences.trim() || null
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;
      
      toast({
        title: language === 'id' ? 'Berhasil!' : 'Success!',
        description: language === 'id' ? 'Preferensi ARUNA telah disimpan' : 'ARUNA preferences have been saved',
      });
      
      if (onClose) onClose();
    } catch (error) {
      console.error('Error saving ARUNA preferences:', error);
      toast({
        title: t('common.error'),
        description: language === 'id' ? 'Gagal menyimpan preferensi ARUNA' : 'Failed to save ARUNA preferences',
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const resetToDefault = () => {
    const defaultPreferences = language === 'id' 
      ? "Berikan respons yang empati dan supportif. Gunakan bahasa yang hangat dan ramah. Berikan saran praktis yang mudah diterapkan dalam kehidupan sehari-hari."
      : "Provide empathetic and supportive responses. Use warm and friendly language. Give practical advice that's easy to apply in daily life.";
    
    setPreferences(defaultPreferences);
  };

  return (
    <Card className="p-6 w-full max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <Settings className="h-8 w-8 text-primary mx-auto mb-2" />
        <h2 className="text-xl font-semibold">
          {language === 'id' ? 'Preferensi ARUNA' : 'ARUNA Preferences'}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {language === 'id' 
            ? 'Sesuaikan cara ARUNA merespons Anda' 
            : 'Customize how ARUNA responds to you'
          }
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">
            {language === 'id' 
              ? 'Bagaimana Anda ingin ARUNA merespons?' 
              : 'How do you want ARUNA to respond?'
            }
          </label>
          <Textarea
            value={preferences}
            onChange={(e) => setPreferences(e.target.value)}
            placeholder={language === 'id' 
              ? 'Contoh: Berikan respons yang singkat dan langsung ke poin. Gunakan bahasa yang profesional. Fokus pada solusi praktis...'
              : 'Example: Give short and direct responses. Use professional language. Focus on practical solutions...'
            }
            className="min-h-[120px]"
            disabled={loading || saving}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {language === 'id' 
              ? 'Deskripsikan gaya komunikasi, tone, dan jenis saran yang Anda inginkan dari ARUNA'
              : 'Describe the communication style, tone, and type of advice you want from ARUNA'
            }
          </p>
        </div>

        <div className="flex gap-2 justify-between">
          <Button
            variant="outline"
            onClick={resetToDefault}
            disabled={loading || saving}
            size="sm"
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            {language === 'id' ? 'Reset Default' : 'Reset Default'}
          </Button>
          
          <div className="flex gap-2">
            {onClose && (
              <Button
                variant="outline"
                onClick={onClose}
                disabled={saving}
              >
                {language === 'id' ? 'Batal' : 'Cancel'}
              </Button>
            )}
            <Button
              onClick={savePreferences}
              disabled={loading || saving}
            >
              <Save className="h-4 w-4 mr-1" />
              {saving 
                ? (language === 'id' ? 'Menyimpan...' : 'Saving...') 
                : (language === 'id' ? 'Simpan' : 'Save')
              }
            </Button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="text-center text-muted-foreground mt-4">
          {language === 'id' ? 'Memuat preferensi...' : 'Loading preferences...'}
        </div>
      )}
    </Card>
  );
};