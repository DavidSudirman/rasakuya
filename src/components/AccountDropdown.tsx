import React from 'react';
import { Button } from '@/components/ui/button';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AccountDropdownProps {}

export const AccountDropdown: React.FC<AccountDropdownProps> = () => {
  const { t } = useLanguage();
  const { user, signOut } = useAuth();

  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'User';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="bg-white/10 border-white/20 text-white hover:bg-white/20 gap-2"
        >
          <User className="h-4 w-4" />
          <span className="hidden sm:inline">
            {t('header.greeting').replace('{name}', displayName)}
          </span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem className="cursor-pointer">
          <User className="h-4 w-4 mr-2" />
          {t('account.profile')}
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer">
          <Settings className="h-4 w-4 mr-2" />
          {t('account.settings')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer text-red-600" onClick={signOut}>
          <LogOut className="h-4 w-4 mr-2" />
          {t('header.logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};