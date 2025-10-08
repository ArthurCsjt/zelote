// Type definitions for Screen Orientation API (PWA support)
interface ScreenOrientation extends EventTarget {
  lock(orientation: OrientationLockType): Promise<void>;
  unlock(): void;
  type: OrientationType;
  angle: number;
  addEventListener(
    type: "change",
    listener: (this: this, ev: Event) => unknown,
    useCapture?: boolean
  ): void;
}

type OrientationLockType =
  | "any"
  | "natural"
  | "landscape"
  | "portrait"
  | "portrait-primary"
  | "portrait-secondary"
  | "landscape-primary"
  | "landscape-secondary";

type OrientationType =
  | "portrait-primary"
  | "portrait-secondary"
  | "landscape-primary"
  | "landscape-secondary";

interface Screen {
  orientation: ScreenOrientation;
}
