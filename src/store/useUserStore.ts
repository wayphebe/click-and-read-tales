import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';

interface UserState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  initialize: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  session: null,
  loading: true,
  initialized: false,
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setLoading: (loading) => set({ loading }),
  initialize: async () => {
    try {
      // 获取当前会话
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
        set({ user: null, session: null, loading: false, initialized: true });
        return;
      }

      set({ 
        user: session?.user ?? null, 
        session: session,
        loading: false,
        initialized: true 
      });

      // 监听认证状态变化
      supabase.auth.onAuthStateChange((_event, session) => {
        set({ 
          user: session?.user ?? null, 
          session: session 
        });
      });
    } catch (error) {
      console.error('Error initializing user:', error);
      set({ user: null, session: null, loading: false, initialized: true });
    }
  },
  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      set({ user: null, session: null });
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }
}));

