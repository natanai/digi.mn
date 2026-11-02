# digi.mn

A text-led, 2D pixel-art Digimon fan game set in the *Digimon Beatbreak* universe. Play as a Cleaner, explore urban districts, and resolve stories through investigation, conversation, or confrontation. Digimon in the game will be original designs by the author.

## Development status

**Engine import completed.** digi.mn contains an independent snapshot of [pre-programmed](https://github.com/natanai/pre-programmed), including its real narrative, world-state, persistence, media, and Author systems. The origin commit is recorded in [docs/source-snapshot.txt](docs/source-snapshot.txt).

**Street prototype implemented.** A feature-owned side-on pixel renderer is connected to the current narrative node's authored choices. It supports WASD/arrow movement, a limited depth axis, walking/idle poses, proximity interaction with **E** or the on-screen interaction button, placeholder streets, deterministic arrangement from the play seed, and integer nearest-neighbor pixel scaling. Choose **TEXT VIEW** to use the original terminal without the graphical layer.

**Not implemented yet:** mission/bounty generation, the permanent Cleaner hub, dedicated map authoring, asset-backed sprite animation, the nonviolent bounty completion validator, the Sapotama partner reveal, and game-specific story content. Placeholder street markers represent current node choices, **not** a finished town/quest system.

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
