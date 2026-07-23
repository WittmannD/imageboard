export interface LayoutPreferences {
  CONTAINER_WIDTH: number;
  MIN_ASPECT: number;
  MAX_ASPECT: number;
  GAP: number;
  IDEAL_MIN_SIZE: number;
  IDEAL_MIN_ASPECT: number;
  IDEAL_MAX_ASPECT: number;
  IDEAL_GALLERY_ASPECT: number;
}

export class LayoutContext implements LayoutPreferences {
  constructor(
    public readonly CONTAINER_WIDTH: number,
    public readonly MIN_ASPECT: number,
    public readonly MAX_ASPECT: number,
    public readonly GAP: number,
    public readonly IDEAL_MIN_SIZE: number,
    public readonly IDEAL_MIN_ASPECT: number,
    public readonly IDEAL_MAX_ASPECT: number,
    public readonly IDEAL_GALLERY_ASPECT: number,
  ) {}

  static from(preferences: LayoutPreferences): LayoutContext {
    return new LayoutContext(
      preferences.CONTAINER_WIDTH,
      preferences.MIN_ASPECT,
      preferences.MAX_ASPECT,
      preferences.GAP,
      preferences.IDEAL_MIN_SIZE,
      preferences.IDEAL_MIN_ASPECT,
      preferences.IDEAL_MAX_ASPECT,
      preferences.IDEAL_GALLERY_ASPECT,
    );
  }

  getEffectiveAspect(ratio: number) {
    return ratio < this.MIN_ASPECT
      ? this.MIN_ASPECT
      : ratio > this.MAX_ASPECT
        ? this.MIN_ASPECT
        : ratio;
  }
}
