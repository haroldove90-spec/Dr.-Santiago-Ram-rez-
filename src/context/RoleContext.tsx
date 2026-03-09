import React, { createContext, useContext, useState, ReactNode } from 'react';

type Role = 'doctor' | 'assistant';

interface RoleContextType {
  role: Role;
  setRole: (role: Role) => void;
  isAuthenticated: boolean;
  login: (role: Role) => void;
  logout: () => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>(() => {
    try {
      const savedRole = localStorage.getItem('userRole');
      return (savedRole as Role) || 'doctor';
    } catch (e) {
      return 'doctor';
    }
  });
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      return localStorage.getItem('isAuthenticated') === 'true';
    } catch (e) {
      return false;
    }
  });

  const setRole = (newRole: Role) => {
    setRoleState(newRole);
    try {
      localStorage.setItem('userRole', newRole);
    } catch (e) {
      console.warn('Could not save role to localStorage', e);
    }
  };

  const login = (selectedRole: Role) => {
    setRole(selectedRole);
    setIsAuthenticated(true);
    try {
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userRole', selectedRole);
    } catch (e) {
      console.warn('Could not save auth state to localStorage', e);
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    try {
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('userRole');
    } catch (e) {
      console.warn('Could not remove auth state from localStorage', e);
    }
  };

  return (
    <RoleContext.Provider value={{ role, setRole, isAuthenticated, login, logout }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}
