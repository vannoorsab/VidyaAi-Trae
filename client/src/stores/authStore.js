import create from 'zustand';
import { persist } from 'zustand/middleware';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';

// TODO: Replace with your Firebase config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      loading: true,
      error: null,

      // Initialize auth state listener
      init: () => {
        onAuthStateChanged(auth, (user) => {
          if (user) {
            // Get custom claims (role)
            user.getIdTokenResult().then((idTokenResult) => {
              set({
                user: {
                  uid: user.uid,
                  email: user.email,
                  displayName: user.displayName,
                  role: idTokenResult.claims.role || 'student',
                  photoURL: user.photoURL
                },
                isAuthenticated: true,
                loading: false,
                error: null
              });
            });
          } else {
            set({
              user: null,
              isAuthenticated: false,
              loading: false,
              error: null
            });
          }
        });
      },

      // Sign in
      signIn: async (email, password) => {
        try {
          set({ loading: true, error: null });
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          const idTokenResult = await userCredential.user.getIdTokenResult();
          
          set({
            user: {
              uid: userCredential.user.uid,
              email: userCredential.user.email,
              displayName: userCredential.user.displayName,
              role: idTokenResult.claims.role || 'student',
              photoURL: userCredential.user.photoURL
            },
            isAuthenticated: true,
            loading: false,
            error: null
          });

          return userCredential.user;
        } catch (error) {
          set({
            loading: false,
            error: error.message
          });
          throw error;
        }
      },

      // Sign up
      signUp: async (email, password, role, displayName) => {
        try {
          set({ loading: true, error: null });
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          
          // Update profile
          await userCredential.user.updateProfile({
            displayName
          });

          // Call backend to set custom claims
          await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${await userCredential.user.getIdToken()}`
            },
            body: JSON.stringify({
              uid: userCredential.user.uid,
              role,
              displayName
            })
          });

          set({
            user: {
              uid: userCredential.user.uid,
              email: userCredential.user.email,
              displayName,
              role,
              photoURL: null
            },
            isAuthenticated: true,
            loading: false,
            error: null
          });

          return userCredential.user;
        } catch (error) {
          set({
            loading: false,
            error: error.message
          });
          throw error;
        }
      },

      // Sign out
      signOut: async () => {
        try {
          await signOut(auth);
          set({
            user: null,
            isAuthenticated: false,
            loading: false,
            error: null
          });
        } catch (error) {
          set({
            loading: false,
            error: error.message
          });
          throw error;
        }
      },

      // Update profile
      updateProfile: async (updates) => {
        try {
          set({ loading: true, error: null });
          
          // Update Firebase profile
          if (updates.displayName || updates.photoURL) {
            await auth.currentUser.updateProfile(updates);
          }

          // Update local state
          set(state => ({
            user: {
              ...state.user,
              ...updates
            },
            loading: false,
            error: null
          }));
        } catch (error) {
          set({
            loading: false,
            error: error.message
          });
          throw error;
        }
      },

      // Clear error
      clearError: () => set({ error: null })
    }),
    {
      name: 'auth-storage',
      getStorage: () => localStorage
    }
  )
);

// Initialize auth state listener
useAuthStore.getState().init();