/**
 * The in-memory fallback store.
 *
 * It is only used when the database cannot be reached. It holds no password
 * of its own: the super admin password comes from the environment.
 */
import { hashPasswordSync } from '../utils/password.js';

export const RESERVED_SLUGS = ['admin', 'api', 'login', 'dashboard', 'settings', 'static', 'auth'];

// Store (PostgreSQL / In-memory adapter)
export const store = {
  admin: {
    id: 1,
    email: 'sparshkoul6@gmail.com',
    username: 'riyast',
    role: 'super_admin',
    accountType: 'super_admin',
    isSuperAdmin: true,
  },
  users: [
    // The super admin of the offline store. The password comes from the
    // environment: there is no password in the code and none in this file.
    ...(process.env.ADMIN_INITIAL_PASSWORD
      ? [
          {
            id: 1,
            email: 'sparshkoul6@gmail.com',
            username: 'riyast',
            password: hashPasswordSync(process.env.ADMIN_INITIAL_PASSWORD),
            role: 'super_admin',
            accountType: 'super_admin',
            isSuperAdmin: true,
          },
        ]
      : []),
  ],
  trees: [
    {
      id: 1,
      adminId: 1,
      name: 'Riyast Boutique',
      slug: 'riyast',
      status: 'live',
      title: 'riyast',
      bio: '',
      avatarUrl: null,
      themeId: 'classic-light',
      customTheme: {
        name: 'Classic Clean',
        backgroundType: 'solid',
        backgroundValue: '#F3F3F1',
        buttonStyle: 'fill',
        buttonColor: '#FFFFFF',
        buttonTextColor: '#111111',
        buttonRadius: 9999,
        fontFamily: 'Inter',
        textColor: '#111111',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 2,
      adminId: 1,
      name: 'Helolo',
      slug: 'helolo',
      status: 'live',
      title: 'helolo',
      bio: '',
      avatarUrl: null,
      themeId: 'classic-light',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 3,
      adminId: 1,
      name: 'Riyast Studio',
      slug: 'riyastttttt',
      status: 'live',
      title: 'riyastttttt',
      bio: '',
      avatarUrl: null,
      themeId: 'classic-light',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 4,
      adminId: 2,
      name: 'Alex Designs',
      slug: 'alex',
      status: 'live',
      title: 'alex',
      bio: 'Digital Creator',
      avatarUrl: null,
      themeId: 'classic-light',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  cards: [],
  events: [],
};

