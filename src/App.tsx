import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type PuzzleStatus = "idle" | "playing" | "solved";

type DemonImage = {
  id: string;
  label: string;
  description: string;
  file: string;
};

type DifficultyOption = {
  id: string;
  label: string;
  size: number;
};

type ScoreEntry = {
  id: string;
  imageId: string;
  imageLabel: string;
  difficultyId: string;
  difficultyLabel: string;
  size: number;
  moves: number;
  finishedAt: number;
};

const SCORE_KEY = "demonHunterRankings";

const demonImages: DemonImage[] = [
  {
    id: "starlit-reaper",
    label: "Starlit Reaper",
    description: "Neon twin-scythe idol hunter",
    file: "/images/starlit-reaper.svg",
  },
  {
    id: "midnight-sigil",
    label: "Midnight Sigil",
    description: "Blue fire rune shield",
    file: "/images/midnight-sigil.svg",
  },
  {
    id: "crimson-halo",
    label: "Crimson Halo",
    description: "Laser halo bow archer",
    file: "/images/crimson-halo.svg",
  },
];

const difficulties: DifficultyOption[] = [
  { id: "easy", label: "Easy · 3 × 3", size: 3 },
  { id: "standard", label: "Standard · 4 × 4", size: 4 },
  { id: "expert", label: "Expert · 5 × 5", size: 5 },
];

const loadRankings = (): ScoreEntry[] => {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(SCORE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as ScoreEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn("Failed to parse rankings", error);
    return [];
  }
};

const storeRankings = (entries: ScoreEntry[]) => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(SCORE_KEY, JSON.stringify(entries));
};

const createSolvedBoard = (size: number) =>
  Array.from({ length: size * size }, (_, index) => index);

const countInversions = (tiles: number[], blankValue: number) => {
  let inversions = 0;
  for (let i = 0; i < tiles.length; i += 1) {
    for (let j = i + 1; j < tiles.length; j += 1) {
      const current = tiles[i];
      const next = tiles[j];
      if (current === blankValue || next === blankValue) {
        continue;
      }
      if (current > next) {
        inversions += 1;
      }
    }
  }
  return inversions;
};

const isSolvable = (tiles: number[], size: number) => {
  const blankValue = tiles.length - 1;
  const inversions = countInversions(tiles, blankValue);
  const blankIndex = tiles.indexOf(blankValue);
  const blankRowFromBottom = size - Math.floor(blankIndex / size);

  if (size % 2 === 1) {
    return inversions % 2 === 0;
  }

  if (blankRowFromBottom % 2 === 0) {
    return inversions % 2 === 1;
  }

  return inversions % 2 === 0;
};

const shuffleBoard = (size: number) => {
  const solved = createSolvedBoard(size);
  const blankValue = solved.length - 1;

  let candidate = [...solved];
  do {
    candidate = [...solved].sort(() => Math.random() - 0.5);
  } while (!isSolvable(candidate, size) || candidate.every((value, idx) => value === solved[idx]) || candidate[0] === blankValue);

  return candidate;
};

const isAdjacent = (indexA: number, indexB: number, size: number) => {
  const rowA = Math.floor(indexA / size);
  const colA = indexA % size;
  const rowB = Math.floor(indexB / size);
  const colB = indexB % size;

  const rowMatch = rowA === rowB && Math.abs(colA - colB) === 1;
  const colMatch = colA === colB && Math.abs(rowA - rowB) === 1;

  return rowMatch || colMatch;
};

const isSolved = (tiles: number[]) => tiles.every((value, index) => value === index);

const randomFrom = <T,>(items: T[], excludeId?: string) => {
  if (items.length === 0) {
    throw new Error("Cannot select from an empty array");
  }

  const filtered =
    excludeId && items.length > 1
      ? items.filter((entry) => (entry as { id?: string }).id !== excludeId)
      : items;

  return filtered[Math.floor(Math.random() * filtered.length)];
};

const createId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

