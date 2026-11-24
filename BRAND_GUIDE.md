# SenteShield brand identity

An original visual identity for the Uganda-focused fraud-awareness application. The design was informed by BrandCrowd's icon-and-wordmark presentation approach, but **no BrandCrowd template, icon, or purchased artwork is included**.

## Primary mark

The rounded tile contains a fine-line shield and an S-shaped continuous signal. The shield represents protection; the S identifies SenteShield. The second small cyan circle suggests a detected signal.

## Files

- `public/senteshield-mark.svg`: standalone scalable mark; the sidebar embeds matching SVG geometry inline so its colors follow the selected dashboard theme.
- `public/favicon.svg`: matching browser favicon.
- `public/senteshield-logo-dark.svg`: horizontal logo for dark surfaces.
- `public/senteshield-logo-light.svg`: horizontal logo for light surfaces.

These assets use vector shapes and live SVG text and remain editable. The horizontal wordmarks use Manrope with Arial fallbacks; letter rendering depends on the installed or loaded typeface. The mark itself needs no fonts.

## Colors

| Role | Hex |
| --- | --- |
| Midnight tile | `#0E1826` |
| Shield lime | `#C9FF9A` |
| SenteShield lime | `#BDF58A` |
| Signal teal | `#7DDFD5` |
| Daylight green | `#397934` |
| Dark background text | `#F6F8FB` |
| Daylight text | `#172436` |

## Usage

Use the icon alone for small brand spaces and the horizontal logo where room permits. Keep the mark's tile intact, avoid stretching the artwork, and do not replace the icon with generic security symbols.

The logo is not a guarantee of financial security or an endorsement by a bank or regulator. Before larger-scale commercial use, consider a brand-name and trademark clearance check.

Reference: [BrandCrowd logo-maker](https://www.brandcrowd.com/logo-maker).

## Theme behaviour

In the dashboard, the logo responds to the interface theme:

- **Light mode:** thin green outline with a white fill
- **Dark mode:** white outline with a dark fill matching the dashboard

The standalone SVG and favicon use `prefers-color-scheme`. The inline sidebar logo follows the selected dashboard preference even if it differs from the device setting.
