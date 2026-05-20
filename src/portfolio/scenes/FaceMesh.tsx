import { useEffect, useRef } from "react";
import * as THREE from "three";

export type FaceAU = "idle" | "AU4" | "AU6" | "AU12" | "ALL" | "JAW";

export function FaceMesh({ auRef }: { auRef: React.MutableRefObject<FaceAU> }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current!;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, el.clientWidth / el.clientHeight, 0.1, 100);
    camera.position.z = 4;
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(el.clientWidth, el.clientHeight);
    el.appendChild(renderer.domElement);

    // procedural face landmarks ~468 points distributed across a face-shaped ellipsoid
    const COUNT = 468;
    const basePos = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);
    // tag regions
    const regions: ("brow"|"cheek"|"lip"|"jaw"|"other")[] = [];
    for (let i = 0; i < COUNT; i++) {
      // distribute on face ellipsoid front-facing
      const u = Math.random();
      const v = Math.random();
      const theta = (u - 0.5) * Math.PI * 1.1; // x angle
      const phi = (v - 0.5) * Math.PI * 1.3; // y angle
      const rx = 0.85, ry = 1.15, rz = 0.55;
      const x = Math.sin(theta) * rx;
      const y = Math.sin(phi) * ry;
      const z = Math.cos(theta) * Math.cos(phi) * rz;
      basePos[i*3] = x; basePos[i*3+1] = y; basePos[i*3+2] = z;
      colors[i*3] = 0.94; colors[i*3+1] = 0.92; colors[i*3+2] = 0.85;
      const ny = y;
      if (ny > 0.55 && ny < 0.85 && Math.abs(x) < 0.65) regions.push("brow");
      else if (ny > -0.1 && ny < 0.35 && Math.abs(x) > 0.35 && Math.abs(x) < 0.78) regions.push("cheek");
      else if (ny < -0.25 && ny > -0.55 && Math.abs(x) < 0.55) regions.push("lip");
      else if (ny < -0.6) regions.push("jaw");
      else regions.push("other");
    }

    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(basePos);
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const pointMat = new THREE.PointsMaterial({ size: 0.022, vertexColors: true, transparent: true, opacity: 0.95 });
    const points = new THREE.Points(geo, pointMat);
    scene.add(points);

    // build sparse edges to nearest neighbors
    const edges: number[] = [];
    for (let i = 0; i < COUNT; i++) {
      const dists: {j: number; d: number}[] = [];
      for (let j = 0; j < COUNT; j++) if (j !== i) {
        const dx = basePos[i*3]-basePos[j*3], dy = basePos[i*3+1]-basePos[j*3+1], dz = basePos[i*3+2]-basePos[j*3+2];
        dists.push({ j, d: dx*dx+dy*dy+dz*dz });
      }
      dists.sort((a,b)=>a.d-b.d);
      for (let k = 0; k < 2; k++) {
        const j = dists[k].j;
        if (j > i) edges.push(i, j);
      }
    }
    const linePos = new Float32Array(edges.length * 3);
    const lineCol = new Float32Array(edges.length * 3);
    for (let i = 0; i < edges.length; i++) {
      const idx = edges[i];
      linePos[i*3] = basePos[idx*3]; linePos[i*3+1] = basePos[idx*3+1]; linePos[i*3+2] = basePos[idx*3+2];
      lineCol[i*3] = 0.35; lineCol[i*3+1] = 0.33; lineCol[i*3+2] = 0.3;
    }
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.BufferAttribute(linePos, 3));
    lineGeo.setAttribute("color", new THREE.BufferAttribute(lineCol, 3));
    const lineMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.35 });
    const lines = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(lines);

    // waveform line below chin
    const waveCount = 200;
    const wavePos = new Float32Array(waveCount * 3);
    for (let i = 0; i < waveCount; i++) {
      wavePos[i*3] = -1 + (i / (waveCount-1)) * 2;
      wavePos[i*3+1] = -1.6;
      wavePos[i*3+2] = 0;
    }
    const waveGeo = new THREE.BufferGeometry();
    waveGeo.setAttribute("position", new THREE.BufferAttribute(wavePos, 3));
    const waveMat = new THREE.LineBasicMaterial({ color: 0xc8f542, transparent: true, opacity: 0 });
    const wave = new THREE.Line(waveGeo, waveMat);
    scene.add(wave);

    const onResize = () => { renderer.setSize(el.clientWidth, el.clientHeight); camera.aspect = el.clientWidth/el.clientHeight; camera.updateProjectionMatrix(); };
    window.addEventListener("resize", onResize);

    let t = 0, raf = 0;
    const colHex = (h: number) => new THREE.Color(h);
    const cBase = colHex(0xf0ece4), cAmber = colHex(0xffa84a), cYellow = colHex(0xffd24a), cGreen = colHex(0x9ae84a);
    const loop = () => {
      t += 0.016;
      points.rotation.y = Math.sin(t*0.25) * (Math.PI/18);
      lines.rotation.y = points.rotation.y;
      wave.rotation.y = points.rotation.y;
      const au = auRef.current;
      const posAttr = geo.getAttribute("position") as THREE.BufferAttribute;
      const colAttr = geo.getAttribute("color") as THREE.BufferAttribute;
      for (let i = 0; i < COUNT; i++) {
        const bx = basePos[i*3], by = basePos[i*3+1], bz = basePos[i*3+2];
        const nx = Math.sin(t*1.1 + i*0.7) * 0.012;
        const ny = Math.cos(t*0.9 + i*0.3) * 0.012;
        let dx = nx, dy = ny, dz = 0;
        const r = regions[i];
        let target = cBase, mix = 0;
        if ((au === "AU4" || au === "ALL") && r === "brow") { dy -= 0.08; target = cAmber; mix = 1; }
        if ((au === "AU6" || au === "ALL") && r === "cheek") { dy += 0.06; target = cYellow; mix = 1; }
        if ((au === "AU12" || au === "ALL") && r === "lip") { dx += Math.sign(bx) * 0.08; dy += 0.03; target = cGreen; mix = 1; }
        if (au === "JAW" && r === "jaw") { dy -= 0.18; }
        posAttr.setXYZ(i, bx + dx, by + dy, bz + dz);
        const cur = new THREE.Color(colAttr.getX(i), colAttr.getY(i), colAttr.getZ(i));
        cur.lerp(mix ? target : cBase, 0.08);
        colAttr.setXYZ(i, cur.r, cur.g, cur.b);
      }
      posAttr.needsUpdate = true;
      colAttr.needsUpdate = true;
      // update lines from points
      const lpos = lineGeo.getAttribute("position") as THREE.BufferAttribute;
      for (let i = 0; i < edges.length; i++) {
        const idx = edges[i];
        lpos.setXYZ(i, posAttr.getX(idx), posAttr.getY(idx), posAttr.getZ(idx));
      }
      lpos.needsUpdate = true;

      // waveform
      const wActive = au === "JAW" ? 1 : 0;
      waveMat.opacity += (wActive*0.9 - waveMat.opacity) * 0.08;
      const wAttr = waveGeo.getAttribute("position") as THREE.BufferAttribute;
      for (let i = 0; i < waveCount; i++) {
        const x = -1 + (i / (waveCount-1)) * 2;
        const env = Math.sin((i/waveCount) * Math.PI);
        wAttr.setY(i, -1.6 + Math.sin(t*6 + i*0.4) * 0.15 * env * wActive);
      }
      wAttr.needsUpdate = true;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); renderer.dispose(); geo.dispose(); lineGeo.dispose(); waveGeo.dispose(); pointMat.dispose(); lineMat.dispose(); waveMat.dispose(); el.removeChild(renderer.domElement); };
  }, [auRef]);
  return <div ref={ref} className="scene-canvas" />;
}
