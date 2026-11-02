# digi.mn — game concept and first playable milestone

> Canonical design brief for the Digimon Beatbreak fan-game project. This records approved directions and deliberate deferrals. It is not a claim that the systems have already been implemented.

## Premise

A text-led, sprite-based Digimon fan game set in the *Digimon Beatbreak* universe. The protagonist begins as a Cleaner carrying an ordinary Sapotama. They accept bounties, travel to generated neighborhoods, investigate situations involving Digimon, and resolve encounters. The game contains an authored persistent story alongside repeatable, procedurally composed assignments.

All playable Digimon species/character artwork will be original designs created by the game's author. The game should not generate hybrid Digimon art out of interchangeable pieces.

## Player experience

- **Home / hub:** permanent location and narrative anchor. This is where the player starts, accepts work, returns after a resolved bounty, and progresses through the authored story.
- **Bounty area:** a deterministically generated overhead map for each assignment, with streets, possible destinations, and points of interest. This is the macro-navigation layer, not the main character viewpoint.
- **Town exploration:** side-on, belt-scrolling 2D streets with a limited depth axis, foreground/background layering, looped idle/walk animations, and interactable people, objects, and entrances. Depth should not demand 3D models or extensive directional sprite sets.
- **Narrative interactions:** text remains primary. Approaching or examining something opens an interaction driven by the same conditional narrative runtime used for conversations.
- **Confrontation:** speech, observation, physical action, disengagement, and defensive actions are all part of one continuous narrative encounter; there is no mandatory separate turn-based battle UI. Dramatic stills/short cutaway animations communicate attacks or other major actions, after which play returns to the encounter.
- **Return home:** a case can be resolved without a financial payout, and either kind of resolution sends the player home as a completed assignment. No traditional quest log is planned; the engine still tracks necessary state internally.

## Nonviolence is a generation invariant

Every generated bounty must have **at least one authored, reachable nonviolent path to a legitimate resolution**. It need not be immediately obvious, easy, or remunerative. A peaceful route may require investigation, patience, sacrifice, negotiation, or protecting someone.

Do not mistake **case resolved**, **bounty paid**, and **persistent consequences** for the same flag. A nonviolent case resolution is not tagged a failure merely because no money was collected. The engine should test peaceful-route reachability as part of bounty generation/validation, rather than relying on hopeful random assembly.

Avoid designing violence as a prerequisite for continued main-story progress.

## Authored structure + procedural variation

An authored **story beat** is a reusable node/subgraph with declared prerequisites, participants/roles, required clue(s), effects, possible exits, and narrative purpose. A bounty composer chooses a coherent situation and compatible beats, then assigns generated locations and optional incidental events. It must produce causal continuity, not merely shuffle dialogue paragraphs.

- Stable seeds should reproduce the same bounty layout and selected content given the same content version.
- Story beats are written and validated by the author; the generator does not invent dialogue or new Digimon artwork.
- Hand-authored quests and main-campaign scenes use the same narrative and encounter mechanics.
- Long-term state can affect future assignments and the authored campaign.
- Bounty composition, narrative validation, and graphical layout generation should be separate deterministic stages.

## Sapotama and partner reveal

The player begins with an ordinary Sapotama. At an authored story moment it erupts or transforms and the narrative asks what the player perceives. The player chooses among evocative **text descriptions before seeing any candidate sprites or portraits**. The resulting decision path meaningfully selects one of the author's original Digimon partners; only then is the chosen creature's art revealed.

This must feel like an event in the story, not an out-of-world personality quiz. The selection is deterministic and persisted. The player may later have story consequences reflecting those choices, but companion autonomy, detailed personality AI, partner-evolution rules, and advanced combat mechanics are **deferred**.

## Asset/rendering contract

- Author sprites and environment tiles using 32×32 logical pixels as a default unit, not an upper bound. Larger characters may occupy multiple tile units.
- Use transparent PNG/sprite sheets for conventional hand-created pixel art, rendered at integer scale with nearest-neighbor sampling and without smoothing. PNG pixels do not themselves scale infinitely; crisp enlargement is a renderer behavior.
- Preserve support for existing vector-grid SVG media where appropriate, without making SVG a requirement for art production.
- Keep asset references stable and repository-managed through the existing media feature.
- Preserve a minimal animation vocabulary: idle, walk, short expressions, and cutaways. Do not require full attack choreography.

## Relationship to pre-programmed

Source of reusable engine concepts: [natanai/pre-programmed](https://github.com/natanai/pre-programmed).

Preferred direction: copy/fork the engine **into this separate repository as a starting snapshot**, then adapt it independently rather than altering pre-programmed's own direction. Preserve its feature-owned architecture, conditional narrative graph, world state, seeded selections, media identity, authoring-in-context, and deterministic testing where possible.

Add or adapt feature-owned systems for:
1. Spatial scene/world renderer and movement.
2. Overworld mission-map composition and scene transitions.
3. Bounty/story-beat composition and reachability validation.
4. Narrative encounter presentation (including cutaways).
5. Partner selection/reveal and persistent game-specific progression.

Do **not** create a second parallel dialogue system, separate combat narrative engine, or duplicated author editors. Visual entities and actions should invoke the shared narrative/state/operations contracts. Keep the authoring path usable: the author must be able to arrange locations, set interactions, preview beats, and compose stories without hand-editing raw game files.

Pre-programmed's current Windows packaging, generic terminal-focused player shell, and historical audits should be evaluated before copying wholesale; do not treat unrelated infrastructure as a mandatory product requirement.

## First playable vertical slice

A demonstrable small end-to-end experience, with placeholder sprites allowed:

1. Begin at a fixed Cleaner home/hub with a Sapotama.
2. Accept one assignment through an interaction, not a conventional quest log.
3. Generate an overhead district from a fixed/replayable seed.
4. Enter one side-on street and move a sprite laterally and in limited depth; idle/walk loops render crisp pixel art.
5. Examine one object, speak with one NPC, and trigger conditional narrative state.
6. Confront one original/placeholder Digimon; choose between narrative actions, including a reachable nonviolent resolution; show one optional dramatic cutaway.
7. Finish the case and return home, clearly differentiating resolved/payout/world consequence.
8. Run a hand-authored Sapotama text-choice sequence that deterministically reveals one of at least two partner art assets. This may occur at a story-appropriate point rather than exactly the sequence above.

At least two seeds should create meaningfully different maps/beat assignments without breaking the main narrative or peaceful reachability. Save/reload should preserve seed, encounter outcomes, partner identity, and persistent state. Author mode should be able to inspect or change the relevant authored material.

**Acceptance criteria:** The complete loop functions in one playable build using the cloned/adapted narrative runtime, with deterministic tests for map reproducibility, partner selection, and a nonviolent completion route. No advanced creature AI, true combat simulation, evolution tree, exhaustive city generator, or polished art is required yet.

## Deliberately undecided

- Exact moment of the Sapotama reveal relative to the first bounty.
- Player input methods beyond keyboard/desktop baseline.
- Detailed partner autonomy, combat numbers, evolution, and balance.
- City generation weights, map dimensions, and pacing.
- How the authored main campaign gates or interrupts random assignments.
- Final story beat schema and author interface; derive these from prototype needs and pre-programmed's existing resource ownership patterns.

## Working rules

Keep this as the **single canonical current concept/vertical-slice brief**. Update it when a decision is made; avoid multiple competing design specs. Technical implementation docs may explain how code works, not silently redefine the experience. Separate speculative ideas from approved requirements, and do not claim concept milestones are implemented until verified.
