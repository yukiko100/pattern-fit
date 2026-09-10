# Pattern Fit Web v1 - Requirements

## Product purpose

Pattern Fit is a browser-based tool for generating simple Grid, Dots, and
Stripes patterns as transparent PNG files.

It is a general-purpose design tool intended for use with Canva, Figma,
PowerPoint, Google Slides, and other design tools. It is not tied to a specific
design platform.

The product focuses on precise control of pattern spacing, thickness, dot size,
layout, angle, and output size rather than decorative pattern variety.

## Product principles

- Pattern spacing is independent from canvas size.
- Changing canvas size must not scale the pattern itself. The pattern must be
  regenerated using the selected spacing and settings.
- Generated PNG backgrounds are fully transparent outside the pattern.
- All generation and download processing happens in the browser.
- Pattern Fit v1 does not require a backend, user account, analytics,
  advertising, tracking, or external storage.

## Primary flow

Pattern
-> Pattern settings
-> Canvas size
-> Preview
-> Download PNG

## Patterns and settings

### Shared settings

- Color
- Transparent background

Default color: `#4C82EE`

### Grid

Settings:

- Pattern spacing
- Line thickness

Default settings:

- Pattern spacing: 32 px
- Line thickness: 1 px

### Dots

Settings:

- Pattern spacing
- Dot size
- Layout: Grid or Diagonal 45 degrees

Default settings:

- Pattern spacing: 32 px
- Dot size: 6 px
- Layout: Grid

### Stripes

Settings:

- Pattern spacing
- Line thickness
- Angle: 0, 45, 90, or 135 degrees

Default settings:

- Pattern spacing: 32 px
- Line thickness: 2 px
- Angle: 45 degrees

## Canvas size

The initial canvas size is Instagram Portrait: 1080 x 1350 px.

Canvas size presets are static data with this shape:

```ts
{
  (id, label, width, height);
}
```

Initial presets:

- Square: 1080 x 1080 px
- Instagram Portrait: 1080 x 1350 px
- Presentation 16:9: 1920 x 1080 px
- Custom

Selecting a preset updates the Width and Height values.

If a user manually changes either Width or Height after selecting a preset, the
Canvas size selection changes to Custom.

Custom size requirements:

- Width and Height are editable independently.
- Valid values are whole numbers from 1 to 8000 px.
- The individual edge limits apply in addition to renderer pixel limits.

## Preview

- Preview uses the same raster renderer as the downloaded PNG.
- The generated output is displayed at a reduced size using CSS.
- A checkerboard is visible only behind the preview to communicate
  transparency. It must never be included in the PNG output.
- Pattern, settings, color, and canvas size changes update the preview after
  the settings are valid.
- Invalid in-progress input keeps the most recent valid preview visible.
- v1 does not implement a separate low-resolution preview renderer.
- A preview-specific renderer is a future performance optimization candidate.

## PNG generation

- Use the browser Canvas 2D API.
- Produce a transparent PNG matching the selected canvas Width and Height.
- Grid uses direct Canvas line drawing with pixel alignment for crisp thin
  lines.
- Dots use calculated coordinates and remain circular in both layouts.
- Stripes at 0 and 90 degrees use direct Canvas drawing.
- Stripes at 45 and 135 degrees use fixed 2x supersampling, then high-quality
  downscaling to the requested output dimensions.

## Download

- Download the generated transparent PNG locally.
- Use `canvas.toBlob()` to create the PNG Blob.
- Create a temporary download URL with `URL.createObjectURL()`.
- Revoke the temporary URL with `URL.revokeObjectURL()` after download.
- Download does not use Canva SDK APIs, external services, or uploads.
- Download is disabled if settings are invalid or PNG generation fails.

Filename format:

```text
pattern-fit-{pattern}-{width}x{height}.png
```

The filename does not include color, spacing, or date/time values.

## Validation

### Pattern spacing

- Whole number from 4 to 128 px.

### Line thickness

- Whole number of 1 px or greater.
- Must be smaller than Pattern spacing.

### Dot size

- Whole number of 2 px or greater.
- Must be smaller than Pattern spacing.

### Input behavior

- Inputs allow temporary text states while a user types.
- Validate on blur, Enter, preset selection, and Download.
- Show errors next to the relevant input.
- Use user-facing messages rather than renderer implementation details.
- Invalid settings must not begin PNG generation or download.

Suggested messages:

- `Enter a whole number between 1 and 8000 px.`
- `Pattern spacing must be between 4 and 128 px.`
- `Line thickness must be smaller than pattern spacing.`
- `Dot size must be smaller than pattern spacing.`
- `This size is too large. Try a smaller width or height.`
- `This size is too large for diagonal stripes. Try a smaller width or height.`
- `This pattern is too dense for this size. Increase the spacing or reduce the output size.`
- `We couldn't generate this pattern. Check the settings and try again.`

## Renderer safety limits

The initial v1 limits match the existing Canva version. They may be reviewed
after production performance measurements.

- Normal PNG output: maximum 16,000,000 output pixels.
- Diagonal Stripes: maximum 4,000,000 output pixels because 2x
  supersampling requires four times as many internal pixels.
- Maximum drawing primitives: 250,000.

## State and persistence

- Every application launch starts with the default settings and Instagram
  Portrait canvas size.
- v1 does not use localStorage.
- v1 does not use URL query parameters.
- v1 does not save settings, presets, or generated files.

## UI and accessibility

- Use React, TypeScript, and Vite.
- Use custom CSS and standard HTML controls.
- Do not use Canva UI Kit, Headless UI, Radix, or another component library in
  v1.
- Use label-associated inputs, keyboard-operable controls, visible focus
  states, semantic buttons, and accessible error messages.
- Use a neutral Pattern Fit design system rather than copying another design
  tool's interface.
- Desktop is the primary v1 target.
- v1 supports Light theme only. Dark theme is out of scope.

## Technical scope

- Create a separate `pattern-fit-web` project.
- Keep the existing Canva Pattern Fit project unchanged.
- Reuse and adapt the existing raster renderer, validation logic, and related
  tests where they do not depend on Canva SDK types or APIs.
- Exclude Canva Current design access, asset upload, page insertion, Intent
  setup, and Vector experiment code from the Web project.
- No backend is required for v1.

## Out of scope for v1

- Canva SDK integration
- Uploading images to external services
- Adding images directly to a third-party design canvas
- User accounts
- Settings persistence
- URL-based settings sharing
- Analytics, advertising, and tracking
- Dark theme
- Decorative pattern types beyond Grid, Dots, and Stripes
- A separate low-resolution preview renderer
