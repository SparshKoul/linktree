import { lazy, Suspense, useEffect, useState } from 'react';
import { storage } from './services/storage.js';
import { getPath, navigate, subscribe } from './router.js';
import { AuthModal } from './components/AuthModal.jsx';
import { PublicTreePage } from './components/PublicTreePage.jsx';

// The dashboard is a big piece of the site. It is only fetched when it is
// actually opened, so a visitor of a public page never downloads it.
const Dashboard = lazy(() => import('./Dashboard.jsx'));
// The page of the site and the contact page are only needed when they are
// opened. A visitor of a public page does not pay for them.
// The files use a named export, so it is given as the default one.
const LandingPage = lazy(() =>
  import('./components/LandingPage.jsx').then((m) => ({ default: m.LandingPage }))
);
const ContactPage = lazy(() =>
  import('./components/ContactPage.jsx').then((m) => ({ default: m.ContactPage }))
);

// While a piece of the site is on its way, the page shows nothing yet.
function PageFallback() {
  return <div className="min-h-screen bg-[#FAFBFB]" />;
}

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
        <Suspense fallback={<PageFallback />}>
          <ContactPage
            onNavigate={navigate}
            currentUser={user}
            onOpenAuth={openAuth}
          />
        </Suspense>
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
      <Suspense fallback={<PageFallback />}>
        <LandingPage
          onNavigate={navigate}
          currentUser={user}
          onLogout={handleLogout}
          onOpenAuth={openAuth}
        />
      </Suspense>
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
