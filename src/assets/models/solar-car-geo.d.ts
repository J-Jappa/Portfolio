export interface BakedGeometry {
  nv: number;
  tris: number;
  u32: boolean;
  pos: string;
  idx: string;
}

export const GROUPS: {
  top: BakedGeometry;
  bottom: BakedGeometry;
  wheelFull: BakedGeometry;
  wheelTread: BakedGeometry;
};
