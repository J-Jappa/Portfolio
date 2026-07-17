# Content Review — Jasper Japp Portfolio

Reviewer: content editor (read-only pass — no files modified)
Date: 2026-07-09
Files read: about.astro, contact.astro, experience.astro, solar-racing.astro, index.astro, seven .mdx projects, two .md writings essays, Header.astro.

> **Owner corrections (2026-07-10).** Jasper has reviewed the top findings:
>
> 1. **Finding SAA-1 is RETRACTED.** "Monolithic reinforcement over a plant" is correct as written; "plant" is intentional, not a typo for "plate". Do not change it.
> 2. **Style rule for all suggested rewrites in this document: no em-dashes or en-dashes.** Jasper does not want them in his copy. Several suggestions below use them; when applying any suggestion, replace dashes with commas, full stops, middots (·) or restructure the sentence. Hyphenated compound words are fine.
> 3. Confirmed: the two writings essays are placeholders (not his writing). Both are now set to `draft: true` until he writes his own.
> 4. Resolved since review: solar racing and the honours project ended Nov 2025; he is an Engineering Specialist at AirTrunk since May 2026. experience.astro and the about page status card have been updated. The AirTrunk role still needs bullet points from Jasper.

---

## Read This First — Top 5 Issues

1. **[HIGH] The two writings essays sound AI-drafted, not like Jasper.** "on-building-slowly" and "notes-from-the-workshop" are polished, aphoristic, and weightless — they contain zero personal specifics, no grounding in what Jasper actually builds, no Australian idiom, nothing that could not have been written by anyone. They're currently not in nav, which is the right call, but publishing them as-is would undercut the authentic voice the rest of the site has earned. See §Writings.

2. **[HIGH] "Working on a compact wireless communications project when it works" — about.astro, Currently section.** The clause "when it works" is ambiguous and reads as an incomplete thought, likely meaning "when it isn't working" or "between stalls", but it could mean "whenever it works". Either way it's confusing and undercuts credibility right at the last bullet a visitor reads before the CV link.

3. **[MED] solar-car-aero.mdx caption capitalisation.** ~~"Monolithic reinforcement over a plant" almost certainly means "plate"~~ RETRACTED: owner confirms "plant" is correct as written. Remaining issue: "first layers after debulk." and "full car vacuum bag." have inconsistent capitalisation relative to adjacent captions. Subtle but visible to detail-oriented readers (i.e. the recruiter checking the work is real).

4. **[MED] experience.astro is dense with unexplained acronyms — SIL, AREH/GERI, ETAP, BWSC — in bullets that a general recruiter cannot parse.** The page is pitched as a "more formal overview" but the BP section in particular reads as internal project shorthand. A single parenthetical gloss each fixes it.

5. **[MED] index.astro hero line is a missed opportunity.** "Engineer focused on tricky problems whether in aerodynamics, composite structures, or applied ML." is functional but impersonal and does not match the warmth the about and project pages have found. Three candidate rewrites are in §index.astro below.

---

## Per-File Findings

### about.astro
Findings: 6

**Finding A-1** [HIGH]
Location: "Currently" section, bullet 2
Quote: `Working on a compact wireless communications project when it works`
Category: (2) poorly written — ambiguous / incomplete
Why: "when it works" reads like a dangling qualifier. The most natural reading is that it means "when it's in a working state" — i.e. intermittently — but it could also mean "whenever I get time". Either reading leaves the visitor uncertain. The "Currently" section is the last prose block before the CV link; unclear sentences here stick.
Suggested rewrite:
> Working on a compact wireless communications project — still early, but coming along.

If the project is stalled, be honest:
> Working (slowly) on a compact wireless communications module between other things.

---

**Finding A-2** [MED]
Location: Intro paragraph, sentence starting "What I enjoy most is finding a problem..."
Quote: `What I enjoy most is finding a problem, learning what I can, and working towards a great solution. This is made even better when I get to do it with others.`
Category: (3) bad voice — the second sentence especially sounds like a LinkedIn summary
Why: "This is made even better when I get to do it with others" is passive and corporate. The rest of the intro is warmer. The sentence pair also lands slightly awkwardly: it states a very general value (curiosity + collaboration) but doesn't connect it to anything concrete.
Suggested rewrite:
> What I find most satisfying is getting stuck into a real problem, learning enough to make progress, and landing on something that actually works. Better still when there's a good team to do it with.

