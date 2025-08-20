# Bloomberg-Inspired Dark Theme Color Scheme

## Overview
This document outlines the Bloomberg-inspired dark theme color scheme for the quantitative trading system. The theme is designed to provide a professional, easy-on-the-eyes interface suitable for extended trading sessions.

## Color Philosophy
Bloomberg Terminal uses a distinctive dark theme with:
- Deep black backgrounds for reduced eye strain
- High contrast text for readability
- Professional accent colors for market data
- Subtle gradients and shadows for depth

## Core Color Variables

### Background Colors
```css
/* Primary Background */
--bg-primary: #0a0a0a;          /* Deep black - main background */
--bg-secondary: #121212;        /* Dark gray - secondary backgrounds */
--bg-tertiary: #1a1a1a;          /* Medium dark - card backgrounds */
--bg-quaternary: #222222;        /* Lighter dark - panels and sections */
--bg-hover: #2a2a2a;             /* Hover state background */
--bg-active: #333333;            /* Active/selected background */

/* Surface Colors */
--surface-primary: #0d0d0d;      /* Main surface */
--surface-secondary: #141414;    /* Secondary surface */
--surface-elevated: #1c1c1c;     /* Elevated surface (cards) */
--surface-overlay: #242424;     /* Overlay surfaces */
```

### Text Colors
```css
/* Primary Text */
--text-primary: #ffffff;         /* White - primary text */
--text-secondary: #e0e0e0;       /* Light gray - secondary text */
--text-tertiary: #b0b0b0;        /* Medium gray - tertiary text */
--text-muted: #808080;           /* Gray - muted text */
--text-disabled: #606060;        /* Dark gray - disabled text */

/* Special Text */
--text-success: #00d4aa;         /* Bloomberg green - positive values */
--text-danger: #ff3b30;          /* Red - negative values */
--text-warning: #ff9500;         /* Orange - warnings */
--text-info: #007aff;            /* Blue - information */
```

### Accent Colors (Market Data)
```css
/* Market Colors */
--market-up: #00d4aa;            /* Green - bullish/positive */
--market-down: #ff3b30;          /* Red - bearish/negative */
--market-neutral: #ffffff;       /* White - neutral */
--market-volatile: #ff9500;      /* Orange - high volatility */

/* Trading Colors */
--buy-color: #00d4aa;            /* Green - buy orders */
--sell-color: #ff3b30;           /* Red - sell orders */
--hold-color: #007aff;           /* Blue - hold positions */
```

### Interactive Elements
```css
/* Button Colors */
--btn-primary: #007aff;          /* Blue - primary actions */
--btn-primary-hover: #0056b3;    /* Darker blue - hover */
--btn-secondary: #404040;         /* Gray - secondary actions */
--btn-secondary-hover: #505050;   /* Lighter gray - hover */

/* Form Elements */
--input-bg: #1a1a1a;             /* Input background */
--input-border: #404040;         /* Input border */
--input-focus: #007aff;          /* Input focus color */
--input-text: #ffffff;           /* Input text */
--input-placeholder: #808080;     /* Input placeholder */
```

### Data Visualization
```css
/* Chart Colors */
--chart-grid: #2a2a2a;           /* Chart grid lines */
--chart-axis: #606060;           /* Chart axis labels */
--chart-line-up: #00d4aa;        /* Upward trend lines */
--chart-line-down: #ff3b30;      /* Downward trend lines */
--chart-line-neutral: #007aff;   /* Neutral trend lines */

/* Volume Bars */
--volume-up: rgba(0, 212, 170, 0.8);    /* Up volume */
--volume-down: rgba(255, 59, 48, 0.8);  /* Down volume */
--volume-neutral: rgba(255, 255, 255, 0.3); /* Neutral volume */
```

### Status and Indicators
```css
/* Status Colors */
--status-online: #00d4aa;         /* Green - online/active */
--status-offline: #ff3b30;        /* Red - offline/inactive */
--status-warning: #ff9500;        /* Orange - warning */
--status-info: #007aff;           /* Blue - information */

/* Alert Colors */
--alert-success: rgba(0, 212, 170, 0.1);    /* Success background */
--alert-danger: rgba(255, 59, 48, 0.1);      /* Danger background */
--alert-warning: rgba(255, 149, 0, 0.1);     /* Warning background */
--alert-info: rgba(0, 122, 255, 0.1);        /* Info background */
```

### Border and Divider Colors
```css
/* Borders */
--border-primary: #2a2a2a;        /* Primary borders */
--border-secondary: #404040;      /* Secondary borders */
--border-tertiary: #505050;       /* Tertiary borders */
--divider: #2a2a2a;               /* Dividers */

/* Focus Ring */
--focus-ring: rgba(0, 122, 255, 0.5);  /* Focus outline */
```

### Shadow Effects
```css
/* Shadows */
--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.3);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.4);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.5);
--shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.6);

/* Glow Effects */
--glow-primary: 0 0 10px rgba(0, 122, 255, 0.3);
--glow-success: 0 0 10px rgba(0, 212, 170, 0.3);
--glow-danger: 0 0 10px rgba(255, 59, 48, 0.3);
```

