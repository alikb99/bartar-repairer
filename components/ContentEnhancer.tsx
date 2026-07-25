"use client";

import { useEffect } from "react";

// Progressively enhances the (exact) WordPress HTML after render:
//  1. FAQ — <a tabindex> triggers + following answers become real accordions.
//  2. Model lists — consecutive <img> + caption-link pairs become a card grid.
// Text content is never changed, only re-wrapped for better UX.
export default function ContentEnhancer({ targetId }: { targetId: string }) {
  useEffect(() => {
    const root = document.getElementById(targetId);
    if (!root) return;

    // ---------- 1) FAQ accordions ----------
    try {
      const triggers = Array.from(
        root.querySelectorAll("a:not([href])"),
      ).filter((a) => (a.textContent || "").trim().length > 3);

      triggers.forEach((trigger) => {
        if (!trigger.parentElement) return;
        const answer = document.createElement("div");
        answer.className = "faq-answer";

        let n: ChildNode | null = trigger.nextSibling;
        while (n) {
          const next: ChildNode | null = n.nextSibling;
          if (n.nodeType === 1) {
            const el = n as HTMLElement;
            if (
              el.matches("a:not([href])") ||
              /^H[1-3]$/.test(el.tagName)
            )
              break;
          }
          answer.appendChild(n);
          n = next;
        }

        const item = document.createElement("div");
        item.className = "faq-item";
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "faq-q";
        const label = document.createElement("span");
        label.innerHTML = trigger.innerHTML;
        const ico = document.createElement("span");
        ico.className = "faq-ico";
        ico.setAttribute("aria-hidden", "true");
        btn.append(label, ico);

        trigger.replaceWith(item);
        item.append(btn, answer);
        btn.addEventListener("click", () => item.classList.toggle("open"));
      });
    } catch {
      /* ignore enhancement errors */
    }

    // ---------- 2) Make tables horizontally scrollable on mobile ----------
    try {
      root.querySelectorAll("table").forEach((table) => {
        if (table.parentElement?.classList.contains("table-wrap")) return;
        const wrap = document.createElement("div");
        wrap.className = "table-wrap";
        table.parentElement?.insertBefore(wrap, table);
        wrap.appendChild(table);
      });
    } catch {
      /* ignore */
    }

    // ---------- 3) Model card grids ----------
    // Runs per content container: the root itself, or — on sectioned service
    // pages — every .svc-body card, since image/caption pairs sit at the top
    // level of each section rather than of the root.
    try {
      const isCard = (el: Element | null) =>
        !!el &&
        el.tagName === "IMG" &&
        el.nextElementSibling?.tagName === "P" &&
        !!el.nextElementSibling.querySelector("a[href]");

      const bodies = root.querySelectorAll<HTMLElement>(".svc-body");
      const scopes = bodies.length ? Array.from(bodies) : [root];
      for (const scope of scopes) {
        let child = scope.firstElementChild;
        while (child) {
          if (isCard(child)) {
            const grid = document.createElement("div");
            grid.className = "model-grid";
            child.parentElement?.insertBefore(grid, child);

            let cur: Element | null = child;
            while (cur && isCard(cur)) {
              const img = cur as HTMLElement;
              const cap = cur.nextElementSibling as HTMLElement;
              const next = cap.nextElementSibling;
              const card = document.createElement("div");
              card.className = "model-card";
              cap.classList.add("cap");
              card.append(img, cap);
              grid.append(card);
              cur = next;
            }
            child = grid.nextElementSibling;
          } else {
            child = child.nextElementSibling;
          }
        }
      }
    } catch {
      /* ignore enhancement errors */
    }
  }, [targetId]);

  return null;
}
