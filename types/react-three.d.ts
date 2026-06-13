declare global {
  namespace JSX {
    interface IntrinsicElements {
      mesh: any;
      group: any;
      torusKnotGeometry: any;
      sphereGeometry: any;
      meshStandardMaterial: any;
      ambientLight: any;
      directionalLight: any;
      pointLight: any;
      canvas: any;
    }
  }
}

export {}
