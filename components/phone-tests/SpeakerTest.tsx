"use client";

import { useEffect, useRef, useState } from "react";
import { Ask, Result, ToolCard, btnGhost, btnPrimary, track, type ResultData } from "./shared";
import type { PhoneTest } from "@/lib/phone-tests";

type Kind = "both" | "left" | "right" | "bass" | "sweep";

const BUTTONS: { kind: Kind; label: string }[] = [
  { kind: "both", label: "هر دو بلندگو" },
  { kind: "left", label: "فقط چپ" },
  { kind: "right", label: "فقط راست" },
  { kind: "bass", label: "صدای بم" },
  { kind: "sweep", label: "جاروی فرکانس" },
];

const STATUS: Record<Kind, string> = {
  both: "هر دو کانال پخش می شود.",
  left: "فقط کانال چپ پخش می شود.",
  right: "فقط کانال راست پخش می شود.",
  bass: "صدای بم ۱۲۰ هرتز؛ بلندگوی آسیب دیده اینجا خش خش یا لرزش می دهد.",
  sweep: "جاروی فرکانس از بم به زیر؛ به خش یا لرزش در میانه راه دقت کنید.",
};

const SERVICE = { serviceHref: "/repairs/speaker-microphone-repair/", serviceLabel: "تعمیر اسپیکر گوشی" };
const link = "font-bold text-accent underline underline-offset-4";

type AudioWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};
type AudioSessionNavigator = Navigator & { audioSession?: { type: string } };

