import { useEffect, useRef } from "react";
import * as THREE from "three";

export function BrainScene({ stepRef }: { stepRef: React.MutableRefObject<number> }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current!;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, el.clientWidth / el.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 4.2);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(el.clientWidth, el.clientHeight);
    el.appendChild(renderer.domElement);

    // pseudo-brain: two displaced hemispheres
    const makeHemi = (sign: number) => {
      const g = new THREE.IcosahedronGeometry(1, 48);
      const pos = g.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
        // gyri-like noise
        const n = Math.sin(x*7+sign*1.3)*Math.cos(y*8)*0.06 + Math.sin(z*9+y*4)*0.05 + Math.cos(x*4+z*6)*0.04;
        const sx = x * 0.95 + sign * 0.05;
        pos.setXYZ(i, sx + (x/(Math.abs(x)+0.001))*n*0.4, y*1.1 + n*0.4, z*0.95 + n*0.3);
      }
      g.computeVertexNormals();
      return g;
    };
    const geo = makeHemi(1);

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uT: { value: 0 },
        uHit: { value: new THREE.Vector3(999,999,999) },
        uHitActive: { value: 0 },
        uStep: { value: 0 },
        uHeart: { value: 0 },
      },
      vertexShader: `varying vec3 vPos; varying vec3 vN; void main(){ vPos=position; vN=normal; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
      fragmentShader: `
        varying vec3 vPos; varying vec3 vN;
        uniform float uT; uniform vec3 uHit; uniform float uHitActive; uniform float uStep; uniform float uHeart;
        vec3 regionColor(vec3 p){
          // simple zones
          vec3 c = vec3(0.0);
          if (p.z > 0.4) c = vec3(1.0, 0.85, 0.35); // frontal
          else if (p.z < -0.4) c = vec3(0.3, 0.95, 1.0); // visual
          else if (p.y > 0.4) c = vec3(1.0, 0.3, 0.85); // parietal
          else c = vec3(1.0, 0.55, 0.2); // temporal
          return c;
        }
        void main(){
          vec3 base = vec3(0.10);
          float d = distance(vPos, uHit);
          float hit = smoothstep(1.2, 0.0, d) * uHitActive;
          vec3 rim = vec3(pow(1.0 - max(dot(normalize(vN), vec3(0.0,0.0,1.0)), 0.0), 2.0));
          // scroll-driven region glow
          float frontal = smoothstep(0.2, 0.8, vPos.z) * step(0.5, uStep) * (uStep < 1.5 ? 1.0 : 0.4);
          float occ = smoothstep(-0.8, -0.2, -vPos.z) * step(1.5, uStep);
          float wide = step(2.5, uStep) * (uStep < 3.5 ? 1.0 : 0.5);
          float roi = step(3.5, uStep);
          vec3 col = base + rim * 0.08;
          col += regionColor(vPos) * hit * 0.9;
          col += vec3(1.0,0.85,0.35) * frontal * 0.5;
          col += vec3(0.3,0.95,1.0) * occ * 0.5;
          col += regionColor(vPos) * wide * 0.4;
          col += regionColor(vPos) * roi * (0.5 + 0.5*sin(uT*3.0 + vPos.x*5.0));
          col += vec3(uHeart * 0.05);
          gl_FragColor = vec4(col, 1.0);
        }`,
    });
    const brain = new THREE.Mesh(geo, mat);
    scene.add(brain);

    // wireframe overlay
    const wire = new THREE.LineSegments(new THREE.WireframeGeometry(geo), new THREE.LineBasicMaterial({ color: 0x222222, transparent: true, opacity: 0.18 }));
    brain.add(wire);

    const ray = new THREE.Raycaster();
    const mouseN = new THREE.Vector2(-2, -2);
    const onMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouseN.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseN.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };
    el.addEventListener("mousemove", onMove);
    const onResize = () => { renderer.setSize(el.clientWidth, el.clientHeight); camera.aspect = el.clientWidth/el.clientHeight; camera.updateProjectionMatrix(); };
    window.addEventListener("resize", onResize);

    let t = 0, raf = 0;
    const loop = () => {
      t += 0.016;
      mat.uniforms.uT.value = t;
      mat.uniforms.uStep.value = stepRef.current;
      mat.uniforms.uHeart.value = 0.5 + 0.5*Math.sin(t * (Math.PI*2/2.4));
      // rotate based on step; near end tilt to face front
      const tiltTarget = stepRef.current >= 5.5 ? 0 : Math.sin(t*0.4) * 0.4;
      brain.rotation.y += (tiltTarget - brain.rotation.y) * 0.04;
      brain.rotation.x += ((-0.05) - brain.rotation.x) * 0.04;

      ray.setFromCamera(mouseN, camera);
      const hits = ray.intersectObject(brain);
      if (hits.length) {
        mat.uniforms.uHit.value.copy(hits[0].point).applyMatrix4(brain.matrixWorld.clone().invert());
        mat.uniforms.uHitActive.value += (1 - mat.uniforms.uHitActive.value) * 0.1;
      } else {
        mat.uniforms.uHitActive.value += (0 - mat.uniforms.uHitActive.value) * 0.05;
      }
      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); el.removeEventListener("mousemove", onMove); window.removeEventListener("resize", onResize); renderer.dispose(); geo.dispose(); mat.dispose(); el.removeChild(renderer.domElement); };
  }, [stepRef]);
  return <div ref={ref} className="scene-canvas" />;
}
