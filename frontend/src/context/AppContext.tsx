import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import type { User, Project } from '../types';
import type { LoadingState } from '../types/common';

// State interface
interface AppState {
  user: User | null;
  projects: Project[];
  selectedProject: Project | null;
  theme: 'light' | 'dark';
  loading: {
    auth: LoadingState;
    projects: LoadingState;
    generation: LoadingState;
  };
}

// Action types
type AppAction =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_PROJECTS'; payload: Project[] }
  | { type: 'SET_SELECTED_PROJECT'; payload: Project | null }
  | { type: 'ADD_PROJECT'; payload: Project }
  | { type: 'UPDATE_PROJECT'; payload: { id: string; updates: Partial<Project> } }
  | { type: 'DELETE_PROJECT'; payload: string }
  | { type: 'SET_THEME'; payload: 'light' | 'dark' }
  | { type: 'SET_LOADING'; payload: { key: keyof AppState['loading']; loading: LoadingState } }
  | { type: 'RESET_STATE' };

// Initial state
const initialState: AppState = {
  user: null,
  projects: [],
  selectedProject: null,
  theme: 'dark',
  loading: {
    auth: { isLoading: false, error: null },
    projects: { isLoading: false, error: null },
    generation: { isLoading: false, error: null },
  },
};

// Reducer
const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    
    case 'SET_PROJECTS':
      return { ...state, projects: action.payload };
    
    case 'SET_SELECTED_PROJECT':
      return { ...state, selectedProject: action.payload };
    
    case 'ADD_PROJECT':
      return { ...state, projects: [action.payload, ...state.projects] };
    
    case 'UPDATE_PROJECT':
      return {
        ...state,
        projects: state.projects.map(project =>
          project.id === action.payload.id
            ? { ...project, ...action.payload.updates }
            : project
        ),
        selectedProject: state.selectedProject?.id === action.payload.id
          ? { ...state.selectedProject, ...action.payload.updates }
          : state.selectedProject,
      };
    
    case 'DELETE_PROJECT':
      return {
        ...state,
        projects: state.projects.filter(project => project.id !== action.payload),
        selectedProject: state.selectedProject?.id === action.payload ? null : state.selectedProject,
      };
    
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    
    case 'SET_LOADING':
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload.key]: action.payload.loading,
        },
      };
    
    case 'RESET_STATE':
      return initialState;
    
    default:
      return state;
  }
};

// Context
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  // Helper functions
  setUser: (user: User | null) => void;
  setProjects: (projects: Project[]) => void;
  setSelectedProject: (project: Project | null) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setLoading: (key: keyof AppState['loading'], loading: LoadingState) => void;
  resetState: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider component
interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Helper functions
  const setUser = (user: User | null) => {
    dispatch({ type: 'SET_USER', payload: user });
  };

  const setProjects = (projects: Project[]) => {
    dispatch({ type: 'SET_PROJECTS', payload: projects });
  };

  const setSelectedProject = (project: Project | null) => {
    dispatch({ type: 'SET_SELECTED_PROJECT', payload: project });
  };

  const addProject = (project: Project) => {
    dispatch({ type: 'ADD_PROJECT', payload: project });
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    dispatch({ type: 'UPDATE_PROJECT', payload: { id, updates } });
  };

  const deleteProject = (id: string) => {
    dispatch({ type: 'DELETE_PROJECT', payload: id });
  };

  const setTheme = (theme: 'light' | 'dark') => {
    dispatch({ type: 'SET_THEME', payload: theme });
  };

  const setLoading = (key: keyof AppState['loading'], loading: LoadingState) => {
    dispatch({ type: 'SET_LOADING', payload: { key, loading } });
  };

  const resetState = () => {
    dispatch({ type: 'RESET_STATE' });
  };

  const value: AppContextType = {
    state,
    dispatch,
    setUser,
    setProjects,
    setSelectedProject,
    addProject,
    updateProject,
    deleteProject,
    setTheme,
    setLoading,
    resetState,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Custom hook to use the context
export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};