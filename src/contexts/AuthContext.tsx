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

// Tambahkan interface untuk session
interface UserSession {
  lastActive: number;
  deviceInfo: {
    userAgent: string;
    platform: string;
    loginTime: string;
    deviceId: string; // Unique ID untuk setiap device/browser
  };
  status: 'active';
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  let inactivityTimer: ReturnType<typeof setTimeout>;
  let checkSessionTimer: ReturnType<typeof setInterval>;

  // Fungsi untuk generate device ID unik
  const generateDeviceId = () => {
    const existingId = localStorage.getItem('deviceId');
    if (existingId) return existingId;
    
    const newId = Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem('deviceId', newId);
    return newId;
  };

  // Fungsi untuk cek device lain yang aktif
  const checkOtherActiveSessions = async (uid: string) => {
    try {
      const sessionsRef = ref(db, `userSessions/${uid}`);
      const snapshot = await get(sessionsRef);
      
      if (snapshot.exists()) {
        const sessions = snapshot.val();
        const currentDeviceId = generateDeviceId();
        const otherSessions = Object.entries(sessions)
          .filter(([deviceId]) => deviceId !== currentDeviceId)
          .map(([deviceId, session]) => {
            const typedSession = session as UserSession;
            return {
              deviceId,
              deviceInfo: typedSession.deviceInfo,
              lastActive: typedSession.lastActive
            };
          });

        if (otherSessions.length > 0) {
          const recentSessions = otherSessions.filter(session => {
            const inactiveTime = Date.now() - session.lastActive;
            return inactiveTime <= INACTIVE_TIMEOUT;
          });

          if (recentSessions.length > 0) {
            // Format pesan dengan lebih baik
            const message = `
              <div class="space-y-2">
                <p class="font-medium">Akun Anda sedang aktif di ${recentSessions.length} perangkat lain:</p>
                <ul class="list-disc pl-4 space-y-1">
                  ${recentSessions.map(s => `
                    <li>
                      <div class="text-sm">
                        <span class="font-medium">${s.deviceInfo.platform}</span>
                        <br/>
                        <span class="text-gray-600">Login: ${new Date(s.deviceInfo.loginTime).toLocaleString()}</span>
                      </div>
                    </li>
                  `).join('')}
                </ul>
                <p class="text-sm text-gray-600 mt-2">
                  Anda tetap bisa menggunakan akun di semua perangkat.
                </p>
              </div>
            `;

            // Tampilkan alert dengan durasi lebih lama (10 detik)
            showAlert('info', message, 10000);
            
            // Tambahkan log untuk debugging
            console.log('Active sessions:', recentSessions);
          }
        }
      }
    } catch (error) {
      console.error('Error checking other sessions:', error);
    }
  };

  // Fungsi untuk update session timestamp di Firebase
  const updateSessionTimestamp = async (uid: string) => {
    try {
      const deviceId = generateDeviceId();
      const updates = {
        [`${deviceId}/lastActive`]: serverTimestamp(),
        [`${deviceId}/deviceInfo`]: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          lastUpdate: new Date().toISOString(),
          deviceId
        },
        [`${deviceId}/status`]: 'active'
      };

      await set(ref(db, `userSessions/${uid}`), updates);
    } catch (error) {
      console.error('Error updating session timestamp:', error);
    }
  };

  // Fungsi untuk cek session dari Firebase
  const checkFirebaseSession = async (uid: string) => {
    try {
      const sessionRef = ref(db, `userSessions/${uid}`);
      const snapshot = await get(sessionRef);
      
      if (snapshot.exists()) {
        const session = snapshot.val();
        const lastActive = session.lastActive;
        
        if (lastActive) {
          // Gunakan timestamp dari server untuk perbandingan
          const serverTimeRef = ref(db, '/.info/serverTimeOffset');
          const offsetData = await get(serverTimeRef);
          const offset = offsetData.val() || 0;
          
          // Hitung waktu server saat ini
          const serverTime = Date.now() + offset;
          const inactiveTime = serverTime - lastActive;
          
          console.log('Last active:', new Date(lastActive).toLocaleString());
          console.log('Server time:', new Date(serverTime).toLocaleString());
          console.log('Inactive time:', Math.floor(inactiveTime / 1000 / 60), 'minutes');
          
          return inactiveTime <= INACTIVE_TIMEOUT;
        }
      }
      return true; // Kembalikan true untuk sesi baru
    } catch (error) {
      console.error('Error checking session:', error);
      return true; // Kembalikan true jika terjadi error
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

  // Fungsi untuk mengecek sesi
  const checkSession = async () => {
    if (user) {
      const isSessionValid = await checkFirebaseSession(user.uid);
      if (!isSessionValid) {
        await signOut();
        showAlert('info', 'Sesi Anda telah berakhir. Silakan login kembali');
        navigate('/login');
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

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const deviceId = generateDeviceId();
        const sessionRef = ref(db, `userSessions/${user.uid}/${deviceId}`);
        const snapshot = await get(sessionRef);
        
        if (snapshot.exists()) {
          const isSessionValid = await checkFirebaseSession(user.uid);
          if (!isSessionValid) {
            await signOut();
            showAlert('info', 'Sesi Anda telah berakhir. Silakan login kembali');
            navigate('/login');
            return;
          }
        }
        
        await updateSessionTimestamp(user.uid);
        await checkOtherActiveSessions(user.uid);
        resetInactivityTimer();
      }
      
      setUser(user);
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (inactivityTimer) clearTimeout(inactivityTimer);
      if (checkSessionTimer) clearInterval(checkSessionTimer);
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const deviceId = generateDeviceId();
      
      // Buat sesi baru untuk device ini
      await set(ref(db, `userSessions/${result.user.uid}/${deviceId}`), {
        lastActive: serverTimestamp(),
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          loginTime: new Date().toISOString(),
          deviceId
        },
        status: 'active'
      });

      // Tambahkan delay kecil sebelum cek sesi lain
      setTimeout(async () => {
        await checkOtherActiveSessions(result.user.uid);
      }, 1000);
      
      return result;
    } catch (error) {
      console.error('Error during sign in:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateSessionTimestamp(result.user.uid);
    resetInactivityTimer();
    return result;
  };

  const signOut = async () => {
    if (user) {
      const deviceId = generateDeviceId();
      // Hapus hanya sesi device ini
      await set(ref(db, `userSessions/${user.uid}/${deviceId}`), null);
    }
    await firebaseSignOut(auth);
    if (inactivityTimer) clearTimeout(inactivityTimer);
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