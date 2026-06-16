import { describe, expect, it } from "vitest";
import { searchProfile } from "../src/index.js";

describe("searchProfile", () => {
  it("maps any movie to the single movie profile, regardless of origin", () => {
    expect(searchProfile({ type: "movie", originCountries: ["CN"] })).toBe("movie");
    expect(searchProfile({ type: "movie", originCountries: ["JP"] })).toBe("movie");
    expect(searchProfile({ type: "movie", originCountries: [] })).toBe("movie");
  });

  it("splits tv by origin (cn/us/kr/jp), else generic-tv", () => {
    expect(searchProfile({ type: "tv", originCountries: ["CN"] })).toBe("cn-tv");
    expect(searchProfile({ type: "tv", originCountries: ["US"] })).toBe("us-tv");
    expect(searchProfile({ type: "tv", originCountries: ["KR"] })).toBe("kr-tv");
    expect(searchProfile({ type: "tv", originCountries: ["JP"] })).toBe("jp-tv");
    expect(searchProfile({ type: "tv", originCountries: ["GB"] })).toBe("generic-tv");
    expect(searchProfile({ type: "tv", originCountries: [] })).toBe("generic-tv");
  });

  it("splits anime by origin (jp/cn/us), else generic-anime", () => {
    expect(searchProfile({ type: "anime", originCountries: ["JP"] })).toBe("jp-anime");
    expect(searchProfile({ type: "anime", originCountries: ["CN"] })).toBe("cn-anime");
    expect(searchProfile({ type: "anime", originCountries: ["US"] })).toBe("us-anime");
    expect(searchProfile({ type: "anime", originCountries: ["KR"] })).toBe("generic-anime");
    expect(searchProfile({ type: "anime", originCountries: [] })).toBe("generic-anime");
  });

  it("resolves co-productions by a deterministic precedence", () => {
    // anime: JP wins (anime is JP-centric); tv: CN wins (indexed in the 国产/合拍 circle).
    expect(searchProfile({ type: "anime", originCountries: ["US", "JP"] })).toBe("jp-anime");
    expect(searchProfile({ type: "tv", originCountries: ["US", "CN"] })).toBe("cn-tv");
  });
});
