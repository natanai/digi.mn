digi.mn  ·  WINDOWS ENGINE PREVIEW
====================================

WHAT YOU'RE TESTING
This is an early, editable prototype of the digi.mn engine, not the finished Digimon game.
It starts with a tiny authored Cleaner scenario, two connected street scenes, an
overhead district overview, and different ways of resolving a bounty.

FIRST LAUNCH
1. Extract the entire digi.mn folder from this ZIP. Do not run inside the ZIP.
2. Run _engine\\digi.mn.exe. Everything needed is inside this folder.
3. Select the first-run start button if shown. Follow the short Cleaner story.
4. Click ground in the street to walk there. Click a person, object, or
   doorway to automatically walk up and interact. Clicking again reroutes
   the character. Click DISTRICT MAP to inspect connected streets, then
   BACK TO STREET to continue. No movement keys are required.
5. TEXT VIEW switches off the graphical panel, exposing the original text UI.
6. To edit the example, type 'admin' in the terminal, then enter the Author
   key from installation.txt (default: local).
7. Inside a Node's INPUT HANDLING section, ARRANGE STREET opens a draggable
   layout editor. SAVE when finished.

THE DEMO
The case is deliberately small, but discoveries now matter. Take the
assignment, ask the vendor or inspect the crate to discover why the alley
matters. The alley entrance remains visible even before you have a lead.
Inside, talk to the Digimon and examine its injured companion to unlock the
informed peaceful resolution. A separate route can earn the bounty payment. Helping them gives a resolved case without a
financial reward. Either resolution returns you to the Cleaner home.

The demo is installed only if the project's database is untouched. An older
stock demo can receive JUST the new cutaway cues, but only if it has no Author
edits. Any edited or imported story is preserved. To try a fully new demo,
extract a fresh portable folder without copying old data.
It does not simulate a procedurally generated bounty or Digimon evolution yet.

CHARACTERS IN THE STREET
The playable street now shows a pixel-art Cleaner and a small red-maned,
armadillo-like Digimon walking alongside. Both use imported, four-frame
transparent sprite sheets, not the old colored rectangles. Clicking the
street moves the Cleaner; the companion follows visually without autonomous
battle or a formal Sapotama reveal.

You can customize the sprites WITHOUT rebuilding: close the app, then
replace assets/sprites/cleaner-walk.png (120x52, four 30x52 frames) or
assets/sprites/partner-walk.png (168x30, four 42x30 frames). Keep
transparency and horizontal layout. The bundled atlas is the fallback.
These are prototype designs and can be redrawn later.

CINEMATIC CUTAWAYS
The engine ships two bundled SVG illustrations as temporary placeholders.
The Cleaner briefing appears when accepting a bounty; the alley rescue scene
appears after discovering the companion and offering to help peacefully.
Close a cutaway to return to the normal game. These are ordinary authored
Media image cues, not a separate cutscene or dialog engine.

An optional cel-inspired HD art pack replaces the SVG stand-ins with sharper
WebP game illustrations. Copy the pack's digi.mn/assets/cutaways folder into
your portable digi.mn/assets/cutaways folder (with the .asset.json receipts).
The same authored cues will resolve to your replacement art automatically.
The included full-resolution PNGs are for your own repainting and tracing.

YOUR FILES
- _engine/data: game database, Electron settings, cache. Keep this folder safe.
- assets: art and audio files for the authored game.
- installation.txt: your local Author key and initial start-button wording.

UPDATING THIS PREVIEW
The Settings > CHECK FOR UPDATES button now supports newer digi.mn preview
releases, as well as the eventual stable release. It downloads the official
Windows ZIP, verifies its SHA-256 digest, preserves _engine/data and your
installation.txt and assets, and relaunches the app after replacing the runtime.

If you installed v0.1.0-preview.4 or earlier, its updater cannot see GitHub
prereleases. Download this newer ZIP manually once. Future preview releases can
be installed through Settings after that.

Before ANY update, save open Author edits and export a .ppgame backup.
For manual updates, extract the new ZIP into a DIFFERENT folder while the
old app is closed. Copy the old _engine/data, assets, and installation.txt
into the new folder, keeping a backup of the old folder until tested.
Never replace only the EXE or remove the old data folder.

SAFETY
This is an unsigned, early Windows build. Windows SmartScreen may warn.
Only run it if it came from the official natanai/digi.mn GitHub release.
It does not require a separate Node.js installation or Cloudflare account.

ABOUT THE ART
The streets, story art, and sprite designs are temporary; Cleaner and
Digimon sprites do now render and animate inside the game. The canonical
Sapotama reveal, companion gameplay/AI, encounter animation, and procedural
bounty generator are still planned.

Project: https://github.com/natanai/digi.mn
