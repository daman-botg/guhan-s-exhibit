import { useEffect, useRef } from "react";

export function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (window.matchMedia("(hover: none)").matches) return;
    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let rx = mx, ry = my;
    const onMove = (e: MouseEvent) => { mx = e.clientX; my = e.clientY; if (dotRef.current) dotRef.current.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`; };
    const onOver = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("a, button, .hoverable")) ringRef.current?.classList.add("hover");
      else ringRef.current?.classList.remove("hover");
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseover", onOver);
    let raf = 0;
    const loop = () => {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      if (ringRef.current) ringRef.current.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseover", onOver); cancelAnimationFrame(raf); };
  }, []);
  return (
    <div className="gv-cursor">
      <div ref={dotRef} className="gv-cursor-dot" />
      <div ref={ringRef} className="gv-cursor-ring" />
    </div>
  );
}
