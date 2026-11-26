// Pure: positions -> score, items -> competitors, data -> fixes.

// Documented weights: a cell where the business is in the top 3 counts fully,
// 4-10 counts half, 11-20 a little, absent nothing. Score = 100 * sum / cells.
export const WEIGHTS = { top3: 1, top10: 0.5, top20: 0.15, absent: 0 };
export const ABSENT_RANK = 21; // for averaging: not in the first 20 counts as 21

const keyOf = (it) => it.cid || it.place_id || it.title;
const isMapItem = (it) => !it.type || it.type === 'maps_search';

function matches(it, target) {
  if (target.cid && it.cid === target.cid) return true;
  return false;
}

/** Position 1-20 of the target in one SERP item list, or null. cid, then place_id, then exact title. */
export function positionOf(items, target) {
  const list = (items || []).filter(isMapItem);
  const pick = (pred) => {
    const hit = list.find(pred);
    if (!hit) return null;
    const p = hit.rank_absolute ?? hit.rank_group ?? list.indexOf(hit) + 1;
    return p >= 1 && p <= 20 ? p : null;
  };
  if (target.cid && list.some((i) => i.cid === target.cid)) return pick((i) => i.cid === target.cid);
  if (target.place_id && list.some((i) => i.place_id === target.place_id)) return pick((i) => i.place_id === target.place_id);
  if (target.title && list.some((i) => i.title === target.title)) return pick((i) => i.title === target.title);
  return null;
}

export function scoreFromPositions(positions) {
  if (positions.length !== 25) throw new Error('expected 25 positions');
  let sum = 0;
  for (const p of positions) {
    if (p == null) sum += WEIGHTS.absent;
    else if (p <= 3) sum += WEIGHTS.top3;
    else if (p <= 10) sum += WEIGHTS.top10;
    else sum += WEIGHTS.top20;
  }
  return Math.round((100 * sum) / positions.length);
}

export function scoreBand(score) {
  if (score < 35) return 'low';
  if (score < 70) return 'mid';
  return 'high';
}

export function bandOfPosition(p) {
  if (p == null) return 'absent';
  if (p <= 3) return 'top3';
  if (p <= 10) return 'top10';
  return 'top20';
}

/** profile fields from a SERP item; anything not present is null (shown as a dash). */
// A Facebook/Instagram/WhatsApp link in the website field is not a website.
const SOCIAL = /(^|\.)(facebook\.com|fb\.com|fb\.me|instagram\.com|tiktok\.com|linktr\.ee|wa\.me|whatsapp\.com|linkedin\.com|twitter\.com|x\.com|youtube\.com)$/i;
export function isRealWebsite(url) {
  if (!url) return false;
  try { return !SOCIAL.test(new URL(/^https?:/i.test(url) ? url : 'http://' + url).hostname); } catch { return false; }
}

export function profileOf(item) {
  const has = (v) => v !== undefined && v !== null;
  let hours = null;
  if (has(item.work_hours)) {
    const t = item.work_hours.timetable;
    hours = !!t && Object.values(t).some((d) => Array.isArray(d) && d.length > 0);
  }
  return {
    name: item.title ?? null,
    rating: item.rating && has(item.rating.value) ? item.rating.value : null,
    reviews: item.rating && has(item.rating.votes_count) ? item.rating.votes_count : null,
    photos: has(item.total_photos) ? item.total_photos : null,
    website: 'url' in item ? isRealWebsite(item.url) : null,
    hours,
    claimed: has(item.is_claimed) ? !!item.is_claimed : null,
  };
}

/**
 * Best-ranking businesses across the grid, self excluded. Absent cells count as rank 21, so a
 * business that tops a few cells loses to one that is steadily near the top everywhere.
 * cells: [{items}], returns [{key, item, avgPosition (over cells present), cellsPresent, score}]
 */
export function rankCompetitors(cells, self, limit = 3) {
  const acc = new Map();
  for (const cell of cells) {
    for (const it of (cell.items || []).filter(isMapItem)) {
      const pos = it.rank_absolute ?? it.rank_group;
      if (pos == null || pos > 20) continue;
      if (matches(it, self) || (self.place_id && it.place_id === self.place_id)) continue;
      if (self.title && !self.cid && !self.place_id && it.title === self.title) continue;
      const key = keyOf(it);
      let e = acc.get(key);
      if (!e) acc.set(key, (e = { key, item: it, sum: 0, cellsPresent: 0 }));
      e.sum += pos;
      e.cellsPresent += 1;
      e.item = it;
    }
  }
  const total = cells.length || 1;
  return [...acc.values()]
    .map((e) => ({
      key: e.key,
      item: e.item,
      cellsPresent: e.cellsPresent,
      avgPosition: e.sum / e.cellsPresent,
      rankScore: (e.sum + (total - e.cellsPresent) * ABSENT_RANK) / total,
    }))
    .sort((a, b) => a.rankScore - b.rankScore || b.cellsPresent - a.cellsPresent)
    .slice(0, limit);
}

export const PRICES = { web: 99, rebuild: 99, gmn: 79 };
const MIN_PHOTOS = 10;
const LOW_RATING = 4.2;

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  if (!s.length) return null;
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/** Up to 3 fixes by rule, ordered by impact, never the same paid offer twice. */
export function chooseFixes(self, competitors) {
  const compReviews = competitors.map((c) => c.reviews).filter((v) => v != null);
  const med = median(compReviews);
  const medPhotos = median(competitors.map((c) => c.photos).filter((v) => v != null));
  const candidates = [];
  if (self.websiteBroken === true) candidates.push({ key: 'broken_website', offer: 'rebuild' });
  else if (self.website === false) candidates.push({ key: 'no_website', offer: 'web' });
  if (self.claimed === false) candidates.push({ key: 'unclaimed_profile', offer: 'gmn' });
  if (self.hours === false || (self.photos != null && (self.photos < MIN_PHOTOS || (medPhotos != null && self.photos < medPhotos / 2)))) {
    candidates.push({ key: 'incomplete_profile', offer: 'gmn' });
  }
  if (self.reviews != null && med != null && self.reviews < med) {
    candidates.push({ key: 'few_reviews', offer: null, n: med });
  }
  if (self.rating != null && self.rating < LOW_RATING) candidates.push({ key: 'low_rating', offer: null });

  const out = [];
  const usedOffers = new Set();
  for (const c of candidates) {
    if (c.offer && usedOffers.has(c.offer)) continue;
    if (c.offer) usedOffers.add(c.offer);
    out.push({ key: c.key, offer: c.offer, price: c.offer ? PRICES[c.offer] : null, n: c.n ?? null });
    if (out.length === 3) break;
  }
  return out;
}
