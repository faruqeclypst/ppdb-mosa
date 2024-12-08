import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { db } from '../firebase/config';
import { ref, get } from 'firebase/database';

type UserRole = {
  role: 'admin' | 'ppdb';
  school?: 'mosa' | 'fajar' | 'all';
  isMaster?: boolean;
}

type AuthContextType = {
  user: User | null;
  userRole: UserRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        // Check admin role
        const adminRef = ref(db, `admins/${user.uid}`);
        const adminSnapshot = await get(adminRef);
        
        if (adminSnapshot.exists()) {
          const adminData = adminSnapshot.val();
          setUserRole({
            role: 'admin',
            school: adminData.school,
            isMaster: adminData.isMaster
          });
        } else {
          // Check PPDB role for both schools
          const mosaRef = ref(db, `ppdb_mosa/${user.uid}`);
          const fajarRef = ref(db, `ppdb_fajar/${user.uid}`);
          
          const mosaSnapshot = await get(mosaRef);
          const fajarSnapshot = await get(fajarRef);
          
          if (mosaSnapshot.exists()) {
            setUserRole({ role: 'ppdb', school: 'mosa' });
          } else if (fajarSnapshot.exists()) {
            setUserRole({ role: 'ppdb', school: 'fajar' });
          }
        }
      } else {
        setUserRole(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const value = {
    user,
    userRole,
    loading,
    signIn,
    signUp,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 