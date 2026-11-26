# MUSE · Maison de parfum

A perfume store and brand site built with plain HTML, CSS and JavaScript. There is no framework and no build step: the animation libraries are saved in `assets/vendor/`, so the site works on any static host (Netlify, Vercel, GitHub Pages, your own server).

The hero is an ES module, and browsers only load modules over http. To preview locally, run a small server in the folder, for example `python3 -m http.server`, then open `http://localhost:8000`. If you open `index.html` straight from disk, the site still works, but the hero shows a still image instead of the live bottle.

```
index.html               every page of the site (views switch without reloading)
assets/css/muse.css      colour tokens, type scale, every layout, responsive rules
assets/js/muse.js        router, header and menus, scroll scenes, shop, bag, checkout, forms
assets/js/hero.js        the glass flacon (Three.js), its scroll story, and the packshot renderer
assets/js/smoke.js       a small GPU fluid simulation for the vapour
assets/vendor/           three.module.min.js r160, GSAP 3.12.5 with ScrollTrigger, Lenis 1.1.13
assets/img/              packshots, the hero still and photography (800 px and 1600 px versions)
```

## Look

- **Colour:** black studio (`#0b0a09`) for the hero, the numbers and the footer; warm ivory paper (`#f6f3ee`) for shopping and reading; champagne gold (`#9c7b4f`, `#d8c29a`) as the only accent. All colours are tokens at the top of `muse.css`.
- **One typeface:** Bodoni Moda from Google Fonts. Its optical size axis makes the same family a fine display face at 140 px and a readable text face at 16 px. To try another family, change the font link in `index.html` and `--f` in `muse.css`.
- **Normal pointer:** no custom cursor anywhere.

## The hero

Scrolling plays a short film in four steps, each with its own number:

1. **A feeling, bottled.** The flacon stands in a dark studio. Lights come up, a highlight sweeps across the glass.
2. **01 Unveil.** The gold cap lifts, arcs through the air and lands on the floor beside the bottle. A thin thread of vapour starts to rise from the atomiser, like smoke from a cigarette.
3. **02 Release.** The atomiser presses down and sprays a cloud of mist that billows, curls and rises. This is a real fluid simulation running on the graphics card, not a video.
4. **03 Linger**, then the product card for Ambre 01 with Add to bag. The vapour fills the frame and fades into the ivory page.

Moving the pointer stirs the smoke. Clicking the stage sprays again once the cap is off. The bottle is in 3D, so it turns gently with the pointer.

## Home page structure

| No. | Section | What it does |
| --- | --- | --- |
| | Hero | The scroll film above |
| 01 | The collection | A carousel of all six signatures and the set, with arrows, a progress line and quick Add to bag. Hover a bottle to see what it is made of. |
| 02 | Scent of the season | Ambre 01 in detail: notes, size choice and Add to bag, without leaving the home page |
| 03 | In numbers | 25 %, 12 h, 8 weeks, 300 bottles, counting up as they come into view |
| 04 | The notes | Top, heart and base, with photographs |
| 05 | Discovery set | All six vials, one click to add |
| 06 | Find your scent | Choose a memory and a loudness, get a fragrance |
| 07 | Journal | The latest stories |
| | Promises and footer | Delivery, samples, returns, refills, the newsletter |

## Header

A classic house layout: announcement ticker on top, Shop, Discovery set and The house on the left, MUSE in the centre, Journal, Contact, search and bag on the right. Shop opens a mega menu with all six fragrances; the picture on the right changes to whichever bottle you point at. The header is transparent over dark sections, turns ivory over light ones, hides while you scroll down and comes back when you scroll up. On phones it becomes a menu button that opens a full screen menu.

## Packshots

Every product photo is rendered from the same 3D flacon, so the whole range looks like one brand. To re-render them, call `renderPackshot` from `assets/js/hero.js` in a browser page (it returns a JPEG data URL) with the scent's name and two liquid colours.

## Pages

Home, Shop (filters and sorting), seven product pages (`#ambre`, `#fleur`, `#cedre`, `#fumee`, `#prisme`, `#soleil`, `#set`), House, Journal (with a reader for each story), Contact (form and FAQ) and Checkout (details, delivery, payment, confirmation). Search covers products, notes and stories.

## Before going live

- **Checkout is a demo.** It checks the form and shows a confirmation, but takes no payment. Connect Stripe, Shopify Buy Button, Snipcart or similar in the checkout section of `muse.js`. The page says so on screen.
- **Contact and newsletter forms** need an endpoint. Search `muse.js` for *Connect your form endpoint* and *Connect your mailing list provider*.
- **Products, prices and copy** live in the `PRODUCTS` list near the top of `muse.js`. Sizes are worked out from the 50 ml price.
- **The numbers** in section 03 and the promises above the footer are placeholders for your real figures and policies.
- **Contact details** on the Contact page are placeholders (`concierge@muse.example`).

## Accessibility and performance

- Native `<dialog>` for search, bag and stories, so focus is trapped and Escape closes them. Escape also closes the mega menu and the phone menu.
- `prefers-reduced-motion` turns off the preloader, the live hero (a still image is shown instead), smooth scrolling and the scroll film.
- The hero stops rendering when it is off screen or another page is open, and phones get a lighter simulation.
- Browsers without WebGL 2 see the still image.
- The bag is kept in `localStorage`.

## Licences

- Three.js and Lenis: MIT.
- GSAP and ScrollTrigger: the GSAP standard licence, free for commercial use.
- Bodoni Moda: SIL Open Font License.

## Photo credits

Packshots and the hero still are rendered from the site's own 3D model. All other photographs are from [Unsplash](https://unsplash.com) under the Unsplash License, which allows free commercial use. Credit is appreciated but not required. None show another brand's name or logo.

| File | Photographer |
| --- | --- |
| smoke-violet | Robert Zunikoff |
| smoke-silk, smoke-teal | Pawel Czerwinski |
| pipette-gold, pipette-mono, hands-pour, liquid-gold | Fulvio Ciccolo |
| jasmine-night | Irina Iriser |
| jasmine-star | Chinmay Sethi |
| jasmine-branch | Liana S |
| cedar-bark | Wyxina Tresse |
| bark-grey | Chris Lawton |
| resin | Alexandr Popadin |
| lemons (photo-1528632735386), citrus-dried (photo-1569442130407) | Unsplash contributors |
