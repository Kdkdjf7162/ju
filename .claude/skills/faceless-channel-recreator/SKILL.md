---
name: faceless-channel-recreator
description: Recreate the format of a faceless YouTube Shorts channel that is blowing up, with your own stories, using the Higgsfield MCP. Studies the target channel, writes a channel file, outlines ten new episodes, produces finished vertical episodes (script with sources, narration, every shot, captions, edit) through Higgsfield's faceless video workflow, saves everything into your project folder, scores each hook with Higgsfield's virality predictor and fixes the weakest one before you post. Use when someone says "recreate this channel", "start a faceless channel like X", "make Shorts like this channel", or runs /faceless-channel-recreator with a channel name or URL.
---

# Faceless Channel Recreator

You run a faceless YouTube Shorts channel for the user. You copy a proven channel's **format**, never its stories, scripts, characters or art.

Inputs (ask once, in one message, only for what's missing):
- **Target channel**: name or URL. Required.
- **Episodes to produce now**: default 3. Outline 10 either way.
- **Length**: default 60 seconds. Allowed: 30, 40, 50 or 60.
- **Aspect**: default 9:16.

Defaults you never ask about: subtitles on, one narrator for the whole channel, one look for the whole channel.

## Before anything else

1. **Check the Higgsfield MCP is connected.** Search your tools for Higgsfield (in Claude Code MCP tools can be deferred, so load them with tool search before deciding they're missing). Calling `balance` is the simplest proof it works. If there's no Higgsfield at all, stop and tell the user:
   > Connect it in 30 seconds: Claude > Settings > Connectors > + > Name: Higgsfield > URL: https://mcp.higgsfield.ai/mcp > Add, then sign in. In Claude Code you can also run `claude mcp add --transport http higgsfield https://mcp.higgsfield.ai/mcp` and then `/mcp`.
2. Call `balance` and note the credits. You'll report the real spend at the end.
3. Create `CHANNEL.md` and an `episodes/` folder in the current working directory if they don't exist.

## Step 1. Study the target

Get the target channel's recent Shorts with titles and view counts. YouTube channel pages don't load in a plain web fetch, so use one of these, in order:
1. **The channel's RSS feed:** `https://www.youtube.com/feeds/videos.xml?channel_id=CHANNEL_ID` lists the latest 15 uploads with titles and view counts (`media:statistics views`). Get the `UC...` channel ID from the channel URL or a search.
2. **yt-dlp**, if it's installed: `yt-dlp --flat-playlist --print "%(view_count)s|%(title)s" https://www.youtube.com/channel/CHANNEL_ID/shorts`
3. Otherwise ask the user to paste the titles and view counts.

Then run Higgsfield's `video_analysis_create` with the `youtube_url` of their single biggest Short (one Short's URL, never the channel URL: given a channel it silently picks a video) to get its scene-by-scene structure and pacing. It's free but can take 15 minutes, so start it first and write the outlines while it runs. If their visual format is something this pipeline doesn't make (for example talking cartoon characters instead of a narrator), say so plainly: you're copying the story format, in your own narrated look.

Tell the user the **pattern in five bullets**: the kind of story, what the first line does, the length, the pacing, and what the top performers have in common. Show the numbers that support each bullet.

## Step 2. The channel file

Write `CHANNEL.md`:

```
# [Channel name]
Format: [one line, e.g. "one weird but true history story in under a minute"]
Inspired by: [target], format only. Never their stories, scripts, characters or art.
Length: [N] s, 9:16, subtitles on
Look: [explainer style picked in step 4]
Narrator: [voice name and id, locked in step 4]
Hook rule: the first line lands the strangest fact in under 8 words, the narration starts inside the first second (the workflow centres each line in its 10-second block, so write the first line long enough to fill about 9.3 seconds), and the first shot is an impact, not an establishing view.
Story rules: public-domain history or well-documented facts only. No living people. No real logos, brands or copyrighted characters. No newspapers, signs or documents with text in any shot (video models invent fake text).
Sources: every factual claim has a source in the episode's sources.md.
```

## Step 3. Ten new episodes

Outline ten new stories that fit the pattern, one line each: the story, the hook line, why it fits. **Check every story against the target's titles and drop any they already covered.** Then show the user the list, the plan for the first episodes, and an estimated credit cost (see the cost table below). **Wait for the user's go before spending anything.**

## Step 4. Produce each episode

For each episode, in order:

1. **Script and sources first.** Write `episodes/epNN/script.md` (one narration line per 10-second block, 20 to 23 words each) and `episodes/epNN/sources.md` (a link for every fact). **Stop and show both to the user.** Cut or fix anything weakly sourced. Each line has to land between about 8 and 9.5 seconds when spoken. Pauses cost more than words: a full stop is about 0.7 seconds and a comma after a spelled-out year about 0.6. So budget 17 to 19 words for the hook line, 19 to 21 for number-heavy lines, 20 to 23 otherwise; keep years out of mid-sentence comma positions; and don't make a line all short words (it comes out rushed). If a line still misses after three takes, rewrite it shorter or move the pause, and tell the user what you changed.
2. **Run Higgsfield's faceless video workflow.** Load it with `get_workflow_instructions` (workflow `faceless-video`) and follow it exactly. It's long (over 100 KB): if the result gets saved to a file, read it in parts, and read the golden rules, the phase gates and the narration and captions sections in full before generating anything. Answer its intake from `CHANNEL.md`: channel type (History or Explainer), Animated, the length, 9:16, subtitles on, **no thumbnail** (step 6 makes a 9:16 cover instead, so skip the workflow's own thumbnail step), the user's own topic.
   - **Look:** on the first episode, show the user the explainer style gallery and recommend the card closest to the target's feel from step 1 (if nothing matches their style, say so: you're keeping their format in a look of your own). Record the pick in `CHANNEL.md` and reuse it for every episode. If a card is marked archived or the workflow swaps it, tell the user and pick a live card. If a card's reference images fail to load, use its gallery cover image as the style reference.
   - **Voice:** on the first episode, let the user pick from the voice picker. Record the name, id and voice type in `CHANNEL.md` and reuse exactly that pair on every episode.
3. **Download everything.** Higgsfield returns links, not files, and its sandbox is wiped between calls. Download each clip from its result link into `episodes/epNN/clips/`, and the finished video from the link `media_confirm` returns into `episodes/epNN/episode.mp4`. Keep the script and sources next to them.
4. Tell the user the credits this episode cost.

After the first episode, run the rest back to back with the same look, narrator and characters where they fit.

## Step 5. Score the hooks, fix the weakest

Higgsfield's `virality_predictor` takes clips up to 16 seconds, so score **the first 15 seconds** of each episode (the hook window is what decides a Short anyway).

1. Make a 15-second trim of each episode's opening (ffmpeg locally, or inside Higgsfield's sandbox) and upload it with `media_upload` and `media_confirm`.
2. Run `virality_predictor` (`action: "create"`) on each, wait with `jobs_wait`, and download the dashboard. The scores are inside the HTML: overall, viral potential, hook score, engagement and sustain.
3. Show a table and name the weakest hook and why. The hook score looks at roughly the first 3 seconds, so that's where fixes pay off. With only one episode, fix it if the hook score is under 50.
4. Fix it: regenerate the first 10-second block of that episode with a hard impact in the very first frame, and rewrite the first line so the strangest fact comes first. Keep everything else. Re-assemble, re-trim and score again (about 20 credits). Show before and after. Gains are often small (a few points); if the score doesn't improve, say so plainly.

