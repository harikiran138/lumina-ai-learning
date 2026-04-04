import { z } from "zod";

export const A2UIDifficultySchema = z.enum(["easy", "medium", "hard"]);
export type A2UIDifficulty = z.infer<typeof A2UIDifficultySchema>;

export const A2UIActionSchema = z.enum(["next-step", "show-hint"]);
export type A2UIAction = z.infer<typeof A2UIActionSchema>;

export const A2UIMetaSchema = z.object({
  topic: z.string().optional(),
  difficulty: A2UIDifficultySchema.optional(),
  estimatedTimeMin: z.number().int().nonnegative().optional(),
  estimated_time_min: z.number().int().nonnegative().optional(),
  exportable: z.boolean().optional(),
});

export type A2UIMeta = {
  topic?: string;
  difficulty?: A2UIDifficulty;
  estimatedTimeMin?: number;
  exportable?: boolean;
};

export const A2UIConfigSchema = z.object({
  interactive: z.boolean().optional(),
  allowHints: z.boolean().optional(),
  reveal: z.enum(["all", "stepwise"]).optional(),
  actions: z.array(A2UIActionSchema).optional(),
});

export type A2UIConfig = z.infer<typeof A2UIConfigSchema>;

const BaseBlockSchema = z.object({
  id: z.string().optional(),
  ui: A2UIConfigSchema.optional(),
  meta: A2UIMetaSchema.optional(),
});

const TextContentSchema = z.object({
  title: z.string().optional(),
  markdown: z.string(),
  summary: z.string().optional(),
  bullets: z.array(z.string()).optional(),
});

const QuizQuestionSchema = z.object({
  prompt: z.string(),
  options: z.array(z.string()).min(2),
  correctIndex: z.number().int().nonnegative().optional(),
  explanation: z.string().optional(),
  hint: z.string().optional(),
});

const QuizContentSchema = z.object({
  title: z.string().optional(),
  difficulty: A2UIDifficultySchema.optional(),
  questions: z.array(QuizQuestionSchema).min(1),
  passingScore: z.number().min(0).max(100).optional(),
});

const CodeContentSchema = z.object({
  title: z.string().optional(),
  language: z.string().default("text"),
  code: z.string(),
  filename: z.string().optional(),
  explanation: z.string().optional(),
  output: z.string().optional(),
});

const GraphDatasetSchema = z.object({
  label: z.string(),
  data: z.array(z.number()),
  color: z.string().optional(),
  backgroundColor: z.union([z.string(), z.array(z.string())]).optional(),
  borderColor: z.string().optional(),
  fill: z.boolean().optional(),
});

const GraphContentSchema = z.object({
  title: z.string().optional(),
  chartType: z.enum(["line", "bar", "pie", "doughnut"]).default("line"),
  labels: z.array(z.string()),
  datasets: z.array(GraphDatasetSchema).min(1),
  xLabel: z.string().optional(),
  yLabel: z.string().optional(),
  summary: z.string().optional(),
});

const StepItemSchema = z.object({
  title: z.string().optional(),
  body: z.string(),
  hint: z.string().optional(),
});

const StepsContentSchema = z.object({
  title: z.string(),
  steps: z.array(StepItemSchema).min(1),
  summary: z.string().optional(),
});

const DiagramContentSchema = z.object({
  title: z.string().optional(),
  diagramType: z.enum(["mermaid", "svg"]).default("mermaid"),
  code: z.string(),
  caption: z.string().optional(),
});

const TableContentSchema = z.object({
  title: z.string().optional(),
  headers: z.array(z.string()).min(1),
  rows: z.array(z.array(z.string())),
});

const FlashcardSchema = z.object({
  front: z.string(),
  back: z.string(),
});

const FlashcardsContentSchema = z.object({
  title: z.string().optional(),
  cards: z.array(FlashcardSchema).min(1),
});

const ReflectionContentSchema = z.object({
  title: z.string().optional(),
  prompt: z.string(),
  placeholder: z.string().optional(),
});

const ConceptContentSchema = z.object({
  title: z.string(),
  summary: z.string(),
  keyPoints: z.array(z.string()).optional(),
});

export const TextBlockSchema = BaseBlockSchema.extend({
  type: z.literal("text"),
  content: TextContentSchema,
});

