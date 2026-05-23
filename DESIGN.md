# Rotten - Design System Specification

## Overview

Rotten's interface follows Cal.com's clean, modern-SaaS aesthetic — white canvas with black primary CTAs, generous whitespace, and clear hierarchy. The system uses **Inter** typography (Cal Sans substitute at weight 600 for display), light-gray cards for feature sections, and embedded product UI fragments showing real functionality.

The design reads as confidently engineered without trying to impress — every section has clear hierarchy, generous whitespace, and a single primary action.

---

## Colors

### Brand & Accent
- **Primary** (`#111111`): Dominant action color. All primary CTAs, display type. Press state: `#242424`
- **Brand Accent** (`#3b82f6`): Used sparingly on inline links and status indicators
- **Badge Pastels**: 
  - Orange: `#fb923c`
  - Pink: `#ec4899`
  - Violet: `#8b5cf6`
  - Emerald: `#34d399`

### Surface
- **Canvas** (`#ffffff`): Default page background
- **Surface Soft** (`#f8f9fa`): Nav pill background, soft dividers
- **Surface Card** (`#f5f5f5`): Feature cards, settings sections
- **Surface Strong** (`#e5e7eb`): Hairline borders, disabled states
- **Surface Dark** (`#101010`): Footer background (only dark surface)
- **Surface Dark Elevated** (`#1a1a1a`): Nested cards in dark areas
- **Hairline** (`#e5e7eb`): 1px borders on light surfaces
- **Hairline Soft** (`#f3f4f6`): Barely-visible dividers

### Text
- **Ink** (`#111111`): Headlines, primary text
- **Body** (`#374151`): Default running text
- **Muted** (`#6b7280`): Secondary text, labels
- **Muted Soft** (`#898989`): Tertiary text, captions
- **On Primary** (`#ffffff`): Text on primary buttons
- **On Dark** (`#ffffff`): Text on dark surfaces
- **On Dark Soft** (`#a1a1aa`): Footer body text

### Semantic
- **Success** (`#10b981`): Confirmation states
- **Warning** (`#f59e0b`): Warning callouts
- **Error** (`#ef4444`): Validation errors

---

## Typography

### Font Family
- **Display**: Inter weight 600 with negative letter-spacing (-0.5px to -2px)
- **Body/UI**: Inter weight 400-600, 0 letter-spacing
- **Code**: JetBrains Mono weight 400

### Hierarchy

| Token | Size | Weight | Line Height | Letter Spacing | Use |
|-------|------|--------|-------------|----------------|-----|
| `display-xl` | 64px | 600 | 1.05 | -2px | Hero h1 |
| `display-lg` | 48px | 600 | 1.1 | -1.5px | Section heads |
| `display-md` | 36px | 600 | 1.15 | -1px | Sub-section heads |
| `display-sm` | 28px | 600 | 1.2 | -0.5px | Card titles |
| `title-lg` | 22px | 600 | 1.3 | -0.3px | Feature titles |
| `title-md` | 18px | 600 | 1.4 | 0 | Card headers |
| `title-sm` | 16px | 600 | 1.4 | 0 | Small titles |
| `body-md` | 16px | 400 | 1.5 | 0 | Default text |
| `body-sm` | 14px | 400 | 1.5 | 0 | Footer, fine-print |
| `caption` | 13px | 500 | 1.4 | 0 | Badge labels |
| `button` | 14px | 600 | 1.0 | 0 | Button labels |
| `nav-link` | 14px | 500 | 1.4 | 0 | Navigation items |

---

## Layout

### Spacing System
- **Base unit**: 4px
- **Tokens**: 
  - `xxs`: 4px
  - `xs`: 8px
  - `sm`: 12px
  - `md`: 16px
  - `lg`: 24px
  - `xl`: 32px
  - `xxl`: 48px
  - `section`: 96px

### Grid & Container
- **Max content width**: 1200px centered
- **Section padding**: 96px vertical
- **Card padding**: 32px for feature cards, 24px for smaller cards
- **Gutters**: 24px between cards in grids

---

## Shapes

