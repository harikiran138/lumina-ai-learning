import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        primary: "var(--color-primary)",
        "primary-hover": "var(--color-primary-hover)",
        surface: "var(--color-surface)",
        "surface-elevated": "var(--color-surface-elevated)",
        background: "var(--color-bg)",
        foreground: "var(--color-text)",
        text: "var(--color-text)",
        "text-secondary": "var(--color-text-secondary)",
        "text-muted": "var(--color-text-muted)",
        border: "var(--color-border)",
        accent: "var(--color-accent)",
        warning: "var(--color-warning)",
        "warning-foreground": "var(--color-warning-foreground)",
        danger: "var(--color-danger)",
        "danger-foreground": "var(--color-danger-foreground)",
        success: "var(--color-success)",
        "success-foreground": "var(--color-success-foreground)",
        info: "var(--color-info)",
        "info-foreground": "var(--color-info-foreground)",
      },
    },
  },
};

export default config;