export const QuizBlockSchema = BaseBlockSchema.extend({
  type: z.literal("quiz"),
  content: QuizContentSchema,
});

export const CodeBlockSchema = BaseBlockSchema.extend({
  type: z.literal("code"),
  content: CodeContentSchema,
});

export const GraphBlockSchema = BaseBlockSchema.extend({
  type: z.literal("graph"),
  content: GraphContentSchema,
});

export const StepsBlockSchema = BaseBlockSchema.extend({
  type: z.literal("steps"),
  content: StepsContentSchema,
});

export const DiagramBlockSchema = BaseBlockSchema.extend({
  type: z.literal("diagram"),
  content: DiagramContentSchema,
});

export const TableBlockSchema = BaseBlockSchema.extend({
  type: z.literal("table"),
  content: TableContentSchema,
});

export const FlashcardsBlockSchema = BaseBlockSchema.extend({
  type: z.literal("flashcards"),
  content: FlashcardsContentSchema,
});

export const ReflectionBlockSchema = BaseBlockSchema.extend({
  type: z.literal("reflection"),
  content: ReflectionContentSchema,
});

export const ConceptBlockSchema = BaseBlockSchema.extend({
  type: z.literal("concept"),
  content: ConceptContentSchema,
});

export const A2UIBlockSchema = z.discriminatedUnion("type", [
  TextBlockSchema,
  QuizBlockSchema,
  CodeBlockSchema,
  GraphBlockSchema,
  StepsBlockSchema,
  DiagramBlockSchema,
  TableBlockSchema,
  FlashcardsBlockSchema,
  ReflectionBlockSchema,
  ConceptBlockSchema,
]);

export type TextBlock = z.infer<typeof TextBlockSchema>;
export type QuizBlock = z.infer<typeof QuizBlockSchema>;
export type CodeBlock = z.infer<typeof CodeBlockSchema>;
export type GraphBlock = z.infer<typeof GraphBlockSchema>;
export type StepsBlock = z.infer<typeof StepsBlockSchema>;
export type DiagramBlock = z.infer<typeof DiagramBlockSchema>;
export type TableBlock = z.infer<typeof TableBlockSchema>;
export type FlashcardsBlock = z.infer<typeof FlashcardsBlockSchema>;
export type ReflectionBlock = z.infer<typeof ReflectionBlockSchema>;
export type ConceptBlock = z.infer<typeof ConceptBlockSchema>;
export type A2UIBlock = z.infer<typeof A2UIBlockSchema>;

export const LessonResponseSchema = z.object({
  version: z.string().optional(),
  type: z.literal("lesson"),
  content: z.object({
    title: z.string().optional(),
    summary: z.string().optional(),
    blocks: z.array(A2UIBlockSchema).min(1),
  }),
  ui: A2UIConfigSchema.optional(),
  meta: A2UIMetaSchema.optional(),
});

export type LessonResponse = z.infer<typeof LessonResponseSchema>;
export type A2UIRenderable = LessonResponse | A2UIBlock;

type LegacyFlowResponse = {
  meta?: Record<string, unknown>;
  flow?: unknown[];
};

function normalizeMeta(meta: Record<string, unknown> | undefined): A2UIMeta | undefined {
  if (!meta) return undefined;

  const difficulty = meta.difficulty;
  const estimatedTimeMin =
    typeof meta.estimatedTimeMin === "number"
      ? meta.estimatedTimeMin
      : typeof meta.estimated_time_min === "number"
        ? meta.estimated_time_min
        : undefined;

  return {
    topic: typeof meta.topic === "string" ? meta.topic : undefined,
    difficulty:
      difficulty === "easy" || difficulty === "medium" || difficulty === "hard"
        ? difficulty
        : undefined,
    estimatedTimeMin,
    exportable:
      typeof meta.exportable === "boolean" ? meta.exportable : undefined,
  };
}

