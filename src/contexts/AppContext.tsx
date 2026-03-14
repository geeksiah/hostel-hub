import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { User, UserRole } from '@/types';
import { mockUsers } from '@/services/mock-data';

interface AppState {
  currentUser: User | null;
  currentRole: UserRole;
  currentHostelId: string;
  sidebarOpen: boolean;
}

interface AppContextType extends AppState {
  setCurrentUser: (user: User | null) => void;
  switchRole: (role: UserRole) => void;
  setCurrentHostelId: (id: string) => void;
  setSidebarOpen: (open: boolean) => void;
  login: (role: UserRole) => void;
  logout: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

const roleUserMap: Record<UserRole, string> = {
  platform_owner: 'u1',
  tenant_admin: 'u2',
  resident: 'u3',
  group_organizer: 'u5',
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    currentUser: null,
    currentRole: 'resident',
    currentHostelId: 'h1',
    sidebarOpen: true,
  });

  const setCurrentUser = useCallback((user: User | null) => setState(s => ({ ...s, currentUser: user })), []);
  const switchRole = useCallback((role: UserRole) => {
    const user = mockUsers.find(u => u.id === roleUserMap[role]) ?? null;
    setState(s => ({ ...s, currentRole: role, currentUser: user }));
  }, []);
  const setCurrentHostelId = useCallback((id: string) => setState(s => ({ ...s, currentHostelId: id })), []);
  const setSidebarOpen = useCallback((open: boolean) => setState(s => ({ ...s, sidebarOpen: open })), []);

  const login = useCallback((role: UserRole) => {
    const user = mockUsers.find(u => u.id === roleUserMap[role]) ?? mockUsers[0];
    setState(s => ({ ...s, currentUser: user, currentRole: role }));
  }, []);

  const logout = useCallback(() => setState(s => ({ ...s, currentUser: null })), []);

  return (
    <AppContext.Provider value={{ ...state, setCurrentUser, switchRole, setCurrentHostelId, setSidebarOpen, login, logout }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
