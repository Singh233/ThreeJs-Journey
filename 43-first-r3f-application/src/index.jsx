import ReactDOM from "react-dom/client";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import Experience from "./Experience.jsx";

import "./style.css";
const root = ReactDOM.createRoot(document.querySelector("#root"));

root.render(
  <Canvas
    // flat
    // dpr={[1, 2]}
    gl={{
      antialias: true,
      toneMapping: THREE.ACESFilmicToneMapping,
      outputColorSpace: THREE.SRGBColorSpace,
    }}
    camera={{ fov: 45, near: 0.1, far: 200, position: [3, 2, 6] }}
  >
    <Experience />
  </Canvas>
);
