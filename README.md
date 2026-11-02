# digi.mn

A text-led, 2D pixel-art Digimon fan game set in the *Digimon Beatbreak* universe. Play as a Cleaner, explore urban districts, and resolve stories through investigation, conversation, or confrontation. Digimon in the game will be original designs by the author.

## Development status

**Engine import completed.** digi.mn contains an independent snapshot of [pre-programmed](https://github.com/natanai/pre-programmed), including its real narrative, world-state, persistence, media, and Author systems. The origin commit is recorded in [docs/source-snapshot.txt](docs/source-snapshot.txt).

**Authored street interactions implemented.** A feature-owned side-on pixel renderer displays explicitly positioned narrative interactions as people, objects, or entrances. The existing interaction editor owns each target's kind, position, optional World resource identity, conditions, response, and continuation. Movement uses WASD/arrow keys after clicking the street to focus it; press **E** or use the on-screen interaction button when near a target. Scenery remains seeded placeholder art with integer nearest-neighbor scaling. Choose **TEXT VIEW** to use the original terminal.

**Not implemented yet:** mission/bounty generation, the permanent Cleaner hub, dedicated map authoring, asset-backed sprite animation, the nonviolent bounty completion validator, the Sapotama partner reveal, and game-specific story content. Street sprites and buildings are placeholders, **not** finished map/quest content.

## Authoring a street interaction

1. Open Author mode and edit a Node's existing input/interaction.
2. In that interaction's overview, enable **Place in street**. Choose Person, Object, or Entrance and set a logical X position (16–4096) and depth (104–129).
3. Optionally associate a Person with an existing Character or an Entrance with an existing Location. Save using the same interaction editor.
4. Configure its response and AFTER destination exactly as you would in pre-programmed. The street presentation does not create a second dialogue/door engine.

Entering the node displays its positioned, currently visible interactions. Unpositioned interactions remain accessible by the normal text-input route. The current prototype does not yet have a drag-to-place scene editor, map persistence, or character sprite loading.

## Running locally

Node.js 22+ is required. Run:

```sh
npm install
npm run local
```

Open `http://127.0.0.1:5173`. The local Worker and database are used by the imported engine. Its default Author key in local mode is `local`, entered after `admin`.

The web build has **not** yet been configured for a publicly playable digi.mn deployment; the inherited Worker/hosting settings must first be separated from pre-programmed.

## Project direction

Read the [canonical game design and first playable milestone](docs/game-design.md) for decisions about the side-on perspective, generated bounty districts, story beats, required nonviolent endings, original Digimon, and narrative-led Sapotama partner selection.

This is an independent, unofficial fan project.
