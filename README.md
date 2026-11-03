# digi.mn

A text-led, 2D pixel-art Digimon fan game set in the *Digimon Beatbreak* universe. Play as a Cleaner, explore urban districts, and resolve stories through investigation, conversation, or confrontation. Digimon in the game will be original designs by the author.

## Windows preview

**[Download digi.mn v0.1.0-preview.21 for Windows 11](https://github.com/natanai/digi.mn/releases/tag/v0.1.0-preview.21)**

This preview includes **Cleaner and red-maned Digimon sprites in the actual street**, point-and-click exploration, the restored monochrome pre-programmed visual language, a full-height history column on the left, one-click terminal suggestions, and authored cinematic cutaways. The early sprite sheets use a consistent pose and subtle walking motion until properly registered frame animations are drawn. Preview versions support in-app updates from v0.1.0-preview.5 onward. Earlier preview clients only check stable releases; they cannot discover the newer previews. The release is a fully contained, unsigned, portable ZIP. Extract it and run `digi.mn/_engine/digi.mn.exe` (do not run it inside the archive). On a brand-new installation, an editable Cleaner demo is created automatically from the real Narrative engine. You can accept a bounty, explore placeholder pixel-art streets, inspect the overhead map, investigate, and resolve the case with or without a payout before returning home.

The initial Author key is `local` in `installation.txt`; change it if desired. Your game data remains within `_engine/data`, and the downloadable archive does not contain saved player data. Later previews should be extracted separately; copy `_engine/data`, `assets`, and `installation.txt` over only after making a backup. Read `_engine/README.txt` in the package for the full instructions.

**Preview scope:** This tests the engine, Author editing, spatial interaction, and a handwritten sample case. It does *not* yet include random bounty composition, finalized character art, a canonical Sapotama partner reveal, or animated combat cutaways. The two still-image story cutaways are temporary examples.

### Testing the player interface in preview.19

The desktop now has a full-height scrolling history on the left, with recent narration kept near the terminal's vertical reading level; the street and actions occupy the right column. Colors, text, borders and controls use the original pre-programmed monochrome VGA visual language rather than a separate LCD theme. Selecting a terminal suggestion submits the command immediately. The character and companion no longer flicker through inconsistent prototype sprite frames, and the companion stops moving once it catches up.

The authored **Cleaner briefing** and **Alley rescue** cutaways use the existing Media runtime, with a fixed shared-engine text compiler so their cue IDs survive notation parsing. You can also use **[VIEW CUTAWAY]** in the street header to preview art explicitly. The stock scene's **Inventory** opens as a contained player workspace over the game viewport, leaving history and actions accessible; the packaged Windows acceptance test checks this using the actual `inv` command and measures the overlay geometry.

## Author mode: edit the running street (early implementation)

Use `admin` in the game terminal and sign in with your installation's Author key (`local` on a new preview). While Author mode is active, the street header exposes **[EDIT SCENE]**. Select it to inspect the *actual played street* without triggering its actions: click a person, object or entrance to open its canonical Narrative Interaction editor; click empty scenery or pavement to open the existing Street Layout workspace. That workspace supports adding a new street interaction, placing existing interactions, dragging markers or using their keyboard coordinates, and committing positions through the normal Author Save. **[PLAY SCENE]** returns to ordinary point-and-click interactions.

On Windows desktop, opening a scene Author task now keeps the game viewport mounted beside the existing Author dock so the editor and game remain in context. Changes remain subject to the existing Author dirty-draft, Save and conflict handling rather than becoming a separate scene save system.

**Important limit:** this is not yet fully visual game authoring. The prototype's procedural buildings/road style, actor sprite selection and animation settings, district-map rendering, and most player-facing GUI layout are still code defaults rather than project data. Moving those into the authoritative World/Media/scene presentation contracts is the next milestone; the requirement is recorded in [docs/game-design.md](docs/game-design.md). Assets may continue to be supplied manually in the portable `assets/` folder.

## Development status

**Engine import completed.** digi.mn contains an independent snapshot of [pre-programmed](https://github.com/natanai/pre-programmed), including its real narrative, world-state, persistence, media, and Author systems. The origin commit is recorded in [docs/source-snapshot.txt](docs/source-snapshot.txt).

**Authored street interactions implemented.** A feature-owned side-on pixel renderer displays explicitly positioned narrative interactions as people, objects, or entrances. The existing interaction editor owns each target's kind, position, optional World resource identity, conditions, response, and continuation. Player movement uses **point and click**: click a walkable area to move there, or click an authored person, object, or doorway to automatically approach and interact. Clicking again changes destinations. The original terminal remains available for text commands. Scenery remains seeded placeholder art with integer nearest-neighbor scaling. Choose **TEXT VIEW** to use the original terminal.

**Visual layout + district scaffold implemented.** Open a Node in Author mode and select **ARRANGE STREET** under Input Handling. The shared Author task provides a drag/keyboard-editable street preview for its existing inputs and saves changed placements using the same canonical interaction mutation. During play, **DISTRICT MAP** opens a full-screen generated map of streets connected through authored Entrance → AFTER transitions. The map is informational, not fast travel; the underlying text runtime still determines whether an entrance changes Node.

**Not implemented yet:** procedural bounty/story generation, the permanent Cleaner hub, true district street-network generation, final authored sprite art, nonviolent bounty completion validation, Sapotama partner reveal, and authored game content. Present buildings and district blocks are placeholders. Cleaner and partner walk sprites are real but provisional asset-backed art.

## Sample mission continuity

The Cleaner case demonstrates actual conditional decisions. Talking with the vendor or inspecting the crate reveals a route into the alley. Listening to the Digimon and examining its injured companion unlocks an informed, peaceful resolution; returning the supplies for pay is a distinct conclusion. All this uses ordinary State flags and Narrative effects.

The revised story is installed **only for new, untouched local projects**. An existing, unchanged original demo can receive just the two new cutaway cues without replacing its story. If a project has any Author edits, its content is preserved and the artwork can be wired manually using the existing Media cue editor.

## Playable Cleaner and Digimon pixel sprites

The **actual street renderer** loads transparent four-frame concept atlases for both characters. The Cleaner has their asymmetric short/shaved-side hairstyle and black clothing; the small armadillo-themed Digimon follows with a blue body and long red hair that suggests its shell, cloak, and weapon. This is an early visual pass, **without the egg in the Cleaner sprite**. The partner is a visual follower only: this does not add partner autonomy or canonically implement the Sapotama reveal.

The tracked starter art is in `public/assets/sprites/cleaner-walk.png` (four 30 × 52 frames in a 120 × 52 atlas) and `partner-walk.png` (four 42 × 30 frames in a 168 × 30 atlas). The renderer reads those PNGs on launch and currently uses a consistent reference pose with subtle stepping motion. Early experimental frames changed the silhouette unpredictably, so full frame cycling is temporarily disabled until the walk sheets are redrawn and properly registered. Clicking and interactions still use the single Narrative system.

**Replacing the sprites in a portable installation:** Close the app, then place replacement PNGs at `digi.mn/assets/sprites/cleaner-walk.png` and `partner-walk.png`. Keep the same four-frame transparent, horizontal atlas dimensions. The portable host prioritizes these local files over its bundled starter art; no recompile or project import is needed. Back up the originals, and remove a replacement to restore the bundled version. Other dimensions require updating the atlas specification in `src/features/streets/spriteFrames.ts`.

## Cutaway art (temporary concept pass)

Two **authored image cues** now demonstrate cinematic cutaways: accepting the bounty presents a Cleaner briefing illustration; choosing the informed nonviolent resolution presents an alley rescue illustration. The cues are ordinary `sprite` text-performance cues from the upstream Media system, not a separate digi.mn cutscene editor. They can be changed, moved, or removed through normal Author tooling.

The preview includes two small, hand-authored SVG illustration stand-ins in `public/assets/cutaways/`, so the game can display cutaways immediately. A separate higher-resolution cel-inspired generated art pack provides `cleaner-briefing.webp` and `alley-rescue.webp`, plus original PNG references. To install the high-resolution artwork in the Windows portable build, copy the pack's `digi.mn/assets/cutaways/` contents into the same folder beside your `_engine`. Keep each WebP's `.asset.json` receipt. The stable IDs `digi.mn.cutaway.cleaner-briefing` and `digi.mn.cutaway.alley-rescue` override the bundled SVGs automatically without touching the story graph.

These are provisional look-development references, **not final character art or a canonical early reveal of the Digimon partner**. The author retains control of the actual reveal and all final sprites. Older edited projects remain untouched on upgrade.

## Player layout (current preview)

The UI now returns to **pre-programmed's canonical monochrome design language**: black backgrounds, VGA typography, gray text, white command suggestions and minimal dotted borders. The narration/history occupies the **full left column**; the street viewport sits above terminal actions on the right. The newest narration is positioned near the actions' vertical level, rather than isolated at the bottom of the screen. Author mode retains the upstream left dock.

Suggested terminal commands execute **immediately on click**. The command field still supports typing and Enter. A small [VIEW CUTAWAY] control in the playable street explicitly previews the demo's cinematic images; the actual story cues still fire when accepting the bounty or reaching the informed peaceful resolution. District Map and Inventory are contained within the game viewport instead of taking over the desktop.

At narrow widths the game stacks the stage, history and terminal. These layout changes are owned in `src/features/streets/digiShell.css` and the Streets feature; shared pre-programmed geometry and gameplay behavior remain the upstream source of truth.

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
