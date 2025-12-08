import React from 'react';
import { 
  ClipboardList, 
  BarChart3, 
  PlusCircle, 
  Laptop, 
  RotateCcw, 
  ListChecks, 
  Calendar, 
  Settings,
  LogOut,
  X,
  ChevronLeft
} from 'lucide-react';
import { useProfileRole } from '@/hooks/use-profile-role';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';

type AppView = 'menu' | 'registration' | 'dashboard' | 'inventory' | 'loan' | 'audit' | 'return' | 'scheduling';

interface AppSidebarProps {
  currentView: AppView;
  onNavigate: (view: AppView, tab?: 'form' | 'active') => void;
}

export function AppSidebar({ currentView, onNavigate }: AppSidebarProps) {
  const { role } = useProfileRole();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { setOpenMobile, isMobile } = useSidebar();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const handleNavigation = (view: AppView, tab?: 'form' | 'active') => {
    onNavigate(view, tab);
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const menuItems = [
    {
      title: 'Empréstimos',
      icon: ClipboardList,
      view: 'loan' as AppView,
      tab: 'form' as const,
      color: 'bg-blue-400 dark:bg-blue-600',
      roles: ['admin', 'super_admin', 'user']
    },
    {
      title: 'Devolução',
      icon: RotateCcw,
      view: 'return' as AppView,
      color: 'bg-amber-400 dark:bg-amber-600',
      roles: ['admin', 'super_admin', 'user']
    },
    {
      title: 'Agendamento',
      icon: Calendar,
      view: 'scheduling' as AppView,
      color: 'bg-violet-400 dark:bg-violet-600',
      roles: ['admin', 'super_admin', 'professor', 'user'],
      badge: 'BETA'
    },
    {
      title: 'Inventário',
      icon: Laptop,
      view: 'inventory' as AppView,
      color: 'bg-teal-400 dark:bg-teal-600',
      roles: ['admin', 'super_admin', 'user']
    },
    {
      title: 'Cadastros',
      icon: PlusCircle,
      view: 'registration' as AppView,
      color: 'bg-green-400 dark:bg-green-600',
      roles: ['admin', 'super_admin', 'user']
    },
    {
      title: 'Contagem',
      icon: ListChecks,
      view: 'audit' as AppView,
      color: 'bg-rose-400 dark:bg-rose-600',
      roles: ['admin', 'super_admin']
    },
    {
      title: 'Dashboard',
      icon: BarChart3,
      view: 'dashboard' as AppView,
      color: 'bg-indigo-400 dark:bg-indigo-600',
      roles: ['admin', 'super_admin', 'user']
    },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(role || 'user'));

  return (
    <Sidebar className="border-r-4 border-black dark:border-white">
      {/* Header */}
      <SidebarHeader className="border-b-4 border-black dark:border-white bg-yellow-300 dark:bg-zinc-900 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-black dark:text-white uppercase tracking-tight">
              Zelote
            </h1>
            <p className="text-xs font-bold text-black dark:text-white uppercase tracking-tight">
              Controle de Chromebooks
            </p>
          </div>
          {isMobile && (
            <button
              onClick={() => setOpenMobile(false)}
              className="p-2 border-2 border-black dark:border-white bg-white dark:bg-zinc-800 hover:bg-red-400 dark:hover:bg-red-600 transition-colors shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff]"
            >
              <X className="w-5 h-5 text-black dark:text-white" />
            </button>
          )}
        </div>
      </SidebarHeader>

      {/* Menu Content */}
      <SidebarContent className="bg-white dark:bg-zinc-900 p-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-black uppercase tracking-widest text-black dark:text-white mb-2 px-2">
            Menu Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {filteredItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.view;
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      onClick={() => handleNavigation(item.view, item.tab)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 border-2 border-black dark:border-white transition-all duration-200 group/item",
                        isActive 
                          ? "bg-black dark:bg-white text-white dark:text-black shadow-none translate-x-0 translate-y-0" 
                          : "bg-white dark:bg-zinc-800 text-black dark:text-white shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#000] dark:hover:shadow-[6px_6px_0px_0px_#fff]",
                        "active:translate-x-0 active:translate-y-0 active:shadow-none"
                      )}
                    >
                      <div className={cn(
                        "p-1.5 border-2 border-black dark:border-white",
                        item.color,
                        isActive && "border-white dark:border-black"
                      )}>
                        <Icon className={cn(
                          "h-4 w-4",
                          isActive ? "text-black" : "text-black dark:text-white"
                        )} />
                      </div>
                      <span className="font-bold text-sm uppercase tracking-tight flex-1 text-left">
                        {item.title}
                      </span>
                      {item.badge && (
                        <Badge className="text-[9px] h-4 px-1 py-0 border border-black bg-yellow-300 text-black rounded-none shadow-[1px_1px_0px_0px_#000] font-bold">
                          {item.badge}
                        </Badge>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t-4 border-black dark:border-white bg-zinc-100 dark:bg-zinc-800 p-3 space-y-2">
        {/* User Info */}
        {user && (
          <div className="p-3 border-2 border-black dark:border-white bg-white dark:bg-zinc-900 shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff]">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 border-2 border-black dark:border-white bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center text-white text-sm font-black">
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-black dark:text-white truncate">
                  {user.email?.split('@')[0]}
                </p>
                <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">
                  {role || 'Usuário'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {role && (role === 'admin' || role === 'super_admin') && (
            <button
              onClick={() => navigate('/settings')}
              className="flex-1 flex items-center justify-center gap-2 p-2 border-2 border-black dark:border-white bg-white dark:bg-zinc-900 text-black dark:text-white font-bold text-xs uppercase shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_#000] dark:hover:shadow-[3px_3px_0px_0px_#fff] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all"
            >
              <Settings className="h-4 w-4" />
              Config
            </button>
          )}
          <button
            onClick={handleLogout}
            className="flex-1 flex items-center justify-center gap-2 p-2 border-2 border-black dark:border-white bg-red-400 dark:bg-red-600 text-black dark:text-white font-bold text-xs uppercase shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_#000] dark:hover:shadow-[3px_3px_0px_0px_#fff] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
