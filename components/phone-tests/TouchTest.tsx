"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as RPointerEvent } from "react";
import {
  Result,
  StageHint,
  ToolCard,
  btnPrimary,
  enterFullscreen,
  exitFullscreen,
  fa,
  track,
  useFullscreenExit,
  type ResultData,
} from "./shared";
import type { PhoneTest } from "@/lib/phone-tests";

// اندازه تقریبی نوک انگشت به پیکسل CSS
const CELL = 44;

type Phase = "idle" | "running" | "review" | "result";

// شبکه عمدا بیرون از state ری اکت است: حرکت انگشت ده ها رویداد در ثانیه می دهد
// و رندر دوباره برای هر خانه تست را کند می کرد. خانه ها با classList رنگ می شوند.
interface Board {
  cols: number;
  rows: number;
  cells: HTMLElement[];
  covered: number;
  maxTouch: number;
  active: Set<number>;
  last: Map<number, { x: number; y: number }>;
}

export default function TouchTest({ tool }: { tool: PhoneTest["tool"] }) {
  const stage = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const pill = useRef<HTMLSpanElement>(null);
  const board = useRef<Board | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [hint, setHint] = useState(true);
  const [noTouch, setNoTouch] = useState(false);
  const [result, setResult] = useState<ResultData | null>(null);

  useEffect(() => {
    setNoTouch(!(navigator.maxTouchPoints > 0));
  }, []);

  const build = () => {
    const g = grid.current;
    if (!g) return;
    const cols = Math.max(6, Math.round(window.innerWidth / CELL));
    const rows = Math.max(8, Math.round(window.innerHeight / CELL));
    g.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    g.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
    const frag = document.createDocumentFragment();
    const cells: HTMLElement[] = [];
    for (let k = 0; k < cols * rows; k++) {
      const c = document.createElement("i");
      c.className = "pt-cell";
      cells.push(c);
      frag.appendChild(c);
    }
    g.replaceChildren(frag);
    board.current = { cols, rows, cells, covered: 0, maxTouch: 0, active: new Set(), last: new Map() };
    updatePill();
  };

  const updatePill = () => {
    const b = board.current;
    if (!b || !pill.current) return;
    const pct = Math.floor((b.covered * 100) / (b.cols * b.rows));
    pill.current.textContent = `${fa(pct)}٪ · لمس همزمان: ${fa(b.maxTouch)}`;
  };

  const mark = (x: number, y: number) => {
    const b = board.current;
    const g = grid.current;
    if (!b || !g) return;
    const r = g.getBoundingClientRect();
    const c = Math.floor((x - r.left) / (r.width / b.cols));
    const ro = Math.floor((y - r.top) / (r.height / b.rows));
    if (c < 0 || ro < 0 || c >= b.cols || ro >= b.rows) return;
    const cell = b.cells[ro * b.cols + c];
    if (!cell.classList.contains("on")) {
      cell.classList.add("on");
      b.covered++;
    }
  };

  // حرکت سریع بین دو رویداد فاصله می اندازد؛ بین دو نقطه پر می شود تا خانه ای الکی سفید نماند
  const stroke = (id: number, x: number, y: number) => {
    const b = board.current!;
    const p = b.last.get(id);
    if (p) {
      const dx = x - p.x;
      const dy = y - p.y;
      const steps = Math.ceil(Math.hypot(dx, dy) / (CELL / 3));
      for (let s = 1; s < steps; s++) mark(p.x + (dx * s) / steps, p.y + (dy * s) / steps);
    }
    mark(x, y);
    b.last.set(id, { x, y });
  };

  const review = useCallback(() => {
    grid.current?.classList.add("done");
    setPhase("review");
    const b = board.current;
    setHint(!!b && b.covered < b.cols * b.rows);
  }, []);

  const afterStroke = () => {
    updatePill();
    const b = board.current!;
    if (b.covered === b.cols * b.rows) review();
  };

  const onDown = (e: RPointerEvent) => {
    if (phase !== "running" || !board.current) return;
    e.preventDefault();
    const b = board.current;
    b.active.add(e.pointerId);
    b.maxTouch = Math.max(b.maxTouch, b.active.size);
    setHint(false);
    stroke(e.pointerId, e.clientX, e.clientY);
    afterStroke();
  };
  const onMove = (e: RPointerEvent) => {
    const b = board.current;
    if (phase !== "running" || !b || !b.active.has(e.pointerId)) return;
    const list = e.nativeEvent.getCoalescedEvents?.() ?? [];
    if (list.length) list.forEach((ev) => stroke(e.pointerId, ev.clientX, ev.clientY));
    else stroke(e.pointerId, e.clientX, e.clientY);
    afterStroke();
  };
  const onUp = (e: RPointerEvent) => {
    board.current?.active.delete(e.pointerId);
    board.current?.last.delete(e.pointerId);
  };

  const start = () => {
    setResult(null);
    setHint(true);
    setPhase("running");
    requestAnimationFrame(() => {
      if (stage.current) enterFullscreen(stage.current);
      // اندازه پنجره بعد از تمام صفحه شدن عوض می شود
      requestAnimationFrame(build);
    });
    track("phone-test-start", { test: "touch" });
  };

  const close = useCallback(() => {
    exitFullscreen();
    const b = board.current;
    if (!b) {
      setPhase("idle");
      return;
    }
    const total = b.cols * b.rows;
    const missed = total - b.covered;
    const pct = Math.floor((b.covered * 100) / total);
    // خانه های لمس نشده فقط در لبه ها؟ سیستم عامل لبه ها را برای ژست ها نگه می دارد
    const edgeOnly = b.cells.every((cell, k) => {
      if (cell.classList.contains("on")) return true;
      const r = Math.floor(k / b.cols);
      const c = k % b.cols;
      return r === 0 || r === b.rows - 1 || c === 0 || c === b.cols - 1;
    });
    const stats = [
      { value: `${fa(pct)}٪`, label: "پوشش صفحه" },
      { value: fa(missed), label: "خانه لمس نشده" },
      { value: fa(b.maxTouch), label: "بیشترین لمس همزمان" },
    ];
    const multiNote =
      b.maxTouch < 2
        ? ` لمس همزمان فقط ${fa(b.maxTouch)} ثبت شد؛ اگر چند انگشت گذاشتید و عدد بالا نرفت، مولتی تاچ ایراد دارد.`
        : "";

    let data: ResultData;
    if (missed === 0 && b.maxTouch >= 2) {
      data = { tone: "ok", stats, title: "تاچ گوشی سالم است", text: "همه نقاط صفحه و لمس همزمان درست کار کرد." };
    } else if (missed === 0 || (edgeOnly && missed <= b.cols)) {
      data = {
        tone: "info",
        stats,
        title: "تاچ تقریبا سالم است",
        text:
          (missed
            ? "فقط چند خانه لبه صفحه لمس نشد. لبه بالا و پایین را سیستم عامل برای ژست ها نگه می دارد و این معمولا خرابی نیست؛ یک بار دیگر آرام تر تست کنید."
            : "همه نقاط صفحه لمس شد.") + multiNote,
      };
    } else {
      data = {
        tone: "bad",
        stats,
        title: "بخشی از تاچ کار نمی کند",
        text:
          "اگر در تست دوباره هم همان ناحیه لمس نمی شود، تاچ آن قسمت ایراد سخت افزاری دارد. در بیشتر گوشی های جدید تاچ و صفحه یکپارچه اند و با تعویض صفحه درست می شوند." +
          multiNote,
        serviceHref: "/samsung-mobile-touch-repair/",
        serviceLabel: "تعمیر تاچ گوشی",
      };
    }
    setResult(data);
    setPhase("result");
  }, []);

  useFullscreenExit(phase === "running" || phase === "review", close);

  const inStage = phase === "running" || phase === "review";

  return (
    <ToolCard heading={tool.heading} intro={tool.intro} privacy={tool.privacy}>
      {noTouch && (
        <p className="mb-4 rounded-xl bg-paper px-4 py-3 text-sm text-ink-700">
          به نظر می رسد این دستگاه صفحه لمسی ندارد. این صفحه را روی خود گوشی باز کنید.
        </p>
      )}
      <button type="button" onClick={start} className={`${btnPrimary} w-full`}>
        {phase === "idle" ? "شروع تست تاچ" : "شروع دوباره"}
      </button>

      {inStage && (
        <div ref={stage} className="fixed inset-0 z-[1000] h-[100dvh] touch-none select-none overscroll-none">
          {/* ltr عمدی: در راست به چپ grid ستون اول را سمت راست می چیند ولی mark() ستون را
              از لبه چپ حساب می کند؛ بدون این، کشیدن انگشت سمت راست خانه سمت چپ را رنگ می کرد */}
          <div
            ref={grid}
            dir="ltr"
            className="pt-grid absolute inset-0 grid bg-white"
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            onContextMenu={(e) => e.preventDefault()}
          />
          {/* نوار بالا لمس خانه های زیرش را نمی گیرد؛ فقط دکمه کلیک پذیر است */}
          <div className="pointer-events-none absolute left-1/2 top-[max(10px,env(safe-area-inset-top))] z-10 flex -translate-x-1/2 items-center gap-2">
            <span ref={pill} className="whitespace-nowrap rounded-full bg-black/65 px-3 py-1.5 text-[13px] text-white" />
            <button
              type="button"
              onClick={phase === "review" ? close : review}
              className="pointer-events-auto min-h-10 whitespace-nowrap rounded-xl bg-accent px-4 text-sm font-bold text-white"
            >
              {phase === "review" ? "دیدن نتیجه" : "پایان تست"}
            </button>
          </div>
          <StageHint show={hint}>
            {phase === "review" ? (
              <>
                خانه های قرمز لمس نشدند.
                <br />
                اگر همیشه همان ناحیه قرمز می ماند، تاچ آنجا ایراد دارد.
              </>
            ) : (
              <>
                انگشت خود را آرام روی همه صفحه بکشید تا همه خانه ها سبز شوند.
                <br />
                برای تست مولتی تاچ چند انگشت را همزمان بگذارید.
              </>
            )}
          </StageHint>
        </div>
      )}

      {phase === "result" && result && <Result data={result} testKey="touch" onRetry={start} />}
    </ToolCard>
  );
}
