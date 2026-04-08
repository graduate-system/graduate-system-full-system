import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "must-green":       "#1a5c2a",
        "must-green-mid":   "#236e33",
        "must-green-light": "#2d8b47",
        "must-gold":        "#f5a623",
        "must-gold-dark":   "#c8841a",

        background:         "var(--background)",
        foreground:         "var(--foreground)",
        card:               { DEFAULT: "var(--card)", foreground: "var(--card-foreground)" },
        popover:            { DEFAULT: "var(--popover)", foreground: "var(--popover-foreground)" },
        primary:            { DEFAULT: "var(--primary)", foreground: "var(--primary-foreground)" },
        secondary:          { DEFAULT: "var(--secondary)", foreground: "var(--secondary-foreground)" },
        muted:              { DEFAULT: "var(--muted)", foreground: "var(--muted-foreground)" },
        accent:             { DEFAULT: "var(--accent)", foreground: "var(--accent-foreground)" },
        destructive:        { DEFAULT: "var(--destructive)" },
        border:             "var(--border)",
        input:              "var(--input)",
        ring:               "var(--ring)",
        sidebar: {
          DEFAULT:            "var(--sidebar)",
          foreground:         "var(--sidebar-foreground)",
          primary:            { DEFAULT: "var(--sidebar-primary)", foreground: "var(--sidebar-primary-foreground)" },
          accent:             { DEFAULT: "var(--sidebar-accent)", foreground: "var(--sidebar-accent-foreground)" },
          border:             "var(--sidebar-border)",
          ring:               "var(--sidebar-ring)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};

export default config;
