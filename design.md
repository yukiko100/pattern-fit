# Pattern Fit Web v1 - Design

## Design goals

Pattern Fit is a neutral, practical browser tool for making transparent pattern
PNGs. The interface should make the generated pattern the visual focus while
keeping settings compact, clear, and easy to scan.

The design must not imitate the UI of Canva, Figma, PowerPoint, Google Slides,
or another design product. It uses custom CSS, Light theme only, and standard
HTML controls with accessible labels and states.

## Page layout

Desktop is the primary target.

- Center the application in a page shell with a maximum width of 1440 px.
- Use a 2-column grid above the responsive breakpoint.
- Left column: Settings panel, 360 px preferred width, with a 320 px minimum
  and 400 px maximum.
- Right column: flexible Preview area, using the remaining available width.
- Use a 32 px column gap and 32 px outer page padding on large screens.
- The header sits above both columns and contains the Pattern Fit name and a
  short one-line description only.
- The settings panel may be sticky within the viewport when sufficient vertical
  space is available; it must remain normally scrollable when it is not.

## Settings panel

The Settings panel uses one vertical sequence with this order:

1. Pattern
2. Pattern settings
3. Canvas size
4. Download PNG

Each section has a visible section heading and uses a subtle divider or
consistent whitespace to establish separation. There are no cards inside cards
or unnecessary decorative containers.

### Pattern

- Present Grid, Dots, and Stripes as a single-choice segmented control or
  radio group.
- Each choice includes a small neutral visual sample and text label.
- The selected state is communicated by more than color, such as border,
  fill, and/or weight.
- The control has an accessible group label of "Pattern".

### Pattern settings

Common:

- Color control.

Grid:

- Pattern spacing.
- Line thickness.

Dots:

- Pattern spacing.
- Dot size.
- Dots layout: Grid or Diagonal 45 degrees.

Stripes:

- Pattern spacing.
- Line thickness.
- Stripes angle: 0, 45, 90, or 135 degrees.

Pattern spacing combines a range input with a compact numeric input and `px`
unit. The range and number input stay synchronized. Helper labels explain that
smaller spacing means higher density.

Thickness and Dot size use a compact label-and-number-input row with a visible
`px` unit. Dots layout and Stripes angle are standard radio groups styled as
compact segmented controls.

### Canvas size

- Present Square, Instagram Portrait, Presentation 16:9, and Custom as a
  single-choice preset control.
- Selecting a preset updates Width and Height.
- Width and Height use adjacent labeled number inputs with `px` units.
- If either dimension is manually edited after a preset selection, Custom
  becomes selected.
- The initial selected preset is Instagram Portrait.

### Download PNG

- Download PNG is the only primary action.
- It spans the panel width and is placed after Canvas size on desktop.
- It remains visible near the bottom of the sticky settings panel when the
  viewport permits.
- It is disabled when settings are invalid or a current PNG cannot be
  generated.

## Preview area

- Use a large, calm preview workspace with a light neutral surface.
- Place a `Preview` heading and brief transparency helper text above or below
  the canvas, without competing with the image.
- Display a CSS checkerboard behind the generated PNG to show transparent
  areas. The checkerboard is preview UI only and never becomes part of the PNG.
- Keep the preview centered horizontally and vertically within its workspace.
- The visible preview uses the selected output aspect ratio through CSS
  `aspect-ratio`.
- Preview changes reflect the current valid renderer output. Do not stretch or
  crop the output image.

### Preview sizing and downscaling

- The preview canvas fills the available Preview area while retaining the
  selected Width-to-Height ratio.
- Its maximum width is the Preview column width, up to 920 px.
- Its maximum height is 720 px or the available viewport height after page
  chrome, whichever is smaller.
- Use CSS scaling for display only; PNG pixels are generated at the requested
  output Width and Height.
- The preview must never exceed its container or require horizontal page
  scrolling.
