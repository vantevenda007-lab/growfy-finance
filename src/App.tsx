import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Header } from '@/components/shell/Header';
import { SidebarNav, type TabKey } from '@/components/shell/SidebarNav';
import { MobileNav } from '@/components/shell/MobileNav';
import { Starfield } from '@/components/shell/Starfield';
import { MeshBackground } from '@/components/shell/MeshBackground';
import { SpotlightCursor } from '@/components/shell/SpotlightCursor';
import { LoadingScreen } from '@/components/shell/LoadingScreen';
import { Toaster, toast } from '@/components/shell/Toaster';
import { CommandPalette } from '@/components/shell/CommandPalette';
import { SmoothScroll } from '@/components/shell/SmoothScroll';
import { LoginScreen } from '@/components/auth/LoginScreen';
import { Dashboard } from '@/pages/Dashboard';
import { CRM } from '@/pages/CRM';
import { Calendar } from '@/pages/Calendar';
import { Receivables } from '@/pages/Receivables';
import { Payables } from '@/pages/Payables';
import { CashFlow } from '@/pages/CashFlow';
import { useStore } from '@/stores/useStore';

const PAGE_TRANSITION = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

const AUTH_STORAGE_KEY = 'growfy.auth.v1';

interface AuthSession {
  email: string;
  signedInAt: string;
}

function readAuth(): AuthSession | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

function App() {
  const hydrate = useStore((s) => s.hydrate);
  const hydrated = useStore((s) => s.hydrated);
  const [active, setActive] = useState<TabKey>('dashboard');
  const [showLoading, setShowLoading] = useState(true);
  const [auth, setAuth] = useState<AuthSession | null>(() => readAuth());

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (hydrated) {
      const t = setTimeout(() => setShowLoading(false), 1100);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [hydrated]);

  function handleAuthenticated(email: string): void {
    const session: AuthSession = { email, signedInAt: new Date().toISOString() };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    setAuth(session);
    toast('Bem-vindo', { description: `Sessão iniciada como ${email}.`, tone: 'success' });
  }

  function handleSignOut(): void {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setAuth(null);
  }

  return (
    <>
      <AnimatePresence>{showLoading && <LoadingScreen key="loading" />}</AnimatePresence>

      {hydrated && !showLoading && !auth && (
        <LoginScreen onAuthenticated={handleAuthenticated} />
      )}

      {hydrated && !showLoading && auth && (
        <div className="relative min-h-screen">
          <MeshBackground />
          <Starfield />
          <SpotlightCursor />

          <div className="relative z-10">
            <Header active={active} userEmail={auth.email} onSignOut={handleSignOut} />
            <MobileNav active={active} onChange={setActive} />
            <div className="flex">
              <SidebarNav active={active} onChange={setActive} />
              <main className="flex-1 px-4 sm:px-5 lg:px-6 py-5 min-w-0">
                <motion.div
                  key={active}
                  initial={PAGE_TRANSITION.initial}
                  animate={PAGE_TRANSITION.animate}
                  transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                >
                  {active === 'dashboard' && <Dashboard />}
                  {active === 'crm' && <CRM />}
                  {active === 'calendar' && <Calendar />}
                  {active === 'receivables' && <Receivables />}
                  {active === 'payables' && <Payables />}
                  {active === 'cashflow' && <CashFlow />}
                </motion.div>
              </main>
            </div>
          </div>

          <CommandPalette active={active} onNavigate={setActive} />
          <Toaster />
          <SmoothScroll />
        </div>
      )}
    </>
  );
}

export default App;
