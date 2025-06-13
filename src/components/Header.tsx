
import { useState } from "react";
import { Button } from "./ui/button";
import { TouchFriendlyButton } from "./TouchFriendlyButton";
import { ResponsiveText } from "./ResponsiveText";
import { Menu, User, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
      <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Logo and Menu */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <TouchFriendlyButton
              variant="ghost"
              size="icon"
              onClick={onMenuClick}
              className="md:hidden"
            >
              <Menu className="h-5 w-5" />
            </TouchFriendlyButton>
            
            <ResponsiveText 
              variant="h3" 
              className="font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent"
            >
              Zelote
            </ResponsiveText>
          </div>
          
          {/* Right side - User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <TouchFriendlyButton variant="ghost" className="gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline-block max-w-[120px] sm:max-w-[200px] truncate">
                  {user?.name || user?.email || 'Usuário'}
                </span>
              </TouchFriendlyButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-56 bg-white border shadow-lg"
            >
              <DropdownMenuItem onClick={logout} className="cursor-pointer">
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
