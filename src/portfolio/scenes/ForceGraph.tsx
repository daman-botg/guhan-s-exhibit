import { useEffect, useRef } from "react";
import * as THREE from "three";

// hue is HSL hue degrees (warm spectrum, with cyan/magenta accents — no blue/violet gradients)
const NODES = [
  { label: "Phase II",              signal: 1,    hue: 45  }, // amber
  { label: "oncology",              signal: 0.45, hue: 18  }, // orange
  { label: "biomarker expression",  signal: 1,    hue: 320 }, // magenta
  { label: "trial dropout rate",    signal: 0.3,  hue: 30  },
  { label: "p-value",               signal: 0.65, hue: 50  },
  { label: "FDA approval",          signal: 0.75, hue: 180 }, // cyan
  { label: "patient cohort",        signal: 0.55, hue: 25  },
  { label: "adverse events",        signal: 0.4,  hue: 8   },
  { label: "genomic marker",        signal: 0.85, hue: 290 }, // magenta-pink
  { label: "trial size",            signal: 1,    hue: 38  },
  { label: "compound toxicity",     signal: 0.35, hue: 12  },
  { label: "enrollment rate",       signal: 0.5,  hue: 55  },
  { label: "primary endpoint",      signal: 1,    hue: 170 }, // teal
  { label: "randomization",         signal: 0.55, hue: 35  },
  { label: "blinding protocol",     signal: 0.4,  hue: 22  },
  { label: "placebo arm",           signal: 0.45, hue: 60  },
  { label: "survival curve",        signal: 0.75, hue: 200 }, // cyan-teal
  { label: "dose response",         signal: 0.65, hue: 42  },
  { label: "control group",         signal: 0.55, hue: 28  },
  { label: "SUCCESS — 84% confidence", signal: 1.2, hue: 78, result: true },
];

