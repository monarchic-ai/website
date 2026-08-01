export const explicitMemBenchmark = {
  benchmark: "LongMemEval-S",
  protocol: "longmemeval-s-answer-v1",
  generated: "1 August 2026",
  questions: 500,
  passedQuestions: 499,
  answerAccuracy: "99.8%",
  answerFaithfulness: "100%",
  answerEvidenceHitRate: "78.2%",
  retrievalRecallAtK: "100%",
  retrievalReceiptCoverage: "100%",
  averageContext: "797 tokens",
  averageContextShort: "797 tok",
  averageLatency: "62.5 ms",
  contextBudget: "800 tokens",
  runtimeProfile: "Synthesis",
  retrievalLimit: "Top 50",
  evidenceUrl:
    "https://github.com/monarchic-ai/ExplicitMem-MCP/blob/main/data/longmemeval-synthesis-benchmark-evidence.json",
} as const;

export const explicitMemQuestionTypes = [
  { label: "Knowledge update", count: 78, accuracy: "100%", passed: "78 / 78" },
  { label: "Multi-session", count: 133, accuracy: "100%", passed: "133 / 133" },
  { label: "Single-session assistant", count: 56, accuracy: "100%", passed: "56 / 56" },
  { label: "Single-session preference", count: 30, accuracy: "100%", passed: "30 / 30" },
  { label: "Single-session user", count: 70, accuracy: "100%", passed: "70 / 70" },
  { label: "Temporal reasoning", count: 133, accuracy: "99.2%", passed: "132 / 133" },
] as const;

export const explicitMemRunConfig = [
  ["Benchmark", explicitMemBenchmark.benchmark],
  ["Protocol", explicitMemBenchmark.protocol],
  ["Judge", "Deterministic normalized answer string match"],
  ["Runtime profile", explicitMemBenchmark.runtimeProfile],
  ["Retrieval limit", explicitMemBenchmark.retrievalLimit],
  ["Session character limit", "None"],
  ["Question coverage", `All ${explicitMemBenchmark.questions} questions`],
  ["Generated", explicitMemBenchmark.generated],
  ["Claim scope", "This benchmark configuration"],
] as const;
