# Pattern Puzzles

This is a classroom version of the symmetry-grid task from Adams, Converse, Hales & Klotz, "People systematically overlook subtractive changes" (*Nature*, 2021). Students get 10×10 patterns that are almost symmetrical. Removing the few extra squares is always the quickest fix, while adding matching squares takes three times as many clicks. The page records which fix each student makes.

Students never see the words "subtract", "add" or "bias", and they don't see any scores.

## Design

- **8 puzzles per student**, split into two parts of 4.
- **One part is plain.** The other part adds a cognitive load: digits flash above the grid, and students count the 5s, then type their count after each puzzle.
- **Order is balanced.** The server alternates students between plain-first and load-first. Part 1 always uses puzzle set A and part 2 uses set B, so the puzzles aren't tied to one condition.
- **The puzzles are the same for every student.** They are generated from fixed seeds in `public/puzzles.js`. Each one has 3 or 4 extra squares.

## Running it in class

You need Node 18 or newer, with nothing to install.

```bash
cd subtraction-test
node server.js
```

The server prints the addresses to use:

```
  Students:  http://192.168.x.x:3000/
  Teacher:   http://localhost:3000/teacher
  Teacher PIN: 4821
```

- Students open the **Students** address on a phone or laptop on the same Wi-Fi as your computer.
- You open **Teacher**, enter the PIN, and watch results come in. The page updates every 3 seconds.
- To choose your own PIN: `TEACHER_PIN=2468 node server.js`. To change the port: `PORT=8080 node server.js`.

**If students can't connect:** many school networks block devices from reaching each other. Try a phone hotspot, or put it on a free host (see below).

## Results

- Everything saves to `data/results.jsonl`, one line per student start and per puzzle. Results survive a server restart.
- **Download CSV** on the teacher page gives one row per puzzle: name, condition, squares added, squares removed, clicks, whether the pattern ended up symmetrical, solution type, whether it used the fewest possible changes, time taken, and the 5s count with the correct answer.
- **Start a new class** moves the current results into a dated archive file in `data/`. Nothing is deleted.

Each puzzle's solution is classed by comparing the final pattern with the starting one:

| Solution | Meaning |
|---|---|
| Removed only | Symmetrical, and every change took a square away |
| Added only | Symmetrical, and every change added a square |
| Added and removed | Symmetrical, using both kinds of change |
| Not symmetrical | Handed in without being solved (the page warns once first) |

## Hosting it online (optional)

This is a plain Node app with no dependencies, so any Node host works, such as Render, Railway or Fly.io. Set the `TEACHER_PIN` environment variable on the host. On hosts with temporary disks, `data/` is wiped on redeploy, so download the CSV after each class.
