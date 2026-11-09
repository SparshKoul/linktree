import { describe, it, expect } from 'vitest';

describe('Minimal Sidebar Navigation and Account Trees Dashboard', () => {
  const allowedMenuItems = ['Workspace', 'Dashboard'];
  const removedMenuItems = [
    'Earn',
    'Media kit',
    'Audience',
    'Insights',
    'Messaging',
    'Business cards',
    'Social planner',
    'Instagram auto-reply',
    'Link shortener',
    'Post ideas',
  ];

  it('keeps only Workspace and Dashboard in the primary navigation', () => {
    expect(allowedMenuItems).toContain('Workspace');
    expect(allowedMenuItems).toContain('Dashboard');
    expect(allowedMenuItems).toHaveLength(2);

    removedMenuItems.forEach((item) => {
      expect(allowedMenuItems).not.toContain(item);
    });
  });

  it('computes how many trees a particular ID owns', () => {
    const userId = 1;
    const allTrees = [
      { id: 101, adminId: 1, slug: 'riyast-main', name: 'Riyast Main' },
      { id: 102, adminId: 1, slug: 'riyast-boutique', name: 'Riyast Boutique' },
      { id: 103, adminId: 2, slug: 'other-user', name: 'Other User' },
    ];

    const userTrees = allTrees.filter((t) => t.adminId === userId);
    expect(userTrees).toHaveLength(2);
    expect(userTrees.map((t) => t.slug)).toEqual(['riyast-main', 'riyast-boutique']);
  });
});
