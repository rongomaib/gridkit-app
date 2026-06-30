declare module 'n8ao' {
  interface N8AOConfiguration {
    intensity: number
    aoRadius: number
    distanceFalloff: number
    screenSpaceRadius: boolean
    halfRes: boolean
    colorMultiply: boolean
  }

  class N8AOPass {
    // Pass interface properties (structural compatibility with THREE.js Pass)
    isPass: boolean
    enabled: boolean
    needsSwap: boolean
    clear: boolean
    renderToScreen: boolean
    // N8AO-specific
    configuration: N8AOConfiguration
    constructor(scene: any, camera: any, width: number, height: number)
    setQualityMode(mode: 'Performance' | 'Low' | 'Medium' | 'High' | 'Ultra'): void
    setSize(width: number, height: number): void
    render(renderer: any, writeBuffer: any, readBuffer: any, deltaTime: any, maskActive: any): void
    dispose(): void
  }

  class N8AOPostPass {
    configuration: N8AOConfiguration
    needsDepthTexture: boolean
    constructor(scene: any, camera: any, width?: number, height?: number)
    setQualityMode(mode: 'Performance' | 'Low' | 'Medium' | 'High' | 'Ultra'): void
    setSize(width: number, height: number): void
    setDepthTexture(texture: unknown): void
    render(renderer: unknown, inputBuffer: unknown, outputBuffer: unknown): void
  }
}
