# Field Station P-4

The personal site of Putu Mahendra (puma), built as a television. The whole site is a VHS tape playing on an old CRT: curved glass, scanlines, static between channels. There's no header. Mr. P, a small low-poly alien in a bubble helmet, hosts it, answers questions about the operator, and does the navigating.

## Channels

| Ch | Page | What's on |
| -- | ---- | --------- |
| 01 | `/` | Chat with Mr. P. Replies stream from a language model, or from a local phrasebook when it's offline, and can mount instruments: the dossier, the tape shelf, a contact form, Star Catcher. |
| 02 | `/notes` | Notes plotted as contacts on a satellite tracking scope. |
| 03 | `/sanctuary` | A live chat room where visitors talk to each other. |
| 04 | `/projects` | Projects as VHS tapes on a shelf, one case study each. |
| 00 | `/test-card` | SMPTE bars, the colophon, and live station status. |
| – | `/play` | The arcade: Star Catcher full screen, with the high-score table. |
| – | `/guestbook` | One line per visitor, kept for good. |
| – | `/teletext` | The plain facts for recruiters, printable. |

Everything works from the keyboard: type anywhere to talk, `/` for slash commands (`/go`, `/whoami`, `/now`, `/resume`, `/theme`, `/effects`…), Alt and a number to change channel, `?` for the full map.

## Stack

Next.js 16 (App Router), React 19, Convex for the live parts, Three.js for Mr. P, MDX for writing, Tailwind CSS 4, Motion, and the Web Audio API for every sound.

## Running it

```bash
bun install
cp .env.example .env.local   # then fill in what you have
npx convex dev               # in one terminal: the live backend
bun dev                      # in another: http://localhost:3000
```

Everything is optional. Without `ZAI_API_KEY`, Mr. P answers from his phrasebook. Without Convex, the Sanctuary, guestbook, high scores and transmitter go off the air, and the rest of the station still works.

## Writing

- **Notes** go in `content/notes/*.mdx`.
- **Projects** go in `content/projects/*.mdx`. On top of the usual `title`, `summary`, `publishedAt` and `tags`, projects can set `role`, `stack` (a list), `externalUrl` (the live site) and `repoUrl`.
- **Facts about the operator** live in `lib/site.ts`: `profile` (role, summary, experience, skills), `now` (the /now panel) and `links`. Mr. P only ever repeats what's written there.

## Moderation

From the Convex dashboard, or with `npx convex run`:

```bash
npx convex run messages:remove '{"id": "..."}'   # a Sanctuary message
npx convex run messages:clear                    # the whole room
npx convex run guestbook:remove '{"id": "..."}'  # a guestbook signature
npx convex run scores:remove '{"id": "..."}'     # a high score
```

Transmissions from the contact form are in the `transmissions` table (`npx convex run transmissions:remove` clears one).