### Border Radius Scale
| Token | Value | Use |
|-------|-------|-----|
| `xs` | 4px | Badge accents |
| `sm` | 6px | Small buttons |
| `md` | 8px | Standard buttons, inputs |
| `lg` | 12px | Content cards |
| `xl` | 16px | Hero cards |
| `pill` | 9999px | Nav pills, badges |
| `full` | 50% | Avatars, icon buttons |

---

## Components

### Buttons
- **Primary**: Black (#111111), white text, 8px radius, 12px×20px padding, 40px height
- **Secondary**: White with hairline, black text, same dimensions
- **Icon Circular**: 36×36px circle, hairline border

### Cards
- **Feature Card**: Light gray (#f5f5f5), 12px radius, 32px padding
- **Settings Section**: White with hairline, 12px radius, 24px padding
- **Preview Card**: White, 12px radius, subtle shadow

### Inputs
- **Text Input**: White, hairline border, 8px radius, 40px height
- **Select**: Same as text input with dropdown arrow
- **Slider**: Accent color track, 16px thumb
- **Checkbox**: 16px square, 4px radius

### Navigation
- **Top Nav**: 64px height, white background, pinned
- **Nav Pill Group**: Soft gray wrapper, pill radius, active state white

---

## Rotten-Specific Components

### Settings Panel
- **Compact Mode** (preview visible): 360px width, vertical scroll
- **Expanded Mode** (preview hidden): Full width, 3-column grid on desktop
- **Section Headers**: Icon + title, color-coded
- **Sticky Header**: Title + toggle button
- **Sticky Footer**: Generate button

### Preview Panel
- **Container**: White card, 12px radius, subtle shadow
- **Aspect Ratio**: 16:9 slide preview
- **Background**: Dynamic or default gray

### File Upload Box
- **Dashed Border**: Hairline, 12px radius
- **Hover State**: Light gray background
- **Active State**: File name + size display

### Color Picker
- **Swatch**: 40px circle, current color fill
- **Popover**: Color grid, hex input

### Status Messages
- **Success**: Green background, checkmark icon
- **Error**: Red background, exclamation icon
- **Loading**: Blue background, spinner icon

---

## Responsive Behavior

### Breakpoints
| Name | Width | Changes |
|------|-------|---------|
| Mobile | < 768px | 1-column, stacked layout |
| Tablet | 768-1024px | 2-column grid |
| Desktop | 1024-1440px | 3-column grid |
| Wide | > 1440px | Max 1200px content width |

### Touch Targets
- Minimum 40×40px for all interactive elements
- 44×44px preferred for primary actions

---

## Elevation & Depth

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat | No shadow | Body sections |
| Hairline | 1px border | Inputs, dividers |
| Card | Light gray bg | Feature cards |
| Subtle shadow | `0 1px 2px rgba(0,0,0,0.05)` | Elevated cards |
| Strong shadow | `0 4px 12px rgba(0,0,0,0.08)` | Modals, popovers |

---

## Do's and Don'ts

### Do
✅ Use black (#111111) for primary CTAs
✅ Apply negative letter-spacing on display sizes
✅ Use light gray cards for feature sections
✅ Keep generous whitespace (96px sections)
✅ Use circular avatars at 36px
✅ End pages with dark footer
✅ Show real product UI in preview

### Don't
❌ Don't use accent colors on primary CTAs
❌ Don't bold beyond weight 600
❌ Don't use radius beyond 16px on cards
❌ Don't add dark surfaces except footer
❌ Don't repeat same surface in consecutive sections
❌ Don't add excessive shadows

---

## Animation Principles
- **Duration**: 150-300ms for most transitions
- **Easing**: ease-in-out for smooth motion
- **Properties**: transform, opacity (GPU-accelerated)
- **Hover**: Subtle opacity/scale changes only

---

## Accessibility
- **Contrast**: WCAG AA minimum (4.5:1 for body text)
- **Focus States**: Visible outline on all interactive elements
- **Touch Targets**: Minimum 40×40px
- **Screen Readers**: Proper ARIA labels
- **Keyboard Navigation**: Full support

---

This design system provides the foundation for Rotten's redesigned interface, following Cal.com's modern-SaaS aesthetic while maintaining the app's functionality and customization options.
