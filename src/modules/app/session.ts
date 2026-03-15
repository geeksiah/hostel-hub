import type { AppDatabase, ExploreFilters, PendingBookingDraft, UserRole } from "@/types";
import { defaultExploreFilters } from "@/services/mock-data";

export interface SessionState {
  currentUserId: string | null;
  currentRole: UserRole;
  currentHostelId: string;
  sidebarOpen: boolean;
  exploreFilters: ExploreFilters;
  pendingBooking: PendingBookingDraft | null;
}

export interface AppState {
  database: AppDatabase | null;
  session: SessionState;
  loading: boolean;
}

export type SessionAction =
  | { type: "SET_DATABASE"; payload: AppDatabase }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_USER"; payload: { userId: string | null; role: UserRole } }
  | { type: "SET_HOSTEL"; payload: string }
  | { type: "SET_SIDEBAR"; payload: boolean }
  | { type: "SET_FILTERS"; payload: ExploreFilters }
  | { type: "SET_PENDING_BOOKING"; payload: PendingBookingDraft | null }
  | { type: "RESET_SESSION"; payload?: Partial<SessionState> };

const STORAGE_KEY = "hostelhub-session";

export const defaultSession: SessionState = {
  currentUserId: null,
  currentRole: "resident",
  currentHostelId: "h1",
  sidebarOpen: true,
  exploreFilters: defaultExploreFilters,
  pendingBooking: null,
};

export function readSession(): SessionState {
  if (typeof window === "undefined") return defaultSession;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSession;
    return { ...defaultSession, ...(JSON.parse(raw) as Partial<SessionState>) };
  } catch {
    return defaultSession;
  }
}

export function persistSession(session: SessionState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function appReducer(state: AppState, action: SessionAction): AppState {
  switch (action.type) {
    case "SET_DATABASE":
      return { ...state, database: action.payload, loading: false };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_USER": {
      const session = { ...state.session, currentUserId: action.payload.userId, currentRole: action.payload.role };
      persistSession(session);
      return { ...state, session };
    }
    case "SET_HOSTEL": {
      const session = { ...state.session, currentHostelId: action.payload };
      persistSession(session);
      return { ...state, session };
    }
    case "SET_SIDEBAR": {
      const session = { ...state.session, sidebarOpen: action.payload };
      persistSession(session);
      return { ...state, session };
    }
    case "SET_FILTERS": {
      const session = { ...state.session, exploreFilters: action.payload };
      persistSession(session);
      return { ...state, session };
    }
    case "SET_PENDING_BOOKING": {
      const session = { ...state.session, pendingBooking: action.payload };
      persistSession(session);
      return { ...state, session };
    }
    case "RESET_SESSION": {
      const session = { ...defaultSession, ...(action.payload ?? {}) };
      persistSession(session);
      return { ...state, session };
    }
    default:
      return state;
  }
}
