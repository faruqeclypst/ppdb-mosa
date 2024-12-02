import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  UserCredential 
} from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { ref, set, get, serverTimestamp } from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import { showAlert } from '../components/ui/Alert';

// Konstanta untuk timeout (30 menit dalam milidetik)
const INACTIVE_TIMEOUT = 1 * 60 * 1000;

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<UserCredential>;
  signUp: (email: string, password: string) => Promise<UserCredential>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Update interface UserSession
interface UserSession {
  timestamp: number | object; // untuk serverTimestamp()
  browser: string;
  os: string;
  loginTime: string;
  deviceKey: string; // pengganti deviceId yang aman
  status: 'active' | 'inactive';
}

// Tambahkan fungsi checkFirebaseSession
const checkFirebaseSession = async (uid: string) => {
  try {
    const deviceKey = generateDeviceId();
    const sessionRef = ref(db, `userSessions/${uid}/${deviceKey}`);
    const snapshot = await get(sessionRef);
    
    if (snapshot.exists()) {
      const session = snapshot.val() as UserSession;
      const timestamp = session.timestamp as number;
      
      // Cek apakah sesi masih aktif (kurang dari timeout)
      const inactiveTime = Date.now() - timestamp;
      return inactiveTime <= INACTIVE_TIMEOUT;
    }
    
    // Jika tidak ada sesi, anggap tidak valid
    return false;
  } catch (error) {
    console.error('Error checking firebase session:', error);
    return false;
  }
};

