# MUSE · Maison de parfum

A perfume store and brand site built with plain HTML, CSS and JavaScript. There is no framework and no build step: the animation libraries are saved in `assets/vendor/`, so the site works on any static host (Netlify, Vercel, GitHub Pages, your own server).

The 3D hero is an ES module, and browsers only load modules over http. To preview locally, run a small server in the folder, for example `python3 -m http.server`, then open `http://localhost:8000`. If you open `index.html` directly from disk, the site still works, but the hero shows a still photograph instead of the 3D bottle.

```
index.html               every page of the site (views switch without reloading)
assets/css/muse.css      colour tokens, type scale, every layout, responsive rules
assets/js/muse.js        router, island navigation, scroll scenes, shop, bag, checkout, forms
assets/js/hero3d.js      the real time glass bottle in the hero (Three.js)
assets/vendor/           three.module.min.js r160, GSAP 3.12.5 with ScrollTrigger, Lenis 1.1.13
assets/img/              photography (800 px and 1600 px versions of each image)
```

## Look

- **One typeface:** Bodoni Moda, from Google Fonts. Its optical size axis lets the same family be a hairline display face at 200 px and a readable text face at 16 px, so nothing else is mixed in. To try another family, change the font link in `index.html` and `--f` in `muse.css`.
- **Colour:** oxblood and wine (`#1a0508` to `#7a2131`), cream paper (`#f4ede3`) and champagne gold (`#c9a063`). All colours are tokens at the top of `muse.css`.

## Signature moments

| Where | What happens |
| --- | --- |
| Preloader | MUSE draws itself while the bottle and fonts load, then a wine curtain sweeps away. |
| Navigation | A floating glass **island**. Hover Collection or Notes and it morphs, with spring physics, into a panel showing the bottles or the notes. A liquid highlight follows the pointer between links, a gold hairline fills as you scroll, and the island turns light or dark to match the section under it. On phones it opens into the full menu. |
| Hero | A **real time 3D glass flask** with liquid inside. Light refracts through the glass, bending the giant scent name and the photographs behind it. Scrolling turns the bottle from Ambre to Fleur to Cèdre: the liquid, the light, the word and the photographs all change. At the end the camera dives into the liquid. Drag to spin the bottle, click to spray. |
| Manifesto | The words light up one by one as you scroll, with small photographs set inside the sentence. |
| Collection | The page pins and the six bottles slide sideways. Hover a bottle to see what it is made of. |
| Notes | The three acts of a fragrance as cards that stack on top of each other. |
| Ritual | A photograph opens from a small window to the full screen. |
| Translate a memory | Choose a memory ("Candles in an old church") and how loud you want it, and get a fragrance, its formula and how to wear it. |
| Page changes | A wine curtain with a wave edge carries the name of the next page across the screen. |
| Bag | Adding a product flies its photograph into the bag in the island. |

## Pages

Home, Shop (filters and sorting), seven product pages (`#ambre`, `#fleur`, `#cedre`, `#fumee`, `#prisme`, `#soleil`, `#set`), House, Journal (with a reader for each story), Contact (form and FAQ) and Checkout (details, delivery, payment, confirmation). Search covers products, notes and stories.

## Before going live

- **Checkout is a demo.** It checks the form and shows a confirmation, but takes no payment. Connect Stripe, Shopify Buy Button, Snipcart or similar in the checkout section of `muse.js`. The page says so on screen.
- **Contact and newsletter forms** need an endpoint. Search `muse.js` for *Connect your form endpoint* and *Connect your mailing list provider*.
- **Products, prices and copy** live in the `PRODUCTS` list near the top of `muse.js`. Sizes are worked out from the 50 ml price.
- **Hero scents** (colours, words and photographs for each scent in the 3D hero) live in `HERO_SCENTS` in `muse.js`.
- **Contact details** on the Contact page are placeholders (`concierge@muse.example`).
- **Your own photography** can replace any file in `assets/img/`. Keep the same names, or update the `img` and `reveal` fields in `PRODUCTS`.

## Accessibility and performance

- Native `<dialog>` for search, bag and stories, so focus is trapped and Escape closes them.
- `prefers-reduced-motion` turns off the preloader, the 3D hero (a photograph is shown instead), smooth scrolling, the custom cursor and magnetic buttons.
- The 3D hero stops rendering when it is off screen or another page is open, and on phones it uses a lower pixel ratio.
- The bag is kept in `localStorage`.

## Licences

- Three.js and Lenis: MIT.
- GSAP and ScrollTrigger: the GSAP standard licence, free for commercial use.
- Bodoni Moda: SIL Open Font License.

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
| hand-clear | Content Pixie |
| jasmine-night | Irina Iriser |
| jasmine-star | Chinmay Sethi |
| jasmine-branch | Liana S |
| cedar-bark | Wyxina Tresse |
| bark-grey | Chris Lawton |
| resin | Alexandr Popadin |
| bottle-sun (photo-1622618991746), dropper-leaf (photo-1617897903246), lemons (photo-1528632735386), citrus-dried (photo-1569442130407), amber-satin (photo-1733660227163), crystal-flowers (photo-1615108395437), gold-glass (photo-1783431412504) | Unsplash contributors |