---

**Finding A-3** [MED]
Location: Intro paragraph, final parenthetical
Quote: `(but I'll do my best to update it once in a while)`
Category: (2) poorly written — the parenthetical hedges unnecessarily and ends the intro paragraph on a low note
Why: The paragraph already flags the site is not exhaustive ("it's by no means an exhaustive portfolio"). The parenthetical doubles down on the apology. Drop it or replace it with something warmer.
Suggested rewrite: Delete the parenthetical, or replace the whole closing clause with:
> You'll find glimpses of that here — I'll keep adding to it.

---

**Finding A-4** [MED]
Location: "Outside of Engineering" section
Quote: `I feel as though I have an almost endless stream of hobbies. I love pulling a great shot of espresso. Skiing is one of my favourite things when I can get to the mountains. Been experimenting with some film photography. And I've started swimming to stay fit. I also always have a few projects on the go to keep me busy whether it's this website or something to help me learn.`
Category: (2) poorly written — five consecutive short sentences with different tenses and constructions
Why: The fragment "Been experimenting with some film photography" mixes register with "I love pulling a great shot of espresso." "I feel as though I have an almost endless stream of hobbies" is an awkward opener. The section has the bones of something good; it just needs connecting tissue.
Suggested rewrite:
> Outside of engineering I tend to have a few things running at once. I love pulling a great shot of espresso and spend an unreasonable amount of time thinking about it. Skiing whenever I can get to the mountains. I've been shooting film for a while now — there's a hidden corner of this site for that. And I've taken up swimming to stay sane.

---

**Finding A-5** [LOW]
Location: "What I've been working on" section, intro sentence
Quote: `Have a look around, but here's a real brief snapshot in a few sentences.`
Category: (2) poorly written — "a real brief snapshot" is awkward ("a really brief" or just "a brief")
Suggested rewrite:
> Have a look around — here's a brief snapshot.

---

**Finding A-6** [LOW]
Location: Solar Racing paragraph
Quote: `Lots of what I'm most proud of came from my time with ANU Solar Racing (most of the projects are things I did on my 2nd iteration with the team).`
Category: (2) poorly written — the parenthetical is verbose and redundant (the project page already makes this clear), "2nd iteration" is slightly jargon-y
Suggested rewrite:
> Most of what I'm proudest of came from my second cycle with ANU Solar Racing. New to Solar Racing? Read [What is Solar Racing?](/solar-racing/) for a quick overview and some shots of the car.

---

### contact.astro
Findings: 1

**Finding C-1** [MED]
Location: The single paragraph
Quote: `I'm always happy to talk engineering. Whether it's a role, a project, or just a question about solar cars or bushfire detection, drop me a line.`
Category: (1) thin content / (3) voice — serviceable but minimal; the two listed topics feel like they were picked at random
Why: Contact pages with only two lines and a list of links work fine technically but feel transactional compared with the warmth the rest of the site has. One more sentence in his voice would match the register.
Suggested rewrite:
> I'm always happy to talk — whether it's a role, a project, something you saw on the site, or just a question about solar cars. Drop me a line.

Optionally add a second sentence if something specific is currently true, e.g.:
> [placeholder — Jasper to fill: e.g. "I'm actively looking for roles in X" or "I'm based in Sydney and open to coffee if you're nearby."]

---

### experience.astro
Findings: 5

**Finding E-1** [HIGH]
Location: BP role, bullet 1
Quote: `Built an Excel-based modelling tool to compare HV transmission lines vs hydrogen pipelines (standards, SIL, reactive compensation).`
Category: (4) audience mismatch — SIL is unexplained
Why: SIL = Safety Integrity Level (or possibly System Integration Level in a power context). A recruiter outside power systems cannot parse it without a gloss. Same bullet also has "HV" which is fine as common shorthand, and "reactive compensation" which is domain knowledge but readable.
Suggested rewrite:
> Built an Excel-based modelling tool to compare HV transmission lines vs hydrogen pipelines (standards, safety integrity levels, reactive compensation).

---

