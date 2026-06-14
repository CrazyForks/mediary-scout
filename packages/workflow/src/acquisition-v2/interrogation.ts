import { generateText, type LanguageModel, type ModelMessage } from "ai";

/**
 * Phase 5.5 — the §6a interrogation harness. BEFORE spending real money / touching
 * real 115, we verify the agent is "聪明" (like the hermes run): we ASK it how it
 * would handle the Lycoris-Recoil edge cases and read its reasoning, with NO tools
 * and NO side effects. The questions are a running conversation so the agent's
 * context builds the way it would in a real task. The human judges the answers and
 * tunes the prompt until they stably match the requirements — only then 6b/live.
 */

export interface InterrogationQuestion {
  id: string;
  /** The question put to the agent. */
  prompt: string;
  /** What a correct (hermes-like) answer should show — for the human reviewer. */
  expectation: string;
}

export const INTERROGATION_QUESTIONS: readonly InterrogationQuestion[] = [
  {
    id: "first_step",
    prompt: "现在让你获取莉可丽丝(Lycoris Recoil)第一季,你第一步做什么?",
    expectation: "从一个合理关键词搜索开始,先判断证据,而不是盲目转存。",
  },
  {
    id: "full_season_pack",
    prompt:
      "假设 PanSou 返回了这批候选,其中有一个明确的『莉可丽丝 全集 1080p』完整全季包,还有若干分集包。你还继续搜吗?还是转存?转哪个?会转多个覆盖全季的资源吗?",
    expectation: "认出全季包、只转这一个、不再搜、不堆叠多个覆盖全季的包(直接照出莉可丽丝事故会不会复现)。",
  },
  {
    id: "verify_landed",
    prompt: "转存之后,你怎么确认资源真的落盘了,而不是凭转存返回值就当成功?",
    expectation: "调用只读目录工具(inspectStaging/inspectTargetDir)看 staging/Season 的真实状态,信回读证据。",
  },
  {
    id: "staging_classification",
    prompt: "inspectStaging 显示 staging 里除了正片,还有字幕、特典(NCOP/SP),以及一个疑似别的作品的视频。你怎么处理这些?",
    expectation: "分类:挖正片进 Season、隔离异作品待人工复核、残留显式归类不静默留;绝不把异作品自动映射成某集。",
  },
  {
    id: "mark_obtained",
    prompt: "你怎么标记某一集已获取?在标记之前你需要确认什么?",
    expectation: "先确认该集的文件此刻确实在 Season 目录里(重读),再 markObtained;不靠文件名编码身份、不维护映射层。",
  },
  {
    id: "overlapping_ranges",
    prompt: "假设没有刚好的全季包,只有 1-10、8-13、12-20 这种重叠分集。你怎么办?扁平化后出现重复集怎么处理?",
    expectation: "组合最少的非冗余范围覆盖全季、扁平化、看到重复按真实大小分组保大删小(Life Tree),用智能不用正则。",
  },
  {
    id: "dead_link",
    prompt: "假设你选的一个候选转存失败/是死链(回读 staging 是空的)。你怎么办?",
    expectation: "把失败当证据、换一个覆盖该缺口的候选重新决策,不机械顺着 provider 顺序往下试。",
  },
  {
    id: "daily_patrol_latest_only",
    prompt:
      "每日巡检场景:这一季你只缺最新一集 S01E13,但唯一覆盖它的资源是一个含全集(1-13)的包。你怎么办?会不会把已有的 1-12 又复制一遍?",
    expectation: "转该包但只把缺的最新集挖进去/只留最新集,其余与已有重复的按保大删小,不无谓地把已有集复制一遍。",
  },
];

export interface InterrogationEntry extends InterrogationQuestion {
  answer: string;
}

export interface RunInterrogationRequest {
  model: LanguageModel;
  /** The task agent's real system prompt (so we interrogate the SHIPPING prompt). */
  systemPrompt: string;
  /** A short scenario framing (target title / season / missing episodes). */
  scenario: string;
}

/**
 * Put the questions to the agent as ONE running conversation (no tools, no side
 * effects) and collect its answers for the human to judge.
 */
export async function runInterrogation(
  request: RunInterrogationRequest,
): Promise<InterrogationEntry[]> {
  const messages: ModelMessage[] = [
    {
      role: "user",
      content: `${request.scenario}

我现在不是让你真的动手,而是要"问询"你的判断。下面我会一个个问你遇到具体情况会怎么做,请用中文清楚说明你的推理和会调用哪些工具、为什么。不要假装已经执行,只描述你的打算。`,
    },
  ];
  const transcript: InterrogationEntry[] = [];
  for (const question of INTERROGATION_QUESTIONS) {
    messages.push({ role: "user", content: question.prompt });
    const result = await generateText({
      model: request.model,
      system: request.systemPrompt,
      messages,
    });
    messages.push({ role: "assistant", content: result.text });
    transcript.push({ ...question, answer: result.text });
  }
  return transcript;
}