- A very tall or wide custom canvas is scaled down to fit while preserving its
  full aspect ratio.

## Spacing system

Use a small custom spacing scale consistently:

- 4 px: tightly related items, such as an icon and label.
- 8 px: label to its input, helper text to its input, or related controls.
- 12 px: groups of controls within one section.
- 16 px: section heading to its first control and compact section separation.
- 24 px: normal section separation.
- 32 px: major layout separation, page padding, and desktop column gap.

Related controls remain visually closer than separate sections. Avoid arbitrary
one-off spacing values.

## Typography hierarchy

Use a system font stack for reliable, neutral rendering.

- App name: 28 px, semibold.
- Page description: 16 px, regular, muted neutral color.
- Section heading: 16 px, semibold.
- Field label: 14 px, medium weight.
- Control text: 14 px to 16 px, regular.
- Helper and validation text: 13 px to 14 px.

Text contrast meets WCAG AA against the Light theme background. Do not use
color alone to indicate required, selected, disabled, or invalid states.

## Controls

### Buttons

- Download PNG is the only primary button and uses the product accent color.
- Preset, pattern, layout, and angle choices are not primary actions; use
  radio-group or segmented-control styling.
- Disabled buttons remain legible and communicate unavailable state without
  relying only on reduced opacity.

### Inputs

- Use standard HTML range, number, color, radio, and button controls.
- Every input has an associated visible label.
- Number inputs accept temporary text while typing and validate on the defined
  commit events.
- Units are visually adjacent to their numeric input but are not part of the
  editable value.

### Color control

- Use a native color input with a visible color swatch.
- The selected color is the generated pattern color, not a UI state color.
- Show a readable hexadecimal value if it is included without introducing a
  second required input method.

## Error and focus states

- Show validation errors directly below or next to their related field.
- Error text explains how to correct the value without exposing renderer
  internals.
- Invalid fields use a visible border and text message; color is not the sole
  error indicator.
- Use `aria-describedby` to associate input errors and helper text.
- All interactive controls have a clear keyboard focus ring with sufficient
  contrast and at least a 2 px visible outline.
- Preserve the most recent valid preview while users are entering an invalid
  temporary value.

## Responsive behavior

- At widths below 960 px, change from two columns to one column.
- In the single-column layout, show Pattern, Pattern settings, and Canvas size
  first, then Preview, then Download PNG.
- The Download PNG button moves below the preview on small screens so users can
  inspect the result immediately before downloading.
- Reduce page padding to 16 px and section spacing to 20 px on narrow screens.
- Controls wrap or stack before they become too narrow to read or operate.
- The preview remains fully visible, retains its aspect ratio, and does not
  cause horizontal scrolling.

## Text wireframe

```text
+-------------------------------------------------------------------+
| Pattern Fit                                                       |
| Create precise transparent patterns for any design tool.          |
+-------------------------------+-----------------------------------+
| SETTINGS                      | PREVIEW                           |
|                               |                                   |
| Pattern                       |          [ checkerboard ]         |
| [ Grid | Dots | Stripes ]     |          [ rendered PNG ]         |
|                               |                                   |
| Pattern settings              |  Preview reflects output ratio.   |
| Pattern spacing [slider][px]  |  Checkerboard is preview-only.    |
| Pattern-specific controls     |                                   |
| Color [swatch]                |                                   |
|                               |                                   |
| Canvas size                   |                                   |
| [ Square / Portrait / ... ]   |                                   |
| Width [    ] px               |                                   |
| Height[    ] px               |                                   |
|                               |                                   |
| [       Download PNG        ] |                                   |
+-------------------------------+-----------------------------------+

Narrow screens:

Pattern -> Pattern settings -> Canvas size -> Preview -> Download PNG
```

## Out of scope for v1 design

- Dark theme.
- Mobile-first layout optimization.
- A pattern gallery or decorative template library.
- Persistent settings, shareable URLs, or account-based workflows.
- UI components copied from a third-party design tool.
