import { extend, useFrame, useThree } from "@react-three/fiber";
import React, { useRef } from "react";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import CustomObject from "./CustomObject";

extend({ OrbitControls });
export default function Experience() {
  const cube = useRef();
  const group = useRef();
  const { camera, gl } = useThree();

  useFrame((state, delta) => {
    cube.current.rotation.y += delta;
    // group.current.rotation.y += delta;
  });

  return (
    <>
      <orbitControls args={[camera, gl.domElement]} />

      <ambientLight intensity={0.5} />
      <directionalLight position={[1, 2, 3]} intensity={1.5} />

      <group ref={group}>
        <mesh position-x={-2} rotation-y={Math.PI * 0.32}>
          <sphereGeometry />
          <meshStandardMaterial color={"orange"} />
        </mesh>
        <mesh ref={cube} scale={1.5} position-x={2} rotation-y={Math.PI * 0.32}>
          <boxGeometry />
          <meshStandardMaterial color={"mediumpurple"} />
        </mesh>
      </group>

      <mesh scale={10} position-y={-1} rotation-x={-Math.PI * 0.5}>
        <planeGeometry />
        <meshStandardMaterial color={"greenyellow"} />
      </mesh>

      <CustomObject />
    </>
  );
}
