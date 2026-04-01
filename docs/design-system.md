# Design System Notes

## Goal

Give `app.spectrum.analyzer` the same vendor family feel as `app.vectorscope` without losing what is distinctive about the spectrum analyzer: a wide, fullscreen plotting surface.

## Keep

- Full browser-width canvas
- Near-full-height visualization area
- Controls located below the main plot
- Lightweight static-app architecture

## Align With Vectorscope

- Use a deeper layered background instead of a flat `#1a1a1a`
- Reuse the vectorscope accent family as the base palette:
  - cool cyan primary accent
  - lighter cyan hover/focus state
  - darker surface panels and border tones
- Upgrade controls from plain blocks to deliberate surfaces with:
  - rounded corners
  - clearer border hierarchy
  - consistent hover and focus states
- Bring footer and supporting text into the same muted-text system used by vectorscope

## Do Not Copy Blindly

- Do not force the analyzer into a centered square canvas layout.
- Do not over-card everything if it reduces usable drawing space.
- Do not create a second, conflicting palette for canvas-only colors.

## Token Direction

When the UI restyle happens, centralize visual tokens in `styles.css` with CSS custom properties for:

- app background
- panel surfaces
- borders
- primary and hover accents
- muted and primary text
- canvas background
- peak spectrum line/fill
- RMS spectrum line/fill
- threshold and guide lines
- label fill and label text

## Canvas And DOM Consistency

The canvas should read from the same theme tokens that style the DOM. That keeps the analyzer trace, threshold line, labels, and surfaces consistent with the surrounding UI and avoids drifting styles between CSS and JavaScript.

## Suggested First UI Pass

1. Add `:root` theme variables inspired by the vectorscope palette.
2. Restyle `body`, `#controls`, buttons, inputs, and footer around those tokens.
3. Replace inline control spacing in `uiComponents.js` with reusable classes.
4. Move JS color defaults to shared theme-derived values.
