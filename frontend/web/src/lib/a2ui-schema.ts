export type A2UIBlockType =
  | "concept"
  | "steps"
  | "quiz"
  | "flashcards"
  | "diagram"
  | "table"
  | "reflection"
  | "text"; // Fallback only, should be avoided by reasoning engine

export interface A2UIMeta {
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  estimated_time_min: number;
  exportable: boolean;
}

export interface BaseBlock {
  type: A2UIBlockType;
  id?: string; // Optional for tracking interactions
}

export interface ConceptBlock extends BaseBlock {
  type: "concept";
  title: string;
  summary: string;
  key_points: string[];
}

export interface StepBlock extends BaseBlock {
  type: "steps";
  title: string;
  steps: string[];
}

export interface QuizQuestion {
  question: string;
  options: string[];
  answer: number; // Index of correct option
  explanation?: string; // Optional explanation for the answer
}

export interface QuizBlock extends BaseBlock {
  type: "quiz";
  difficulty: "easy" | "medium" | "hard";
  questions: QuizQuestion[];
}

export interface Flashcard {
  front: string;
  back: string;
}

export interface FlashcardBlock extends BaseBlock {
  type: "flashcards";
  cards: Flashcard[];
}

export interface DiagramBlock extends BaseBlock {
  type: "diagram";
  title?: string;
  caption?: string;
  code: string; // Mermaid code or SVG content
  diagram_type: "mermaid" | "svg";
}

export interface TableBlock extends BaseBlock {
  type: "table";
  title?: string;
  headers: string[];
  rows: string[][];
}

export interface ReflectionBlock extends BaseBlock {
  type: "reflection";
  prompt: string;
  placeholder?: string;
}

export interface TextBlock extends BaseBlock {
  type: "text";
  content: string;
}

export type A2UIBlock =
  | ConceptBlock
  | StepBlock
  | QuizBlock
  | FlashcardBlock
  | DiagramBlock
  | TableBlock
  | ReflectionBlock
  | TextBlock;

export interface A2UIResponse {
  meta: A2UIMeta;
  flow: A2UIBlock[];
}
