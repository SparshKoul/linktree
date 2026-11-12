/**
 * The words that go under the title of a card.
 *
 * Rule of the house: a line is only there when the owner wrote it. Nothing
 * is made up for them, so a card never shows a rating, a number of reviews
 * or a count that nobody put in.
 */

/**
 * The line under the title of a reviews card.
 * @param {string|number|null} rating the rating the owner wrote
 * @param {string|number|null} count the number of reviews the owner wrote
 * @returns {string} an empty string when the owner wrote nothing
 */
export function reviewsLine(rating, count) {
  const star = String(rating ?? '').trim();
  const number = String(count ?? '').trim();
  if (!star && !number) return '';
  if (star && number) {
    return `${star} ★ (${number} ${number === '1' ? 'review' : 'reviews'})`;
  }
  return star ? `${star} ★` : `${number} ${number === '1' ? 'review' : 'reviews'}`;
}

/**
 * The line under the title of a gallery card.
 * @param {number} count how many pictures the owner put in
 * @param {string} [size] the size of the pictures
 * @returns {string} an empty string when there are no pictures
 */
export function galleryLine(count, size = '') {
  const number = Number(count) || 0;
  if (number <= 0) return '';
  const sizeTag = size ? ` · ${size}` : '';
  return `Gallery · ${number} ${number === 1 ? 'item' : 'items'}${sizeTag}`;
}

/**
 * The types that show something of their own and need no link.
 * @param {string} type
 * @returns {boolean}
 */
export function cardNeedsALink(type) {
  const withoutLink = [
    'header',
    'social',
    'email_signup',
    'contact_form',
    'collapsible',
    'text',
    'custom_html',
  ];
  return !withoutLink.includes(type);
}
