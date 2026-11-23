# Claude Code Anime Themes

A growing collection of anime-inspired looks for the Claude desktop app. Each theme is its own plugin, so you install only the ones you like. All artwork is original vector art drawn for these themes.

## Themes

### Yato x Killua - Godspeed Divine Edition
Yato's calm shrine-blue (Noragami) meets Killua's Godspeed lightning (Hunter x Hunter): a full dark color theme, framed message boxes and an animated backdrop. The backdrop follows real session activity: thinking, writing, tool calls, completed turns, errors and high context use.

Switch modes with `/godspeed divine`, `/godspeed godspeed` or `/godspeed dual` (default). Reacts to real events: subagents, permission prompts, compaction and the kind of tool running.

### Solo Leveling - Shadow Monarch
Three different worlds in layered, animated vector art: **Monarch** (a throne room with a cracked black moon and a shadow army that grows with every real tool call), **System** (a hunter HUD, a jagged Gate and a city) and **Dungeon** (a red eclipse and colossal sentinels). A companion changes pose with what Claude is doing: standing, sword raised, dash, kneel. The status band shows real counts and the real context meter only.

Switch worlds with `/shadow system`, `/shadow monarch` or `/shadow dungeon`, and run `/shadow status` to see the real events the session has received. Subagents become shadow soldiers, a permission prompt makes the knight kneel and wait, compaction purges the scene, and each kind of tool has its own effect.

### Noragami
Three worlds built from original silhouette art: **Shrine Night** (a torii under a crescent moon, with offerings that count real tool calls), **Far Shore** (the underworld river with lanterns and phantoms) and **Takamagahara** (a golden sun and a heavenly gate in the clouds). Play as **Yato, Hiyori, Yukine or Bishamon**: each has a pose for every session state and their own effects, and the others join you when subagents start. The character sets the app's accent colors and tints the look; the world is the scenery. Use `/noragami shrine|farshore|heaven` for the world and `/noragami yato|hiyori|yukine|bishamon` for the character.

### Hunter x Hunter
Three worlds: **Godspeed** (a black moon, cyan lightning and a charge that counts real tool calls), **Heavens Arena** (a dusk tower with sweeping floodlights and a crowd that grows) and **Zoldyck Estate** (the colossal gate in silver fog). Play as **Killua, Gon, Kurapika or Leorio**: each has a pose for every state and their own effects (claws, a fist burst, chains, a slam), and the others join you when subagents start. The character sets the app's accent colors and tints the look; the world is the scenery. Use `/hxh godspeed|arena|estate` for the world and `/hxh killua|gon|kurapika|leorio` for the character.

More themes coming.

## Install

At the prompt of a terminal session:

```
/plugin install yato-killua-godspeed --marketplace BiluAilu/claude-code-anime-themes
```

From a shell:

```
claude plugin install yato-killua-godspeed --marketplace BiluAilu/claude-code-anime-themes
```

For Noragami and Hunter x Hunter:

```
/plugin install noragami --marketplace BiluAilu/claude-code-anime-themes
/plugin install hunter-x-hunter --marketplace BiluAilu/claude-code-anime-themes
```

For Solo Leveling:

```
/plugin install solo-leveling-shadow-monarch --marketplace BiluAilu/claude-code-anime-themes
```

In the desktop app, where `/plugin` does not run: click + next to the prompt box, then Plugins, Add marketplace with `BiluAilu/claude-code-anime-themes`, then Add plugin.

## Rollback
Uninstall the plugin (`/plugin uninstall yato-killua-godspeed`). Your own settings are never changed.

## Add a theme
Put a new plugin folder under `plugins/` and add its entry to `.claude-plugin/marketplace.json`.

License: MIT.
