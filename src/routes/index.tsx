import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "../portfolio/portfolio.css";
import { Cursor } from "../portfolio/Cursor";
import { HeroFluid } from "../portfolio/scenes/HeroFluid";
import { FaceMesh, type FaceAU } from "../portfolio/scenes/FaceMesh";
import { ForceGraph } from "../portfolio/scenes/ForceGraph";
import { BrainScene } from "../portfolio/scenes/BrainScene";
import mouseImg from "../assets/mouse-silhouette.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Guhan Venkat — ML researcher. Builder. High schooler." },
      { name: "description", content: "Personal portfolio of Guhan Venkat — ML research at UPenn & CHOP, clinical trial prediction, neural attention dashboards, and tools that give people a voice." },
      { property: "og:title", content: "Guhan Venkat — ML researcher. Builder." },
      { property: "og:description", content: "ML research at UPenn & CHOP. Tools that read brains, track zebrafish, and translate emotion into voice." },
    ],
  }),
  component: Portfolio,
});

const NAME = "GUHAN VENKAT";

function Portfolio() {
  const [chapter, setChapter] = useState("01");
  const faceAU = useRef<FaceAU>("idle");
  const graphProgress = useRef(0);
  const brainStep = useRef(0);
  const ch3Active = useRef<number>(-1);
  const ch6Active = useRef<number>(-1);
  const [, force] = useState(0);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    // Hero name reveal
    const letters = gsap.utils.toArray<HTMLSpanElement>(".ch1 h1 span");
    gsap.to(letters, { opacity: 1, y: 0, duration: 0.6, stagger: 0.04, ease: "power3.out", delay: 0.2,
      onComplete: () => { gsap.to(".ch1 .sub", { opacity: 1, duration: 0.8, delay: 0.6 }); }
    });

    // Chapter indicator
    const chapters = [
      { sel: ".ch1", n: "01" }, { sel: ".ch2", n: "02" }, { sel: ".ch3", n: "03" },
      { sel: ".ch4", n: "04" }, { sel: ".ch5", n: "05" }, { sel: ".ch6", n: "06" }, { sel: ".ch7", n: "07" },
    ];
    chapters.forEach((c) => {
      ScrollTrigger.create({ trigger: c.sel, start: "top center", end: "bottom center",
        onToggle: (s) => { if (s.isActive) setChapter(c.n); } });
    });

    // Ch2 about lines
    gsap.utils.toArray<HTMLElement>(".ch2 .line").forEach((line, i) => {
      gsap.to(line, { opacity: 1, y: 0, duration: 1, ease: "power3.out", delay: i*0.2,
        scrollTrigger: { trigger: ".ch2", start: "top 60%" } });
    });
    gsap.utils.toArray<HTMLElement>(".ch2 .meta").forEach((m, i) => {
      gsap.to(m, { opacity: 1, duration: 0.8, delay: 0.8 + i*0.15,
        scrollTrigger: { trigger: ".ch2", start: "top 60%" } });
    });

    // Ch3 face — pin + step through AUs
    const ch3Beats: FaceAU[] = ["AU4", "AU6", "AU12", "ALL", "JAW"];
    ScrollTrigger.create({
      trigger: ".ch3", start: "top top", end: "+=300%", pin: true, scrub: 0.5,
      onUpdate: (self) => {
        const p = self.progress;
        const idx = Math.min(ch3Beats.length - 1, Math.floor(p * ch3Beats.length));
        faceAU.current = ch3Beats[idx];
        if (idx !== ch3Active.current) {
          ch3Active.current = idx;
          document.querySelectorAll<HTMLElement>(".ch3 .copy p").forEach((el, i) => el.classList.toggle("active", i <= idx));
        }
      },
    });

    // Ch4 graph
    ScrollTrigger.create({
      trigger: ".ch4", start: "top top", end: "+=250%", pin: true, scrub: 0.6,
      onUpdate: (self) => {
        graphProgress.current = self.progress;
        const finalEl = document.querySelector<HTMLElement>(".ch4 .ch4-final");
        if (finalEl) finalEl.style.opacity = String(Math.max(0, (self.progress - 0.8) / 0.2));
      },
    });

    // Ch5 research — sequential lab reveals
    const ch5tl = gsap.timeline({ scrollTrigger: { trigger: ".ch5", start: "top 70%" } });
    ch5tl.from(".ch5 .ch5-headline", { opacity: 0, y: 40, duration: 1, ease: "power3.out" });
    ScrollTrigger.create({
      trigger: ".ch5 .split", start: "top center",
      onEnter: () => {
        document.querySelectorAll(".ch5 .anatomy .hippo, .ch5 .anatomy .hippo-label").forEach((e) => e.classList.add("active"));
        gsap.to(".ch5 .lab-eisch", { opacity: 1, y: 0, duration: 1, ease: "power3.out" });
      },
    });
    ScrollTrigger.create({
      trigger: ".ch5 .split", start: "center center", end: "bottom center",
      onEnter: () => {
        document.querySelectorAll(".ch5 .anatomy .hippo").forEach((e) => { e.classList.remove("active"); e.classList.add("dim"); });
        document.querySelectorAll(".ch5 .anatomy .hippo-label").forEach((e) => e.classList.remove("active"));
        document.querySelectorAll(".ch5 .anatomy .pfc, .ch5 .anatomy .arc, .ch5 .anatomy .pfc-label").forEach((e) => e.classList.add("active"));
        gsap.to(".ch5 .lab-eisch", { opacity: 0, y: -40, duration: 0.6, ease: "power2.in" });
        gsap.to(".ch5 .lab-mukherjee", { opacity: 1, y: 0, duration: 0.8, delay: 0.1, ease: "power3.out" });
      },
      onLeaveBack: () => {
        document.querySelectorAll(".ch5 .anatomy .hippo").forEach((e) => { e.classList.add("active"); e.classList.remove("dim"); });
        document.querySelectorAll(".ch5 .anatomy .hippo-label").forEach((e) => e.classList.add("active"));
        document.querySelectorAll(".ch5 .anatomy .pfc, .ch5 .anatomy .arc, .ch5 .anatomy .pfc-label").forEach((e) => e.classList.remove("active"));
        gsap.to(".ch5 .lab-eisch", { opacity: 1, y: 0, duration: 0.6 });
        gsap.to(".ch5 .lab-mukherjee", { opacity: 0, y: 40, duration: 0.4 });
      },
    });

    // Ch6 brain steps
    ScrollTrigger.create({
      trigger: ".ch6", start: "top top", end: "bottom bottom", scrub: 0.5,
      onUpdate: (self) => {
        const lines = document.querySelectorAll<HTMLElement>(".ch6 .ch6-copy p");
        const total = lines.length;
        const idx = Math.min(total - 1, Math.floor(self.progress * total));
        brainStep.current = idx;
        if (idx !== ch6Active.current) {
          ch6Active.current = idx;
          lines.forEach((el, i) => el.classList.toggle("active", i === idx));
        }
        const finalEl = document.querySelector<HTMLElement>(".ch6 .ch6-final");
        if (finalEl) finalEl.style.opacity = String(Math.max(0, (self.progress - 0.85) / 0.15));
      },
    });

    force(1);
    return () => { ScrollTrigger.getAll().forEach((t) => t.kill()); };
  }, []);

  return (
    <>
      <Cursor />
      <div className="gv-label tl">GV</div>
      <div className="gv-label tr">{chapter} / 07</div>

      {/* CH 01 */}
      <section className="chapter ch1">
        <HeroFluid />
        <h1>
          {NAME.split("").map((ch, i) => (
            <span key={i}>{ch === " " ? "\u00A0" : ch}</span>
          ))}
        </h1>
        <div className="sub">ML researcher · Builder · High schooler</div>
      </section>

      {/* CH 02 */}
      <section className="chapter ch2">
        <div className="line">I build systems that read brains,</div>
        <div className="line">track zebrafish, and give deaf users a voice in meetings</div>
        <div className="line">— all before senior year.</div>
        <div className="meta">University of Pennsylvania · Children's Hospital of Philadelphia</div>
        <div className="meta">Skillman, NJ · graduating 2028</div>
      </section>

      {/* CH 03 */}
      <section className="chapter ch3">
        <FaceMesh auRef={faceAU} />
        <div />
        <div className="copy">
          <p>MediaPipe reads 468 landmarks in real time.</p>
          <p>Geometric displacement ratios compute emotion intensity — 0 to 1.</p>
          <p>The AU vector feeds the LLM for emotional reconstruction.</p>
          <p>SSML prosody tags. Azure Neural TTS. The feeling survives the translation.</p>
          <p>Routed live into Zoom. No captions. No screen sharing. Just a <span className="lime">voice</span>.</p>
        </div>
      </section>

      {/* CH 04 */}
      <section className="chapter ch4">
        <ForceGraph progressRef={graphProgress} />
        <div className="ch4-title">04 — Clinical Trial Outcome Predictor</div>
        <div className="ch4-final">
          Fine-tuned BioBERT. Built in partnership with Google LLC. Not just a probability score — a reason.
        </div>
      </section>

      {/* CH 05 */}
      <section className="chapter ch5">
        <div className="ch5-headline">Three labs. Two universities. One semester.</div>
        <div className="split">
          <svg className="anatomy mouse" viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3.5" result="b" />
                <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            {/* Mouse body outline — anatomical, side profile */}
            <path d="M 80 240 Q 70 215 90 200 Q 110 188 145 188 Q 170 188 195 178 Q 215 168 240 168 Q 290 162 340 168 Q 395 175 440 192 Q 470 204 495 220 Q 520 234 535 250 Q 548 262 552 274 Q 555 285 548 290 Q 540 294 525 290 Q 510 285 500 282 L 498 296 Q 510 308 515 322 Q 518 332 510 336 Q 502 339 492 330 Q 482 320 476 310 L 470 310 Q 462 322 450 330 Q 440 336 430 333 Q 423 330 425 322 Q 428 312 436 304 Q 430 302 420 302 L 280 302 Q 260 308 250 320 Q 240 332 228 332 Q 218 332 218 322 Q 220 314 230 306 L 200 304 Q 188 310 178 320 Q 168 330 156 330 Q 146 328 148 318 Q 152 308 162 300 L 150 296 Q 130 290 110 282 Q 90 274 82 260 Q 78 250 80 240 Z" />
            {/* Ear */}
            <path d="M 100 200 Q 92 178 108 170 Q 124 166 130 184 Q 132 196 122 202 Z" />
            {/* Eye */}
            <circle cx="118" cy="216" r="3" fill="#f0ece4" stroke="none" />
            {/* Whiskers */}
            <path d="M 78 250 L 50 248 M 78 256 L 52 260 M 78 244 L 52 240" strokeWidth="0.6" />
            {/* Tail */}
            <path d="M 552 280 Q 580 290 595 270 Q 605 252 590 240" strokeWidth="1" />

            {/* Brain regions inside the head — hippocampus & PFC */}
            <path className="region hippo" d="M 145 218 Q 152 208 168 210 Q 182 213 188 224 Q 184 234 168 234 Q 152 232 145 224 Z" />
            <path className="region pfc" d="M 96 220 Q 100 210 114 210 Q 126 212 130 222 Q 126 232 114 234 Q 100 232 96 224 Z" />
            <path className="region arc" d="M 114 222 Q 140 200 168 222" fill="none" />

            {/* Anatomical leader lines + labels */}
            <line className="region hippo" x1="168" y1="222" x2="290" y2="120" />
            <text className="label hippo-label" x="295" y="118">Dentate Gyrus · CA1</text>
            <line className="region pfc" x1="114" y1="222" x2="290" y2="80" />
            <text className="label pfc-label" x="295" y="78">Prelimbic Cortex → dHPC Circuit</text>
          </svg>
          <div className="lab-info">
            <div className="lab-slide lab-eisch">
              <h3>Eisch Lab — UPenn / CHOP</h3>
              <p>No-code SLEAP GUI eliminating manual annotation. Real-time behavioral tracking pipeline for hippocampal experiments.</p>
            </div>
            <div className="lab-slide lab-mukherjee">
              <h3>Mukherjee Lab — UPenn</h3>
              <p>Facial landmark model for schizophrenia phenotyping in mice. Connecting expression patterns to prefrontal-hippocampal circuit disruptions.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CH 06 */}
      <section className="chapter ch6">
        <div className="ch6-pin">
          <div className="ch6-scene"><BrainScene stepRef={brainStep} /></div>
          <div className="ch6-copy">
            <p>Short-form video in.</p>
            <p>V-JEPA2 features extracted and cached to disk.</p>
            <p>Encoder unloaded. TRIBE v2 loads.</p>
            <p>20,484 cortical vertices predicted per timepoint.</p>
            <p>Glasser-Yeo atlas. Five functional ROI groups.</p>
            <p>Live heatmap. Local RTX 5060 Ti. 16 GB VRAM. No quantization.</p>
          </div>
          <div className="ch6-final">
            20,484 cortical vertices. One local GPU. <span className="lime">Real-time.</span>
          </div>
        </div>
      </section>

      {/* CH 07 */}
      <section className="chapter ch7">
        <h2>Let's build something.</h2>
        <a className="email hoverable" href="mailto:guhan.venkatachalapathi@gmail.com">guhan.venkatachalapathi@gmail.com</a>
        <div className="socials">
          <a className="hoverable" href="#">GitHub</a> / <a className="hoverable" href="#">LinkedIn</a>
        </div>
      </section>
    </>
  );
}
