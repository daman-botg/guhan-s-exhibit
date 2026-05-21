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
          <div className="mouse-stage">
            <img className="mouse-img" src={mouseImg} alt="Anatomical reference: laboratory mouse, side profile" loading="lazy" />
            <div className="brain-overlay">
              <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <radialGradient id="g-frontal" cx="50%" cy="50%"><stop offset="0%" stopColor="#ff3b6e" stopOpacity="1"/><stop offset="100%" stopColor="#ff3b6e" stopOpacity="0"/></radialGradient>
                  <radialGradient id="g-parietal" cx="50%" cy="50%"><stop offset="0%" stopColor="#ff9a3c" stopOpacity="1"/><stop offset="100%" stopColor="#ff9a3c" stopOpacity="0"/></radialGradient>
                  <radialGradient id="g-occipital" cx="50%" cy="50%"><stop offset="0%" stopColor="#ffd83c" stopOpacity="1"/><stop offset="100%" stopColor="#ffd83c" stopOpacity="0"/></radialGradient>
                  <radialGradient id="g-temporal" cx="50%" cy="50%"><stop offset="0%" stopColor="#3cffb0" stopOpacity="1"/><stop offset="100%" stopColor="#3cffb0" stopOpacity="0"/></radialGradient>
                  <radialGradient id="g-cerebellum" cx="50%" cy="50%"><stop offset="0%" stopColor="#3ccfff" stopOpacity="1"/><stop offset="100%" stopColor="#3ccfff" stopOpacity="0"/></radialGradient>
                  <radialGradient id="g-hippo" cx="50%" cy="50%"><stop offset="0%" stopColor="#ff5cf0" stopOpacity="1"/><stop offset="100%" stopColor="#ff5cf0" stopOpacity="0"/></radialGradient>
                </defs>
                {/* rainbow region blobs — positioned over the mouse's head */}
                <ellipse className="brain-region r-frontal"   cx="55"  cy="95"  rx="38" ry="32" fill="url(#g-frontal)" />
                <ellipse className="brain-region r-parietal"  cx="95"  cy="80"  rx="34" ry="28" fill="url(#g-parietal)" />
                <ellipse className="brain-region r-occipital" cx="130" cy="100" rx="32" ry="28" fill="url(#g-occipital)" />
                <ellipse className="brain-region r-temporal"  cx="100" cy="120" rx="40" ry="22" fill="url(#g-temporal)" />
                <ellipse className="brain-region r-cerebellum" cx="150" cy="130" rx="26" ry="22" fill="url(#g-cerebellum)" />
                <ellipse className="brain-region r-hippo"     cx="85"  cy="105" rx="22" ry="16" fill="url(#g-hippo)" />
                {/* circuit arc connecting prefrontal → hippocampus, drawn on demand */}
                <path className="arc-path" d="M 55 95 Q 70 60 95 80 Q 92 100 85 105" />
              </svg>
            </div>
          </div>
          <div className="lab-info">
            <div className="lab-slide lab-eisch">
              <span className="tag">01 — Eisch Lab</span>
              <h3>UPenn / CHOP</h3>
              <p>No-code SLEAP GUI eliminating manual annotation. Real-time behavioral tracking pipeline for hippocampal experiments.</p>
            </div>
            <div className="lab-slide lab-mukherjee">
              <span className="tag">02 — Mukherjee Lab</span>
              <h3>UPenn</h3>
              <p>Facial landmark model for schizophrenia phenotyping in mice. Connecting expression patterns to prefrontal–hippocampal circuit disruptions.</p>
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
