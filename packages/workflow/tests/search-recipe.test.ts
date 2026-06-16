import { describe, expect, it } from "vitest";
import { getSearchRecipe, SEARCH_PROFILES } from "../src/index.js";

describe("getSearchRecipe", () => {
  it("every profile yields a non-empty recipe that carries the universal laws", () => {
    for (const profile of SEARCH_PROFILES) {
      const text = getSearchRecipe(profile);
      expect(text.length).toBeGreaterThan(40);
      // Universal laws must ride along on every recipe.
      expect(text).toContain("复搜"); // 单次 0 必复搜
      expect(text).toContain("画质"); // 画质≠搜索词
    }
  });

  it("encodes the profile-specific lead strategy", () => {
    expect(getSearchRecipe("movie")).toContain("裸中文名");
    expect(getSearchRecipe("us-tv")).toContain("Complete"); // 英文名+Complete = 合集王
    expect(getSearchRecipe("cn-anime")).toContain("国漫"); // +国漫 万能键
    expect(getSearchRecipe("jp-anime")).toContain("1080"); // +1080P 非 4K
    expect(getSearchRecipe("kr-tv")).toContain("译名");
    expect(getSearchRecipe("us-anime")).toContain("英文名");
  });

  it("warns US-show profiles against bare-name searches (the relevance gate)", () => {
    expect(getSearchRecipe("us-tv")).toMatch(/裸|gate|闸门|别裸|token/);
  });
});
