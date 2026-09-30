"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Ask, Result, ToolCard, btnGhost, btnPrimary, fa, track, type ResultData } from "./shared";
import type { PhoneTest } from "@/lib/phone-tests";

const REC_SECONDS = 5;

type AudioWindow = Window & { webkitAudioContext?: typeof AudioContext };
type Phase = "idle" | "live" | "ask" | "result";

const BAD_TEXT =
  "در بسیاری از گوشی های اندرویدی میکروفون اصلی روی برد شارژ است و با تعویض همان برد درست می شود؛ عیب یابی دقیق در برتر سرویس رایگان است.";

export default function MicrophoneTest({ tool }: { tool: PhoneTest["tool"] }) {
  const stream = useRef<MediaStream | null>(null);
  const ctx = useRef<AudioContext | null>(null);
  const raf = useRef(0);
  const bar = useRef<HTMLElement>(null);
  const levelText = useRef<HTMLSpanElement>(null);
  const wave = useRef<HTMLCanvasElement>(null);
  const loudest = useRef(0);
  const recUrl = useRef<string | null>(null);

  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [mics, setMics] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState("");
  const [recLeft, setRecLeft] = useState(0);
  const [playback, setPlayback] = useState<string | null>(null);
  const [result, setResult] = useState<ResultData | null>(null);

  const release = useCallback(() => {
    cancelAnimationFrame(raf.current);
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    ctx.current?.close().catch(() => {});
    ctx.current = null;
  }, []);

  useEffect(() => {
    window.addEventListener("pagehide", release);
    return () => {
      window.removeEventListener("pagehide", release);
      release();
      if (recUrl.current) URL.revokeObjectURL(recUrl.current);
    };
  }, [release]);

  // نمایش شدت و شکل موج مستقیم روی DOM؛ ۶۰ بار در ثانیه state ری اکت عوض نمی شود
  const loop = (analyser: AnalyserNode) => {
    const buf = new Float32Array(analyser.fftSize);
    let shown = 0;
    const tick = () => {
      analyser.getFloatTimeDomainData(buf);
      let sum = 0;
      for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
      const rms = Math.sqrt(sum / buf.length);
      // مقیاس لگاریتمی تا صحبت عادی وسط نوار بنشیند نه ته آن
      const db = 20 * Math.log10(rms || 1e-8);
      const pct = Math.max(0, Math.min(100, ((db + 60) * 100) / 55));
      // بالا رفتن فوری، پایین آمدن نرم تا نوار با هر هجا نپرد
      shown = pct > shown ? pct : shown * 0.92;
      loudest.current = Math.max(loudest.current, pct);
      if (bar.current) bar.current.style.width = `${shown}%`;
      if (levelText.current) levelText.current.textContent = `${fa(Math.round(shown))}٪`;
      draw(buf);
      raf.current = requestAnimationFrame(tick);
    };
    tick();
  };

  const draw = (buf: Float32Array) => {
    const c = wave.current;
    if (!c) return;
    const w = c.clientWidth;
    const h = c.clientHeight;
    const dpr = window.devicePixelRatio || 1;
    if (c.width !== w * dpr) {
      c.width = w * dpr;
      c.height = h * dpr;
    }
    const g = c.getContext("2d");
    if (!g) return;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);
    g.lineWidth = 2;
    g.strokeStyle = getComputedStyle(c).color;
    g.beginPath();
    const step = buf.length / w;
    for (let x = 0; x < w; x++) {
      const y = h / 2 + buf[Math.floor(x * step)] * h * 0.9;
      if (x === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.stroke();
  };

  const bad = (title: string) => {
    setResult({
      tone: "bad",
      title,
      text: BAD_TEXT,
      serviceHref: "/repairs/speaker-microphone-repair/",
      serviceLabel: "تعمیر میکروفون گوشی",
    });
    setPhase("result");
  };

  const open = async (id?: string) => {
    setError(null);
    setResult(null);
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setError("مرورگر شما دسترسی به میکروفون را نمی دهد. صفحه را در کروم یا سافاری به روز باز کنید.");
      return;
    }
    release();
    // حذف نویز و تنظیم خودکار بلندی خاموش تا ضعف واقعی میکروفون پنهان نشود
    const audio: MediaTrackConstraints = { echoCancellation: false, noiseSuppression: false, autoGainControl: false };
    if (id) audio.deviceId = { exact: id };
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio });
      stream.current = s;
      const AC = window.AudioContext ?? (window as AudioWindow).webkitAudioContext;
      const ac = new AC();
      ctx.current = ac;
      const analyser = ac.createAnalyser();
      analyser.fftSize = 2048;
      ac.createMediaStreamSource(s).connect(analyser);
      loudest.current = 0;
      setPhase("live");
      requestAnimationFrame(() => loop(analyser));
      track("phone-test-start", { test: "microphone" });
      const list = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === "audioinput");
      setMics(list);
      setDeviceId(id ?? s.getAudioTracks()[0]?.getSettings().deviceId ?? "");
    } catch (e) {
      const name = (e as DOMException)?.name;
      if (name === "NotAllowedError" || name === "SecurityError") {
        setError(
          "اجازه میکروفون داده نشد. در کروم روی آیکن کنار آدرس سایت بزنید و میکروفون را «مجاز» کنید؛ در آیفون از تنظیمات، بخش سافاری و میکروفون. بعد صفحه را تازه کنید.",
        );
      } else if (name === "NotFoundError") {
        setError("هیچ میکروفونی پیدا نشد.");
        bad("مرورگر هیچ میکروفونی پیدا نکرد");
      } else if (name === "NotReadableError") {
        setError("میکروفون در اختیار برنامه دیگری است (مثلا تماس یا ضبط صدا). آن را ببندید و دوباره امتحان کنید.");
      } else {
        setError("باز کردن میکروفون ممکن نشد. صفحه را تازه کنید و دوباره امتحان کنید.");
      }
    }
  };

  const record = () => {
    const s = stream.current;
    if (!s || typeof MediaRecorder === "undefined") {
      setError("این مرورگر ضبط صدا را پشتیبانی نمی کند؛ نوار شدت صدا کافی است.");
      return;
    }
    const type = ["audio/webm", "audio/mp4", "audio/ogg"].find((t) => MediaRecorder.isTypeSupported?.(t));
    const rec = type ? new MediaRecorder(s, { mimeType: type }) : new MediaRecorder(s);
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data);
    };
    rec.onstop = () => {
      if (recUrl.current) URL.revokeObjectURL(recUrl.current);
      recUrl.current = URL.createObjectURL(new Blob(chunks, { type: rec.mimeType || type || "audio/webm" }));
      setPlayback(recUrl.current);
      setRecLeft(0);
    };
    rec.start();
    setRecLeft(REC_SECONDS);
    let left = REC_SECONDS;
    const timer = setInterval(() => {
      left--;
      setRecLeft(left);
      if (left <= 0) {
        clearInterval(timer);
        if (rec.state !== "inactive") rec.stop();
      }
    }, 1000);
  };

  const finish = () => {
    const heard = loudest.current;
    release();
    if (heard < 8) {
      bad("میکروفون تقریبا صدایی دریافت نکرد");
      return;
    }
    setPhase("ask");
  };

  const restart = () => {
    setPlayback(null);
    void open(deviceId || undefined);
  };

  return (
    <ToolCard heading={tool.heading} intro={tool.intro} privacy={tool.privacy}>
      {phase !== "live" && (
        <button type="button" onClick={() => void open()} className={`${btnPrimary} w-full`}>
          {phase === "idle" ? "شروع تست میکروفون" : "شروع دوباره"}
        </button>
      )}

      {phase === "live" && (
        <div>
          <div className="h-[18px] overflow-hidden rounded-full bg-paper" aria-hidden>
            <i
              ref={bar}
              className="block h-full w-0 bg-accent transition-[width] duration-75"
            />
          </div>
          <p className="mt-1.5 text-[13px] text-ink-500">
            شدت صدا: <span ref={levelText}>۰٪</span>
          </p>
          <canvas
            ref={wave}
            role="img"
            aria-label="شکل موج صدای میکروفون"
            className="mt-3 block h-[90px] w-full rounded-xl border border-line bg-paper text-accent"
          />
          {mics.length > 1 && (
            <label className="mt-4 grid gap-1.5 text-sm text-ink-700">
              انتخاب میکروفون
              <select
                value={deviceId}
                onChange={(e) => {
                  setDeviceId(e.target.value);
                  void open(e.target.value);
                }}
                className="min-h-11 rounded-xl border border-line bg-white px-3"
              >
                {mics.map((m, i) => (
                  <option key={m.deviceId} value={m.deviceId}>
                    {m.label || `میکروفون ${fa(i + 1)}`}
                  </option>
                ))}
              </select>
            </label>
          )}
          <div className="mt-4 flex flex-wrap gap-2.5">
            <button type="button" onClick={record} disabled={recLeft > 0} className={btnPrimary}>
              {recLeft > 0 ? `در حال ضبط… ${fa(recLeft)}` : playback ? "ضبط دوباره" : `ضبط ${fa(REC_SECONDS)} ثانیه`}
            </button>
            <button type="button" onClick={finish} className={btnGhost}>
              پایان تست
            </button>
          </div>
          {playback && <audio src={playback} controls autoPlay className="mt-3 w-full" />}
        </div>
      )}

      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-accent-tint px-4 py-3 text-sm leading-7 text-accent-deep">
          {error}
        </p>
      )}

      {phase === "ask" && (
        <Ask
          question="صدای ضبط شده چطور بود؟"
          options={[
            {
              label: "واضح و بدون مشکل",
              onPick: () => {
                setResult({
                  tone: "ok",
                  title: "میکروفون گوشی سالم است",
                  text: "اگر فقط در تماس صدای شما نمی رود، بخش «ضبط سالم است ولی در تماس صدا نمی رود» را پایین همین صفحه ببینید.",
                });
                setPhase("result");
              },
            },
            { label: "ضعیف یا دور", onPick: () => bad("صدای میکروفون ضعیف است") },
            { label: "خش دار یا قطع و وصل", onPick: () => bad("میکروفون صدای خش دار ضبط می کند") },
          ]}
        />
      )}
      {phase === "result" && result && <Result data={result} testKey="microphone" onRetry={restart} />}
    </ToolCard>
  );
}
