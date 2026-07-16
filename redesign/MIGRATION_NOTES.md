# Paradigm Shift Migration Notes

This working migration lives in `redesign/` and does not overwrite the current production `index.html`.

## Files created

- `redesign/index.html`
- `redesign/assets/css/main.css`
- `redesign/assets/js/main.js`
- `redesign/MIGRATION_NOTES.md`

## Paradigm Shift files used

The migration uses `paradigm-shift/index.html` as the structural reference, especially the continuous scrolling page model and the editorial pattern:

```html
<section>
  <header>...</header>
  <div class="content">...</div>
</section>
```

The new CSS is a custom adapted stylesheet in `redesign/assets/css/main.css` rather than a direct copy of the original template CSS. This keeps the final site lighter and removes Dimension-specific modal behavior.

Referenced template source:

- `paradigm-shift/index.html`
- `paradigm-shift/assets/css/main.css`
- `paradigm-shift/assets/js/main.js`

## Current assets reused

The redesign reuses existing project assets from the repository root instead of duplicating large files:

- `../images/seb_video_cover.jpg`
- `../images/seb_visual_identity.jpg`
- `../images/seb_environment.jpg`
- `../images/seb_ui_design.jpg`
- `../images/seb_inspect_phase.jpg`
- `../images/seb_memory_playback.jpg`
- `../images/seb_dialogue_scene.jpg`
- `../images/seb_narrative_timeline.jpg`
- `../images/seb_intro_cinematics_flow.jpg`
- `../images/seb_inspect_loop.jpg`
- `../images/seb_llm_runtime_context.jpg`
- `../images/seb_stt_tts_flow.jpg`
- `../images/cinematics_joseon_noir.jpg`
- `../images/cinematics_crown_of_ashes.jpg`
- `../images/cinematics_greener_corporation.jpg`
- `../images/cinematics_robot_intruder.jpg`
- `../images/cinematics_roller_skate.jpg`
- `../images/Suji_Park_CV_preview.jpg`
- `../assets/docs/Suji_Park_CV.pdf`

Vimeo embeds preserved:

- SOMEONE ELSE’S BUSINESS presentation: `https://player.vimeo.com/video/1209250280?h=0&title=0&byline=0&portrait=0`
- Demo reel: `https://player.vimeo.com/video/1194143007`

Contact links preserved:

- Email: `mailto:suji.park.b@gmail.com`
- Vimeo: `https://vimeo.com/sujiparkb`
- ArtStation: `https://www.artstation.com/suji_park`
- LinkedIn: `https://www.linkedin.com/in/sujiparkb/`

## Paths to change when promoting to repository root

If `redesign/index.html` is moved to the repository root as the production `index.html`, update paths that currently begin with `../`:

- Change `../images/...` to `images/...`
- Change `../assets/docs/Suji_Park_CV.pdf` to `assets/docs/Suji_Park_CV.pdf`

CSS and JS paths can remain:

- `assets/css/main.css`
- `assets/js/main.js`

If promoting the redesign, copy or move:

- `redesign/assets/css/main.css` to `assets/css/main.css`
- `redesign/assets/js/main.js` to `assets/js/main.js`

Keep a backup of the current Dimension-based production files before replacing them.

## Dimension files that can be removed later

Only remove these after the redesign has been promoted, tested and committed:

- Dimension modal/hash transition code in the current root `assets/js/main.js`
- Dimension-specific `#main > article` switching behavior
- Dimension-specific `#bg` structure
- Unused Dimension CSS rules for hidden article panels and popup-style sections
- Unused template images such as `images/pic01.jpg`, `images/pic02.jpg` and `images/pic03.jpg`, if they are no longer referenced anywhere

Do not remove the HTML5 UP credit unless the license allows it.

## Testing checklist

- Open `redesign/index.html` locally.
- Confirm the page is continuous vertical scroll.
- Confirm navigation anchors jump to:
  - `#featured-project`
  - `#portfolio`
  - `#about`
- Confirm no Dimension modal panels or hash article transitions appear.
- Confirm the interface reads as black, warm white, grey and muted red.
- Confirm no teal or yellow interface dominance remains.
- Confirm the hero is left aligned and unboxed.
- Confirm Featured Project content is complete.
- Confirm both Vimeo embeds load and are playable.
- Confirm Visual Presentation uses full-width and half-width image rhythm.
- Confirm grayscale-to-color interaction works on desktop for Visual Presentation and Portfolio selected works.
- Confirm mobile and touch devices show images in full color with no sticky hover transform.
- Confirm Process Breakdown is text-led and diagrams are compact, uniform and uncropped.
- Confirm Process 05 matches Process 01–04.
- Confirm Portfolio selected works use consistent 16:9 frames.
- Confirm the fifth Portfolio item remains a normal left-column card on desktop.
- Confirm CV preview opens `../assets/docs/Suji_Park_CV.pdf`.
- Confirm contact links work.
- Confirm the contact rows align, including ArtStation.
- Check at 390px wide for no horizontal overflow.
- Check keyboard focus states.
- Check reduced motion behavior.

## Deployment steps

1. Test `redesign/index.html` locally.
2. Commit the safe migration version under `redesign/`.
3. When approved, back up the current production `index.html`, `assets/css/main.css` and `assets/js/main.js`.
4. Promote the redesign to root by copying the new HTML/CSS/JS into the production locations.
5. Update `../images/...` and `../assets/docs/...` paths to root-relative repository paths as noted above.
6. Test again locally from root `index.html`.
7. Commit and push to GitHub Pages.
