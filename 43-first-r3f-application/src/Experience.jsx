import { useFrame } from "@react-three/fiber";
import React, { useRef } from "react";

export default function Experience() {
  const cube = useRef();
  const group = useRef();

  useFrame((state, delta) => {
    cube.current.rotation.y += delta;
    group.current.rotation.y += delta;
  });
  return (
    <>
      <group ref={group}>
        <mesh position-x={-2} rotation-y={Math.PI * 0.32}>
          <sphereGeometry />
          <meshBasicMaterial color={"orange"} />
        </mesh>
        <mesh ref={cube} scale={1.5} position-x={2} rotation-y={Math.PI * 0.32}>
          <boxGeometry />
          <meshBasicMaterial color={"mediumpurple"} />
        </mesh>
      </group>

      <mesh scale={10} position-y={-1} rotation-x={-Math.PI * 0.5}>
        <planeGeometry />
        <meshBasicMaterial color={"greenyellow"} />
      </mesh>
    </>
  );
}
