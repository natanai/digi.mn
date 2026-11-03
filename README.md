# digi.mn

A text-led, 2D pixel-art Digimon fan game set in the *Digimon Beatbreak* universe. Play as a Cleaner, explore urban districts, and resolve stories through investigation, conversation, or confrontation. Digimon in the game will be original designs by the author.

## Windows preview

**[Download digi.mn v0.1.0-preview.6 for Windows 11](https://github.com/natanai/digi.mn/releases/tag/v0.1.0-preview.6)**

This preview includes the redesigned three-region desktop interface and the contained terminal suggestions. Preview versions support in-app updates from v0.1.0-preview.5 onward. Earlier preview clients only check stable releases; they cannot discover the newer previews. The release is a fully contained, unsigned, portable ZIP. Extract it and run `digi.mn/_engine/digi.mn.exe` (do not run it inside the archive). On a brand-new installation, an editable Cleaner demo is created automatically from the real Narrative engine. You can accept a bounty, explore placeholder pixel-art streets, inspect the overhead map, investigate, and resolve the case with or without a payout before returning home.

The initial Author key is `local` in `installation.txt`; change it if desired. Your game data remains within `_engine/data`, and the downloadable archive does not contain saved player data. Later previews should be extracted separately; copy `_engine/data`, `assets`, and `installation.txt` over only after making a backup. Read `_engine/README.txt` in the package for the full instructions.

**Preview scope:** This tests the engine, Author editing, spatial interaction, and a handwritten sample case. It does *not* yet include random bounty composition, your original Digimon pixel art, the Sapotama partner reveal, or the final combat/cutaway presentation.

## Development status

**Engine import completed.** digi.mn contains an independent snapshot of [pre-programmed](https://github.com/natanai/pre-programmed), including its real narrative, world-state, persistence, media, and Author systems. The origin commit is recorded in [docs/source-snapshot.txt](docs/source-snapshot.txt).

**Authored street interactions implemented.** A feature-owned side-on pixel renderer displays explicitly positioned narrative interactions as people, objects, or entrances. The existing interaction editor owns each target's kind, position, optional World resource identity, conditions, response, and continuation. Movement uses WASD/arrow keys after clicking the street to focus it; press **E** or use the on-screen interaction button when near a target. Scenery remains seeded placeholder art with integer nearest-neighbor scaling. Choose **TEXT VIEW** to use the original terminal.

**Visual layout + district scaffold implemented.** Open a Node in Author mode and select **ARRANGE STREET** under Input Handling. The shared Author task provides a drag/keyboard-editable street preview for its existing inputs and saves changed placements using the same canonical interaction mutation. During play, **DISTRICT MAP** opens a full-screen generated map of streets connected through authored Entrance → AFTER transitions. The map is informational, not fast travel; the underlying text runtime still determines whether an entrance changes Node.

**Not implemented yet:** procedural bounty/story generation, the permanent Cleaner hub, true district street-network generation, asset-backed sprite animation, nonviolent bounty completion validation, Sapotama partner reveal, and authored game content. Present buildings, character silhouettes, and district blocks are placeholders.

## Sample mission continuity

The Cleaner case demonstrates actual conditional decisions. Talking with the vendor or inspecting the crate reveals a route into the alley. Listening to the Digimon and examining its injured companion unlocks an informed, peaceful resolution; returning the supplies for pay is a distinct conclusion. All this uses ordinary State flags and Narrative effects.

The revised story is installed **only for new, untouched local projects**. Upgrading an existing installation preserves its authored content, including the original sample story. To inspect the new sample, extract a separate fresh portable folder without copying old save data.

## Player layout (current preview)

The game UI now has **three distinct regions**: a centered, pixel-perfect street viewport; a pale LCD-style narration/history panel; and a separate dark terminal/action panel. The log is readable and scrollable but not editable in player mode. In Author experience, authored lines can still expose their normal source-edit affordances.

Suggestions scroll **inside the action panel** rather than floating over the narration. The view toggle and Options/Author controls share one toolbar, while the District Map button belongs to the street panel. At narrower window widths the history and actions stack. These changes are owned in `src/features/streets/digiShell.css` and the street feature; shared pre-programmed terminal behavior remains reusable.

## Authoring a street interaction

1. Open Author mode and edit a Node's existing input/interaction.
2. In that interaction's overview, enable **Place in street**. Choose Person, Object, or Entrance and set a logical X position (16–4096) and depth (104–129).
3. Optionally associate a Person with an existing Character or an Entrance with an existing Location. Save using the same interaction editor.
4. Configure its response and AFTER destination exactly as you would in pre-programmed. The street presentation does not create a second dialogue/door engine.
5. For a multi-object view, return to the Node editor and choose **ARRANGE STREET** under Input Handling. Drag markers or focus a marker and use arrow keys; use the normal **SAVE** action. The editor uses shared Author dirty-state and nested task navigation.
6. Make another Node with street interactions and point an entrance's AFTER transition there. On entering it, the next street renders and the District Map shows authored connections.

Entering the node displays its positioned, currently visible interactions. Unpositioned interactions remain accessible by the normal text-input route. The current prototype does not yet support dedicated tile painting, per-building geometry editing, a fully generated street graph, or art-backed character animation. Street arrangement is persisted on existing interactions; the overhead map is recalculated deterministically from their connections.

## Running locally

Node.js 22+ is required. Run:

```sh
npm install
npm run local
```

Open `http://127.0.0.1:5173`. The local Worker and database are used by the imported engine. Its default Author key in local mode is `local`, entered after `admin`.

The web build has **not** yet been configured for a publicly playable digi.mn deployment; the inherited Worker/hosting settings must first be separated from pre-programmed.

## Upstream engine updates

**pre-programmed is the canonical engine; digi.mn adds game-specific features.** This is not a one-time copy that should drift indefinitely. The original imported commit and latest integrated upstream commit are recorded in [docs/source-snapshot.txt](docs/source-snapshot.txt).

The [upstream review workflow](.github/workflows/upstream-engine.yml) checks pre-programmed every Monday (and can be run manually). It uses a **three-way patch** to propose changes to shared engine files while retaining digi.mn's street, district, and Digimon extensions. Upstream's Author UX audit and canonical task lookup remain in the upstream repo, rather than competing with a duplicate copy here.

Updates are never silently copied over game-specific work. The process runs shared and game-specific tests, proposes a PR where permitted, and requires review for conflicts or incompatible behavior. If GitHub Actions cannot open a PR, it retains the tested sync branch and attempts to create a tracking issue. A later upstream commit is **not considered integrated** until its changes and pin are merged into digi.mn.

Game-specific presentation logic should live in `src/features/streets` and other isolated features; the imported engine's top-level App now calls a compact `StreetPlaySurface` adapter. See [AGENTS.md](AGENTS.md) for the contribution rules that keep future merges possible.

## Project direction

Read the [canonical game design and first playable milestone](docs/game-design.md) for decisions about the side-on perspective, generated bounty districts, story beats, required nonviolent endings, original Digimon, and narrative-led Sapotama partner selection.

This is an independent, unofficial fan project.
