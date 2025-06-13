
import React, { useState } from 'react';
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "./ui/sheet";
import { Menu, X, Home, Computer, BarChart, Users, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileNavigationProps {
  onNavigate: (route: string) => void;
  currentRoute?: string;
}

const navigationItems = [
  { id: 'menu', label: 'Menu Principal', icon: Home },
  { id: 'loan', label: 'Empréstimos', icon: Computer },
  { id: 'dashboard', label: 'Dashboard', icon: BarChart },
  { id: 'inventory', label: 'Inventário', icon: Computer },
  { id: 'user-management', label: 'Usuários', icon: Users },
];

export function MobileNavigation({ onNavigate, currentRoute }: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleNavigation = (route: string) => {
    onNavigate(route);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Navigation Toggle - Fixed position for easy access */}
      <div className="md:hidden fixed top-4 right-4 z-50">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="bg-white shadow-lg border-2 min-h-[48px] min-w-[48px]"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent 
            side="right" 
            className="w-80 sm:w-96 p-0"
          >
            <SheetHeader className="p-6 pb-4 border-b">
              <SheetTitle className="text-lg font-semibold">
                Menu de Navegação
              </SheetTitle>
            </SheetHeader>
            
            <div className="p-4 space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentRoute === item.id;
                
                return (
                  <Button
                    key={item.id}
                    variant={isActive ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start min-h-[48px] text-left",
                      "px-4 py-3 rounded-lg",
                      isActive && "bg-blue-600 text-white"
                    )}
                    onClick={() => handleNavigation(item.id)}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Button>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Bottom Navigation for Mobile - Alternative option */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 z-40">
        <div className="flex justify-around items-center max-w-md mx-auto">
          {navigationItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const isActive = currentRoute === item.id;
            
            return (
              <Button
                key={item.id}
                variant="ghost"
                size="sm"
                className={cn(
                  "flex flex-col items-center justify-center min-h-[48px] min-w-[48px]",
                  "px-2 py-1 rounded-lg",
                  isActive && "text-blue-600 bg-blue-50"
                )}
                onClick={() => handleNavigation(item.id)}
              >
                <Icon className="h-4 w-4 mb-1" />
                <span className="text-xs truncate max-w-[60px]">
                  {item.label.split(' ')[0]}
                </span>
              </Button>
            );
          })}
        </div>
      </div>
    </>
  );
}
