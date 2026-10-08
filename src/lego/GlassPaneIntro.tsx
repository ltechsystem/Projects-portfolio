import { useEffect, useRef, useState } from "react";
import logod from "../../media/logod.png";

const COLS = 13;
const LOGO_ASPECT = 809 / 2232; // height / width of media/logod.png
const LOCK_DISTANCE = 1400; // "scroll" units needed to fully zoom through the window

export function GlassPaneIntro() {
  const [progress, setProgress] = useState(0);
  const [introDone, setIntroDone] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [viewport, setViewport] = useState(() => ({
    w: typeof window !== "undefined" ? window.innerWidth : 1200,
    h: typeof window !== "undefined" ? window.innerHeight : 800,
  }));
  const progressRef = useRef(0);
  const touchYRef = useRef<number | null>(null);

  // While the intro hasn't finished, the real page must not scroll at all —
  // wheel/touch/key input is captured here and converted into the zoom
  // progress instead, so the portfolio underneath stays put until the
  // camera has actually passed through the target window.
  useEffect(() => {
    window.scrollTo(0, 0);
    const html = document.documentElement;
    const prevOverflow = html.style.overflow;
    html.style.overflow = "hidden";

    const finish = () => {
      progressRef.current = 1;
      setProgress(1);
      setIntroDone(true);
      html.style.overflow = prevOverflow;
    };

    const applyDelta = (delta: number) => {
      if (progressRef.current >= 1) return;
      const next = Math.min(1, Math.max(0, progressRef.current + delta / LOCK_DISTANCE));
      progressRef.current = next;
      setProgress(next);
      if (next >= 1) finish();
    };

    const onWheel = (e: WheelEvent) => {
      if (progressRef.current >= 1) return;
      e.preventDefault();
      applyDelta(e.deltaY);
    };
    const onTouchStart = (e: TouchEvent) => {
      touchYRef.current = e.touches[0]?.clientY ?? null;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (progressRef.current >= 1) return;
      const y = e.touches[0]?.clientY;
      if (y == null || touchYRef.current == null) return;
      e.preventDefault();
      applyDelta(touchYRef.current - y);
      touchYRef.current = y;
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (progressRef.current >= 1) return;
      if (["ArrowDown", "PageDown", " "].includes(e.key)) {
        e.preventDefault();
        applyDelta(160);
      }
    };
    const onResize = () => setViewport({ w: window.innerWidth, h: window.innerHeight });

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
      html.style.overflow = prevOverflow;
    };
  }, []);

  // Square panes, 13 across, as many rows as fit the viewport height.
  // Rounded to a whole pixel so the panes (laid out via left/width) and the
  // frame overlay (drawn via a repeating gradient, which has no pixel
  // snapping) land on the exact same grid — otherwise they drift apart
  // column by column since 1707/13 etc. is a repeating fraction.
  const cellSize = Math.round(viewport.w / COLS);
  const ROWS = Math.ceil(viewport.h / cellSize);
  const MAX_WAVE = COLS - 1 + (ROWS - 1);

  // Logo laid out once across the whole viewport; each pane shows only its own slice.
  const logoW = Math.min(620, viewport.w * 0.52);
  const logoH = logoW * LOGO_ASPECT;
  const logoLeft = (viewport.w - logoW) / 2;
  const logoTop = (viewport.h - logoH) / 2;
  const FRAME = 6; // px — thickness of the window frame around each pane (thin mullion, not a prison bar)
  const GLASS_DEPTH = 10; // px — visible thickness of the glass pane edge while flipping

  // The camera zooms toward the two middle panes of the bottom row — that
  // pair is "the window" the user passes through into the portfolio. The
  // target point must land inside one pane's solid glass (not on the frame
  // line *between* the pair), or the frame mullion itself balloons to fill
  // the screen as it scales up instead of the glass.
  const targetCol = Math.floor(COLS / 2) - 1; // left pane of the middle pair
  const targetRow = ROWS - 1;
  const targetPxX = ((targetCol + 1) + 0.5) * cellSize;
  const targetPxY = (targetRow + 0.5) * cellSize;
  const zoomScale = 1 + Math.pow(progress, 1.5) * 9;

  // A fixed transform-origin keeps whatever point it's set to pinned at the
  // same screen position throughout — with the target near the bottom row,
  // that point stays pinned near the bottom edge the whole time instead of
  // ending up centered, which read as "not aligned vertically". Instead we
  // use transform-origin 0/0 and compute an explicit translate + scale so
  // the target point glides from its real position (progress 0, identity —
  // the full grid renders unshifted) to the exact viewport center
  // (progress 1, fully zoomed in and centered).
  const centerX = viewport.w / 2;
  const centerY = viewport.h / 2;
  const desiredX = targetPxX + (centerX - targetPxX) * progress;
  const desiredY = targetPxY + (centerY - targetPxY) * progress;
  const translateX = desiredX - zoomScale * targetPxX;
  const translateY = desiredY - zoomScale * targetPxY;

  const cells: { row: number; col: number; i: number }[] = [];
  let idx = 0;
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      cells.push({ row, col, i: idx++ });
    }
  }

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-50"
      style={{ display: introDone ? "none" : "block", overflow: "hidden" }}
    >
      {/* Everything zooms together toward the target window, in lockstep,
          so the frame and the panes never drift apart as the camera moves in. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translate(${translateX}px, ${translateY}px) scale(${zoomScale})`,
          transformOrigin: "0 0",
          transition: "transform 0.05s linear",
        }}
      >
        {cells.map(({ row, col, i }) => {
          // Diagonal wave: panes nearer the top-left open first; the target
          // window pair opens dead last, right as the zoom finishes on it.
          const isTargetPane = row === targetRow && (col === targetCol || col === targetCol + 1);
          const wave = isTargetPane ? 1 : (col + row) / MAX_WAVE;
          const start = wave * 0.5;
          const end = start + 0.4;
          let local = (progress - start) / (end - start);
          local = Math.min(1, Math.max(0, local));

          const isHovered = hoveredIndex === i;
          const openFraction = isHovered ? 1 : local;
          const rotate = openFraction * 140;

          const cellLeft = col * cellSize;
          const cellTop = row * cellSize;

          return (
            <div
              key={i}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex((h) => (h === i ? null : h))}
              style={{
                // Absolutely positioned from the same cellSize used by the
                // frame bars below, so pane edges and frame lines always
                // coincide exactly — CSS Grid's 1fr tracks round to whole
                // pixels per column and would drift out of sync instead.
                position: "absolute",
                left: cellLeft,
                top: cellTop,
                width: cellSize,
                height: cellSize,
                perspective: "1400px",
                overflow: "hidden",
                pointerEvents: local > 0.6 ? "none" : "auto",
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: "100%",
                  transformStyle: "preserve-3d",
                  transformOrigin: "center center",
                  // translateZ pushes the pane physically off the frame plane as it
                  // opens, so it visibly separates/offsets rather than spinning flush.
                  transform: `rotateY(-${rotate}deg) translateZ(${openFraction * 16}px)`,
                  transition: "transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)",
                  willChange: "transform",
                }}
              >
                {/* Frost layer — blurs/dims whatever real content sits behind the
                    overlay so it reads as opaque frosted glass, not a see-through
                    window onto sharp text. Sits behind the logo layer. */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    background: "rgba(248,248,250,0.55)",
                    backdropFilter: "blur(18px)",
                    WebkitBackdropFilter: "blur(18px)",
                  }}
                />
                {/* Front face — the logo itself, rendered crisp/unfrosted even
                    though it still sits on the frosted glass pane */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    backgroundColor: "rgba(246,247,249,0.3)",
                    backgroundImage: `url(${logod})`,
                    backgroundRepeat: "no-repeat",
                    backgroundSize: `${logoW}px ${logoH}px`,
                    backgroundPosition: `${logoLeft - cellLeft}px ${logoTop - cellTop}px`,
                    boxShadow: "inset 0 0 14px rgba(0,0,0,0.08)",
                  }}
                />
                {/* Right edge — gives the glass real thickness as it swings open */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    bottom: 0,
                    width: GLASS_DEPTH,
                    transformOrigin: "right center",
                    transform: "rotateY(90deg)",
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    background: "linear-gradient(90deg, rgba(150,155,160,0.55), rgba(255,255,255,0.9))",
                  }}
                />
                {/* Left edge — covers the opposite swing direction */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    bottom: 0,
                    width: GLASS_DEPTH,
                    transformOrigin: "left center",
                    transform: "rotateY(-90deg)",
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    background: "linear-gradient(270deg, rgba(150,155,160,0.55), rgba(255,255,255,0.9))",
                  }}
                />
              </div>
            </div>
          );
        })}

        {/* The mullion grid is built from real positioned boxes — one bar per
            column/row boundary — rather than a painted gradient. A gradient
            and a clipped box can rasterize with different sub-pixel rounding
            once the shared ancestor is scaled up during the zoom, which let
            the frame visibly drift from the panes; boxes laid out with the
            exact same left/top/cellSize arithmetic as the panes can't.
            Thin and light — a window mullion, not a prison bar. */}
        {Array.from({ length: COLS + 1 }).map((_, col) => (
          <div
            key={`v${col}`}
            className="pointer-events-none"
            style={{
              position: "absolute",
              left: col * cellSize - FRAME / 2,
              top: 0,
              width: FRAME,
              height: ROWS * cellSize,
              background: "linear-gradient(90deg, #ffffff 0%, #eceeef 45%, #d3d6d9 75%, #e9ebec 100%)",
              boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.08)",
            }}
          />
        ))}
        {Array.from({ length: ROWS + 1 }).map((_, row) => (
          <div
            key={`h${row}`}
            className="pointer-events-none"
            style={{
              position: "absolute",
              left: 0,
              top: row * cellSize - FRAME / 2,
              width: COLS * cellSize,
              height: FRAME,
              background: "linear-gradient(180deg, #ffffff 0%, #eceeef 45%, #d3d6d9 75%, #e9ebec 100%)",
              boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.08)",
            }}
          />
        ))}
      </div>

      <div
        className="fixed inset-x-0 bottom-10 flex justify-center pointer-events-none"
        style={{ opacity: Math.max(0, 1 - progress * 3) }}
      >
        <span className="text-sm tracking-widest uppercase text-foreground bg-background/90 backdrop-blur px-4 py-2 rounded-full border shadow-sm">
          Scroll to open ↓
        </span>
      </div>
    </div>
  );
}
