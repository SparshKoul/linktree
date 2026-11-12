import { lazy, Suspense, useEffect, useState } from 'react';
import { storage } from './services/storage.js';
import { getPath, navigate, subscribe } from './router.js';
import { LandingPage } from './components/LandingPage.jsx';
import { ContactPage } from './components/ContactPage.jsx';
import { AuthModal } from './components/AuthModal.jsx';
import { PublicTreePage } from './components/PublicTreePage.jsx';

// The dashboard is a big piece of the site. It is only fetched when it is
// actually opened, so a visitor of a public page never downloads it.
const Dashboard = lazy(() => import('./Dashboard.jsx'));

const isLandingPath = (path) => path === '/' || path === '' || path === '/home';
const isDashboardPath = (path) =>
  path.startsWith('/dashboard') || path.startsWith('/admin') || path.startsWith('/app');
const isContactPath = (path) =>
  path === '/contact' ||
  path.startsWith('/contact') ||
  path === '/pricing' ||
  path === '/features' ||
  path === '/solutions';

export function App() {
  const [path, setPath] = useState(getPath);
  const [user, setUser] = useState(() => storage.getUser());
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  useEffect(() => subscribe(setPath), []);

  const openAuth = (mode = 'login') => {
    setAuthMode(mode || 'login');
    setIsAuthOpen(true);
  };

  const handleAuthSuccess = (signedInUser) => {
    storage.setUser(signedInUser);
    setUser(signedInUser);
    setIsAuthOpen(false);
    navigate('/dashboard');
  };

  const handleLogout = () => {
    storage.setUser(null);
    setUser(null);
    setIsAuthOpen(false);
  };

  const showLanding = isLandingPath(path);
  const showContact = isContactPath(path);
  const showDashboard = isDashboardPath(path);

  // Everything that is not one of the known pages is a public tree.
  const slug = showLanding || showContact || showDashboard ? null : decodeURIComponent(
    path.replace(/^\/(t\/)?/, '').replace(/^@/, '').split('/')[0]
  );

  if (showDashboard) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-[#FAFBFB]" />}>
        <Dashboard />
      </Suspense>
    );
  }

  if (showContact) {
    return (
      <>
        <ContactPage
          onNavigate={navigate}
          currentUser={user}
          onOpenAuth={openAuth}
        />
        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          currentUser={user}
          onAuthSuccess={handleAuthSuccess}
          onLogout={handleLogout}
          initialMode={authMode}
          treesCount={0}
        />
      </>
    );
  }

  if (slug) {
    return <PublicTreePage slug={slug} />;
  }

  return (
    <>
      <LandingPage
        onNavigate={navigate}
        currentUser={user}
        onLogout={handleLogout}
        onOpenAuth={openAuth}
      />
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={user}
        onAuthSuccess={handleAuthSuccess}
        onLogout={handleLogout}
        initialMode={authMode}
        treesCount={0}
      />
    </>
  );
}