// Pindahkan generateDeviceId ke scope global (di atas AuthProvider)
const generateDeviceId = () => {
  const existingId = localStorage.getItem('deviceKey');
  if (existingId) return existingId;
  
  // Generate simple alphanumeric ID
  const newId = 'device_' + Math.random().toString(36).substr(2, 9);
  localStorage.setItem('deviceKey', newId);
  return newId;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  let inactivityTimer: ReturnType<typeof setTimeout>;
  let checkSessionTimer: ReturnType<typeof setInterval>;

  // Update fungsi updateSessionTimestamp
  const updateSessionTimestamp = async (uid: string) => {
    try {
      const deviceKey = generateDeviceId();
      const sessionData: UserSession = {
        timestamp: serverTimestamp(),
        browser: navigator.userAgent.split('/')[0],
        os: navigator.platform,
        loginTime: new Date().toISOString(),
        deviceKey,
        status: 'active'
      };

      await set(ref(db, `userSessions/${uid}/${deviceKey}`), sessionData);
    } catch (error) {
      console.error('Error updating session:', error);
    }
  };

  // Update fungsi checkOtherActiveSessions
  const checkOtherActiveSessions = async (uid: string) => {
    try {
      const sessionsRef = ref(db, `userSessions/${uid}`);
      const snapshot = await get(sessionsRef);
      
      if (snapshot.exists()) {
        const sessions = snapshot.val();
        const currentDevice = generateDeviceId();
        const otherSessions = Object.entries(sessions)
          .filter(([key]) => key !== currentDevice)
          .map(([key, session]) => ({
            key,
            ...(session as UserSession)
          }));

        if (otherSessions.length > 0) {
          const recentSessions = otherSessions.filter(session => {
            const timestamp = session.timestamp as number;
            const inactiveTime = Date.now() - timestamp;
            return inactiveTime <= INACTIVE_TIMEOUT;
          });

          if (recentSessions.length > 0) {
            const message = `
              <div class="space-y-2">
                <p class="font-medium">Akun aktif di ${recentSessions.length} perangkat lain:</p>
                <ul class="list-disc pl-4 space-y-1">
                  ${recentSessions.map(s => `
                    <li>
                      <div class="text-sm">
                        <span class="font-medium">${s.os}</span>
                        <br/>
                        <span class="text-gray-600">Login: ${new Date(s.loginTime).toLocaleString()}</span>
                      </div>
                    </li>
                  `).join('')}
                </ul>
              </div>
            `;
            showAlert('info', message, 10000);
          }
        }
      }
    } catch (error) {
      console.error('Error checking sessions:', error);
    }
  };

  // Update fungsi signIn
  const signIn = async (email: string, password: string) => {
    try {
      // Clear any existing sessions first
      localStorage.removeItem('deviceKey');
      
      const result = await signInWithEmailAndPassword(auth, email, password);
      const deviceKey = generateDeviceId();
      
      const sessionData: UserSession = {
        timestamp: serverTimestamp(),
        browser: navigator.userAgent.split('/')[0],
        os: navigator.platform,
        loginTime: new Date().toISOString(),
        deviceKey,
        status: 'active'
      };

      // Tunggu sampai session tersimpan
      await set(ref(db, `userSessions/${result.user.uid}/${deviceKey}`), sessionData);
      
      // Tambah delay sebelum cek sesi lain
      await new Promise(resolve => setTimeout(resolve, 1000));
      await checkOtherActiveSessions(result.user.uid);
      
      return result;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  // Update fungsi signOut
  const signOut = async () => {
    try {
      if (user) {
        const deviceKey = generateDeviceId();
        // Hapus sesi terlebih dahulu
        await set(ref(db, `userSessions/${user.uid}/${deviceKey}`), null);
        // Clear localStorage
        localStorage.removeItem('deviceKey');
        // Clear timers
        if (inactivityTimer) clearTimeout(inactivityTimer);
        if (checkSessionTimer) clearInterval(checkSessionTimer);
        // Logout dari Firebase
        await firebaseSignOut(auth);
        // Redirect ke login setelah logout berhasil
        navigate('/login');
      }
    } catch (error) {
      console.error('Error during signout:', error);
    }
  };

  // Reset timer dan update Firebase
  const resetInactivityTimer = async () => {
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
    }
    
    if (user) {
      await updateSessionTimestamp(user.uid);
      
      inactivityTimer = setTimeout(async () => {
        await signOut();
        showAlert('info', 'Anda telah logout otomatis karena tidak aktif selama 30 menit');
        navigate('/login');
      }, INACTIVE_TIMEOUT);
    }
  };

  // Update fungsi checkSession
  const checkSession = async () => {
    if (user) {
      const isSessionValid = await checkFirebaseSession(user.uid);
      if (!isSessionValid) {
        await signOut();
        showAlert('info', 'Sesi Anda telah berakhir. Silakan login kembali');
        // Pastikan redirect ke login
        navigate('/login', { replace: true });
      }
    }
  };

  // Setup event listeners
  useEffect(() => {
    const events = ['mousedown', 'keydown', 'mousemove', 'touchstart', 'scroll'];
    
    const handleActivity = () => {
      resetInactivityTimer();
    };

    events.forEach(event => {
      document.addEventListener(event, handleActivity);
    });

    if (user) {
      checkSessionTimer = setInterval(checkSession, 60 * 1000);
    }

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      if (inactivityTimer) clearTimeout(inactivityTimer);
      if (checkSessionTimer) clearInterval(checkSessionTimer);
    };
  }, [user]);

  // Update auth state listener
  useEffect(() => {
    let mounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user && mounted) {
          const deviceKey = generateDeviceId();
          const sessionRef = ref(db, `userSessions/${user.uid}/${deviceKey}`);
          const snapshot = await get(sessionRef);
          
          if (snapshot.exists()) {
            const isSessionValid = await checkFirebaseSession(user.uid);
            if (!isSessionValid) {
              await signOut();
              showAlert('info', 'Sesi Anda telah berakhir. Silakan login kembali');
              // Pastikan redirect ke login
              navigate('/login', { replace: true });
              return;
            }
          }
          
          await updateSessionTimestamp(user.uid);
          await checkOtherActiveSessions(user.uid);
          resetInactivityTimer();
        }
        
        if (mounted) {
          setUser(user);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
        if (mounted) {
          setUser(null);
          setLoading(false);
          // Redirect ke login jika terjadi error
          navigate('/login', { replace: true });
        }
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
      if (inactivityTimer) clearTimeout(inactivityTimer);
      if (checkSessionTimer) clearInterval(checkSessionTimer);
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateSessionTimestamp(result.user.uid);
    resetInactivityTimer();
    return result;
  };

  const value = {
    user,
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
