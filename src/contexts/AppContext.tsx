import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, type ReactNode } from "react";
import { AuthService, DataService } from "@/services";
import { appReducer, readSession, type AppState } from "@/modules/app/session";
import type { ExploreFilters, PendingBookingDraft, User, UserRole } from "@/types";

interface AuthAttemptResult {
  user: User | null;
  error?: string;
}

interface AppContextType extends AppState {
  currentUser: User | null;
  currentRole: UserRole;
  currentHostelId: string;
  sidebarOpen: boolean;
  exploreFilters: ExploreFilters;
  pendingBooking: PendingBookingDraft | null;
  login: (role: UserRole, email?: string) => Promise<AuthAttemptResult>;
  logout: () => void;
  refreshData: () => Promise<void>;
  resetDemo: () => Promise<void>;
  switchRole: (role: UserRole) => Promise<AuthAttemptResult>;
  setCurrentHostelId: (id: string) => void;
  setSidebarOpen: (open: boolean) => void;
  setExploreFilters: (filters: ExploreFilters) => void;
  setPendingBooking: (draft: PendingBookingDraft | null) => void;
  clearPendingBooking: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, {
    database: null,
    loading: true,
    session: readSession(),
  });

  const refreshData = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: true });
    const result = await DataService.getSnapshot();
    dispatch({ type: "SET_DATABASE", payload: result.data });
  }, []);

  useEffect(() => {
    void refreshData();
  }, [refreshData]);

  const currentUser = useMemo(() => {
    if (!state.database || !state.session.currentUserId) return null;
    return state.database.users.find((user) => user.id === state.session.currentUserId) ?? null;
  }, [state.database, state.session.currentUserId]);

  const login = useCallback(async (role: UserRole, email?: string) => {
    const result = email ? await AuthService.login(email) : await AuthService.quickLogin(role);
    if (result.error) {
      return { user: null, error: result.error.message };
    }
    const user = result.data && result.data.role === role ? result.data : result.data;
    if (user) {
      dispatch({ type: "SET_USER", payload: { userId: user.id, role: user.role } });
      dispatch({ type: "SET_HOSTEL", payload: user.hostelId ?? state.session.currentHostelId });
      await refreshData();
      return { user };
    }
    return { user: null };
  }, [refreshData, state.session.currentHostelId]);

  const switchRole = useCallback(async (role: UserRole) => login(role), [login]);

  const logout = useCallback(() => {
    dispatch({ type: "RESET_SESSION" });
    if (typeof window !== "undefined") {
      window.location.replace("/");
    }
  }, []);

  const resetDemo = useCallback(async () => {
    const result = await DataService.resetDemo();
    dispatch({ type: "SET_DATABASE", payload: result.data });
    dispatch({ type: "RESET_SESSION", payload: { currentHostelId: result.data.hostels[0]?.id ?? "h1" } });
  }, []);

  const setCurrentHostelId = useCallback((id: string) => dispatch({ type: "SET_HOSTEL", payload: id }), []);
  const setSidebarOpen = useCallback((open: boolean) => dispatch({ type: "SET_SIDEBAR", payload: open }), []);
  const setExploreFilters = useCallback((filters: ExploreFilters) => dispatch({ type: "SET_FILTERS", payload: filters }), []);
  const setPendingBooking = useCallback((draft: PendingBookingDraft | null) => dispatch({ type: "SET_PENDING_BOOKING", payload: draft }), []);
  const clearPendingBooking = useCallback(() => dispatch({ type: "SET_PENDING_BOOKING", payload: null }), []);

  const value = useMemo<AppContextType>(
    () => ({
      ...state,
      currentUser,
      currentRole: state.session.currentRole,
      currentHostelId: state.session.currentHostelId,
      sidebarOpen: state.session.sidebarOpen,
      exploreFilters: state.session.exploreFilters,
      pendingBooking: state.session.pendingBooking,
      login,
      logout,
      refreshData,
      resetDemo,
      switchRole,
      setCurrentHostelId,
      setSidebarOpen,
      setExploreFilters,
      setPendingBooking,
      clearPendingBooking,
    }),
    [clearPendingBooking, currentUser, login, logout, refreshData, resetDemo, setCurrentHostelId, setExploreFilters, setPendingBooking, setSidebarOpen, state, switchRole],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
