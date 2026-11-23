# Claude Code Anime Themes

A growing collection of anime-inspired looks for the Claude desktop app. Each theme is its own plugin, so you install only the ones you like. All artwork is original vector art drawn for these themes.

## Themes

### Yato x Killua - Godspeed Divine Edition
Yato's calm shrine-blue (Noragami) meets Killua's Godspeed lightning (Hunter x Hunter): a full dark color theme, framed message boxes and an animated backdrop. The backdrop follows real session activity: thinking, writing, tool calls, completed turns, errors and high context use.

Switch modes with `/godspeed divine`, `/godspeed godspeed` or `/godspeed dual` (default). Reacts to real events: subagents, permission prompts, compaction and the kind of tool running.

### Solo Leveling - Shadow Monarch
Three different worlds in layered, animated vector art: **Monarch** (a throne room with a cracked black moon and a shadow army that grows with every real tool call), **System** (a hunter HUD, a jagged Gate and a city) and **Dungeon** (a red eclipse and colossal sentinels). A companion changes pose with what Claude is doing: standing, sword raised, dash, kneel. The status band shows real counts and the real context meter only.

Switch worlds with `/shadow system`, `/shadow monarch` or `/shadow dungeon`, and run `/shadow status` to see the real events the session has received. Subagents become shadow soldiers, a permission prompt makes the knight kneel and wait, compaction purges the scene, and each kind of tool has its own effect.

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
