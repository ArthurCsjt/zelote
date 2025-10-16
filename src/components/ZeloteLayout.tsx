"use client";
import React, { useState, useEffect } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { 
    LayoutDashboard, 
    FilePlus, 
    Boxes, 
    ArrowRightLeft, 
    Undo2, 
    Calculator, 
    Settings, 
    LogOut,
    UserCircle,
    ListChecks,
    Menu
} from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useProfileRole } from "@/hooks/use-profile-role";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { ActivityFeed } from "./ActivityFeed";

// Componentes de Logo
export const Logo = () => {
  return (
    <Link
      to="/"
      className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20"
    >
      <div className="h-5 w-6 bg-primary rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-medium text-black dark:text-white whitespace-pre text-lg"
      >
        Zelote
      </motion.span>
    </Link>
  );
};
export const LogoIcon = () => {
  return (
    <Link
      to="/"
      className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20"
    >
      <div className="h-5 w-6 bg-primary rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
    </Link>
  );
};

// Este é o seu novo componente de layout principal
export function ZeloteLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { isAdmin } = useProfileRole();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Estado para controlar a abertura da sidebar (mobile e desktop)
  const [open, setOpen] = useState(false);
  
  // Fechar sidebar no mobile ao navegar
  useEffect(() => {
    if (window.innerWidth < 768) {
      setOpen(false);
    }
  }, [location.pathname]);

  // Lógica para determinar se a sidebar deve estar aberta por padrão no desktop
  useEffect(() => {
    if (window.innerWidth >= 768) {
      setOpen(true);
    }
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // Mapeamento dos links do menu Zelote
  const links = [
    {
      label: "Dashboard",
      href: "/", // Rota principal
      icon: <LayoutDashboard />,
    },
    {
      label: "Cadastros",
      href: "/registration",
      icon: <FilePlus />,
    },
    {
      label: "Inventário",
      href: "/inventory",
      icon: <Boxes />,
    },
    {
      label: "Empréstimos",
      href: "/loan",
      icon: <ArrowRightLeft />,
    },
    {
      label: "Sistema de Contagem",
      href: "/audit",
      icon: <ListChecks />,
    },
  ];
  
  // Links de Ação (Configurações e Logout)
  const actionLinks = [
    ...(isAdmin ? [{
      label: "Configurações",
      href: "/settings",
      icon: <Settings />,
    }] : []),
    {
      label: "Sair",
      onClick: handleLogout,
      icon: <LogOut />,
    },
  ];

  const userEmail = user?.email || "Usuário Desconhecido";
  const displayEmail = userEmail.length > 25 ? userEmail.substring(0, 22) + '...' : userEmail;

  return (
    <div
      className={cn(
        "flex flex-col md:flex-row bg-gray-100 dark:bg-neutral-800 w-full flex-1 mx-auto overflow-hidden min-h-screen",
      )}
    >
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            {open ? <Logo /> : <LogoIcon />}
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
          </div>
          
          {/* Links de Ação e Perfil */}
          <div className="flex flex-col gap-2 border-t pt-4 border-neutral-200 dark:border-neutral-700">
            {/* Perfil do Usuário */}
            <SidebarLink
              link={{
                label: displayEmail,
                href: "/settings", // Redireciona para configurações ao clicar no perfil
                icon: <UserCircle className="h-6 w-6 flex-shrink-0" />,
              }}
            />
            
            {/* Links de Ação */}
            {actionLinks.map((link, idx) => (
                <SidebarLink 
                    key={idx} 
                    link={{
                        label: link.label,
                        href: link.href || '#',
                        icon: link.icon,
                    }}
                    // Adiciona o onClick se for o botão de Sair
                    onClick={link.onClick}
                />
            ))}
          </div>
        </SidebarBody>
      </Sidebar>
      
      {/* Conteúdo Principal */}
      <div className={cn(
        "flex-1 p-4 md:p-8 overflow-y-auto transition-all duration-300",
        // Adiciona padding esquerdo no mobile para compensar o botão de menu
        "pt-16 md:pt-4" 
      )}>
        {/* Header Fixo para Mobile (para o botão de notificação) */}
        <div className="fixed top-0 right-0 z-30 p-4 md:hidden bg-white/90 backdrop-blur-sm w-full flex justify-end">
            <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative h-9 w-9">
                    <Menu className="h-5 w-5 text-gray-600" />
                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-auto" align="end">
                  <ActivityFeed />
                </PopoverContent>
            </Popover>
        </div>
        
        {children}
      </div>
    </div>
  );
}