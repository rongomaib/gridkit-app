import { TinyColor as Color } from '@ctrl/tinycolor'

export function transparentize(
  color: ConstructorParameters<typeof Color>[0],
  alpha: number,
): string {
  return new Color(color).setAlpha(alpha).toHex8String()
}
