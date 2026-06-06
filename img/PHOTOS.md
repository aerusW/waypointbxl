# Photos — where to drop real images

| File | Used where | Recommended size |
|---|---|---|
| `og-image.jpg` | Social share preview (Open Graph + Twitter Card) | 1200 × 630 px |
| `brussels-dublin.jpg` | Work card 04, background of `.work-card__image` | 800 × 600 px |
| `favicon.svg` | Browser tab / bookmarks | Replace the SVG placeholder |

## How to wire up work-card photos

Add an inline `style` attribute to the `.work-card__image` div in `index.html`:

```html
<div class="work-card__image"
     role="img"
     aria-label="Describe the photo here"
     style="background-image: url('img/brussels-dublin.jpg')"></div>
```

All images should be optimised (run through Squoosh or similar) before deploying.
