# Demo: pass/fail accessibility scenarios

Sample web files used to demonstrate and test the Smyth Accessibility action.

## Pass (intended to pass first-pass a11y)

| File                         | Scenario                                                                               |
| ---------------------------- | -------------------------------------------------------------------------------------- |
| `pass/minimal.html`          | Minimal compliant page: doctype, lang, title, image with alt, labeled form control.    |
| `pass/semantic-section.html` | Landmarks (header, main, nav, footer), heading hierarchy, button with accessible name. |

## Fail (intended to fail; expect findings)

| File                        | Scenario                                                                  |
| --------------------------- | ------------------------------------------------------------------------- |
| `fail/missing-alt.html`     | Image without `alt`; expect at least one finding.                         |
| `fail/unlabeled-input.html` | Inputs without associated `<label>` or `aria-label`; expect findings.     |
| `fail/poor-contrast.html`   | Low-contrast text (light gray on white); expect contrast-related finding. |

These files can be used as fixtures for file-resolution tests or for manual/smoke runs of the action against the `demo/` directory.