## Typography Scale
```css
/* Font Sizes */
--font-xs: 11px;          /* Extra small - data labels */
--font-sm: 12px;          /* Small - secondary info */
--font-base: 14px;        /* Base - body text */
--font-lg: 16px;          /* Large - headings */
--font-xl: 18px;          /* Extra large - titles */
--font-2xl: 20px;         /* 2X large - main titles */
--font-3xl: 24px;         /* 3X large - page headers */

/* Font Weights */
--font-light: 300;        /* Light */
--font-normal: 400;       /* Normal */
--font-medium: 500;       /* Medium */
--font-semibold: 600;     /* Semibold */
--font-bold: 700;         /* Bold */

/* Line Heights */
--leading-tight: 1.25;    /* Tight */
--leading-normal: 1.5;    /* Normal */
--leading-relaxed: 1.75;  /* Relaxed */
```

## Spacing Scale
```css
/* Spacing Units */
--space-xs: 4px;          /* Extra small */
--space-sm: 8px;          /* Small */
--space-md: 12px;         /* Medium */
--space-lg: 16px;         /* Large */
--space-xl: 20px;         /* Extra large */
--space-2xl: 24px;        /* 2X large */
--space-3xl: 32px;        /* 3X large */
--space-4xl: 40px;        /* 4X large */
```

## Border Radius
```css
/* Border Radius */
--radius-sm: 4px;         /* Small */
--radius-md: 6px;         /* Medium */
--radius-lg: 8px;         /* Large */
--radius-xl: 12px;        /* Extra large */
--radius-full: 9999px;    /* Full circle */
```

## Transitions
```css
/* Transition Timing */
--transition-fast: 150ms;     /* Fast transitions */
--transition-normal: 300ms;   /* Normal transitions */
--transition-slow: 500ms;     /* Slow transitions */

/* Transition Easing */
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
```

## Implementation Guidelines

### CSS Root Variables
```css
:root {
  /* Bloomberg Dark Theme */
  --bg-primary: #0a0a0a;
  --bg-secondary: #121212;
  --bg-tertiary: #1a1a1a;
  --bg-quaternary: #222222;
  --bg-hover: #2a2a2a;
  --bg-active: #333333;
  
  --text-primary: #ffffff;
  --text-secondary: #e0e0e0;
  --text-tertiary: #b0b0b0;
  --text-muted: #808080;
  --text-disabled: #606060;
  
  --market-up: #00d4aa;
  --market-down: #ff3b30;
  --market-neutral: #ffffff;
  --market-volatile: #ff9500;
  
  --btn-primary: #007aff;
  --btn-primary-hover: #0056b3;
  --btn-secondary: #404040;
  --btn-secondary-hover: #505050;
  
  --chart-grid: #2a2a2a;
  --chart-axis: #606060;
  --chart-line-up: #00d4aa;
  --chart-line-down: #ff3b30;
  --chart-line-neutral: #007aff;
}
```

### Dark Mode Application
```css
/* Apply dark theme */
.dark {
  color-scheme: dark;
}

/* Force dark mode for all elements */
.dark body {
  background-color: var(--bg-primary);
  color: var(--text-primary);
}

/* Element-specific dark styles */
.dark .card {
  background-color: var(--bg-tertiary);
  border-color: var(--border-primary);
}

.dark .btn-primary {
  background-color: var(--btn-primary);
  color: white;
}

.dark .btn-primary:hover {
  background-color: var(--btn-primary-hover);
}
```

## Accessibility Considerations

### Contrast Ratios
- Text Primary on Background: 21:1 (AAA)
- Text Secondary on Background: 14:1 (AAA)
- Text Tertiary on Background: 7:1 (AA)
- Links and Buttons: 4.5:1 (AA)

### Color Blindness
- Market data uses both color and symbols (▲/▼)
- Status indicators include icons in addition to colors
- Important actions have text labels

### Reduced Motion
- All animations respect `prefers-reduced-motion`
- Transitions can be disabled system-wide
- Essential information doesn't rely on animations

## Usage Examples

### Market Data Display
```css
.price-up {
  color: var(--market-up);
}

.price-down {
  color: var(--market-down);
}

.price-neutral {
  color: var(--market-neutral);
}
```

### Trading Interface
```css
.buy-button {
  background-color: var(--buy-color);
  color: white;
}

.sell-button {
  background-color: var(--sell-color);
  color: white;
}
```

### Status Indicators
```css
.status-online {
  color: var(--status-online);
  background-color: rgba(0, 212, 170, 0.1);
}

.status-offline {
  color: var(--status-offline);
  background-color: rgba(255, 59, 48, 0.1);
}
```

## Browser Support
- Modern browsers with CSS custom properties support
- Fallback colors provided for older browsers
- Responsive design considerations for all screen sizes

## Maintenance
- All colors defined as CSS custom properties
- Easy to modify theme by updating root variables
- Consistent naming convention for easy reference
- Documented usage patterns for developers