import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
export default function CustomObject() {
  const geometryRef = useRef();
  const verticesCount = 10 * 3;

  useEffect(() => {
    geometryRef.current.computeVertexNormals();
  }, []);
  const positions = useMemo(() => {
    const positions = new Float32Array(verticesCount * 3);

    for (let i = 0; i < verticesCount * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 3;
    }
    return positions;
  }, []);
  return (
    <mesh>
      <bufferGeometry ref={geometryRef}>
        <bufferAttribute
          attach={"attributes-position"}
          count={verticesCount}
          itemSize={3}
          array={positions}
        />
      </bufferGeometry>
      <meshStandardMaterial color={"red"} side={THREE.DoubleSide} />
    </mesh>
  );
}