export default function SpeakerTest({ tool }: { tool: PhoneTest["tool"] }) {
  const ctx = useRef<AudioContext | null>(null);
  const current = useRef<{ osc: OscillatorNode; gain: GainNode } | null>(null);
  const [playing, setPlaying] = useState<Kind | null>(null);
  const [started, setStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"testing" | "ask" | "result">("testing");
  const [result, setResult] = useState<ResultData | null>(null);

  useEffect(() => () => void ctx.current?.close().catch(() => {}), []);

  const audio = (): AudioContext | null => {
    if (!ctx.current) {
      const AC = window.AudioContext ?? (window as AudioWindow).webkitAudioContext;
      if (!AC) return null;
      // آیفون در حالت بی صدا Web Audio را قطع می کند مگر نشست صوتی «پخش» باشد (سافاری ۱۷ به بعد)
      try {
        const nav = navigator as AudioSessionNavigator;
        if (nav.audioSession) nav.audioSession.type = "playback";
      } catch {
        /* پشتیبانی نمی شود */
      }
      ctx.current = new AC();
    }
    if (ctx.current.state === "suspended") void ctx.current.resume();
    return ctx.current;
  };

  const stop = () => {
    const c = current.current;
    const ac = ctx.current;
    if (c && ac) {
      try {
        c.gain.gain.setTargetAtTime(0, ac.currentTime, 0.02);
        c.osc.stop(ac.currentTime + 0.1);
      } catch {
        /* از قبل تمام شده */
      }
    }
    current.current = null;
    setPlaying(null);
  };

  const play = (kind: Kind) => {
    const wasThis = playing === kind;
    stop();
    if (wasThis) return;
    const ac = audio();
    if (!ac) {
      setError("مرورگر شما پخش صدا را پشتیبانی نمی کند؛ کروم یا سافاری به روز را امتحان کنید.");
      return;
    }
    if (!started) {
      setStarted(true);
      track("phone-test-start", { test: "speaker" });
    }

    const osc = ac.createOscillator();
    const gain = ac.createGain();
    const now = ac.currentTime;
    let out: AudioNode = gain;
    if (kind === "left" || kind === "right") {
      const pan = kind === "left" ? -1 : 1;
      if (ac.createStereoPanner) {
        const p = ac.createStereoPanner();
        p.pan.value = pan;
        gain.connect(p);
        out = p;
      } else {
        // سافاری قدیمی StereoPanner ندارد
        const merger = ac.createChannelMerger(2);
        gain.connect(merger, 0, pan < 0 ? 0 : 1);
        out = merger;
      }
    }
    out.connect(ac.destination);
    osc.connect(gain);
    osc.type = "sine";
    gain.gain.setValueAtTime(0, now);

    let dur: number;
    let level = 0;
    if (kind === "sweep") {
      // از ۱۰۰ هرتز تا ۱۰ کیلوهرتز؛ خش یا لرزش در یک بازه خودش را نشان می دهد
      dur = 8;
      level = 0.25;
      osc.frequency.setValueAtTime(100, now);
      osc.frequency.exponentialRampToValueAtTime(10000, now + dur);
      gain.gain.linearRampToValueAtTime(level, now + 0.05);
    } else if (kind === "bass") {
      dur = 4;
      level = 0.5;
      osc.frequency.value = 120;
      gain.gain.linearRampToValueAtTime(level, now + 0.05);
    } else {
      // بوق های کوتاه پشت سر هم تا جای صدا راحت پیدا شود
      dur = 3;
      osc.frequency.value = 660;
      for (let k = 0; k < 6; k++) {
        const t = now + k * 0.5;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.3, t + 0.02);
        gain.gain.setValueAtTime(0.3, t + 0.28);
        gain.gain.linearRampToValueAtTime(0, t + 0.3);
      }
    }
    if (level) {
      gain.gain.setValueAtTime(level, now + dur - 0.1);
      gain.gain.linearRampToValueAtTime(0, now + dur);
    }
    osc.start(now);
    osc.stop(now + dur + 0.05);
    osc.onended = () => {
      if (current.current?.osc === osc) {
        current.current = null;
        setPlaying(null);
      }
    };
    current.current = { osc, gain };
    setPlaying(kind);
  };

  const pick = (data: ResultData) => {
    setResult(data);
    setPhase("result");
  };

  const retry = () => {
    setResult(null);
    setPhase("testing");
  };

  return (
    <ToolCard heading={tool.heading} intro={tool.intro} privacy={tool.privacy}>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {BUTTONS.map((b) => (
          <button
            key={b.kind}
            type="button"
            aria-pressed={playing === b.kind}
            onClick={() => play(b.kind)}
            className={btnGhost}
          >
            {b.label}
          </button>
        ))}
      </div>
      {(playing || error) && (
        <p role="status" className="mt-3 rounded-xl bg-paper px-4 py-3 text-sm leading-7 text-ink-700">
          {error ?? STATUS[playing as Kind]}
        </p>
      )}
      {started && phase === "testing" && (
        <button
          type="button"
          onClick={() => {
            stop();
            setPhase("ask");
          }}
          className={`${btnPrimary} mt-4 w-full`}
        >
          ثبت نتیجه تست
        </button>
      )}

      {phase === "ask" && (
        <Ask
          question="صدای بلندگو چطور بود؟"
          options={[
            {
              label: "صاف و بدون مشکل",
              onPick: () =>
                pick({
                  tone: "ok",
                  title: "اسپیکر گوشی سالم است",
                  text: "اگر در تماس صدای طرف مقابل را نمی شنوید، ایراد از بلندگوی مکالمه است؛ راهش پایین همین صفحه آمده.",
                }),
            },
            {
              label: "کم یا گرفته بود",
              onPick: () =>
                pick({
                  tone: "bad",
                  ...SERVICE,
                  title: "صدای بلندگو ضعیف است",
                  text: (
                    <>
                      صدای کم و گرفته اغلب از گرد و خاک یا آب در توری بلندگوست. اول{" "}
                      <a href="/clean-phone-speaker-with-sound/" className={link}>
                        تمیز کردن اسپیکر با صدا
                      </a>{" "}
                      را امتحان کنید؛ اگر بهتر نشد بلندگو باید بررسی شود.
                    </>
                  ),
                }),
            },
            {
              label: "خش دار یا لرزان بود",
              onPick: () =>
                pick({
                  tone: "bad",
                  ...SERVICE,
                  title: "بلندگو آسیب دیده است",
                  text: "خش در صدای بم یا لرزش در جاروی فرکانس معمولا یعنی پرده بلندگو پاره یا شل شده و با تعویض بلندگو درست می شود.",
                }),
            },
            {
              label: "یک طرف یا کلا صدا نداشت",
              onPick: () =>
                pick({
                  tone: "bad",
                  ...SERVICE,
                  title: "بلندگو صدا ندارد",
                  text: "اول مطمئن شوید هدفون یا بلوتوث وصل نیست و آیفون روی بی صدا نیست. بعضی گوشی ها فقط یک بلندگو دارند و صدای چپ و راست از همان یکی پخش می شود. اگر گوشی دو بلندگو دارد و یکی ساکت است، بلندگو یا فلت آن ایراد دارد.",
                }),
            },
          ]}
        />
      )}
      {phase === "result" && result && <Result data={result} testKey="speaker" onRetry={retry} />}
    </ToolCard>
  );
}
