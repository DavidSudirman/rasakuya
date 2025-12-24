import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Settings, Save, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useTTS } from '@/hooks/useTTS';

interface ArunaPreferencesProps {
  onClose?: () => void;
}

type VoiceGender = 'auto' | 'male' | 'female';

interface ArunaMemory {
  personality_summary?: string;
  style?: string;
  voiceOn?: boolean;
  voiceGender?: VoiceGender;
  voiceName?: string | null;
}

export const ArunaPreferences: React.FC<ArunaPreferencesProps> = ({ onClose }) => {
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { supported: ttsSupported, voices } = useTTS();
  const [memory, setMemory] = useState<ArunaMemory>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadPreferences(); }, [user]);

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
        const parsed = JSON.parse(data.aruna_preferences);
        setMemory(parsed || {});
      } else setMemory({});
    } catch (error) {
      console.error('Error loading ARUNA preferences:', error);
      toast({
        title: t('common.error'),
        description: language === 'id' ? 'Gagal memuat preferensi ARUNA' : 'Failed to load ARUNA preferences',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const payload = JSON.stringify(memory ?? {});
      const { error } = await supabase
        .from('profiles')
        .upsert({ user_id: user.id, aruna_preferences: payload }, { onConflict: 'user_id' });
      if (error) throw error;
      toast({
        title: language === 'id' ? 'Berhasil!' : 'Success!',
        description: language === 'id'
          ? 'Preferensi ARUNA telah disimpan'
          : 'ARUNA preferences have been saved',
      });
      onClose?.();
    } catch (error) {
      console.error('Error saving ARUNA preferences:', error);
      toast({
        title: t('common.error'),
        description: language === 'id'
          ? 'Gagal menyimpan preferensi ARUNA'
          : 'Failed to save ARUNA preferences',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const resetToDefault = () => {
    setMemory({
      personality_summary:
        language === 'id'
          ? 'Santai, empatik, dan realistis. Gunakan bahasa alami dan hangat.'
          : 'Calm, empathetic, and realistic. Use natural and warm language.',
      style:
        language === 'id'
          ? 'Jawab singkat (2–4 kalimat), empatik, suportif, dan jelas.'
          : 'Be concise (2–4 sentences), empathetic, supportive, and clear.',
      voiceOn: false,
      voiceGender: 'auto',
      voiceName: null,
    });
  };

  const updateMemory = (key: keyof ArunaMemory, value: any) => {
    setMemory(prev => ({ ...prev, [key]: value }));
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
            ? 'Atur tipe AI dan gaya bicara ARUNA'
            : 'Set AI type and response style'}
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="text-sm font-medium mb-2 block">
            {language === 'id' ? 'Gaya respons ARUNA' : 'ARUNA response style'}
          </label>
          <Textarea
            value={memory.style || ''}
            onChange={(e) => updateMemory('style', e.target.value)}
            placeholder={
              language === 'id'
                ? 'Contoh: Singkat (2–4 kalimat), empatik, jelas.'
                : 'Example: Short (2–4 sentences), empathetic, clear.'
            }
            className="min-h-[100px]"
          />
        </div>

        {/* Voice settings */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            {language === 'id' ? 'Pengaturan Suara (TTS)' : 'Voice Settings (TTS)'}
          </label>
          <div className="flex items-center gap-2 mb-3">
            <input
              id="voiceOn"
              type="checkbox"
              checked={!!memory.voiceOn}
              onChange={(e) => updateMemory('voiceOn', e.target.checked)}
              disabled={!ttsSupported || loading || saving}
            />
            <label htmlFor="voiceOn" className="text-sm">
              {language === 'id' ? 'Aktifkan balasan suara' : 'Enable voice replies'}
            </label>
          </div>

          <div className="flex gap-3 mb-3 flex-wrap">
            {(['auto', 'male', 'female'] as VoiceGender[]).map((g) => (
              <label key={g} className="text-sm flex items-center gap-1">
                <input
                  type="radio"
                  name="voiceGender"
                  value={g}
                  checked={memory.voiceGender === g}
                  onChange={() => updateMemory('voiceGender', g)}
                  disabled={!ttsSupported || loading || saving}
                />
                {language === 'id'
                  ? g === 'auto'
                    ? 'Otomatis'
                    : g === 'male'
                    ? 'Laki-laki'
                    : 'Perempuan'
                  : g}
              </label>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm">{language === 'id' ? 'Pilih suara:' : 'Choose voice:'}</span>
            <select
              className="text-sm border rounded p-1 flex-1"
              value={memory.voiceName || ''}
              onChange={(e) => updateMemory('voiceName', e.target.value)}
              disabled={!ttsSupported || loading || saving}
            >
              <option value="">{language === 'id' ? 'Pilih otomatis' : 'Auto select'}</option>
              {voices.map((v) => (
                <option key={v.name} value={v.name}>
                  {v.name} — {v.lang}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2 justify-between">
          <Button variant="outline" onClick={resetToDefault} disabled={loading || saving} size="sm">
            <RotateCcw className="h-4 w-4 mr-1" />
            {language === 'id' ? 'Reset Default' : 'Reset to Default'}
          </Button>
          <div className="flex gap-2">
            {onClose && (
              <Button variant="outline" onClick={onClose} disabled={saving}>
                {language === 'id' ? 'Batal' : 'Cancel'}
              </Button>
            )}
            <Button onClick={savePreferences} disabled={loading || saving}>
              <Save className="h-4 w-4 mr-1" />
              {saving ? (language === 'id' ? 'Menyimpan...' : 'Saving...') : (language === 'id' ? 'Simpan' : 'Save')}
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
