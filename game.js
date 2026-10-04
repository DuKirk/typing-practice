/* Typing game page ("Word Rain") — runs inside the #game section.
   Wrapped in an IIFE so it cannot clash with the globals in script.js. */
(function () {
  const section = document.getElementById("game");
  if (!section) return;
  const $ = (id) => document.getElementById(id);
  const panel = $("wrPanel"), input = $("wrInput");

  const FALLBACK = ("time year people way day man thing woman life child world school state family student group country problem hand part place case week company system program question work government number night point home water room mother area money story fact month lot right study book eye job word business issue side kind head house service friend father power hour game line end member law car city community name president team minute idea kid body information back parent face others level office door health person art war history party result change morning reason research girl guy moment air teacher force education keyboard practice speed accuracy rhythm finger typing screen window bridge garden planet pocket rocket silver forest thunder island castle dragon lantern marble whisper jungle puzzle canyon meadow harvest compass journey mirror orange purple cricket monsoon river mountain festival market spice train tiger elephant temple").split(" ");

  // Use words from the site's own passages when available, so the game matches the Test page.
  function buildWordList() {
    try {
      if (typeof PASSAGES !== "undefined" && Array.isArray(PASSAGES)) {
        const set = new Set();
        PASSAGES.forEach((p) => (p.text || "").toLowerCase().split(/\s+/).forEach((w) => {
          w = w.replace(/[^a-z]/g, "");
          if (w.length >= 3 && w.length <= 9) set.add(w);
        }));
        if (set.size >= 80) return [...set];
      }
    } catch (e) {}
    return FALLBACK;
  }
  const WORDS = buildWordList();

  let lives = 5, maxLives = 5, score = 0, level = 1, combo = 0, killed = 0, best = 0;
  let words = [], running = false, paused = false, last = 0, spawnT = 0;

  const isActive = () => section.classList.contains("active-page");
  const speed = () => 45 + level * 14;
  const spawnEvery = () => Math.max(0.7, 2.2 - level * 0.15);

  function drawHearts() {
    $("wrHearts").innerHTML = Array.from({ length: maxLives }, (_, i) =>
      `<span class="wr-heart ${i >= lives ? "lost" : ""}">♥</span>`).join("");
  }
  function hud() {
    $("wrScore").textContent = score; $("wrLevel").textContent = level;
    $("wrCombo").textContent = combo; $("wrBest").textContent = best;
    drawHearts();
  }

  /* ---------- scenes ---------- */
const rng = seed => () => ((seed = seed * 16807 % 2147483647) / 2147483647);
function forestSVG() {
  const r = rng(7), pine = "M0-100L10-72H5L15-50H8L20-25H10L24 0H-24L-10-25H-20L-8-50H-15L-5-72H-10Z";
  let o = '<rect width="800" height="500" fill="#c2f5e0"/>';
  [[350,"#8ccbad",.9,1.4,30],[395,"#4d9575",1.2,1.9,42],[440,"#0f6242",1.5,2.3,60]].forEach(([y,c,a,b,step]) => {
    o += `<rect y="${y}" width="800" height="${500-y}" fill="${c}"/>`;
    for (let x = -10; x < 820; x += step * (.7 + r() * .6))
      o += `<path d="${pine}" fill="${c}" transform="translate(${x} ${y+6}) scale(${a + r() * (b - a)})"/>`;
  });
  [[20,1.9],[75,2.6],[-5,2.9],[770,2.4],[725,1.7],[795,3]].forEach(([x,k]) =>
    o += `<path d="${pine}" fill="#024d30" transform="translate(${x} 480) scale(${k})"/>`);
  return o + '<path d="M0 500V462C200 440 520 448 800 476V500Z" fill="#024d30"/>';
}
function autumnSVG() {
  const r = rng(11);
  let o = '<rect width="800" height="500" fill="#f8e6d0"/>' +
    '<g fill="#fff" opacity=".9"><ellipse cx="90" cy="130" rx="70" ry="30"/><ellipse cx="140" cy="105" rx="45" ry="32"/><ellipse cx="600" cy="70" rx="60" ry="22"/><ellipse cx="640" cy="55" rx="34" ry="24"/></g>' +
    '<path d="M200 330C290 140 380 95 470 125C570 165 620 260 700 330Z" fill="#e9cea5"/>' +
    '<path d="M400 330C410 200 450 130 480 125C570 165 620 260 700 330Z" fill="#dfbf90" opacity=".6"/>' +
    '<path d="M0 500V300C150 280 300 340 450 260C600 195 700 265 800 250V500Z" fill="#69742f"/>' +
    '<path d="M0 500V370C130 320 270 335 390 405C510 440 700 400 800 385V500Z" fill="#a39b46"/>' +
    '<path d="M230 500C420 430 600 360 800 372V500Z" fill="#cfbc5c"/>';
  const orange = ["#f39a1e","#f7b03a","#ef7f1a","#e8681a","#fbc04d"], yellow = ["#f6c556","#fbd97a","#f3a63a","#f7b845"];
  [[470,330,.95,yellow],[250,390,1.15,orange],[70,360,1.6,orange],[730,360,1.6,orange]].forEach(([x,y,k,pal]) => {
    o += `<path d="M${x-8*k} ${y}L${x-4*k} ${y-120*k}L${x+4*k} ${y-120*k}L${x+8*k} ${y}Z" fill="#6a3716"/>` +
      `<path d="M${x} ${y-90*k}L${x-40*k} ${y-150*k}M${x} ${y-100*k}L${x+45*k} ${y-140*k}" stroke="#6a3716" stroke-width="${5*k}" stroke-linecap="round"/>`;
    for (let i = 0; i < 12; i++)
      o += `<circle cx="${x + (r()-.5)*150*k}" cy="${y - 150*k + (r()-.6)*110*k}" r="${(28 + r()*24)*k}" fill="${pal[Math.floor(r()*pal.length)]}"/>`;
  });
  o += '<g fill="#f7c531"><circle cx="20" cy="495" r="45"/><circle cx="75" cy="505" r="40"/><circle cx="-10" cy="470" r="30"/></g>' +
       '<g fill="#f5a623"><circle cx="790" cy="495" r="45"/><circle cx="735" cy="505" r="35"/></g>';
  for (let i = 0; i < 8; i++)
    o += `<g class="lf" style="--x:${40 + i*95}px;animation-duration:${9 + r()*6}s;animation-delay:-${r()*12}s"><path d="M0-9Q7 0 0 9Q-7 0 0-9Z" fill="${orange[i % 4]}"/></g>`;
  return o;
}
function rain(r, n, col, dur, slant) {
  let o = `<g opacity=".6">`;
  for (let i = 0; i < n; i++)
    o += `<g class="dr" style="--x:${Math.floor(r()*900)}px;--s:${slant}px;animation-duration:${(dur*(.8+r()*.4)).toFixed(2)}s;animation-delay:-${(r()*dur).toFixed(2)}s"><line x2="-4" y2="16" stroke="${col}" stroke-width="1.3" stroke-linecap="round"/></g>`;
  return o + "</g>";
}
function cloud(x, y, k, c, i) {
  return `<g class="cl${i % 2 ? " cl2" : ""}" fill="${c}"><ellipse cx="${x}" cy="${y}" rx="${110*k}" ry="${34*k}"/><ellipse cx="${x-50*k}" cy="${y+8*k}" rx="${70*k}" ry="${28*k}"/><ellipse cx="${x+55*k}" cy="${y+6*k}" rx="${80*k}" ry="${30*k}"/><ellipse cx="${x+5*k}" cy="${y-24*k}" rx="${60*k}" ry="${30*k}"/></g>`;
}
function rainySVG() {
  const r = rng(5);
  let o = '<defs><linearGradient id="wrRsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7d8fa3"/><stop offset="1" stop-color="#c9d3dc"/></linearGradient></defs><rect width="800" height="500" fill="url(#wrRsky)"/>';
  [[120,90,1,"#aab6c3"],[420,60,1.2,"#98a7b6"],[680,110,.9,"#aab6c3"],[260,160,.8,"#b9c4cf"]].forEach(([x,y,k,c],i) => o += cloud(x,y,k,c,i));
  o += '<path d="M0 330C120 280 240 290 360 320C480 350 620 290 800 310V500H0Z" fill="#8ea0ae"/><path d="M0 370C160 330 300 350 440 375C580 400 700 350 800 360V500H0Z" fill="#6f8593"/>';
  [[90,372,1],[175,382,.8],[590,392,1.1],[700,366,.9]].forEach(([x,y,k]) =>
    o += `<rect x="${x-4*k}" y="${y-40*k}" width="${8*k}" height="${44*k}" fill="#4a5d68"/><g fill="#587380"><circle cx="${x}" cy="${y-62*k}" r="${30*k}"/><circle cx="${x-20*k}" cy="${y-46*k}" r="${22*k}"/><circle cx="${x+20*k}" cy="${y-48*k}" r="${22*k}"/></g>`);
  o += '<path d="M0 500V430C200 410 500 425 800 415V500Z" fill="#4c6270"/>';
  [[160,462,70,0],[430,478,90,.6],[660,455,60,1.2]].forEach(([x,y,w,d]) =>
    o += `<ellipse cx="${x}" cy="${y}" rx="${w}" ry="${w*.14}" fill="#8fa8b8" opacity=".55"/><ellipse class="rp" cx="${x}" cy="${y}" rx="${w*.5}" ry="${w*.07}" fill="none" stroke="#e4eef7" stroke-width="1.5" style="animation-delay:${d}s"/><ellipse class="rp" cx="${x+w*.3}" cy="${y}" rx="${w*.4}" ry="${w*.06}" fill="none" stroke="#e4eef7" stroke-width="1.5" style="animation-delay:${d+.9}s"/>`);
  return o + rain(r, 70, "#e4eef7", 1.1, 40);
}
function stormySVG() {
  const r = rng(9), pine = "M0-100L10-72H5L15-50H8L20-25H10L24 0H-24L-10-25H-20L-8-50H-15L-5-72H-10Z";
  let o = '<defs><linearGradient id="wrSsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0f1526"/><stop offset="1" stop-color="#46506c"/></linearGradient><filter id="wrGlow"><feGaussianBlur stdDeviation="5"/></filter></defs><rect width="800" height="500" fill="url(#wrSsky)"/>';
  [[100,60,1.5,"#1e2439"],[380,40,1.7,"#252c45"],[650,70,1.5,"#1e2439"],[240,140,1.1,"#2e3752"],[560,150,1.2,"#2b3350"]].forEach(([x,y,k,c],i) => o += cloud(x,y,k,c,i));
  [["M280 100L262 195L292 200L255 315L318 180L288 175L305 100Z",7,-2],["M620 110L603 205L630 209L598 305L655 195L628 191L640 110Z",11,-6]].forEach(([d,t,dl]) => {
    const a = `animation-duration:${t}s;animation-delay:${dl}s`;
    o += `<g class="bolt" style="${a}"><path d="${d}" fill="#9fc0ff" filter="url(#wrGlow)"/><path d="${d}" fill="#f7fbff"/></g><rect class="fl" width="800" height="500" fill="#cfe0ff" style="${a}"/>`;
  });
  o += '<path d="M0 340C150 300 300 330 450 310C600 290 700 320 800 305V500H0Z" fill="#1a2135"/><rect y="425" width="800" height="75" fill="#0d1220"/>';
  for (let x = -10; x < 820; x += 40 * (.7 + r() * .6))
    o += `<g transform="translate(${x} 432) scale(${(.9 + r() * .7).toFixed(2)})"><path class="sw" d="${pine}" fill="#0d1220" style="animation-delay:-${(r()*2.6).toFixed(2)}s"/></g>`;
  o += '<path d="M0 500V445C250 430 550 440 800 432V500Z" fill="#0a0e1a"/>';
  return o + rain(r, 120, "#cfdcf0", .7, 90);
}


  panel.querySelector("[data-s=autumn]").innerHTML = autumnSVG();
  panel.querySelector("[data-s=forest]").innerHTML = forestSVG();
  panel.querySelector("[data-s=rainy]").innerHTML = rainySVG();
  panel.querySelector("[data-s=stormy]").innerHTML = stormySVG();

  function setScene(name) {
    panel.dataset.scene = name;
    section.querySelectorAll("[data-wr-scene]").forEach((b) => b.classList.toggle("on", b.dataset.wrScene === name));
  }
  section.querySelectorAll("[data-wr-scene]").forEach((b) => (b.onclick = () => setScene(b.dataset.wrScene)));
  section.querySelectorAll("[data-wr-lives]").forEach((b) => (b.onclick = () => {
    maxLives = +b.dataset.wrLives; lives = maxLives; drawHearts();
    section.querySelectorAll("[data-wr-lives]").forEach((x) => x.classList.toggle("on", x === b));
  }));
  setScene("autumn");

  /* ---------- game loop ---------- */
  function spawn() {
    const text = WORDS[Math.floor(Math.random() * WORDS.length)];
    if (words.some((w) => w.text === text)) return;
    const el = document.createElement("div");
    el.className = "wr-word"; el.textContent = text;
    panel.appendChild(el);
    const maxX = Math.max(0, panel.clientWidth - el.offsetWidth - 8);
    const w = { el, text, x: 4 + Math.random() * maxX, y: -el.offsetHeight, v: speed() * (0.85 + Math.random() * 0.3) };
    el.style.transform = `translate(${w.x}px,${w.y}px)`;
    words.push(w);
  }

  function frame(t) {
    if (!running) return;
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (t - last) / 1000); last = t;
    if (paused) return;
    spawnT += dt;
    if (spawnT >= spawnEvery()) { spawnT = 0; spawn(); }
    const H = panel.clientHeight;
    for (const w of [...words]) {
      w.y += w.v * dt;
      w.el.style.transform = `translate(${w.x}px,${w.y}px)`;
      if (w.y > H) { removeWord(w); miss(); if (!running) return; }
    }
  }
  function removeWord(w) { w.el.remove(); words = words.filter((x) => x !== w); }
  function miss() {
    lives--; combo = 0; hud();
    panel.classList.remove("hit"); void panel.offsetWidth; panel.classList.add("hit");
    if (lives <= 0) gameOver();
  }

  function refreshTarget() {
    const v = input.value.toLowerCase();
    let target = null;
    for (const w of words) {
      w.el.classList.remove("target"); w.el.textContent = w.text;
      if (v && w.text.startsWith(v) && (!target || w.y > target.y)) target = w;
    }
    if (target) {
      target.el.classList.add("target");
      target.el.innerHTML = `<span class="done">${target.text.slice(0, v.length)}</span>${target.text.slice(v.length)}`;
    }
    input.classList.toggle("bad", !!v && !target);
  }

  input.addEventListener("input", () => {
    if (!running || paused) { input.value = ""; return; }
    const v = input.value.toLowerCase().trim();
    const hit = words.filter((w) => w.text === v).sort((a, b) => b.y - a.y)[0];
    if (hit) {
      const pts = Math.round(hit.text.length * 10 * (1 + Math.min(combo, 20) * 0.1));
      score += pts; combo++; killed++;
      const tag = document.createElement("div");
      tag.className = "wr-pop"; tag.textContent = "+" + pts;
      tag.style.left = hit.x + "px"; tag.style.top = hit.y + "px";
      panel.appendChild(tag); setTimeout(() => tag.remove(), 700);
      removeWord(hit); input.value = "";
      if (killed % 10 === 0) level++;
      hud();
    }
    refreshTarget();
  });

  /* ---------- flow: start / pause / over / close ---------- */
  const screens = ["wrStart", "wrOver", "wrPauseScreen"];
  function showOnly(id) { screens.forEach((s) => $(s).classList.toggle("hidden", s !== id)); }

  function start() {
    words.forEach((w) => w.el.remove()); words = [];
    lives = maxLives; score = 0; level = 1; combo = 0; killed = 0; spawnT = 1.5;
    running = true; paused = false; input.value = ""; input.classList.remove("bad");
    showOnly(null); $("wrPause").textContent = "Pause";
    hud(); input.focus(); last = performance.now(); requestAnimationFrame(frame);
  }
  function saveBest() { const b = score > best; if (b) { best = score; $("wrBest").textContent = best; } return b; }
  function gameOver() {
    running = false;
    const nb = saveBest();
    $("wrSummary").textContent = `Score ${score} · Level ${level} · ${killed} words typed` + (nb ? " — new best!" : "");
    $("wrOver").insertBefore($("wrOptions"), $("wrAgain"));   // lives + scene choices after every game
    showOnly("wrOver"); $("wrAgain").focus();
  }
  function setPause(p) {
    if (!running) return;
    paused = p; $("wrPauseScreen").classList.toggle("hidden", !p);
    $("wrPause").textContent = p ? "Resume" : "Pause";
    if (!p) input.focus();
  }
  function closeGame() {            // ✕ — stop and go back to the Test page
    if (running) saveBest();
    running = false; paused = false;
    words.forEach((w) => w.el.remove()); words = []; input.value = ""; input.classList.remove("bad");
    $("wrPause").textContent = "Pause";
    $("wrStart").insertBefore($("wrOptions"), $("wrStartBtn")); showOnly("wrStart");
    hud();
    const home = document.querySelector('.nav-link[data-page="home"]');
    if (home) home.click();
  }

  $("wrStartBtn").onclick = start;
  $("wrAgain").onclick = start;
  $("wrResume").onclick = () => setPause(false);
  $("wrPause").onclick = () => setPause(!paused);
  $("wrClose").onclick = closeGame;

  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && isActive()) setPause(!paused); });
  window.addEventListener("blur", () => { if (isActive()) setPause(true); });

  // Pause automatically when the player leaves this page; focus the right control when they come back.
  // The game page uses a full-screen, no-scroll layout (see "body.game-mode" in game.css).
  const syncLayout = () => document.body.classList.toggle("game-mode", isActive());
  new MutationObserver(() => {
    syncLayout();
    if (!isActive()) { setPause(true); return; }
    if (!running) { const b = $("wrStartBtn").offsetParent ? $("wrStartBtn") : $("wrAgain"); b && b.focus({ preventScroll: true }); }
  }).observe(section, { attributes: true, attributeFilter: ["class"] });

  // "Practice game" shortcut on the Test page: same as clicking the Game tab in the menu.
  document.querySelectorAll("[data-goto=game]").forEach((el) => el.addEventListener("click", () => {
    const tab = document.querySelector('.nav-link[data-page="game"]');
    if (tab) tab.click();
  }));

  syncLayout();
  hud();
})();