The predictor is a prediction. Real viewers are the judge.

## Step 6. Ready to post

For each episode write a title, a description and hashtags, and make a cover image with GPT Image 2 (`generate_image`, model `gpt_image_2_5`, 9:16): the episode's look, the hook in big text, **unbranded objects and no other text**. Save it as `episodes/epNN/cover.png`.

Then call `balance` again and report: credits quoted, credits spent, and credits per finished episode.

Remind the user: YouTube doesn't monetize mass-produced or repetitive videos. It does pay for original ones. Keep every episode a new story, sourced, in the channel's own look, and tick YouTube's altered or synthetic content label when posting.

## Costs (Higgsfield credits, checked October 2026; prices change)

| Item | Credits |
|---|---|
| One 10-second video block (the faceless workflow's video model) | 20 |
| One image (the workflow's image model) | 1.25 |
| One narration take (lines often need 2 or 3 takes to hit the timing) | about 0.75 to 0.9 |
| Virality predictor | 0 |
| GPT Image 2 cover, low quality | 0.25 |
| **One 60-second episode** | **about 140 to 160** |
| One 30-second episode | about 75 to 80 (tested: 77, plus 20 for the hook fix) |

Each regenerated block adds 20. Check `balance` before and after rather than trusting estimates.

## Known rough edges

- Video blocks can come back with a preset recommendation instead of a job (in testing, every block in the batch). Resubmit those items with `declined_preset_id` set to the recommended preset, and send it up front on every later block.
- The caption step can fail looking for narration files under different names than the assembler left (it wants `v_000.wav`, `v_001.wav` and so on, zero-indexed, in the voice folder it's given). Copy the takes to those names and rerun it.
- Caption checks can refuse to burn on spelled-out years and money (speech-to-text writes digits, so the match score drops). If the timing matches, rerun the caption script with `--minimum-similarity 0.70` and tell the user.
- Uploads: send the file with `curl --upload-file` and the headers the signed URL asks for (including `If-None-Match: *`), even if the upload tool's own hint says `--data-binary`.
- Video generations take about 10 to 12 minutes and the predictor can queue for several minutes. Keep going; don't resubmit while a job is still running.
