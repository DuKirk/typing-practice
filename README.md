# TypingMaster

A minimal typing test with 15, 30, 60 and 120 second modes and session-only stats.

## Run locally
Open `index.html` in a browser. No build step needed.

## Host on GitHub Pages
Repo Settings > Pages > Deploy from branch > `main` / root.

## Add passages
Edit `passages.js` and add objects with `id`, `topic` and `text`.

## Typing game
The **Game** page (`game.js`, `game.css`, section `#game` in `index.html`) is a falling-words game with 3 or 5 lives, levels, combos and five animated scenes. It builds its word list from `passages.js`, so new passages automatically add new game words.

## Themes
The sun/moon button in the header switches between **Normal** (default), **Light** and **Dark**. Colours live in `theme.css`; the choice is remembered in the browser (`theme.js`).

## Practice page
The **Practice** page (`practice.js`, `practice.css`, section `#practice` in `index.html`) has timed modes, Basics / Intermediate / Expert word levels, an on-screen keyboard with a finger guide, and a weak-keys drill. Its colours follow the site theme.

## Game picker
The Game page has two games, chosen with the pill buttons at the top: **Word Rain** (`game.js`, `game.css`) and **Keyboard Ninja** (`ninja.js`, `ninja.css`). The choice is remembered. Switching to Ninja pauses Word Rain, and Ninja freezes whenever you leave its view.
