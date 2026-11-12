export function toPublicCard(c) {
  const lockType = c.lock_type ?? c.lockType ?? 'none';
  const card = {
    ...c,
    treeId: c.tree_id ?? c.treeId,
    tree_id: c.tree_id ?? c.treeId,
    thumbnailUrl: c.thumbnail_url ?? c.thumbnailUrl,
    thumbnail_url: c.thumbnail_url ?? c.thumbnailUrl,
    lockType,
    lock_type: lockType,
  };
  delete card.lockValue;
  delete card.lock_value;
  return card;
}

export function sanitizeTreeForPublic(tree) {
  if (!tree) return tree;
  const clone = { ...tree };
  delete clone.custom_theme; // Prevent duplicate payload serialization
  // The cards are sent separately, without their passcodes. The copy inside
  // the tree object would leak them.
  delete clone.cards;
  // The state of the owner is for the server, not for the visitors.
  delete clone.ownerState;

  // Guarantee both camelCase and snake_case for all header & media fields
  const avatarUrl = clone.avatarUrl || clone.avatar_url || clone.customTheme?.avatarUrl || null;
  const logoUrl = clone.logoUrl || clone.logo_url || clone.customTheme?.logoUrl || null;
  const bannerUrl = clone.bannerUrl || clone.banner_url || clone.customTheme?.bannerUrl || null;
  const heroUrl = clone.heroUrl || clone.hero_url || clone.customTheme?.heroUrl || null;
  const titleStyle = clone.titleStyle || clone.title_style || clone.customTheme?.titleStyle || 'text';
  const titleFont = clone.titleFont || clone.title_font || clone.customTheme?.titleFont || 'Inter';
  const titleColor = clone.titleColor || clone.title_color || clone.customTheme?.titleColor || '#111111';
  const headerLayout = clone.headerLayout || clone.header_layout || clone.customTheme?.headerLayout || 'classic';

  clone.avatarUrl = avatarUrl;
  clone.avatar_url = avatarUrl;
  clone.logoUrl = logoUrl;
  clone.logo_url = logoUrl;
  clone.bannerUrl = bannerUrl;
  clone.banner_url = bannerUrl;
  clone.heroUrl = heroUrl;
  clone.hero_url = heroUrl;
  clone.titleStyle = titleStyle;
  clone.title_style = titleStyle;
  clone.titleFont = titleFont;
  clone.title_font = titleFont;
  clone.titleColor = titleColor;
  clone.title_color = titleColor;
  clone.headerLayout = headerLayout;
  clone.header_layout = headerLayout;

  if (clone.customTheme) {
    const theme = {
      ...clone.customTheme,
      avatarUrl,
      logoUrl,
      bannerUrl,
      heroUrl,
      titleStyle,
      titleFont,
      titleColor,
      headerLayout,
    };
    if (theme.backgroundImageUrl) {
      theme.backgroundValue = `url("${theme.backgroundImageUrl}") center / cover no-repeat`;
    } else if (typeof theme.backgroundValue === 'string' && theme.backgroundValue.startsWith('url("data:')) {
      theme.backgroundValue = theme.backgroundColor || '#050F15';
    }
    if (typeof theme.wallpaperVideoUrl === 'string' && theme.wallpaperVideoUrl.startsWith('data:')) {
      theme.wallpaperVideoUrl = null;
    }
    clone.customTheme = theme;
  }
  return clone;
}