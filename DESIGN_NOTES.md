# SenteShield — design system notes

## Direction

A financial safety product should feel precise, calm and action-oriented. The primary screen is a **working scanner**, not an advertising page. Copy remains short, the labels explain actions, and results tell users what to do next.

## Palette

| Role | Midnight mode | Daylight mode |
|---|---|---|
| Page | `#0a0e17` | `#edf1f4` |
| Navigation | `#0d1320` | `#f7f9fb` |
| Headline | `#f6f8fb` | `#172436` |
| Primary action | `#bdf58a` | `#3b7a35` |
| Information accent | `#7ddfd5` | `#217d77` |
| Review signal | `#ffd08b` | `#935c17` |
| High-risk signal | `#ff978e` | `#ab3d43` |

Use blurred panels selectively. Risk notices use text labels as well as color. Large touch controls have visible focus states and the interface respects system reduced-motion settings.

## Motion

- Gentle page entrance and hover feedback, no disorienting transitions.
- Slow decorative shield/radar rotations that are disabled on reduced-motion preference.
- Progress overlay is **indeterminate**; it does not fabricate a percentage or claim processing stages that are not observable.
- Popups are native HTML dialogs for keyboard behavior and focus handling.

## Sources reviewed

- [React Bits Pro App UI](https://pro.reactbits.dev/docs/app-ui) — dashboard navigation and interface composition. This project uses original CSS and JavaScript; it does not reproduce paid component code.
- [Figma color combinations](https://www.figma.com/resource-library/color-combinations/) — coherent primary/accent roles and readable text contrast.
- [CSS Design Awards — animated websites](https://www.cssdesignawards.com/website-gallery?feature=animated) — rhythm and subtle movement, adapted for a task-oriented app.

## Design constraints

No login, no messages database, no artificial risk percentages, no unverified official partner logos, no external animation package. A user can try the interface, see warning patterns and scan a message immediately.
