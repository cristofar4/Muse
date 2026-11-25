# MUSE · Eau de parfum

A single-page storefront for MUSE, built with plain HTML, CSS and JavaScript. There are no dependencies and no build step: open `index.html` in a browser, or serve the folder from any static host.

```
index.html            page structure and copy
assets/css/muse.css   design tokens, layout, animation, responsive rules
assets/js/muse.js     drawn artwork and every interaction
assets/favicon.svg
```

## What's on the page

**The Flacon bar (navigation)**
- The **MUSE logo fills with gold liquid** as you scroll, so the wordmark doubles as a progress bar. Hovering the logo makes the surface swirl faster.
- A **bead of perfume flows between links**. Its leading edge moves first and the trailing edge catches up, and when it settles it drips. When you aren't hovering, it rests under the section you're reading.
- Link text **evaporates**: each letter rises and blurs away while an italic version condenses in its place.
- **Shop opens the Perfumer's Organ**, a shelf of raw-material vials with the three bottles in front. Hover a bottle to read its mood, notes and price.
- The **bag icon is a tiny flacon** that fills as you add items. Added bottles fly into it along an arc.
- The bar switches between light and dark to match the section beneath it. It hides while you scroll down and comes back when you scroll up.
- **✦ Menu** opens a full-screen menu that pours down like liquid.

**Sections**
1. **Hero.** The giant MUSE letters, a moon and a glass bottle drawn in code. Drag the bottle to swirl it and the liquid sloshes with real spring physics. Tabs switch between Ambre, Fleur and Cèdre; liquid colour, cap, label, ingredients and background all change.
2. **Find your signature.** Product cards in warm, sunlit scenes, each with Quick view (sizes, notes) and Add to bag.
3. **A fragrance, unfolding.** A "time on skin" slider. Drag from spray to 8 hours and watch the top, heart and base notes fade in and out, with intensity curves to match.
4. **What draws you in?** A three-question scent finder. A colour aura and the bottle's liquid follow each answer, and the result can be added to the bag. Keys 1 to 3 answer.
5. **The house.** An animated atelier: a pipette lets one drop fall into a beaker.
6. **Gifting.** The gift box lid lifts when the box scrolls into view. "Write the card" previews the note on the card inside.
7. **Journal and questions.** Articles and an accordion FAQ.
8. **Footer.** A newsletter form that stamps a wax seal when you subscribe.

Also: a one-drop preloader (once per visit), a faint gold *sillage* trail behind the mouse, magnetic buttons, and search by note, mood or name (try "jasmine" or "warm").

## Accessibility and performance
- Uses native `<dialog>` for the menu, search, bag and quick view, so focus is trapped and Escape closes them.
- Hero tabs follow the ARIA tab pattern with arrow keys. The quiz uses real radio buttons and the slider is a native range input.
- `prefers-reduced-motion` turns off the preloader, physics, waves, parallax and the cursor trail.
- One shared animation loop sleeps when nothing is moving. Waves and the atelier pause when they're off screen.
- The bag is saved in `localStorage`.

## Making it yours
- **Prices, notes and copy** live in the `SCENTS` object at the top of `assets/js/muse.js`. Prices also appear in the product cards in `index.html`, so update both.
- **Colours and fonts** are tokens in the `:root` block at the top of `muse.css`. Each fragrance's liquid and cap colours are under `[data-scent="…"]`.
- **Newsletter:** connect your mailing provider where `letters()` says *Connect your mailing list provider here*.
- **Checkout:** the Checkout button currently shows a notice. Point the `[data-checkout]` handler in `clicks()` at your store.
- **Photography:** bottles and ingredients are drawn as SVG so they can animate. To use product photos instead, place an `<img>` inside any `.scene` in place of the `data-flacon` span.
