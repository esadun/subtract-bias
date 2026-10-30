// Puzzle set for the symmetry-grid task.
// Each puzzle starts from a pattern that is symmetric left-right and top-bottom,
// then gets a few extra squares in one quarter. Removing those extras restores
// symmetry in `extras` clicks; the additive fix (mirroring them into the other
// three quarters) takes 3 × `extras` clicks.
// Seeds are fixed, so every student sees the same eight puzzles.

(function () {
  const N = 10;
  const H = N / 2;

  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function makePuzzle(id, seed, extras) {
    const r = rng(seed);
    let quarter;
    do {
      quarter = Array.from({ length: H }, () => Array.from({ length: H }, () => r() < 0.4));
    } while (quarter.flat().filter(Boolean).length < 6);

    const grid = Array.from({ length: N }, (_, y) =>
      Array.from({ length: N }, (_, x) => {
        const qy = y < H ? y : N - 1 - y;
        const qx = x < H ? x : N - 1 - x;
        return quarter[qy][qx];
      }));

    // Add the extras in one quarter, on squares that are empty there.
    const which = Math.floor(r() * 4);
    const oy = which < 2 ? 0 : H;
    const ox = which % 2 === 0 ? 0 : H;
    const empty = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < H; x++) {
      if (!grid[oy + y][ox + x]) empty.push([oy + y, ox + x]);
    }
    for (let i = 0; i < extras; i++) {
      const [y, x] = empty.splice(Math.floor(r() * empty.length), 1)[0];
      grid[y][x] = true;
    }
    return { id, extras, grid };
  }

  function isSymmetric(g) {
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      if (g[y][x] !== g[y][N - 1 - x] || g[y][x] !== g[N - 1 - y][x]) return false;
    }
    return true;
  }

  // Block 1 always uses set A and block 2 set B; which condition comes first
  // is counterbalanced by the server, so puzzle set is not tied to condition.
  const setA = [
    makePuzzle('A1', 1101, 3),
    makePuzzle('A2', 2203, 4),
    makePuzzle('A3', 3307, 3),
    makePuzzle('A4', 4409, 4),
  ];
  const setB = [
    makePuzzle('B1', 5501, 4),
    makePuzzle('B2', 6607, 3),
    makePuzzle('B3', 7703, 4),
    makePuzzle('B4', 8809, 3),
  ];

  window.Puzzles = { N, setA, setB, isSymmetric };
})();
