"use client";

import { useCallback, useRef, useState, type KeyboardEvent } from "react";
import {
  Ask,
  Result,
  StageHint,
  ToolCard,
  btnPrimary,
  enterFullscreen,
  exitFullscreen,
  fa,
  track,
  useFlash,
  useFullscreenExit,
  type ResultData,
} from "./shared";
import type { PhoneTest } from "@/lib/phone-tests";

// رنگ های تخت تمام صفحه؛ دو خاکستری آخر برای سوختگی OLED و لکه های ناهمرنگ
const COLORS = [
  { c: "#000000", name: "سیاه", look: "دنبال نقطه روشن یا رنگی و نور زدگی کنار صفحه بگردید" },
  { c: "#ffffff", name: "سفید", look: "دنبال نقطه سیاه، لکه زرد یا سایه بگردید" },
  { c: "#ff0000", name: "قرمز", look: "دنبال نقطه سیاه یا خط بگردید" },
  { c: "#00ff00", name: "سبز", look: "دنبال نقطه سیاه یا خط بگردید" },
  { c: "#0000ff", name: "آبی", look: "دنبال نقطه سیاه یا خط بگردید" },
  { c: "#808080", name: "خاکستری", look: "دنبال سایه کیبورد یا نوار بالای صفحه بگردید (سوختگی)" },
  { c: "#1e1e1e", name: "خاکستری تیره", look: "دنبال لکه های ناهمرنگ و رگه بگردید" },
];

type Phase = "idle" | "running" | "ask" | "result";

export default function DeadPixelTest({ tool }: { tool: PhoneTest["tool"] }) {
  const stage = useRef<HTMLDivElement>(null);
  const lastTap = useRef(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [i, setI] = useState(0);
  const [result, setResult] = useState<ResultData | null>(null);
  const hint = useFlash(`${phase}-${i}`, i === 0 ? 3200 : 1600);

  const start = () => {
    setI(0);
    setResult(null);
    setPhase("running");
    // لایه باید اول رندر شود بعد تمام صفحه
    requestAnimationFrame(() => {
      if (!stage.current) return;
      enterFullscreen(stage.current);
      stage.current.focus();
    });
    track("phone-test-start", { test: "dead-pixel" });
  };

  const finish = useCallback(() => {
    exitFullscreen();
    setPhase("ask");
  }, []);
  useFullscreenExit(phase === "running", finish);

  const next = () => {
    // touch و click پشت سر هم نباید دو رنگ را رد کنند
    const now = Date.now();
    if (now - lastTap.current < 250) return;
    lastTap.current = now;
    if (i + 1 >= COLORS.length) finish();
    else setI(i + 1);
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === " " || e.key === "Enter" || e.key === "ArrowLeft") {
      e.preventDefault();
      next();
    } else if (e.key === "ArrowRight" && i > 0) setI(i - 1);
  };

  const pick = (bad: boolean) => {
    setPhase("result");
    setResult(
      bad
        ? {
            tone: "bad",
            title: "صفحه نمایش ایراد دارد",
            text: "پایین همین صفحه در بخش «نتیجه تست را چطور بخوانیم» ببینید ایرادی که دیدید چیست. نقطه مرده، خط و لکه سیاه با نرم افزار برطرف نمی شوند و لکه ها معمولا بزرگتر می شوند؛ عیب یابی در برتر سرویس رایگان است.",
            serviceHref: "/repairs/lcd-replacement/",
            serviceLabel: "هزینه تعویض ال سی دی",
          }
        : {
            tone: "ok",
            title: "صفحه نمایش سالم به نظر می رسد",
            text: (
              <>
                روی هیچ رنگی ایرادی ندیدید. اگر تاچ گوشی هم مشکوک است،{" "}
                <a href="/phone-test/touch-screen/" className="font-bold text-accent underline underline-offset-4">
                  تست تاچ
                </a>{" "}
                را انجام دهید.
              </>
            ),
          },
    );
  };

  const col = COLORS[i];

  return (
    <ToolCard heading={tool.heading} intro={tool.intro} privacy={tool.privacy}>
      <button type="button" onClick={start} className={`${btnPrimary} w-full`}>
        {phase === "idle" ? "شروع تست صفحه" : "شروع دوباره"}
      </button>

      {phase === "running" && (
        <div
          ref={stage}
          tabIndex={-1}
          onPointerUp={next}
          onKeyDown={onKey}
          className="fixed inset-0 z-[1000] h-[100dvh] cursor-pointer touch-none select-none outline-none"
          style={{ background: col.c }}
        >
          <StageHint show={hint}>
            <b>
              {fa(i + 1)} از {fa(COLORS.length)} — {col.name}
            </b>
            <br />
            {col.look}
            {i === 0 && (
              <>
                <br />
                <small>برای رنگ بعدی صفحه را لمس کنید</small>
              </>
            )}
          </StageHint>
        </div>
      )}

      {phase === "ask" && (
        <Ask
          question="روی یکی از رنگ ها نقطه، خط، لکه یا سایه دیدید؟"
          options={[
            { label: "نه، صفحه سالم بود", onPick: () => pick(false) },
            { label: "بله، ایراد دیدم", onPick: () => pick(true) },
          ]}
        />
      )}
      {phase === "result" && result && <Result data={result} testKey="dead-pixel" onRetry={start} />}
    </ToolCard>
  );
}
