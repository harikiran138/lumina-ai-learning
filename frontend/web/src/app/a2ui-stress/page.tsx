"use client";

import React, { useState } from "react";
import { A2UIRenderer } from "@/components/advanced/A2UIRenderer";
import { Button } from "@/components/ui/button";

export default function A2UIStressPage() {
  const [useVariantB, setUseVariantB] = useState(false);

  const toggleVariant = () => setUseVariantB(!useVariantB);

  // --- Test Data Generators ---

  const getQuizData = (variantB: boolean) =>
    variantB
      ? {
          component: "Quiz",
          props: {
            question: "What is the capital of France?",
            options: ["London", "Berlin", "Paris", "Madrid"],
            correctIndex: 2,
            explanation: "Paris is the capital of France.",
            topic: "Geography",
            difficulty: "easy",
          },
        }
      : {
          component: "Quiz",
          props: {
            question: "What is 2 + 2?",
            options: ["3", "4", "5", "6"],
            correctIndex: 1,
            explanation: "2 plus 2 equals 4.",
            topic: "Math",
            difficulty: "easy",
          },
        };

  const getFlashcardData = (variantB: boolean) =>
    variantB
      ? {
          component: "Flashcard",
          props: {
            front: "What is the powerhouse of the cell?",
            back: "Mitochondria",
            subject: "Biology",
          },
        }
      : {
          component: "Flashcard",
          props: {
            front: "What does HTML stand for?",
            back: "HyperText Markup Language",
            subject: "Web Dev",
          },
        };

  const getChartData = (variantB: boolean) =>
    variantB
      ? {
          component: "Chart",
          props: {
            type: "line",
            title: "Monthly Revenue",
            labels: ["Jan", "Feb", "Mar", "Apr"],
            data: [1200, 1900, 3000, 5000],
            datasetLabel: "Revenue ($)",
          },
        }
      : {
          component: "Chart",
          props: {
            type: "bar",
            title: "Student Progress",
            labels: ["Week 1", "Week 2", "Week 3"],
            data: [65, 78, 90],
            datasetLabel: "Score (%)",
          },
        };

  const getTimelineData = (variantB: boolean) =>
    variantB
      ? {
          component: "Timeline",
          props: {
            title: "Project Roadmap",
            events: [
              {
                date: "Q1 2024",
                title: "Planning",
                description: "Define scope and requirements",
              },
              {
                date: "Q2 2024",
                title: "Development",
                description: "Core features implementation",
              },
            ],
          },
        }
      : {
          component: "Timeline",
          props: {
            title: "History of AI",
            events: [
              {
                date: "1956",
                title: "Dartmouth Workshop",
                description: "Birth of AI as a field",
              },
              {
                date: "2017",
                title: "Transformer Model",
                description: "Paper 'Attention Is All You Need' published",
              },
            ],
          },
        };

  const getComparisonData = (variantB: boolean) =>
    variantB
      ? {
          component: "ComparisonTable",
          props: {
            title: "iOS vs Android",
            headers: ["Feature", "iOS", "Android"],
            rows: [
              { feature: "Developer", values: ["Apple", "Google"] },
              { feature: "Source", values: ["Closed", "Open Source"] },
            ],
          },
        }
      : {
          component: "ComparisonTable",
          props: {
            title: "React vs Vue",
            headers: ["Aspect", "React", "Vue"],
            rows: [
              { feature: "Learning Curve", values: ["Moderate", "Easy"] },
              { feature: "Syntax", values: ["JSX", "Templates"] },
            ],
          },
        };

  const getCodeBlockData = (variantB: boolean) =>
    variantB
      ? {
          component: "CodeBlock",
          props: {
            code: "console.log('Hello, World!');",
            language: "javascript",
            filename: "hello.js",
            explanation: "Simple JS print statement.",
          },
        }
      : {
          component: "CodeBlock",
          props: {
            code: "def greet(name):\n    return f'Hello, {name}'",
            language: "python",
            filename: "greet.py",
            explanation: "Python function to greet a user.",
          },
        };

  const getMermaidData = (variantB: boolean) =>
    variantB
      ? {
          component: "Mermaid",
          props: {
            chart:
              "graph LR; A[Start] --> B{Decision}; B -->|Yes| C[Do Task]; B -->|No| D[End];",
            title: "Workflow Diagram",
          },
        }
      : {
          component: "Mermaid",
          props: {
            chart: "graph TD; Client --> Server; Server --> Database;",
            title: "System Architecture",
          },
        };

  const TEST_CASES = [
    { id: "quiz", title: "Quiz Component", getData: getQuizData },
    {
      id: "flashcard",
      title: "Flashcard Component",
      getData: getFlashcardData,
    },
    { id: "chart", title: "Chart Component", getData: getChartData },
    { id: "timeline", title: "Timeline Component", getData: getTimelineData },
    { id: "comparison", title: "Comparison Table", getData: getComparisonData },
    { id: "codeblock", title: "Code Block", getData: getCodeBlockData },
    { id: "mermaid", title: "Mermaid Diagram", getData: getMermaidData },
  ];

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-12 pb-24">
      <div className="sticky top-0 z-50 bg-white dark:bg-black p-4 border-b flex justify-between items-center shadow-md">
        <h1 className="text-2xl font-bold">A2UI Stress Test & Verification</h1>
        <Button
          onClick={toggleVariant}
          variant={useVariantB ? "destructive" : "default"}
        >
          {useVariantB
            ? "Switch to State A (Original)"
            : "Switch to State B (Updated)"}
        </Button>
      </div>

      <p className="text-gray-500">
        This page verifies all A2UI components rendering and their adaptability
        to dynamic data changes. Use the toggle above to simulate a full state
        update.
      </p>

      {TEST_CASES.map((test) => {
        const data = test.getData(useVariantB);
        const jsonString = JSON.stringify(data, null, 2);
        const content = `\`\`\`a2ui\n${jsonString}\n\`\`\``;

        return (
          <div
            key={test.id}
            className="border p-6 rounded-xl bg-gray-50 dark:bg-gray-900 shadow-sm"
          >
            <h2 className="text-lg font-semibold mb-4 border-b pb-2">
              {test.title}
            </h2>

            <div className="bg-white dark:bg-[#0d1117] p-4 rounded-xl border border-gray-200 dark:border-gray-800 min-h-[100px]">
              <A2UIRenderer content={content} />
            </div>

            <details className="mt-4 text-xs text-gray-500">
              <summary className="cursor-pointer hover:text-gray-700">
                View Source Payload
              </summary>
              <pre className="mt-2 bg-gray-200 dark:bg-gray-800 p-3 rounded overflow-x-auto">
                {jsonString}
              </pre>
            </details>
          </div>
        );
      })}

      {/* Edge Cases Section */}
      <div className="border-t pt-8 mt-12">
        <h2 className="text-xl font-bold mb-6 text-red-500">
          Edge Case Handling
        </h2>
        <div className="grid gap-8">
          {/* <div className="border border-red-200 p-4 rounded-xl bg-red-50/50">
            <h3 className="font-semibold mb-2 text-red-700">Malformed JSON</h3>
            <A2UIRenderer
              content={`\`\`\`a2ui\n{ "component": "Quiz", "props": { "question": "JSON Broken" \n\`\`\``}
            />
          </div> */}
          <div className="border border-yellow-200 p-4 rounded-xl bg-yellow-50/50">
            <h3 className="font-semibold mb-2 text-yellow-700">
              Unknown Component
            </h3>
            <A2UIRenderer
              content={`\`\`\`a2ui\n{ "component": "FutureWidget", "props": {} }\n\`\`\``}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