function normalizeLegacyBlock(block: Record<string, unknown>): A2UIBlock | null {
  const type = block.type;

  switch (type) {
    case "concept":
      return {
        type: "concept",
        content: {
          title:
            typeof block.title === "string" ? block.title : "Core concept",
          summary:
            typeof block.summary === "string" ? block.summary : "",
          keyPoints: Array.isArray(block.key_points)
            ? block.key_points.filter((item): item is string => typeof item === "string")
            : [],
        },
      };
    case "steps": {
      const rawSteps: Array<{ body: string; title?: string; hint?: string }> =
        Array.isArray(block.steps)
          ? block.steps.map((item) => {
              if (typeof item === "string") return { body: item };
              if (item && typeof item === "object") {
                const s = item as Record<string, unknown>;
                return {
                  body: typeof s.body === "string" ? s.body : typeof s.step === "string" ? s.step : String(s),
                  title: typeof s.title === "string" ? s.title : undefined,
                  hint: typeof s.hint === "string" ? s.hint : undefined,
                };
              }
              return { body: String(item) };
            })
          : [{ body: "No steps available." }];
      const hasHints = rawSteps.some((s) => Boolean(s.hint));
      return {
        type: "steps",
        content: {
          title: typeof block.title === "string" ? block.title : "Steps",
          steps: rawSteps,
        },
        ui: {
          interactive: rawSteps.length > 1,
          reveal: rawSteps.length > 1 ? "stepwise" : "all",
          allowHints: hasHints,
        },
      };
    }
    case "quiz":
      return {
        type: "quiz",
        content: {
          difficulty:
            block.difficulty === "easy" ||
            block.difficulty === "medium" ||
            block.difficulty === "hard"
              ? block.difficulty
              : undefined,
          questions: Array.isArray(block.questions)
            ? block.questions
                .filter(
                  (item): item is Record<string, unknown> =>
                    Boolean(item) && typeof item === "object",
                )
                .map((question) => ({
                  prompt:
                    typeof question.question === "string"
                      ? question.question
                      : "Question",
                  options: Array.isArray(question.options)
                    ? question.options.filter(
                        (option): option is string => typeof option === "string",
                      )
                    : [],
                  correctIndex:
                    typeof question.answer === "number"
                      ? question.answer
                      : undefined,
                  explanation:
                    typeof question.explanation === "string"
                      ? question.explanation
                      : undefined,
                }))
            : [],
        },
        ui: {
          interactive: true,
        },
      };
    case "flashcards":
      return {
        type: "flashcards",
        content: {
          cards: Array.isArray(block.cards)
            ? block.cards
                .filter(
                  (item): item is Record<string, unknown> =>
                    Boolean(item) && typeof item === "object",
                )
                .map((card) => ({
                  front: typeof card.front === "string" ? card.front : "",
                  back: typeof card.back === "string" ? card.back : "",
                }))
            : [],
        },
      };
    case "diagram":
      return {
        type: "diagram",
        content: {
          title: typeof block.title === "string" ? block.title : undefined,
          code: typeof block.code === "string" ? block.code : "",
          diagramType: block.diagram_type === "svg" ? "svg" : "mermaid",
          caption:
            typeof block.caption === "string" ? block.caption : undefined,
        },
      };
    case "graph": {
      const validChartTypes = ["bar", "line", "pie", "doughnut"] as const;
      type ChartType = (typeof validChartTypes)[number];
      const rawChartType = block.chartType ?? block.graph_type;
      const chartType: ChartType = validChartTypes.includes(rawChartType as ChartType)
        ? (rawChartType as ChartType)
        : "line";

      // Handle multi-dataset format: [{label, data, color?}]
      const rawDatasets = Array.isArray(block.datasets) ? block.datasets : [];
      const isMultiDataset =
        rawDatasets.length > 0 &&
        typeof rawDatasets[0] === "object" &&
        rawDatasets[0] !== null &&
        "data" in (rawDatasets[0] as object);

      const normalizedDatasets = isMultiDataset
        ? (rawDatasets as Record<string, unknown>[]).map((ds, i) => ({
            label: typeof ds.label === "string" ? ds.label : `Series ${i + 1}`,
            data: Array.isArray(ds.data)
              ? ds.data.filter((v): v is number => typeof v === "number")
              : [],
            color: typeof ds.color === "string" ? ds.color : undefined,
            backgroundColor: typeof ds.backgroundColor !== "undefined"
              ? (ds.backgroundColor as string | string[])
              : undefined,
          }))
        : [
            {
              label:
                typeof block.dataset_label === "string"
                  ? block.dataset_label
                  : "Series 1",
              data: Array.isArray(block.values)
                ? block.values.filter((v): v is number => typeof v === "number")
                : Array.isArray(block.data)
                  ? block.data.filter((v): v is number => typeof v === "number")
                  : [],
            },
          ];

      return {
        type: "graph",
        content: {
          title: typeof block.title === "string" ? block.title : undefined,
          chartType,
          labels: Array.isArray(block.labels)
            ? block.labels.filter((item): item is string => typeof item === "string")
            : [],
          datasets: normalizedDatasets,
          xLabel: typeof block.x_label === "string" ? block.x_label : undefined,
          yLabel: typeof block.y_label === "string" ? block.y_label : undefined,
          summary: typeof block.summary === "string" ? block.summary : undefined,
        },
      };
    }
    case "code":
      return {
        type: "code",
        content: {
          title: typeof block.title === "string" ? block.title : undefined,
          language:
            typeof block.language === "string" ? block.language : "text",
          filename:
            typeof block.filename === "string" ? block.filename : undefined,
          code: typeof block.code === "string" ? block.code : "",
          explanation:
            typeof block.explanation === "string" ? block.explanation : undefined,
          output:
            typeof block.output === "string" ? block.output : undefined,
        },
      };
    case "table":
      return {
        type: "table",
        content: {
          title: typeof block.title === "string" ? block.title : undefined,
          headers: Array.isArray(block.headers)
            ? block.headers.filter((item): item is string => typeof item === "string")
            : [],
          rows: Array.isArray(block.rows)
            ? block.rows.map((row) =>
                Array.isArray(row)
                  ? row.filter((cell): cell is string => typeof cell === "string")
                  : [],
              )
            : [],
        },
      };
    case "reflection":
      return {
        type: "reflection",
        content: {
          title: typeof block.title === "string" ? block.title : undefined,
          prompt: typeof block.prompt === "string" ? block.prompt : "",
          placeholder:
            typeof block.placeholder === "string" ? block.placeholder : undefined,
        },
        ui: {
          interactive: true,
        },
      };
    case "text":
      return {
        type: "text",
        content: {
          markdown:
            typeof block.content === "string" ? block.content : "",
        },
      };
    default:
      return null;
  }
}

