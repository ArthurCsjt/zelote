"use client";

import React, { useState, ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";

interface SidebarProps {
  children: ReactNode;
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const Sidebar = ({ children, open, setOpen }: SidebarProps) => {
  return (
    <>
      {/* Mobile Menu Button */}
      <div className="fixed top-4 left-4 z-[999] md:hidden">
        <button
          onClick={() => setOpen(!open)}
          className="p-2 rounded-full bg-white shadow-lg border border-gray-200 text-gray-800"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Overlay para Mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar Desktop/Mobile */}
      <motion.div
        initial={{ x: open ? 0 : -300 }}
        animate={{ x: open ? 0 : 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col h-full w-[260px] bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-700 shadow-xl",
          "md:relative md:translate-x-0 md:flex-shrink-0",
          "overflow-hidden" // Garante que o conteúdo que vaza seja cortado
        )}
      >
        <motion.div
          className={cn(
            "flex flex-col h-full",
            open ? "w-[260px]" : "w-[60px]"
          )}
          animate={{ width: open ? 260 : 60 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {children}
        </motion.div>
      </motion.div>
    </>
  );
};

interface SidebarBodyProps {
  children: ReactNode;
  className?: string;
}

export const SidebarBody = ({ children, className }: SidebarBodyProps) => {
  return (
    <div className={cn("flex flex-col flex-1 p-4 overflow-y-auto", className)}>
      {children}
    </div>
  );
};

interface SidebarLinkProps {
  link: {
    label: string;
    href: string;
    icon: ReactNode;
  };
  onClick?: () => void;
  open: boolean; // Adicionando a prop 'open'
}

export const SidebarLink = ({ link, onClick, open }: SidebarLinkProps) => {
  const { pathname } = useLocation();
  const isActive = pathname === link.href || (link.href === '/' && pathname === '/');

  const content = (
    <div
      className={cn(
        "flex items-center space-x-2 py-2 px-3 rounded-lg transition-colors duration-200 cursor-pointer",
        "text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800",
        isActive && "bg-primary/10 text-primary dark:bg-primary/20 dark:text-white",
        // Ajuste de padding para o estado recolhido
        !open && "justify-center px-0"
      )}
      onClick={onClick}
    >
      {React.cloneElement(link.icon as React.ReactElement, {
        className: cn(
          "h-5 w-5 flex-shrink-0",
          isActive ? "text-primary" : "text-neutral-500 dark:text-neutral-400"
        ),
      })}
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: open ? 1 : 0 }} // Controla a opacidade do texto
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className={cn(
          "text-sm font-medium whitespace-pre overflow-hidden",
          isActive ? "text-primary dark:text-white" : "text-neutral-700 dark:text-neutral-200",
          // Esconde o texto completamente quando fechado
          !open && "w-0 h-0 p-0 m-0"
        )}
      >
        {link.label}
      </motion.span>
    </div>
  );

  if (onClick) {
    return content;
  }

  return (
    <Link to={link.href}>
      {content}
    </Link>
  );
};