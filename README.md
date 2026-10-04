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
