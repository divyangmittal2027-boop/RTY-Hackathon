# 🚀 Buildathon: Make Wednesdays Great Again

**Masters' Union · For AI Developers · Winner gets Rs. 25,000**

> **Every team must build in a fork of this repository.** Projects not built in a fork of this repo won't be judged.

| | |
|---|---|
| **Date** | Wednesday, 18 November 2026 |
| **Hacking** | **3:00 PM – 7:00 PM IST** (code freeze at 7:00 PM sharp) |
| **Venue** | CDS Audi, 8th floor |
| **Prize** | Rs. 25,000 to the winning team |
| **Register your fork** | 👉 **[https://forms.gle/ZJUYKwTYjsMsVB2b9](https://forms.gle/ZJUYKwTYjsMsVB2b9)** (**deadline 3:30 PM IST**) |
| **Final submission** | Your fork as it stands at **7:00 PM IST**. There's nothing else to submit. |

> 🤖 **Using an AI coding agent?** Point it at [`AGENTS.md`](AGENTS.md). It has the full event brief, tracks, judging and rules in a form agents can read directly. Claude Code loads it automatically through `CLAUDE.md`, and Codex reads `AGENTS.md` natively.

---

## 🎯 Pick one build track

| # | Track | Brief |
|---|---|---|
| **01** | **Build for the Physical World** | Make a real-world task easier, faster or more reliable. Show it in a realistic scenario. |
| **02** | **Build for AI Agents** | Find something an agent struggles with. Build the tool that fixes it, then demo the agent using it. |
| **03** | **Build in Your Area of Expertise** | Pick a field you know firsthand. Ship a working product that improves how people handle it today. |

## ⚖️ How you'll be judged (each criterion is ⅓ of your score)

| Criterion | The question judges ask |
|---|---|
| **Working product** | Does it do what you say it does? Show the core workflow in your demo. |
| **Problem insight** | Who faces this problem, and why does it happen? |
| **Depth of execution** | How well did you solve the hardest part of the build? |

---

## Why fork this repo?

Everyone starts from the same commit (the **genesis commit**) at the same time. Organizers can then check that:
- all code was written **during** the Buildathon and not brought in from an earlier project,
- teams commit steadily instead of pasting in one huge AI-generated dump at the end,
- every repo stays public and visible while you build.

The organizers track every fork automatically: commits, timing and activity. Read [RULES.md](RULES.md) before you write any code.

---

## ✅ Setup (about 5 minutes, do it at 3:00 PM)

**In short:** fork → register your fork in the form **by 3:30 PM** → build → push before 7:00 PM.

### 1. Fork this repo
Click **Fork** (top right). On the fork screen:
- **Owner:** one team member's personal account. Only **one fork per team**.
- **Repository name:** `buildathon-<team-name>`, for example `buildathon-byte-bandits`
- Click **Create fork**.

> ⚠️ Don't download a ZIP or copy the files into a new repo. **It has to be a real GitHub fork**, or the tracker can't see you.

### 2. Keep it public
Forks of a public repo are public. **Don't make it private, archive it, or delete it** until judging is over.

### 3. Add your teammates
In your fork: **Settings → Collaborators → Add people**. Add each teammate's GitHub account so their commits count toward the team.

### 4. Enable Actions
Open the **Actions** tab of your fork and click **"I understand my workflows, go ahead and enable them"**. This runs the automatic check on every push.

### 5. Make your registration commit (your first commit)
Fill in [`team.json`](team.json). `track` must be one of `physical-world`, `ai-agents` or `area-of-expertise`. Then:

```bash
git clone https://github.com/<your-username>/buildathon-<team-name>.git
cd buildathon-<team-name>
# edit team.json
git add team.json
git commit -m "register: <team name>"
git push
```

The **Hackathon check** in the Actions tab should go green ✅. If it's red, open the run to see what's wrong in `team.json`.

### 6. Register your fork (deadline: 3:30 PM IST)
👉 **[https://forms.gle/ZJUYKwTYjsMsVB2b9](https://forms.gle/ZJUYKwTYjsMsVB2b9)**

It's a 4-question Google Form: team name, fork link, track, team members. It connects your repo to the organizers' live tracker.

- Fill it in **once per team**, right after forking, and **no later than 3:30 PM IST**. **Teams that don't register can't be tracked.**
- Paste your **fork's** URL (`https://github.com/<you>/buildathon-<team-name>`), not this starter repo's.
- Need to change something? Use the **"Edit your response"** link on the confirmation page. Don't fill it in twice.
- **Final submission is automatic.** Whatever is pushed to your fork at 7:00 PM IST is what gets judged.

---

## 🛠 While you build (3:00 – 7:00 PM)

- Put your code anywhere in the repo (`app/`, `src/`, `frontend/`, `backend/`…). There's no required layout.
- **Commit early, commit often**, at least every 30 minutes of real work, with messages that say what changed.
- **Push regularly.** Commits you never push don't exist to the tracker.
- AI coding tools (Claude Code, Codex, Cursor, Copilot…) are **allowed and encouraged**. Keep `AGENTS.md` and `CLAUDE.md` in the repo; they keep your agent within the rules.
- Before 7:00 PM, replace the "Your project" section below with your project's README.

## 🧊 Code freeze: 7:00 PM IST

At 7:00 PM the tracker takes a snapshot of every fork. **Commits pushed after code freeze are ignored.** Judges look at your last commit before 7:00 PM.

## ❌ Things that get you flagged

- Rewriting history (`git push --force`, rebasing away the genesis commit, squashing everything into one commit)
- Commits dated before 3:00 PM
- One or two giant commits containing most of the project
- A repo that isn't a fork of this one, or that's private or deleted

See [RULES.md](RULES.md) for the full list.

---

## Your project

### Naari — Your city, your sisterhood

**🌐 Live Hackathon Demo:** https://divyangmittal2027-boop.github.io/RTY-Hackathon/

**Quick judge flow:** Open the live demo → enter an optional name → tap Explore Naari → Scan nearby cafés & restaurants → select a venue → submit a safety review → open Profile and add a photo/bio → see My Ratings. No real login credentials are required.


**Team:** Naari · **Track:** Build for the Physical World (`physical-world`)

**Problem:** Ordinary review systems prioritize food, service, and ambiance, but rarely tell women whether a place has practical conditions that affect confidence and safety. People need to know more than an average star rating: staff behaviour, possible harassment, hygiene, and access to help matter.

**What we built during the hackathon:** A responsive, vibrant map-first web prototype with a cinematic photo welcome screen, explicit one-tap demo entry without passwords, and a local editable profile. It has a full-screen OpenStreetMap, a city selector for Delhi NCR, expandable 3.5 km OpenStreetMap discovery of cafés/restaurants/food courts/bakeries/essentials (best-effort), a manual Scan nearby action and place search via OpenStreetMap Nominatim, a movable places panel, daytime/nighttime navigation controls, a transparent score breakdown, guided interactive ratings with completion tracking, local review editing and deletion, a "My ratings" view, a private safety journal, the ability to create personally labelled places when directory lookups fail, and official emergency telephone links. Map pins indicate venue types through different colours; individual illustrative scores and the difference between sample and personal ratings are explained in the place details. Newly entered feedback appears immediately in the local score and personal-review panel.

**Hardest technical part:** Separating map availability from place-data availability. Map tiles, location permission, public listing APIs, and ratings can fail independently. The interface is designed to show an initial map and fallback places even if one external provider fails, and to avoid presenting public directory listings as verified safe places. It never fabricates live community ratings for public listings.

**Run locally:**

```bash
python3 -m http.server 8080
# Open http://localhost:8080
```

The site is vanilla HTML/CSS/JavaScript using ES modules and Leaflet. No frontend build step or API secrets are required.

**Test commands:**

```bash
node --check src/original-look.mjs
node --test tests/*.test.mjs
```

The fork also includes a browser walkthrough GitHub Action that exercises city switching, place details, saving and editing ratings, review persistence after reload, the profile's "My ratings" page, and private note creation and deletion. Screenshots from successful runs appear as workflow artifacts.

**Login and profile:** The welcome screen has a photo, optional display name and **Explore Naari** button that deliberately bypasses authentication. There is no Google sign-in, session verification, password, or server login. Profile supports editing a demo display name and bio, uploading a JPG/PNG/WebP avatar (resized before storing), viewing ratings and local contribution counts. Profile data stays in `localStorage`.

**Live place coverage:** The map queries a public, third-party OpenStreetMap directory for named nearby places within roughly 3.5 km of a selected city or map centre; the **Scan nearby** action refreshes this area. This is best effort, **not an exhaustive list of every café and restaurant**. Results may be incomplete, stale, rate-limited, or unavailable. Each returned listing can be selected and locally rated, and users can create their own approximate personal place when a directory misses one.

**Demo workflow (90 seconds):**

1. On the photo welcome screen, enter an optional name and click **Explore Naari** (demo access; no actual authentication). Choose a Delhi NCR city and click **Scan nearby cafés & restaurants** to look for public map listings.
2. Expand the panel to show place details and a clearly labelled sample score breakdown.
3. Open the new rating form and complete four visual inputs: Creep Level, Safety, Hygiene, and Washroom. Watch the completion bar and personal preview update; optionally choose vibe tags, infrastructure and a written observation.
4. Save and see your note, individual ratings, and updated score in place details. Reopen to edit; then visit Profile → My ratings to edit or delete the saved review.
5. Visit Inbox → Your safety journal, save a private observation, refresh and delete it. Then demonstrate the location action and emergency toolkit. All information remains separate from the earlier Naari application.

**Prototype limitations and safety disclosure:**

- **Not a safety certification.** A green score from fictional or user-entered reviews cannot guarantee personal safety; circumstances change. Do not use this prototype as the sole basis for safety-critical decisions.
- **All preset sample venues, initial community-style ratings and scores are fictional demo material**, not real Naari reports. Public OpenStreetMap directory listings, when available, are not verified by Naari.
- The daytime/nighttime selection changes the interface, but does not assert measured time-specific safety differences. There is no verified safe-route algorithm.
- Reviews, "My ratings", personally created places, and safety-journal notes are stored only in the user's browser, never published to other users. Anyone using the same browser profile may be able to view these unencrypted records. There is no live member verification, real-time private messaging, or production database in this Buildathon prototype. No part of the app links to or authenticates through the previous Naari product.
- External public directory APIs may be rate-limited or unavailable, and OpenStreetMap coverage is never guaranteed to include all nearby venues. Maps, external fonts, and the optional photographic welcome illustration require internet access. Location permission is optional.

**Buildathon provenance and separation:** This is an independent hackathon implementation, inspired by a prior product concept but built from newly authored code during the 18 November 2026 hacking window. No pre-existing project source or production backend was imported, connected, or modified. The fork preserves the original hackathon genesis and incremental implementation commits.