function normalizeLegacyResponse(response: LegacyFlowResponse): LessonResponse | null {
  const meta = normalizeMeta(
    response.meta && typeof response.meta === "object"
      ? (response.meta as Record<string, unknown>)
      : undefined,
  );
  const blocks = Array.isArray(response.flow)
    ? response.flow
        .filter(
          (block): block is Record<string, unknown> =>
            Boolean(block) && typeof block === "object",
        )
        .map((block) => normalizeLegacyBlock(block))
        .filter((block): block is A2UIBlock => Boolean(block))
    : [];

  if (blocks.length === 0) {
    return null;
  }

  return {
    version: "1.0",
    type: "lesson",
    content: {
      title: meta?.topic,
      blocks,
    },
    meta,
  };
}

export function normalizeA2UIResponse(payload: unknown): A2UIRenderable | null {
  const lessonResult = LessonResponseSchema.safeParse(payload);
  if (lessonResult.success) {
    return lessonResult.data;
  }

  const blockResult = A2UIBlockSchema.safeParse(payload);
  if (blockResult.success) {
    return blockResult.data;
  }

  if (payload && typeof payload === "object") {
    return normalizeLegacyResponse(payload as LegacyFlowResponse);
  }

  return null;
}

function safeParseJson(candidate: string): unknown | null {
  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
}

export function parseA2UIContent(raw: string): A2UIRenderable {
  const direct = normalizeA2UIResponse(safeParseJson(raw));
  if (direct) {
    return direct;
  }

  const fencedMatch = raw.match(/```json\s*([\s\S]*?)\s*```/i);
  if (fencedMatch?.[1]) {
    const fromFenced = normalizeA2UIResponse(safeParseJson(fencedMatch[1]));
    if (fromFenced) return fromFenced;
  }

  // Final fallback: wrap plain text/markdown in a TextBlock so the user always sees a response
  return {
    type: "text",
    content: { markdown: raw },
  };
}

export function extractA2UITopic(raw: string): string | null {
  const parsed = parseA2UIContent(raw);

  if (parsed.meta?.topic) {
    return parsed.meta.topic;
  }

  if (parsed.type === "lesson") {
    return parsed.content.title || null;
  }

  return null;
}
