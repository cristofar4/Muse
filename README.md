# MUSE · Perfume you can see

A perfume store and brand site built with plain HTML, CSS and JavaScript. There is no framework and no build step. Serve the folder from any static host (Netlify, Vercel, GitHub Pages, your own server) and it works. To preview locally, run a tiny server in the folder, for example `python3 -m http.server`, then open `http://localhost:8000`. The WebGL smoke effect needs a server; opening the file directly still works, but the hero shows a still photo instead.

```
index.html             every page of the site (views switch without reloading)
assets/css/muse.css    design tokens, the 12 column grid, every layout, responsive rules
assets/js/muse.js      router, navigation, animations, shop, bag, checkout, forms
assets/js/vapor.js     the WebGL smoke effect on hero photographs
assets/img/            photography (800 px and 1600 px versions of each image)
```

## The idea

You cannot smell a screen, so the whole site tries to make scent visible. One typeface only, **Fraunces**, because its weight and softness can be animated: letters melt, swell and breathe.

## Signature interactions

| Where | What happens |
| --- | --- |
| Navigation | The menu is a row of perfume **blotter strips** hanging from the top of the screen. They sway when you scroll or brush past them, a stain of colour wicks up the paper when you hover, and the current page stays stained. They tuck away while you read. On phones you **pull the strip down** to open the menu, which unrolls like paper. |
| Logo | MUSE **breathes**: each letter slowly swells and softens, then thins again. |
| Preloader | The word *Inhale* swells from a hairline to heavy and soft, then flips to *Exhale* and evaporates. Shown once per visit. |
| Hero | A real photograph of smoke rendered in WebGL. Wherever the cursor moves, the image **rises like vapor**. The giant MUSE inverts the smoke inside its letters, and the letters swell toward your cursor. |
| Headings | Every big title **condenses out of vapor**: heavy, soft, blurred letters settle into thin sharp glass. |
| Product photos | Hover a bottle and the cursor **uncovers what the scent is made of** (resin under the amber, jasmine under the floral). |
| Hold to smell | Press and hold a button, or the space bar. A blurred photograph sharpens, smoke rises, and the fragrance plays out in three acts. There is also a "let it play" option for anyone who cannot hold. |
| Anatomy of a scent | Scrolling down walks you sideways through five raw materials, with their botanical names. |
| Translate a memory | Choose a memory ("Candles in an old church") and a loudness, and get a fragrance, its formula and how to wear it. |
| Page changes | Pages swap behind a burst of dark mist that sprays from where you clicked, then evaporates. |
| Bag | Adding a product flies a drop of its colour into the Bag strip, which fills with colour as the bag grows. |

## Pages

Home, Shop (filters and sorting), seven product pages (`#ambre`, `#fleur`, `#cedre`, `#fumee`, `#prisme`, `#soleil`, `#set`), House, Journal (with a reader for each story), Contact (form and FAQ) and Checkout (details, delivery, payment, confirmation). Search covers products, notes and stories.

## Before going live

- **Checkout is a demo.** It validates the form and shows a confirmation, but takes no payment. Connect Stripe, Shopify Buy Button, Snipcart or similar in the checkout section of `muse.js`. The page says so on screen.
- **Contact and newsletter forms** need an endpoint. Search `muse.js` for *Connect your form endpoint* and *Connect your mailing list provider*.
- **Products, prices and copy** live in the `PRODUCTS` list near the top of `muse.js`. Sizes are worked out from the 50 ml price.
- **Contact details** on the Contact page are placeholders (`concierge@muse.example`).
- **Your own photography** can replace any file in `assets/img/`. Keep the same names, or update the `img` and `reveal` fields in `PRODUCTS`.

## Accessibility and performance

- Native `<dialog>` for search, bag, menu and stories, so focus is trapped and Escape closes them.
- Every hold or drag interaction has a keyboard or click alternative.
- `prefers-reduced-motion` turns off the preloader, WebGL, melting type, sway and parallax.
- One shared animation loop sleeps when nothing moves. WebGL and the smoke canvas pause when they are off screen.
- The bag is kept in `localStorage`.

## Photo credits

All photographs are from [Unsplash](https://unsplash.com) under the Unsplash License, which allows free commercial use. Credit is appreciated but not required. None show another brand's name or logo.

| File | Photographer |
| --- | --- |
| smoke-violet | Robert Zunikoff |
| smoke-silk, smoke-teal | Pawel Czerwinski |
| pipette-gold, pipette-mono, hands-pour, liquid-gold | Fulvio Ciccolo |
| bottle-frost | Angélica Echeverry |
| bottle-ink | Kier in Sight Archives |
| bottle-prism | JC Media |
| jasmine-night | Irina Iriser |
| jasmine-star | Chinmay Sethi |
| jasmine-branch | Liana S |
| cedar-bark | Wyxina Tresse |
| bark-grey | Chris Lawton |
| resin | Alexandr Popadin |
| bottle-sun (photo-1622618991746), dropper-leaf (photo-1617897903246), lemons (photo-1528632735386), citrus-dried (photo-1569442130407) | Unsplash contributors |
