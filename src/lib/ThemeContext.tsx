import React, { createContext, useContext, useEffect, useState } from 'react';

type ThemeContextType = {
  isDarkMode: boolean;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    // Verificar preferência salva no localStorage
    const savedTheme = localStorage.getItem('theme');
    
    // Se não existir preferência, verifique a preferência do sistema
    if (!savedTheme) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    
    // Retornar a preferência salva
    return savedTheme === 'dark';
  });

  useEffect(() => {
    // Atualizar classe no documento HTML
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Salvar preferência no localStorage
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
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