import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { A2UIRenderer } from './A2UIRenderer';
import React from 'react';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock ResizeObserver for Chart.js
global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));

describe('A2UIRenderer', () => {
  it('renders markdown text correctly', () => {
    render(<A2UIRenderer content="Hello world" />);
    expect(screen.getByText('Hello world')).toBeDefined();
  });

  it('renders a Quiz component from JSON block', () => {
    const quizContent = JSON.stringify({
      component: 'Quiz',
      props: {
        question: 'What is 2+2?',
        options: ['3', '4', '5'],
        correctIndex: 1,
        topic: 'Math',
        difficulty: 'easy'
      }
    });
    
    render(<A2UIRenderer content={`\`\`\`a2ui\n${quizContent}\n\`\`\``} />);
    
    expect(screen.getByText('What is 2+2?')).toBeDefined();
    expect(screen.queryByText('Mathematicians')).toBeNull(); // Sanity check
    expect(screen.getByText('Math')).toBeDefined();
  });

  it('handles quiz interactions', () => {
    const onAction = vi.fn();
    const quizContent = JSON.stringify({
      component: 'Quiz',
      props: {
        question: 'Is testing good?',
        options: ['Yes', 'No'],
        correctIndex: 0,
        topic: 'QA'
      }
    });

    render(<A2UIRenderer content={`\`\`\`a2ui\n${quizContent}\n\`\`\``} onAction={onAction} />);

    // Select "Yes"
    const yesButton = screen.getByText('Yes');
    fireEvent.click(yesButton);

    // Submit
    const submitButton = screen.getByText('Submit Answer');
    fireEvent.click(submitButton);

    expect(screen.getByText('Correct!')).toBeDefined();
    expect(onAction).toHaveBeenCalledWith('quiz_answer', expect.objectContaining({
      isCorrect: true,
      selectedOption: 'Yes'
    }));
  });

  it('renders a Flashcard component', () => {
    const flashcardContent = JSON.stringify({
      component: 'Flashcard',
      props: {
        front: 'Term',
        back: 'Definition',
        subject: 'History'
      }
    });

    render(<A2UIRenderer content={`\`\`\`a2ui\n${flashcardContent}\n\`\`\``} />);
    
    expect(screen.getByText('Term')).toBeDefined();
    expect(screen.getByText('History')).toBeDefined();
  });

  it('renders mixtures of markdown and a2ui blocks', () => {
    const mixedContent = 'Before\n```a2ui\n{"component":"CodeBlock","props":{"code":"const x = 1;"}}\n```\nAfter';
    render(<A2UIRenderer content={mixedContent} />);
    expect(screen.getByText('Before')).toBeDefined();
    expect(screen.getByText('const x = 1;')).toBeDefined();
    expect(screen.getByText('After')).toBeDefined();
  });
});
