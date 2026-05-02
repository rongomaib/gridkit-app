// with help from:
//   - https://madebyevan.com/shaders/grid/
//   - https://github.com/ayamflow/glsl-grid/blob/master/demo/index.html
//   - https://github.com/Fyrestar/THREE.InfiniteGridHelper/blob/master/InfiniteGridHelper.js
//   - https://github.com/pmndrs/drei/blob/master/src/core/shaderMaterial.tsx

import { type ThreeElement, extend } from '@react-three/fiber'
import { Color, DoubleSide, ShaderMaterial } from 'three'

const DEFAULT_AXIS_LENGTH = 100
const DEFAULT_SMALL_SIZE = 1
const DEFAULT_LARGE_SIZE = 10
const DEFAULT_COLOR = new Color('white')

export class VkGridMaterial extends ShaderMaterial {
  constructor() {
    super({
      // depthWrite needed for z-fighting with shadow floor
      depthWrite: false,
      fragmentShader: `
        varying vec3 vPos;

        uniform float uSmallSize;
        uniform float uLargeSize;
        uniform vec3 uColor;

        float when_gt(float x, float y) {
          return max(sign(x - y), 0.0);
        }

        float when_le(float x, float y) {
          return 1.0 - when_gt(x, y);
        }

        float grid(vec3 pos, vec3 axis, float size) {
          float width = 1.0;

          // Grid size
          vec3 tile = pos / size;

          // Grid gradient
          vec3 level = abs(fract(tile - 0.5) - 0.5);

          // Derivative (crisp line)
          vec3 deri = fwidth(tile);
          vec3 grid3D = clamp((level - deri * (width - 1.0)) / deri, 0.0, 1.0);

          // Shorter syntax but pow(0.0) fails on some GPUs
          // float lines = float(length(axis) > 0.0) * pow(grid3D.x, axis.x) * pow(grid3D.y, axis.y) * pow(grid3D.z, axis.z);
          float lines = float(length(axis) > 0.0)
              * (when_gt(axis.x, 0.0) * grid3D.x + when_le(axis.x, 0.0))
              * (when_gt(axis.y, 0.0) * grid3D.y + when_le(axis.y, 0.0))
              * (when_gt(axis.z, 0.0) * grid3D.z + when_le(axis.z, 0.0));

          return 1.0 - lines;
        }

        void main() {
          float smallLines = grid(vPos, vec3(1.0, 1.0, 0.0), uSmallSize);
          float largeLines = grid(vPos, vec3(1.0, 1.0, 0.0), uLargeSize);

          gl_FragColor = vec4(uColor.rgb, mix(largeLines, smallLines, smallLines));
          gl_FragColor.a = mix(0.35 * gl_FragColor.a, gl_FragColor.a, largeLines);

          if (gl_FragColor.a <= 0.0) discard;
        }
      `,
      side: DoubleSide,
      transparent: true,
      uniforms: {
        uColor: {
          value: DEFAULT_COLOR,
        },
        uLargeSize: {
          value: DEFAULT_LARGE_SIZE,
        },
        uSmallSize: {
          value: DEFAULT_SMALL_SIZE,
        },
      },
      vertexShader: `
        varying vec3 vPos;

        void main() {
          vPos = position;

          gl_Position = projectionMatrix * modelViewMatrix * vec4(vPos, 1.0);
        }
      `,
    })
  }

  get smallSize() {
    // @ts-ignore
    return this.uniforms.uSmallSize.value
  }
  set smallSize(value: number) {
    // @ts-ignore
    this.uniforms.uSmallSize.value = value
  }

  get largeSize() {
    // @ts-ignore
    return this.uniforms.uLargeSize.value
  }
  set largeSize(value: number) {
    // @ts-ignore
    this.uniforms.uLargeSize.value = value
  }

  get color() {
    // @ts-ignore
    return this.uniforms.uColor.value
  }
  set color(color: Color) {
    // @ts-ignore
    this.uniforms.uColor.value = color
  }
}

extend({ VkGridMaterial })

declare module '@react-three/fiber' {
  interface ThreeElements {
    vkGridMaterial: ThreeElement<typeof VkGridMaterial>
  }
}

export interface GridProps {
  axisLength?: number
  largeSize?: number
  smallSize?: number
  color?: Color
  renderOrder?: number
}

export function Grid(props: GridProps) {
  const {
    axisLength = DEFAULT_AXIS_LENGTH,
    smallSize = DEFAULT_SMALL_SIZE,
    largeSize = DEFAULT_LARGE_SIZE,
    color = DEFAULT_COLOR,
    renderOrder,
  } = props

  return (
    <mesh frustumCulled={false} renderOrder={renderOrder}>
      <planeGeometry args={[2 * axisLength, 2 * axisLength, 1, 1]} />
      <vkGridMaterial smallSize={smallSize} largeSize={largeSize} color={color} />
    </mesh>
  )
}