function App() {
  const [difficultyId, setDifficultyId] = useState(difficulties[0].id);
  const [currentImage, setCurrentImage] = useState(demonImages[0]);
  const [tiles, setTiles] = useState<number[]>([]);
  const [moveCount, setMoveCount] = useState(0);
  const [status, setStatus] = useState<PuzzleStatus>("idle");
  const [rankings, setRankings] = useState<ScoreEntry[]>(() => loadRankings());

  const boardRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  const activeDifficulty = useMemo(
    () => difficulties.find((entry) => entry.id === difficultyId) ?? difficulties[0],
    [difficultyId],
  );

  const tileCount = activeDifficulty.size * activeDifficulty.size;
  const blankValue = tileCount - 1;

  const focusBoard = () => {
    if (typeof window === "undefined") {
      return;
    }
    window.setTimeout(() => {
      boardRef.current?.focus();
    }, 0);
  };

  const startPuzzle = useCallback(
    (options?: { randomImage?: boolean; targetDifficultyId?: string }) => {
      const targetDifficulty =
        difficulties.find((entry) => entry.id === options?.targetDifficultyId) ?? activeDifficulty;

      const nextImage = options?.randomImage
        ? randomFrom(demonImages, currentImage.id)
        : currentImage;

      setDifficultyId(targetDifficulty.id);
      setCurrentImage(nextImage);
      setTiles(shuffleBoard(targetDifficulty.size));
      setMoveCount(0);
      setStatus("playing");
      focusBoard();
    },
    [activeDifficulty, currentImage],
  );

  useEffect(() => {
    if (initialized.current) {
      return;
    }
    initialized.current = true;
    startPuzzle();
  }, [startPuzzle]);

  const persistRanking = useCallback(
    (moves: number) => {
      const entry: ScoreEntry = {
        id: createId(),
        imageId: currentImage.id,
        imageLabel: currentImage.label,
        difficultyId: activeDifficulty.id,
        difficultyLabel: activeDifficulty.label,
        size: activeDifficulty.size,
        moves,
        finishedAt: Date.now(),
      };

      setRankings((previous) => {
        const updated = [...previous, entry].sort((a, b) => a.moves - b.moves).slice(0, 8);
        storeRankings(updated);
        return updated;
      });
    },
    [activeDifficulty, currentImage],
  );

  const attemptMove = useCallback(
    (tileIndex: number) => {
      if (status !== "playing") {
        return;
      }
      const emptyIndex = tiles.indexOf(blankValue);
      if (!isAdjacent(tileIndex, emptyIndex, activeDifficulty.size)) {
        return;
      }

      const nextTiles = [...tiles];
      [nextTiles[tileIndex], nextTiles[emptyIndex]] = [nextTiles[emptyIndex], nextTiles[tileIndex]];

      const solved = isSolved(nextTiles);
      setTiles(nextTiles);
      setMoveCount((previous) => {
        const updated = previous + 1;
        if (solved) {
          persistRanking(updated);
        }
        return updated;
      });

      if (solved) {
        setStatus("solved");
      }
    },
    [activeDifficulty.size, blankValue, persistRanking, status, tiles],
  );

  const handleTileClick = (index: number) => {
    attemptMove(index);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (status !== "playing") {
      return;
    }
    const emptyIndex = tiles.indexOf(blankValue);
    const size = activeDifficulty.size;
    const row = Math.floor(emptyIndex / size);
    const col = emptyIndex % size;

    let target = -1;

    switch (event.key) {
      case "ArrowUp":
      case "w":
      case "W":
        if (row < size - 1) {
          target = emptyIndex + size;
        }
        break;
      case "ArrowDown":
      case "s":
      case "S":
        if (row > 0) {
          target = emptyIndex - size;
        }
        break;
      case "ArrowLeft":
      case "a":
      case "A":
        if (col < size - 1) {
          target = emptyIndex + 1;
        }
        break;
      case "ArrowRight":
      case "d":
      case "D":
        if (col > 0) {
          target = emptyIndex - 1;
        }
        break;
      case " ":
      case "Enter":
        event.preventDefault();
        startPuzzle();
        return;
      default:
        return;
    }

    if (target >= 0) {
      event.preventDefault();
      attemptMove(target);
    }
  };

  const onDifficultyChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const targetId = event.target.value;
    startPuzzle({ targetDifficultyId: targetId });
  };

  const solvedMessage =
    status === "solved" ? `Cleared in ${moveCount} move${moveCount === 1 ? "" : "s"}!` : null;

  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">K-pop Demon Hunter Showcase</p>
          <h1>Arcade Jigsaw</h1>
          <p className="lede">
            Assemble the hunter, climb the leaderboard, and swap tiles with mouse clicks or arrow keys.
          </p>
        </div>
        <div className="controls">
          <label className="control">
            <span>Difficulty</span>
            <select value={difficultyId} onChange={onDifficultyChange}>
              {difficulties.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <button type="button" onClick={() => startPuzzle({ randomImage: true })}>
            Random Demon Hunter
          </button>
        </div>
      </header>

      <main className="content">
        <section className="puzzle-panel">
          <div className="puzzle-headline">
            <div>
              <h2>{currentImage.label}</h2>
              <p>{currentImage.description}</p>
            </div>
            <div className="metrics">
              <div>
                <span className="metric-label">Moves</span>
                <strong>{moveCount}</strong>
              </div>
              <div>
                <span className="metric-label">Grid</span>
                <strong>{activeDifficulty.size} × {activeDifficulty.size}</strong>
              </div>
            </div>
          </div>

          <div
            className="puzzle-board"
            ref={boardRef}
            tabIndex={0}
            role="application"
            aria-label="Jigsaw puzzle board"
            onKeyDown={handleKeyDown}
            style={{
              gridTemplateColumns: `repeat(${activeDifficulty.size}, 1fr)`,
              gridTemplateRows: `repeat(${activeDifficulty.size}, 1fr)`,
            }}
          >
            {tiles.map((value, index) => {
              const solvedRow = Math.floor(value / activeDifficulty.size);
              const solvedCol = value % activeDifficulty.size;
              const isBlank = value === blankValue;
              const backgroundPosition = `${(solvedCol / (activeDifficulty.size - 1 || 1)) * 100}% ${(solvedRow / (activeDifficulty.size - 1 || 1)) * 100}%`;

              return (
                <button
                  key={`${value}-${index}`}
                  type="button"
                  className={`tile ${isBlank ? "tile--empty" : ""}`}
                  style={
                    isBlank
                      ? undefined
                      : {
                          backgroundImage: `url(${currentImage.file})`,
                          backgroundSize: `${activeDifficulty.size * 100}% ${activeDifficulty.size * 100}%`,
                          backgroundPosition,
                        }
                  }
                  onClick={() => handleTileClick(index)}
                  aria-label={isBlank ? "Empty space" : `Tile ${value + 1}`}
                  disabled={isBlank}
                >
                  {!isBlank && <span>{value + 1}</span>}
                </button>
              );
            })}
          </div>

          <div className="helper-text">
            <p>Use clicks or Arrow/WASD keys to slide tiles. Press Space or Enter to restart quickly.</p>
            {solvedMessage && <p className="success">{solvedMessage}</p>}
          </div>
        </section>

        <section className="rankings-panel">
          <h2>Shadow Rankings</h2>
          {rankings.length === 0 ? (
            <p className="helper-text">Finish a hunt to enter the leaderboard.</p>
          ) : (
            <ol className="ranking-list">
              {rankings.map((entry, index) => (
                <li key={entry.id}>
                  <span className="rank-index">#{index + 1}</span>
                  <div>
                    <strong>{entry.moves} moves</strong>
                    <p>{entry.imageLabel} · {entry.difficultyLabel}</p>
                  </div>
                  <time>{new Date(entry.finishedAt).toLocaleTimeString()}</time>
                </li>
              ))}
            </ol>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
