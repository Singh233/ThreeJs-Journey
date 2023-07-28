import React from "react";
import { useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";

export default function Model() {
  const model = useLoader(
    GLTFLoader,
    "./hamburger.glb",
    (loader) => {
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath("./draco/");
      loader.setDRACOLoader(dracoLoader);
    }
  );
  return <primitive object={model.scene} scale={0.35}/>;
}
