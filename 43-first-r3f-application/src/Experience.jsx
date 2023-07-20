import React from "react";

export default function Experience() {
  return (
    <>
      <mesh position-x={-2} rotation-y={Math.PI * 0.32}>
        <sphereGeometry />
        <meshBasicMaterial color={"orange"} />
      </mesh>
      <mesh scale={1.5} position-x={2} rotation-y={Math.PI * 0.32}>
        <boxGeometry />
        <meshBasicMaterial color={"mediumpurple"} />
      </mesh>
      <mesh scale={10} position-y={-1} rotation-x={-Math.PI * 0.5}>
        <planeGeometry />
        <meshBasicMaterial color={"greenyellow"} />
      </mesh>
    </>
  );
}
