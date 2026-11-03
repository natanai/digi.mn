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
4. For movement: click the street panel to focus it, then use WASD or arrows.
   Press E when near a person, object, or doorway. Click DISTRICT MAP to
   inspect the connected streets, then BACK TO STREET to continue.
5. TEXT VIEW switches off the graphical panel, exposing the original text UI.
6. To edit the example, type 'admin' in the terminal, then enter the Author
   key from installation.txt (default: local).
7. Inside a Node's INPUT HANDLING section, ARRANGE STREET opens a draggable
   layout editor. SAVE when finished.

THE DEMO
The initial scenario is intentionally small. Take a notice, explore South
Market, enter the service alley, listen to the frightened Digimon, and choose
how to resolve the situation. Helping them gives a resolved case without a
financial reward. Either resolution returns you to the Cleaner home.

This demonstration is installed ONCE only if the project's database is brand
new and untouched. Later launches preserve your work and your authored data.
It does not simulate a procedurally generated bounty or Digimon evolution yet.

YOUR FILES
- _engine/data: game database, Electron settings, cache. Keep this folder safe.
- assets: art and audio files for the authored game.
- installation.txt: your local Author key and initial start-button wording.

For a new preview, export a .ppgame backup from Author mode. Extract the newer
ZIP into a separate folder, then move the old _engine/data, assets, and
installation.txt into the new folder. Do not overwrite your save data with an
empty copy. The preview updater may not offer prerelease-to-prerelease upgrades.

SAFETY
This is an unsigned, early Windows build. Windows SmartScreen may warn.
Only run it if it came from the official natanai/digi.mn GitHub release.
It does not require a separate Node.js installation or Cloudflare account.

ABOUT THE ART
The streets and characters are placeholders, not the user's original pixel
sprites. The Sapotama reveal, animated Digimon partner, encounter cutaways,
and procedural bounty generator are still planned.

Project: https://github.com/natanai/digi.mn
