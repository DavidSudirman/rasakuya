import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { AITherapist } from '@/components/AITherapist';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { cn } from '@/lib/utils';

type ChatTab = {
  id: string;
  title: string;
  createdAt: number;
};

interface Props {
  moodEntries: Array<{ date: string; mood: string; emoji: string; description?: string }>;
}

const LS_KEY = (uid: string) => `aruna-tabs-${uid}`;

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export const ArunaChatTabs: React.FC<Props> = ({ moodEntries }) => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [tabs, setTabs] = useState<ChatTab[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [editingId, setEditingId] = useState<string>('');
  const [tempTitle, setTempTitle] = useState<string>('');

  const emptyLabel = language === 'id' ? 'Chat' : 'Chat';
  const newLabel = language === 'id' ? 'Chat Baru' : 'New Chat';

  const storageKey = useMemo(() => (user ? LS_KEY(user.id) : ''), [user]);

  // Load tabs
  useEffect(() => {
    if (!user) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as { tabs: ChatTab[]; activeId?: string };
        if (parsed.tabs?.length) {
          setTabs(parsed.tabs);
          setActiveId(
            parsed.activeId && parsed.tabs.some(t => t.id === parsed.activeId)
              ? parsed.activeId
              : parsed.tabs[0].id
          );
          return;
        }
      }
    } catch {
      // ignore parse errors
    }
    // default: create one tab
    const first: ChatTab = { id: uid(), title: `${emptyLabel} 1`, createdAt: Date.now() };
    setTabs([first]);
    setActiveId(first.id);
  }, [storageKey, user]);

  // Persist tabs
  useEffect(() => {
    if (!user) return;
    localStorage.setItem(storageKey, JSON.stringify({ tabs, activeId }));
  }, [tabs, activeId, storageKey, user]);

  const addTab = () => {
    const n = tabs.length + 1;
    const t: ChatTab = { id: uid(), title: `${emptyLabel} ${n}`, createdAt: Date.now() };
    setTabs(prev => [...prev, t]);
    setActiveId(t.id);
  };

  const startRename = (id: string) => {
    const tab = tabs.find(t => t.id === id);
    if (!tab) return;
    setEditingId(id);
    setTempTitle(tab.title);
  };

  const cancelRename = () => {
    setEditingId('');
    setTempTitle('');
  };

  const confirmRename = (id: string) => {
    setTabs(prev =>
      prev.map(t => (t.id === id ? { ...t, title: (tempTitle || newLabel).trim() } : t))
    );
    cancelRename();
  };

  const deleteTab = (id: string) => {
    if (user) localStorage.removeItem(`aruna-chat-${user.id}-${id}`);
    setTabs(prev => {
      const filtered = prev.filter(t => t.id !== id);
      if (!filtered.length) {
        const first: ChatTab = { id: uid(), title: `${emptyLabel} 1`, createdAt: Date.now() };
        setActiveId(first.id);
        return [first];
      }
      if (id === activeId) setActiveId(filtered[0].id);
      return filtered;
    });
  };

  return (
    <div className="space-y-4">
      {/* Tab Bar */}
      <Card className="p-2">
        <div className="flex items-center gap-2 overflow-x-auto">
          <div className="flex items-center gap-1">
            {tabs.map(tab => {
              const isActive = tab.id === activeId;
              const isEditing = tab.id === editingId;

              return (
                <div
                  key={tab.id}
                  className={cn(
                    'group flex items-center gap-1 rounded-md px-3 py-2 border transition-all',
                    isActive
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted hover:bg-muted/70 border-transparent text-foreground'
                  )}
                >
                  {isEditing ? (
                    <>
                      <Input
                        value={tempTitle}
                        onChange={(e) => setTempTitle(e.target.value)}
                        className={cn(
                          'h-7 w-36 bg-background',
                          isActive ? 'text-foreground' : 'text-foreground'
                        )}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') confirmRename(tab.id);
                          if (e.key === 'Escape') cancelRename();
                        }}
                      />
                      <Button
                        size="icon"
                        variant={isActive ? 'secondary' : 'ghost'}
                        className="h-7 w-7"
                        onClick={() => confirmRename(tab.id)}
                        title={language === 'id' ? 'Simpan' : 'Save'}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant={isActive ? 'secondary' : 'ghost'}
                        className="h-7 w-7"
                        onClick={cancelRename}
                        title={language === 'id' ? 'Batal' : 'Cancel'}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <button
                        className="truncate max-w-[180px] text-left"
                        onClick={() => setActiveId(tab.id)}
                        title={tab.title}
                      >
                        {tab.title}
                      </button>

                      <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="icon"
                          variant={isActive ? 'secondary' : 'ghost'}
                          className="h-7 w-7"
                          onClick={() => startRename(tab.id)}
                          title={language === 'id' ? 'Ubah nama' : 'Rename'}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant={isActive ? 'secondary' : 'ghost'}
                          className="h-7 w-7"
                          onClick={() => deleteTab(tab.id)}
                          title={language === 'id' ? 'Hapus' : 'Delete'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          <Button
            size="icon"
            variant="outline"
            className="ml-1 shrink-0"
            onClick={addTab}
            title={language === 'id' ? 'Tambah chat' : 'New chat'}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      {/* Active Chat */}
      <AITherapist key={activeId} sessionId={activeId} moodEntries={moodEntries} />
    </div>
  );
};
