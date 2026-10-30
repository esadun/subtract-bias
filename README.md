# Pattern Puzzles

This is a classroom version of the symmetry-grid task from Adams, Converse, Hales & Klotz, "People systematically overlook subtractive changes" (*Nature*, 2021). Students get 10×10 patterns that are almost symmetrical. Removing the few extra squares is always the quickest fix, while adding matching squares takes three times as many clicks. The site records which fix each student makes, with and without an extra memory load.

Students never see the words "subtract", "add" or "bias", and they don't see any scores.

## Using it

- **Students** open the class link, for example `https://your-site.netlify.app/?class=period3`, type their first name and do 8 puzzles. There's no login.
- **You** open `https://your-site.netlify.app/teacher`. Pick a class, or all classes, to see results. The page updates every 10 seconds. Use the "Student link" box there to make a link for each class.
- **Archive this class** removes a class's results from the teacher page and moves them to an `archive` store, which you can still see in the Netlify dashboard under Blobs.

## Test design

- **8 puzzles in two parts of 4.** One part is plain. In the other, digits flash above the grid; students count the 5s and type their count after each puzzle.
- **Random order.** Each student's browser flips a coin to decide whether the load part comes first or second. The teacher page shows the actual split.
- **Puzzle sets.** Part 1 always uses puzzle set A and part 2 uses set B, so a puzzle set isn't tied to one condition.
- **The puzzles are the same for every student.** They're generated from fixed seeds in `public/puzzles.js`. Each has 3 or 4 extra squares.
- **Unsolved puzzles.** If a student presses Done on a pattern that isn't symmetrical, the page warns them once. A second press hands it in as it is.

Each puzzle's solution is classed by comparing the final pattern with the starting one:

| Solution | Meaning |
|---|---|
| Removed only | Symmetrical, and every change took a square away |
| Added only | Symmetrical, and every change added a square |
| Added and removed | Symmetrical, using both kinds of change |
| Not symmetrical | Handed in without being solved |

"Fewest possible changes" means the student removed exactly the extra squares and nothing else.

## Deploying (Netlify + GitHub)

1. Push this folder to a new GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Pattern Puzzles"
   git branch -M main
   git remote add origin https://github.com/<you>/<repo>.git
   git push -u origin main
   ```
2. In Netlify, choose **Add new site → Import an existing project → GitHub** and pick the repository.
3. Leave the build settings as they are. `netlify.toml` already sets the publish folder and functions, and there's no build command.
4. Deploy. Netlify Blobs needs no setup.

From then on, every push to `main` redeploys the site. Student results are kept across redeploys.

## Project layout

```
public/
  index.html         student test
  teacher.html       results page (/teacher)
  puzzles.js         the eight puzzles and the symmetry check
  style.css
netlify/
  functions/
    start.mjs          POST /api/start          creates a student's record
    trial.mjs          POST /api/trial          adds one finished puzzle
    results.mjs        GET  /api/results        all records, or ?class=…
    archive-class.mjs  POST /api/archive-class  moves a class to the archive
  lib/store.mjs      shared storage helpers
netlify.toml
```

Each student attempt is one record in the `attempts` Blobs store, keyed `<class>/<id>`. Only that student's browser writes to it, so students saving at the same moment never overwrite each other.

## Running locally (optional)

```bash
npm install
npx netlify-cli dev
```

`netlify dev` serves the site and functions, with a local stand-in for Blobs.

## Note

The teacher page and the results API are not password-protected. Anyone who knows the `/teacher` address can view and archive results.
# subtract-bias
# subtract-bias
# subtract-bias
