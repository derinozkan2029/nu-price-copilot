# Reference images for view-and-theme-specialist

Drop **actual image files** (screenshots or saved images) here for the agent
to look at directly — it can view images, not just read text, but it cannot
fetch Instagram or TikTok content itself (both are login-walled and
JS-rendered; a fetch only returns hashtags/metadata, never the photo).

For each post you want to use as a reference: open it, screenshot or
right-click → save the image/video-frame, and put the file in the matching
theme folder below.

## Folder structure

Use the same `id` as in `data/room-themes.json` when the theme already
exists, so the agent treats this as refining that theme rather than forking
a near-duplicate:

```
.claude/agents/assets/view-and-theme-specialist/
  pink-preppy/            (matches existing theme id)
    example1.jpg
    sources.txt           (optional — original post URLs, for your own reference)
  minimalist-chic/         (matches existing theme id "minimalist-chic", not "chic-minimalist")
  coastal-cowgirl/
  cozy-boho-neutral/       (matches existing theme id "cozy-boho-neutral", not "cozy-boho")
  sage-green-botanical/
```

These five folders already exist (created from the source links you had
gathered) with a `sources.txt` in each listing the original post URLs for
your own attribution/reference. **They don't have actual image files yet —
the agent has nothing to look at until you add the real screenshots.**

The agent globs this directory before doing any web research and treats
actual images here as ground truth for color palette, materials, and
motifs — ranked above anything it finds via web search. `sources.txt` is
for you; the agent doesn't need it to do its job, since it can't fetch the
linked posts anyway.
