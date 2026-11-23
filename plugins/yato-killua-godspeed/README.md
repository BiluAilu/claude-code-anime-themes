# YATO x KILLUA - Godspeed Divine Edition

A midnight-blue anime look for the Claude desktop app, mixing Yato's calm shrine-blue (Noragami) with Killua's Godspeed lightning (Hunter x Hunter). It sets a full dark color theme, styled message boxes, and an animated SVG backdrop that follows real session activity.

## Reacts to real events
- **Subagents:** a bright spirit orb circles the moon for each running subagent (`spirits N` in the band).
- **Permission prompt:** an amber ring and glow around the moon and "awaiting your word"; it ends when the tool finishes.
- **Compaction:** rings contract inward and the sky darkens; a toast shows the real before and after context percentage.
- **Tool kind (from the real tool name):** Edit/Write a slash, Read/Grep/Glob sonar rings, WebFetch/WebSearch a beam into the moon, Agent/Task summon rings, MCP cyan lightning, Bash the Godspeed dash.
- `/godspeed status` prints the real event counts this session received.

## Use
- `/godspeed` shows the current mode. `/godspeed divine | godspeed | dual` switches it (default `dual`, remembered across sessions).
- Backdrop states come only from real events: turn start and thinking (divine particles), text streaming (lightning grows), tool calls (Godspeed pulses and speed lines), turn complete (one soft blue glow), a failed tool or API error (restrained red), and context at 80% or more (amber vignette plus a toast, using the session's real context percentage).
- A slim band above the prompt shows the mode, state and context percentage.

## Notes
- Only the desktop and mobile apps draw themes and backdrops; the terminal gets the band only.
- A session has one theme at a time, so this replaces `theme-examples` while active. That plugin is untouched.
- Rollback: delete this folder, or run `$.theme.clear()` via the other plugin's `/custom-theme off`.
