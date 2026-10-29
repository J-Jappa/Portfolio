export interface ExplodeGroup {
  id: string;
  /** Label shown once the group has separated; null = moves but unlabelled */
  label: string | null;
  /** Explode offset along the stack axis, model mm (+ is the front face) */
  dz: number;
  /** Sideways explode offset, model mm */
  dx: number;
  nv: number;
  ne: number;
  u32: boolean;
  /** base64 Uint16 positions, quantised into BOUNDS */
  pos: string;
  /** base64 line-segment index pairs */
  idx: string;
}

export const BOUNDS: { min: [number, number, number]; max: [number, number, number] };
export const GROUPS: ExplodeGroup[];

/** The display's glass face in model mm (x = width, y = length), or null */
export const SCREEN: { group: string; min: [number, number]; max: [number, number]; z: number } | null;

/** 1-bit boot animation for the screen, or null. Bits are row-major, MSB first. */
export const ANIM: {
  w: number;
  h: number;
  fps: number;
  frames: number;
  /** Frame to hold on once it has played */
  hold: number;
  /** Bit value that means "ink" */
  ink: 0 | 1;
  /** base64, one raw frame (the held end frame), shown without motion */
  poster: string;
  /** base64 zlib stream of every frame */
  z: string;
} | null;