export function ForceGraph({ progressRef }: { progressRef: React.MutableRefObject<number> }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current!;
    const W = () => el.clientWidth, H = () => el.clientHeight;
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-W()/2, W()/2, H()/2, -H()/2, 0.1, 100);
    camera.position.z = 10;
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W(), H());
    el.appendChild(renderer.domElement);

    type N = { x: number; y: number; vx: number; vy: number; sig: number; hue: number; result?: boolean; label: string };
    const nodes: N[] = NODES.map((n) => ({
      x: (Math.random()-0.5)*W()*0.7,
      y: (Math.random()-0.5)*H()*0.7,
      vx: 0, vy: 0,
      sig: n.signal, hue: n.hue, result: n.result, label: n.label,
    }));
    // edges: random sparse links
    const edges: [number, number][] = [];
    for (let i = 0; i < nodes.length; i++) {
      const k = 2 + Math.floor(Math.random()*2);
      for (let j = 0; j < k; j++) {
        const t = Math.floor(Math.random()*nodes.length);
        if (t !== i) edges.push([i, t]);
      }
    }

    // labels via DOM overlay
    const labelLayer = document.createElement("div");
    labelLayer.style.cssText = "position:absolute;inset:0;pointer-events:none;";
    el.appendChild(labelLayer);
    const labelEls: HTMLDivElement[] = nodes.map((n) => {
      const d = document.createElement("div");
      d.textContent = n.label;
      d.style.cssText = `position:absolute;transform:translate(-50%,-150%);font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:${n.result?"#c8f542":"#8a857a"};white-space:nowrap;transition:color .6s,opacity .6s;`;
      labelLayer.appendChild(d);
      return d;
    });

    // node spheres as points
    const nodeGeo = new THREE.BufferGeometry();
    const nodePos = new Float32Array(nodes.length*3);
    const nodeCol = new Float32Array(nodes.length*3);
    const nodeSize = new Float32Array(nodes.length);
    nodeGeo.setAttribute("position", new THREE.BufferAttribute(nodePos, 3));
    nodeGeo.setAttribute("color", new THREE.BufferAttribute(nodeCol, 3));
    nodeGeo.setAttribute("size", new THREE.BufferAttribute(nodeSize, 1));
    const nodeMat = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {},
      vertexShader: `attribute float size; attribute vec3 color; varying vec3 vC; void main(){ vC=color; vec4 mv=modelViewMatrix*vec4(position,1.0); gl_PointSize=size; gl_Position=projectionMatrix*mv; }`,
      fragmentShader: `varying vec3 vC; void main(){ vec2 c=gl_PointCoord-0.5; float d=length(c); float a=smoothstep(0.5,0.0,d); float core=smoothstep(0.3,0.0,d); gl_FragColor=vec4(vC, a*0.6 + core*0.4); }`,
    });
    const nodePoints = new THREE.Points(nodeGeo, nodeMat);
    scene.add(nodePoints);

    // edges as line segments
    const edgePos = new Float32Array(edges.length*2*3);
    const edgeCol = new Float32Array(edges.length*2*3);
    const edgeGeo = new THREE.BufferGeometry();
    edgeGeo.setAttribute("position", new THREE.BufferAttribute(edgePos, 3));
    edgeGeo.setAttribute("color", new THREE.BufferAttribute(edgeCol, 3));
    const edgeMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.4 });
    const edgeLines = new THREE.LineSegments(edgeGeo, edgeMat);
    scene.add(edgeLines);

    // arc to result (final)
    const arcGeo = new THREE.BufferGeometry();
    const arcPos = new Float32Array(60 * 3);
    arcGeo.setAttribute("position", new THREE.BufferAttribute(arcPos, 3));
    const arcMat = new THREE.LineBasicMaterial({ color: 0xc8f542, transparent: true, opacity: 0 });
    const arcLine = new THREE.Line(arcGeo, arcMat);
    scene.add(arcLine);

    const mouse = { x: -9999, y: -9999, in: false };
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      mouse.x = e.clientX - rect.left - W()/2;
      mouse.y = -(e.clientY - rect.top - H()/2);
      mouse.in = true;
    };
    const onLeave = () => { mouse.in = false; mouse.x = -9999; mouse.y = -9999; };
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    const onResize = () => {
      renderer.setSize(W(), H());
      camera.left = -W()/2; camera.right = W()/2; camera.top = H()/2; camera.bottom = -H()/2;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    let raf = 0, t = 0;
    const loop = () => {
      t += 0.016;
      const prog = Math.min(1, Math.max(0, progressRef.current));
      // physics
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        // pull high-signal nodes toward center as progress increases
        const tgtR = a.result ? Math.min(W(), H())*0.32 : (a.sig > 0.85 ? 80 : a.sig > 0.5 ? 220 : 360);
        const ang = Math.atan2(a.y, a.x);
        const tx = Math.cos(ang) * tgtR * (a.result ? 1 : (0.5 + prog*0.5));
        const ty = Math.sin(ang) * tgtR * (a.result ? 1 : (0.5 + prog*0.5));
        a.vx += (tx - a.x) * 0.005;
        a.vy += (ty - a.y) * 0.005;
        // repulsion from others
        for (let j = 0; j < nodes.length; j++) if (j !== i) {
          const b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d2 = dx*dx + dy*dy + 100;
          const f = 2000 / d2;
          a.vx += (dx/Math.sqrt(d2)) * f * 0.04;
          a.vy += (dy/Math.sqrt(d2)) * f * 0.04;
        }
        // mouse repulsion
        if (mouse.in) {
          const dx = a.x - mouse.x, dy = a.y - mouse.y;
          const d2 = dx*dx + dy*dy + 200;
          const f = 80000 / d2;
          a.vx += (dx/Math.sqrt(d2)) * f * 0.001;
          a.vy += (dy/Math.sqrt(d2)) * f * 0.001;
        }
        a.vx *= 0.86; a.vy *= 0.86;
        a.x += a.vx; a.y += a.vy;
      }
      // write positions/colors
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        nodePos[i*3] = n.x; nodePos[i*3+1] = n.y; nodePos[i*3+2] = 0;
        const intensity = n.result ? 1 : (n.sig > 0.85 ? (0.4 + prog*0.6) : (0.3 - prog*0.2));
        const c = n.result ? new THREE.Color(0xc8f542).multiplyScalar(0.5 + 0.5*Math.sin(t*3))
                            : new THREE.Color(intensity, intensity*0.97, intensity*0.9);
        nodeCol[i*3] = c.r; nodeCol[i*3+1] = c.g; nodeCol[i*3+2] = c.b;
        nodeSize[i] = n.result ? 22 : (8 + n.sig * 8 * (0.5 + prog*0.5));
        labelEls[i].style.left = `${n.x + W()/2}px`;
        labelEls[i].style.top = `${-n.y + H()/2}px`;
        labelEls[i].style.opacity = String(n.result ? (prog > 0.85 ? 1 : 0) : (0.4 + intensity*0.6));
        if (n.result) labelEls[i].style.color = "#c8f542";
        else if (n.sig > 0.85) labelEls[i].style.color = `rgba(240,236,228,${0.5 + prog*0.5})`;
      }
      (nodeGeo.getAttribute("position") as THREE.BufferAttribute).needsUpdate = true;
      (nodeGeo.getAttribute("color") as THREE.BufferAttribute).needsUpdate = true;
      (nodeGeo.getAttribute("size") as THREE.BufferAttribute).needsUpdate = true;
      for (let i = 0; i < edges.length; i++) {
        const [a, b] = edges[i];
        edgePos[i*6] = nodes[a].x; edgePos[i*6+1] = nodes[a].y; edgePos[i*6+2] = 0;
        edgePos[i*6+3] = nodes[b].x; edgePos[i*6+4] = nodes[b].y; edgePos[i*6+5] = 0;
        const k = (nodes[a].sig + nodes[b].sig) / 2;
        const v = 0.2 + k * 0.4 * prog;
        edgeCol[i*6] = v; edgeCol[i*6+1] = v; edgeCol[i*6+2] = v*0.9;
        edgeCol[i*6+3] = v; edgeCol[i*6+4] = v; edgeCol[i*6+5] = v*0.9;
      }
      (edgeGeo.getAttribute("position") as THREE.BufferAttribute).needsUpdate = true;
      (edgeGeo.getAttribute("color") as THREE.BufferAttribute).needsUpdate = true;
      // arc on final
      const result = nodes[nodes.length-1];
      const arcReveal = Math.max(0, (prog - 0.85) / 0.15);
      arcMat.opacity = arcReveal;
      for (let i = 0; i < 60; i++) {
        const tt = (i/59) * arcReveal;
        const sx = 0, sy = 0;
        const ex = result.x, ey = result.y;
        const mxp = (sx+ex)/2, myp = (sy+ey)/2 + 80;
        const x = (1-tt)*(1-tt)*sx + 2*(1-tt)*tt*mxp + tt*tt*ex;
        const y = (1-tt)*(1-tt)*sy + 2*(1-tt)*tt*myp + tt*tt*ey;
        arcPos[i*3] = x; arcPos[i*3+1] = y; arcPos[i*3+2] = 0;
      }
      (arcGeo.getAttribute("position") as THREE.BufferAttribute).needsUpdate = true;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); el.removeEventListener("mousemove", onMove); el.removeEventListener("mouseleave", onLeave); window.removeEventListener("resize", onResize); renderer.dispose(); nodeGeo.dispose(); edgeGeo.dispose(); arcGeo.dispose(); nodeMat.dispose(); edgeMat.dispose(); arcMat.dispose(); el.removeChild(labelLayer); el.removeChild(renderer.domElement); };
  }, [progressRef]);
  return <div ref={ref} className="scene-canvas" />;
}
