// Differences between the deployed 2026-08-16 site and the current build that
// are deliberate, with the reason for each. verify-against-live.mjs consults
// this file to split "we changed this on purpose" from "the rebuild lost this".
//
// Nothing here is hidden: an accepted difference is still printed, still
// counted, and still listed per page. Accepting it only means it does not fail
// the check. Delete an entry and the difference reappears as UNRESOLVED.
//
// RULE FOR THIS FILE: an entry needs a reason a person can check. "It looked
// fine" is not one. If you cannot say why the new behaviour is correct, the
// difference is a regression and belongs in the fix list instead.

/** Official profile URLs, old (deployed) → why the new one replaced it. */
const SOCIAL_HOSTS =
  /(instagram\.com|t\.me\/|aparat\.com|x\.com|facebook\.com|linkedin\.com|pinterest\.com|wa\.me|youtube\.com)/;

/** Blank out every "sameAs":[…] list so the rest of the node can be compared. */
const stripSameAs = (node) =>
  node.replace(/"sameAs":\[[^\]]*\]/g, '"sameAs":[]');

export const ACCEPTED = [
  {
    id: "social-profile-urls",
    axes: ["links", "schema"],
    reason:
      "Social profile URLs were canonicalised after the 2026-08-16 deploy. " +
      "The live build carries an Instagram share link with a rotating ?igsh= " +
      "token and a Facebook /people/…/pfbid… URL that eventually 404s; both " +
      "are replaced by the form the platform itself canonicalises to. Telegram, " +
      "Aparat, X, LinkedIn and Pinterest were added. sameAs is an identity " +
      "claim, so a stable URL is the whole point.",
    // links: a bare profile URL on one side or the other.
    matches: (value) => SOCIAL_HOSTS.test(value),
    // schema: two versions of the SAME @id node are accepted only when
    // blanking every sameAs array makes them identical. Testing "does this
    // node mention instagram.com" would wave through a node that changed its
    // prices as well, which is exactly the kind of miss this file exists to
    // prevent.
    matchesNodePair: (live, build) =>
      stripSameAs(live) === stripSameAs(build),
  },
  {
    id: "related-link-anchor-text",
    axes: ["links"],
    reason:
      "The deployed site truncated related-article anchor text at about 45 " +
      "characters; the rebuild renders the full post title. The cards already " +
      "clamp visually with line-clamp-1, so nothing overflows, and full " +
      "descriptive anchor text carries more internal-link signal than a " +
      "sentence cut mid-word. Same href, longer label — no link was gained " +
      "or lost.",
    // Same URL on both sides, and the live label is a prefix of the build one.
    matchesPair: (href, live, build) =>
      build.startsWith(live) && live.length > 0 && live.length < build.length,
  },
];

/**
 * Classify one axis diff. Returns the ids of the rules that explain every
 * entry in it, or null when at least one entry is unexplained.
 */
export function classify(axis, diff) {
  const used = new Set();

  const explainOne = (value) => {
    for (const rule of ACCEPTED) {
      if (!rule.axes.includes(axis) || !rule.matches) continue;
      if (axis === "schema") continue; // schema goes through matchesNodePair
      if (rule.matches(value)) {
        used.add(rule.id);
        return true;
      }
    }
    return false;
  };

  if (!diff.onlyLive) return null; // scalar/text axes are never auto-accepted

  // Schema nodes are paired by @id and compared whole, so a node cannot be
  // waved through on the strength of one property while another changed.
  if (axis === "schema") {
    const idOf = (s) => (s.match(/"@id":"([^"]*)"/) ?? s.match(/"@type":"([^"]*)"/) ?? [, "?"])[1];
    const build = new Map(diff.onlyBuild.map((s) => [idOf(s), s]));
    const live = new Map(diff.onlyLive.map((s) => [idOf(s), s]));
    if (build.size !== live.size) return null; // a node was added or removed
    for (const [id, liveNode] of live) {
      const buildNode = build.get(id);
      if (buildNode === undefined) return null;
      const rule = ACCEPTED.find(
        (r) => r.axes.includes("schema") && r.matchesNodePair?.(liveNode, buildNode),
      );
      if (!rule) return null;
      used.add(rule.id);
    }
    return [...used];
  }

  const split = (s) => {
    const i = s.indexOf(" :: ");
    return i < 0 ? [s, ""] : [s.slice(0, i), s.slice(i + 4)];
  };
  const buildByHref = new Map(diff.onlyBuild.map(split));
  const liveByHref = new Map(diff.onlyLive.map(split));

  for (const entry of diff.onlyLive) {
    const [href, label] = split(entry);
    if (explainOne(entry)) continue;
    const counterpart = buildByHref.get(href);
    if (counterpart !== undefined) {
      const pairRule = ACCEPTED.find(
        (r) => r.axes.includes(axis) && r.matchesPair?.(href, label, counterpart),
      );
      if (pairRule) {
        used.add(pairRule.id);
        continue;
      }
    }
    return null;
  }
  for (const entry of diff.onlyBuild) {
    const [href, label] = split(entry);
    if (explainOne(entry)) continue;
    const counterpart = liveByHref.get(href);
    if (counterpart !== undefined) {
      const pairRule = ACCEPTED.find(
        (r) => r.axes.includes(axis) && r.matchesPair?.(href, counterpart, label),
      );
      if (pairRule) {
        used.add(pairRule.id);
        continue;
      }
    }
    return null;
  }

  return [...used];
}
