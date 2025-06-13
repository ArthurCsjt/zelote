
import React from 'react';
import { Header } from './Header';

interface LayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ title, subtitle, children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header onMenuClick={() => {}} />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
          {subtitle && (
            <p className="text-gray-600">{subtitle}</p>
          )}
        </div>
        {children}
      </main>
    </div>
  );
};

export default Layout;
