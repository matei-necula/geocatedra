import { describe, expect, it } from "vitest";
import { resizePlan } from "./imageResize";

describe("resizePlan", () => {
  it("returns null when both sides within max", () => {
    expect(resizePlan(1200, 800)).toBeNull();
  });
  it("scales the long side down to max, keeps aspect ratio", () => {
    expect(resizePlan(3200, 1600)).toEqual({ w: 1600, h: 800 });
    expect(resizePlan(1600, 3200)).toEqual({ w: 800, h: 1600 });
  });
});
