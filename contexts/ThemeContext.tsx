'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ThemeContextType {
  primaryColor: string;
  secondaryColor: string;
  setPrimaryColor: (color: string) => void;
  setSecondaryColor: (color: string) => void;
  isLoading: boolean;
  companyLogo: string | null;
  companyName: string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [primaryColor, setPrimaryColor] = useState('#10b981');
  const [secondaryColor, setSecondaryColor] = useState('#059669');
  const [isLoading, setIsLoading] = useState(true);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState('FalconERP');

  useEffect(() => {
    // Cargar colores de la empresa activa
    const loadCompanyColors = async () => {
      try {
        const response = await fetch('/api/companies');
        if (response.ok) {
          const companies = await response.json();
          const activeCompany = companies.find((c: any) => c.active);
          if (activeCompany) {
            setPrimaryColor(activeCompany.primaryColor || '#10b981');
            setSecondaryColor(activeCompany.secondaryColor || '#059669');
            setCompanyLogo(activeCompany.logo || null);
            setCompanyName(activeCompany.name || 'FalconERP');
          }
        }
      } catch (error) {
        // Silenciar error si no está autenticado
        console.log('No se pudieron cargar los colores de la empresa');
      } finally {
        setIsLoading(false);
      }
    };
    loadCompanyColors();

    // Escuchar cambios de empresa
    const handleCompanyChange = () => loadCompanyColors();
    window.addEventListener('companyChanged', handleCompanyChange);
    return () => window.removeEventListener('companyChanged', handleCompanyChange);
  }, []);

  return (
    <ThemeContext.Provider value={{ primaryColor, secondaryColor, setPrimaryColor, setSecondaryColor, isLoading, companyLogo, companyName }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