**Finding E-2** [HIGH]
Location: BP role, bullet 3
Quote: `Extended to n-1 and multi-line scenarios for AREH/GERI reliability analysis; validated against ETAP and consultant benchmarks.`
Category: (4) audience mismatch — AREH/GERI and ETAP are unexplained
Why: AREH (Australia's Renewable Energy Hub) and GERI (Green Energy Renewable Infrastructure, or similar) are project-specific acronyms a recruiter outside Australian energy infrastructure will not know. ETAP is power-systems simulation software — equally opaque outside the field.
Suggested rewrite:
> Extended to n-1 and multi-line failure scenarios for large-scale renewable hub reliability analysis; validated against ETAP (industry power-systems simulation software) and consultant benchmarks.

(Drop AREH/GERI unless you add a gloss, or link to a public project page.)

---

**Finding E-3** [MED]
Location: BP role, bullet 5
Quote: `Assessed Dynamic Line Rating (wind + thermal algorithms) with potential ~$20M savings; delivered docs and a user guide; presented to senior engineers.`
Category: (2) poorly written — "delivered docs and a user guide" is tacked on and undersells the communication work; bullet is overfull
Why: Three distinct achievements crammed with semicolons. The presentation to senior engineers is actually notable.
Suggested rewrite (or split into two bullets):
> Assessed Dynamic Line Rating using wind and thermal algorithms; estimated potential ~$20M in operational savings.
> Delivered technical documentation and a user guide; presented findings to senior engineers.

---

**Finding E-4** [MED]
Location: Solar Racing role, bullet 1
Quote: `Aero & structures for BWSC vehicles (2023 & 2025).`
Category: (1) thin content — this bullet does less work than all the others; BWSC is unexplained on this page
Why: Every other bullet has a verb and says something about scope or outcome. This one is a noun phrase. BWSC appears without gloss here (the solar-racing.astro page explains it, but experience.astro stands alone as a resume-style page a recruiter might read first).
Suggested rewrite:
> Led aero and structures work for two Bridgestone World Solar Challenge (BWSC) campaigns (2023 & 2025).

---

**Finding E-5** [LOW]
Location: Solar Racing role, bullet 4
Quote: `SolidWorks composites design aligned to tooling/layup constraints; integrated structural/electrical packaging.`
Category: (2) poorly written — "aligned to tooling/layup constraints" is passive/jargon; "integrated structural/electrical packaging" is dense
Why: Readable to a mechanical engineer but opaque to a general tech recruiter. A small gloss helps.
Suggested rewrite:
> SolidWorks design for composite parts, shaped to suit real tooling and layup requirements; integrated mechanical and electrical packaging into the carbon structure.

---

### solar-racing.astro
Findings: 2

**Finding SR-1** [LOW]
Location: "My role on the team" section, paragraph 3
Quote: `In the next cycle (2024 to 2025) I moved to Structures with responsibility for a new aerodynamic shell and a carbon-fibre chassis from scratch. I led the aero design. The regulations changed from 2023, so we committed to a very different concept. I then interfaced every subsystem into the carbon structure. I worked closely across the technical team to make the structure as efficient as possible.`
Category: (2) poorly written — three short declarative sentences in a row with little connective tissue; "I then interfaced every subsystem" is slightly passive
Why: The paragraph tells a good story but the staccato rhythm is choppy. Minor polish.
Suggested rewrite:
> In the 2024–2025 cycle I moved to Structures and led the aero design for a new shell and carbon chassis, built from scratch. The regulations had changed significantly from 2023, so we committed to a very different concept. From there I interfaced every subsystem into the carbon structure, working closely with the whole technical team to keep the layout as efficient as possible.

---

**Finding SR-2** [LOW]
Location: BWSC route figure caption
Quote: `caption="Bridgestone World Solar Challenge, Darwin to Adelaide. Source: https://worldsolarchallenge.org/about-us/route-map"`
Category: (2) poorly written — pasting a raw URL as a caption is informal and looks unfinished
Why: Captions are visible rendered text. A raw URL is not a clean citation style.
Suggested rewrite: Render a hyperlink inside the caption text if the Figure component supports it, or rewrite as:
> Bridgestone World Solar Challenge route map, Darwin to Adelaide. (Source: worldsolarchallenge.org)

---

### index.astro (hero paragraph)
Findings: 1 + 3 candidate rewrites

**Finding I-1** [MED]
Location: Hero div
Quote: `Engineer focused on tricky problems whether in aerodynamics, composite structures, or applied ML.`
Category: (3) bad voice — functional but impersonal; "tricky problems" is slightly casual in a way that feels chosen for effect rather than natural; "whether in" is slightly awkward
Why: This is the first thing a visitor reads. It does the job but does not match the warmth or specificity of the project write-ups or about page. The site rework aims for "friendly, partly professional, most importantly personal" — this line is the opposite order.

The owner plans to replace this with a personal hero. Three candidates:

**Candidate 1 — warm and specific:**
> I'm Jasper — an engineering grad from ANU who spent the last few years building solar car aerodynamics, running CFD in the early hours, and teaching myself machine learning for bushfire detection. Here's most of what I've been working on.

**Candidate 2 — quieter, confident:**
> Engineering grad from ANU. I've done aerodynamics, carbon composites, embedded ML, and a handful of things in between. Browse what I've been building.

**Candidate 3 — personal entry-point:**
> Most of the interesting things I've worked on started with a problem I didn't fully understand. This is where I write about what happened next.

(Candidate 3 fits best if the index evolves into a combined projects + writings landing page.)

---

### solar-car-aero.mdx
Findings: 5

**Finding SAA-1** [RETRACTED]
Location: Manufacturing image row, caption for image 5
Quote: `caption: "Monolithic reinforcement over a plant for roll-hoop mounts."`
Status: RETRACTED. Owner confirms "plant" is correct as written. No change needed.

---

**Finding SAA-2** [MED]
Location: Manufacturing image row, captions for images 3 and 6
Quote (image 3): `caption: "first layers after debulk."`
Quote (image 6): `caption: "full car vacuum bag."`
Category: (2) inconsistent capitalisation — adjacent captions are sentence-cased ("Full Car Pattern", "Laying hatches first with soric core.") but these two open with lowercase
Why: All captions should follow the same convention. Sentence case is used everywhere else.
Suggested rewrite:
> First layers after debulk.
> Full car vacuum bag.

---

**Finding SAA-3** [MED]
Location: Manufacturing image row, caption for image 1
Quote: `caption: "Full Car Pattern. Our first real glimpse into the car in reality."`
Category: (2) poorly written — "into the car in reality" is redundant ("in reality" adds nothing after "glimpse into the car")
Suggested rewrite:
> Full car pattern — the first real glimpse of the car at full scale.

---

**Finding SAA-4** [MED]
Location: Refinement section, sentence after 1,000 compute hours
Quote: `I ran more than 1,000 compute hours in ANSYS Fluent and generated about 1.5 TB of data.`
Category: (1) lack of context — impressive numbers that a non-CFD reader can't calibrate
Why: 1,000 compute hours and 1.5 TB are striking but unexplained. A single sentence of context (what machine, over what period, how many individual runs?) would help a recruiter appreciate the scope rather than just the headline.
Suggested rewrite:
> I ran more than 1,000 compute hours in ANSYS Fluent across the project — roughly [X] months of cluster time — and generated about 1.5 TB of simulation data across [~N] design variants. [placeholder — Jasper to fill with actual timeframe and approximate run count]

---

**Finding SAA-5** [LOW]
Location: Results paragraph
Quote: `The result was a CdA about 20% lower than the 2023 car in straight-line despite the 50% increase in array area.`
Category: (4) audience mismatch — CdA is unexplained here (it appears in the outcomes frontmatter too)
Why: CdA (coefficient of drag × frontal area) is standard aero shorthand, but the project write-up aims to be readable to a broader audience. One gloss on first use would help.
Suggested rewrite:
> The result was a drag-area (CdA) about 20% lower than the 2023 car in straight-line, despite the 50% increase in array area.

---

### bushfire-detection.mdx
Findings: 1

**Finding BF-1** [LOW]
Location: Opening line
Quote: `As I'm sure we're all too aware, bushfires are becoming more frequent and more severe, in Australia and around the world.`
Category: (3) voice — "As I'm sure we're all too aware" is a rhetorical opener that feels slightly polished/generic compared with the directness of the rest of the write-up
Why: The rest of the project write-up is excellent — detailed, honest about limitations, clear about what the work actually shows. This one opener reads differently. Minor.
Suggested rewrite:
> Bushfires are becoming more frequent and more severe — in Australia especially, and around the world. The impact on people, wildlife and infrastructure gives us a strong reason to know about fires as early as possible.

---

### fourbar-egress.mdx
Findings: 0

No significant issues. The write-up is clear, first-person, honest about constraints and iteration. The "What I would refine next" section is good. "Change Canopy split angle" in that section opens with a capital mid-list inconsistently — minor.

**Finding FB-1** [LOW]
Location: "What I would refine next", bullet 3
Quote: `Change Canopy split angle to allow for shorter, lighter linkages without fouling.`
Category: (2) capitalisation inconsistency — "Canopy" is capitalised but the surrounding bullets are not
Suggested rewrite:
> Change the canopy split angle to allow for shorter, lighter linkages without fouling.

---

### solar-hinging.mdx
Findings: 0

Clean. Good voice, good detail level, outcomes are appropriately modest. No findings.

---

### bulkheads-interfacing.mdx
Findings: 1

**Finding BI-1** [LOW]
Location: Battery constraint section
Quote: `Rules require the battery pack to be constrained for 20 g in all axes.`
Category: (4) audience mismatch — "20 g" is unexplained for a non-motorsport reader
Why: 20 g (twenty times gravitational acceleration) is the regulatory crash load requirement, but a visitor outside solar racing / motorsport may read this as 20 grams. One word clarifies it.
Suggested rewrite:
> Rules require the battery pack to be restrained for 20 g (twenty times gravitational acceleration) loads in all axes.

---

### light-covers.mdx
Findings: 0

Good write-up. Concise, honest, well-structured. No significant issues.

---

### photo-scope.mdx
Findings: 3

**Finding PS-1** [HIGH]
Location: Frontmatter
Quote: `draft: true # temporarily hidden — set to false to publish`
Category: (5) structural — decision needed on publish status
Why: The write-up is complete, honest, and very much in Jasper's voice — arguably the strongest essay-style piece on the site (see also Findings PS-2 and PS-3). The only thing holding it back from publishing is the missing screenshots. See Finding PS-2.

---

**Finding PS-2** [HIGH]
Location: Three commented-out Figure/ImageRow blocks
Quote:
```
{/* <Figure src="/images/scope/globe.png" alt="The wireframe globe with photo pins and a comet" maxWidth="820px" /> */}
{/* <ImageRow cols={2} images={[...]} /> */}
```
Category: (1) lack of detail / (5) structural — missing visuals
Why: The write-up describes a highly visual piece. Without any screenshots the text-only post asks the reader to imagine an interface they can just go click on, which is fine for a write-up, but the empty Figure slots look unfinished if published as-is. The fix is fast: take three screenshots (globe, contact sheet, viewer) and drop them under `/public/images/scope/`, then uncomment. This is what is blocking publication, not the prose.

---

**Finding PS-3** [MED]
Location: Summary frontmatter
Quote: `summary: "A hidden corner of this site: an interactive wireframe globe and CRT 'contact sheet' for my film photography. Photos are discovered straight from their folders, plotted where they were shot, and browsed through a Tron / Evangelion / NASA-terminal interface, with comets, boot sequences and spinnable camera wireframes. A deliberate design-and-feel experiment, built almost entirely by pair-programming with Claude Code, because I am not a web developer."`
Category: (2) summary is too long for a project card
Why: Project card summaries elsewhere are one concise sentence. This summary is 70+ words and will overflow or be truncated in the card view.
Suggested rewrite for `summary`:
> A retro-futurist terminal for my film photos: a spinning wireframe globe, CRT contact sheet, and terminal viewer built by pair-programming with Claude Code.

---

### Writings: on-building-slowly.md and notes-from-the-workshop.md
Findings: 4

**Finding W-1** [HIGH]
Location: Both essays, general
Category: (3) bad voice — essays read as AI-drafted or heavily polished generic prose, not as Jasper's authentic voice
Why: Compare with photo-scope.mdx: that essay uses specific details (Nikon FM, Yashica-A TLR, the exact naming convention for roll folders, a frank admission that he chased a GPU compositing bug). The two writings essays contain zero specific detail. "On building slowly" is a series of well-turned aphorisms — "the middle is the work", "the middle is not an obstacle between you and the work" — but there is no single concrete example: no solar car, no workshop story, no specific failure that was instructive. "Notes from the workshop" is the same pattern: true, reasonably well-phrased, but featureless. Any engineer could have written either of them. Neither sounds like a person who spent four weeks laying up carbon fibre six days a week.

The problem is not the topics — they're good topics for Jasper. The problem is the execution. Both pieces read like placeholder prose written to hold the slot until real content arrives.

**Recommendation:** Rewrite both in the photo-scope voice. Pick one concrete thing for each essay. Examples:
- "On building slowly": the 64th SolidWorks revision of the aero shell, what changed, what held, and what the patience actually cost.
- "Notes from the workshop": one real lesson from the Sydney composites workshop — the vacuum bag failure, the bondline that was too thick, the jig that saved a panel — told in one paragraph.

If that rewrite isn't ready yet, unpublish both (`draft: true`) until it is. They are currently not in nav, which is the right call. Do not surface the writings section until there's at least one essay that is unambiguously in Jasper's voice.

---

**Finding W-2** [MED]
Location: on-building-slowly.md, opening sentence
Quote: `There is a particular kind of impatience that dresses itself up as ambition.`
Category: (3) bad voice — sounds more like a literary essay than an engineer's personal writing
Why: The sentence is well-crafted but belongs to a different kind of writer. Jasper's voice (per photo-scope and the project write-ups) opens with a direct statement about what happened or what the thing is. This opener sets a register the rest of the site does not share.

---

**Finding W-3** [MED]
Location: notes-from-the-workshop.md, opening
Quote: `A workshop is an honest place. The material does not care about your intentions, only your tolerances.`
Category: (3) bad voice — aphoristic, impersonal
Why: Same issue as W-2. The line is well-written on its own terms but sounds like a maxim rather than something Jasper said. The project write-ups open with what the project actually was and what the constraints were — this opening has no grounding.

---

**Finding W-4** [LOW]
Location: Both essays
Category: (5) structural — the writings section has no nav entry
Why: The nav in Header.astro (Projects, About, Experience, Contact) does not include Writings. The collection exists and both drafts have `draft: false`, but there is no way into the writings section from the nav. This is presumably intentional, but it should be a deliberate decision with a plan for when to surface it, not an accident. See Decisions Needed below.

---

## Decisions Needed (Checklist)

- [ ] **Writings section — nav surfacing.** Both essays have `draft: false` but Writings has no nav link. Decide: keep hidden until content is ready, or add a nav entry once at least one essay is rewritten in Jasper's voice. Recommendation: keep hidden and rewrite both essays before surfacing.

- [ ] **photo-scope.mdx — publish or stay draft.** The write-up is complete and in Jasper's voice. The only blocker is missing screenshots. Recommendation: take three screenshots of the live scope (globe, contact sheet, viewer), drop under `/public/images/scope/`, uncomment the three Figure/ImageRow blocks, and set `draft: false`.

- [ ] **about.astro "Currently" bullet.** Clarify what "when it works" means and rewrite (see A-1). If the project is stalled, remove the bullet or be explicit ("on the backburner").

- [ ] **index.astro hero paragraph.** The site rework intends a personal hero. Pick one of the three candidates in §index.astro or write your own, and replace the current line before the rework ships.

- [ ] **experience.astro acronyms.** Decide whether to add inline glosses (recommended) or drop unexplained acronyms from the bullets. BWSC and ETAP at minimum need a parenthetical on a page that stands alone as a resume-style document.

- [ ] **Writings — rewrite both essays.** Both read as placeholder prose. If unpublishing is not an option, add at least one concrete specific detail per essay that is unambiguously from Jasper's actual experience.

---

## Finding Count by File

| File | Findings | Severity breakdown |
|---|---|---|
| about.astro | 6 | 1 HIGH, 3 MED, 2 LOW |
| contact.astro | 1 | 1 MED |
| experience.astro | 5 | 2 HIGH, 2 MED, 1 LOW |
| solar-racing.astro | 2 | 2 LOW |
| index.astro | 1 | 1 MED |
| solar-car-aero.mdx | 5 | 1 HIGH, 3 MED, 1 LOW |
| bushfire-detection.mdx | 1 | 1 LOW |
| fourbar-egress.mdx | 1 | 1 LOW |
| solar-hinging.mdx | 0 | — |
| bulkheads-interfacing.mdx | 1 | 1 LOW |
| light-covers.mdx | 0 | — |
| photo-scope.mdx | 3 | 2 HIGH, 1 MED |
| writings (both) | 4 | 1 HIGH, 2 MED, 1 LOW |
| **Total** | **30** | **7 HIGH · 13 MED · 10 LOW** |
