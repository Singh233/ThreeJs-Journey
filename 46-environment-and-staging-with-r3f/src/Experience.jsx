import { useFrame } from "@react-three/fiber";
import {
  AccumulativeShadows,
  SoftShadows,
  BakeShadows,
  useHelper,
  OrbitControls,
  RandomizedLight,
} from "@react-three/drei";
import { useRef } from "react";
import { Perf } from "r3f-perf";
import * as THREE from "three";

export default function Experience() {
  const cube = useRef();
  const directionalLight = useRef();

  // useHelper(directionalLight, THREE.DirectionalLightHelper, 1);

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;
    cube.current.rotation.y += delta * 0.2;
    // cube.current.position.x = 2 + Math.sin(time);
  });

  return (
    <>
      {/* <BakeShadows /> */}
      {/* <SoftShadows
        frustum={3.75}
        size={50}
        near={9.5}
        samples={17}
        rings={11}
      /> */}

      <color args={["black"]} attach={"background"} />

      <Perf position="top-left" />

      <OrbitControls makeDefault />

      <AccumulativeShadows
        position={[0, -0.99, 0]}
        scale={10}
        color="#316d39"
        opacity={0.8}
        frames={500}
        temporal
        // blend={100}
      >
        <RandomizedLight
          amount={8}
          radius={1}
          ambient={0.5}
          intensity={1}
          position={[1, 2, 3]}
          bias={0.001}
        />
      </AccumulativeShadows>

      <directionalLight
        castShadow
        ref={directionalLight}
        position={[1, 2, 3]}
        intensity={1.5}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={1}
        shadow-camera-far={10}
        shadow-camera-top={5}
        shadow-camera-right={5}
        shadow-camera-bottom={-5}
        shadow-camera-left={-5}
      />
      <ambientLight intensity={0.5} />

      <mesh castShadow position-x={-2}>
        <sphereGeometry />
        <meshStandardMaterial color="orange" />
      </mesh>

      <mesh castShadow ref={cube} position-x={2} scale={1.5}>
        <boxGeometry />
        <meshStandardMaterial color="mediumpurple" />
      </mesh>

      <mesh position-y={-1} rotation-x={-Math.PI * 0.5} scale={10}>
        <planeGeometry />
        <meshStandardMaterial color="greenyellow" />
      </mesh>
    </>
  );
}
