type BrainNode = {
  x: number;
  y: number;
  phase: number;
  depth: number;
  size: number;
  signal: boolean;
};

type BrainEdge = {
  a: number;
  b: number;
  phase: number;
  speed: number;
  signal: boolean;
};

type SignalPulse = {
  x: number;
  y: number;
  startedAt: number;
};

type BrainLayout = {
  originX: number;
  originY: number;
  scale: number;
};

const FIELD_SELECTOR = "[data-brain-field]";
const VIEW_WIDTH = 900;
const VIEW_HEIGHT = 620;
const TAU = Math.PI * 2;

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));

const seededRandom = (seed: number) => {
  let value = seed >>> 0;

  return () => {
    value += 0x6d2b79f5;
    let next = value;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
};

const createBrainPath = () => {
  const path = new Path2D();

  path.moveTo(111, 311);
  path.bezierCurveTo(78, 282, 83, 232, 119, 204);
  path.bezierCurveTo(106, 160, 140, 119, 188, 114);
  path.bezierCurveTo(207, 72, 268, 53, 312, 80);
  path.bezierCurveTo(352, 47, 413, 53, 451, 88);
  path.bezierCurveTo(500, 73, 548, 103, 563, 148);
  path.bezierCurveTo(612, 158, 642, 202, 631, 246);
  path.bezierCurveTo(665, 276, 658, 326, 623, 353);
  path.bezierCurveTo(635, 397, 601, 438, 557, 442);
  path.bezierCurveTo(539, 481, 492, 498, 454, 476);
  path.bezierCurveTo(417, 509, 359, 508, 322, 476);
  path.bezierCurveTo(284, 500, 231, 482, 210, 445);
  path.bezierCurveTo(164, 456, 125, 424, 126, 383);
  path.bezierCurveTo(91, 367, 82, 335, 100, 307);
  path.bezierCurveTo(94, 304, 96, 315, 111, 311);
  path.closePath();

  path.moveTo(432, 458);
  path.bezierCurveTo(449, 477, 452, 499, 447, 521);
  path.bezierCurveTo(443, 542, 455, 559, 474, 568);
  path.lineTo(523, 568);
  path.bezierCurveTo(497, 548, 492, 525, 501, 499);
  path.bezierCurveTo(508, 477, 504, 458, 489, 442);
  path.closePath();

  return path;
};

const createNetwork = (
  context: CanvasRenderingContext2D,
  brainPath: Path2D,
  nodeCount: number,
) => {
  const random = seededRandom(0x4d4f4e41);
  const nodes: BrainNode[] = [];
  let attempts = 0;

  while (nodes.length < nodeCount && attempts < nodeCount * 40) {
    attempts += 1;
    const x = 72 + random() * 590;
    const y = 48 + random() * 526;

    if (!context.isPointInPath(brainPath, x, y)) continue;

    nodes.push({
      x,
      y,
      phase: random() * TAU,
      depth: 0.2 + random() * 0.8,
      size: 0.65 + random() * 1.45,
      signal: random() < 0.115,
    });
  }

  const cellSize = 48;
  const cells = new Map<string, number[]>();
  const keyFor = (x: number, y: number) =>
    `${Math.floor(x / cellSize)}:${Math.floor(y / cellSize)}`;

  nodes.forEach((node, index) => {
    const key = keyFor(node.x, node.y);
    const bucket = cells.get(key) ?? [];
    bucket.push(index);
    cells.set(key, bucket);
  });

  const randomEdge = seededRandom(0x524f5941);
  const edges: BrainEdge[] = [];
  const seen = new Set<string>();

  nodes.forEach((node, index) => {
    const cellX = Math.floor(node.x / cellSize);
    const cellY = Math.floor(node.y / cellSize);
    const candidates: Array<{ index: number; distance: number }> = [];

    for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
      for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
        const bucket = cells.get(`${cellX + offsetX}:${cellY + offsetY}`) ?? [];

        bucket.forEach((candidateIndex) => {
          if (candidateIndex === index) return;
          const candidate = nodes[candidateIndex];
          const distance = Math.hypot(candidate.x - node.x, candidate.y - node.y);
          if (distance >= 13 && distance <= 69) {
            candidates.push({ index: candidateIndex, distance });
          }
        });
      }
    }

    candidates
      .sort((left, right) => left.distance - right.distance)
      .slice(0, node.signal ? 3 : 2)
      .forEach(({ index: candidateIndex }) => {
        const a = Math.min(index, candidateIndex);
        const b = Math.max(index, candidateIndex);
        const edgeKey = `${a}:${b}`;
        if (seen.has(edgeKey)) return;
        seen.add(edgeKey);

        edges.push({
          a,
          b,
          phase: randomEdge(),
          speed: 0.72 + randomEdge() * 0.75,
          signal: nodes[a].signal || nodes[b].signal || randomEdge() < 0.055,
        });
      });
  });

  return { nodes, edges };
};

const drawTrailingField = (
  context: CanvasRenderingContext2D,
  time: number,
  pointerStrength: number,
) => {
  context.save();
  context.globalCompositeOperation = "screen";

  for (let index = 0; index < 30; index += 1) {
    const startX = 548 + (index % 5) * 12;
    const startY = 132 + index * 10.2;
    const drift = Math.sin(time * 0.00024 + index * 0.68) * (4 + pointerStrength * 7);
    const endY = startY + Math.sin(index * 0.84) * 48 + drift;

    context.beginPath();
    context.moveTo(startX, startY);
    context.bezierCurveTo(
      672,
      startY - 34 + drift,
      765,
      endY + 24 - drift,
      VIEW_WIDTH + 18,
      endY,
    );
    context.strokeStyle =
      index % 7 === 0 ? "rgb(255 210 26 / 0.34)" : "rgb(255 255 255 / 0.13)";
    context.lineWidth = index % 5 === 0 ? 1.1 : 0.62;
    context.stroke();

    if (index % 4 === 0) {
      const progress = (time * 0.00008 * (1 + (index % 3) * 0.22) + index * 0.09) % 1;
      const inverse = 1 - progress;
      const controlOneX = 672;
      const controlOneY = startY - 34 + drift;
      const controlTwoX = 765;
      const controlTwoY = endY + 24 - drift;
      const endX = VIEW_WIDTH + 18;
      const pointX =
        inverse ** 3 * startX +
        3 * inverse ** 2 * progress * controlOneX +
        3 * inverse * progress ** 2 * controlTwoX +
        progress ** 3 * endX;
      const pointY =
        inverse ** 3 * startY +
        3 * inverse ** 2 * progress * controlOneY +
        3 * inverse * progress ** 2 * controlTwoY +
        progress ** 3 * endY;

      context.beginPath();
      context.arc(pointX, pointY, 1.45, 0, TAU);
      context.fillStyle = index % 8 === 0 ? "#ffd21a" : "rgb(255 255 255 / 0.9)";
      context.fill();
    }
  }

  context.restore();
};

const drawFoldField = (context: CanvasRenderingContext2D, time: number) => {
  context.save();
  context.globalCompositeOperation = "screen";

  for (let row = 0; row < 23; row += 1) {
    context.beginPath();
    for (let x = 72; x <= 676; x += 7) {
      const y =
        111 +
        row * 15.7 +
        Math.sin(x * 0.027 + row * 0.71 + time * 0.00014) * 8.5 +
        Math.sin(x * 0.061 - row * 0.43) * 3.5;

      if (x === 72) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.strokeStyle =
      row % 6 === 0 ? "rgb(255 210 26 / 0.22)" : "rgb(255 255 255 / 0.095)";
    context.lineWidth = row % 5 === 0 ? 1.05 : 0.65;
    context.stroke();
  }

  for (let column = 0; column < 12; column += 1) {
    context.beginPath();
    for (let y = 86; y <= 500; y += 7) {
      const x =
        142 +
        column * 39 +
        Math.sin(y * 0.032 + column * 0.83 - time * 0.0001) * 10 +
        Math.sin(y * 0.071 + column) * 3;

      if (y === 86) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.strokeStyle =
      column % 5 === 0 ? "rgb(255 210 26 / 0.17)" : "rgb(255 255 255 / 0.07)";
    context.lineWidth = 0.62;
    context.stroke();
  }

  context.restore();
};

const drawAnatomicalContours = (context: CanvasRenderingContext2D, time: number) => {
  const contours = [
    [365, 83, 338, 155, 397, 220, 363, 285, 329, 351, 391, 418, 354, 478],
    [132, 239, 184, 166, 278, 168, 302, 231, 322, 286, 260, 315, 205, 289],
    [193, 367, 226, 319, 295, 323, 315, 367, 330, 411, 277, 444, 231, 420],
    [405, 151, 450, 111, 530, 135, 548, 188, 564, 235, 512, 266, 467, 244],
    [425, 306, 471, 269, 548, 285, 570, 330, 593, 374, 548, 411, 498, 394],
    [156, 272, 188, 242, 227, 241, 244, 268, 261, 294, 229, 323, 194, 313],
  ] as const;

  context.save();
  context.globalCompositeOperation = "screen";
  context.setLineDash([2.5, 7]);
  context.lineDashOffset = reducedDashOffset(time);

  contours.forEach((curve, index) => {
    context.beginPath();
    context.moveTo(curve[0], curve[1]);
    context.bezierCurveTo(curve[2], curve[3], curve[4], curve[5], curve[6], curve[7]);
    context.bezierCurveTo(curve[8], curve[9], curve[10], curve[11], curve[12], curve[13]);
    context.strokeStyle =
      index % 3 === 0 ? "rgb(255 210 26 / 0.42)" : "rgb(255 255 255 / 0.24)";
    context.lineWidth = index % 3 === 0 ? 1.25 : 0.9;
    context.stroke();
  });

  context.setLineDash([]);
  context.restore();
};

const reducedDashOffset = (time: number) => -(time * 0.006) % 20;

const mountBrain = (field: HTMLElement) => {
  if (field.dataset.brainMounted === "true") return;

  const canvas = field.querySelector<HTMLCanvasElement>("[data-brain-canvas]");
  const status = field.querySelector<HTMLElement>("[data-brain-status]");
  const context = canvas?.getContext("2d", { alpha: false });
  if (!canvas || !context || !status) return;

  field.dataset.brainMounted = "true";

  const brainPath = createBrainPath();
  const { nodes, edges } = createNetwork(
    context,
    brainPath,
    field.getBoundingClientRect().width < 560 ? 520 : 820,
  );
  const displaced = new Float32Array(nodes.length * 2);
  const pulses: SignalPulse[] = [];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const pointer = {
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    active: false,
  };

  let width = 1;
  let height = 1;
  let pixelRatio = 1;
  let layout: BrainLayout = { originX: 0, originY: 0, scale: 1 };
  let animationFrame = 0;
  let lastFrame = 0;
  let inViewport = true;
  let statusTimer = 0;

  const updateStatus = (label: string, state: "idle" | "tracking" | "pulse") => {
    status.textContent = label;
    field.dataset.brainState = state;
  };

  const resize = () => {
    const bounds = field.getBoundingClientRect();
    width = Math.max(1, bounds.width);
    height = Math.max(1, bounds.height);
    pixelRatio = Math.min(window.devicePixelRatio || 1, 1.7);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    pointer.x = pointer.x || width * 0.5;
    pointer.y = pointer.y || height * 0.46;
    pointer.targetX = pointer.targetX || pointer.x;
    pointer.targetY = pointer.targetY || pointer.y;
    scheduleFrame();
  };

  const fieldPoint = (clientX: number, clientY: number) => {
    const bounds = field.getBoundingClientRect();
    return {
      x: clamp(clientX - bounds.left, 0, bounds.width),
      y: clamp(clientY - bounds.top, 0, bounds.height),
    };
  };

  const toBrainPoint = (x: number, y: number) => ({
    x: (x - layout.originX) / layout.scale,
    y: (y - layout.originY) / layout.scale,
  });

  const addPulse = (x: number, y: number) => {
    const point = toBrainPoint(x, y);
    pulses.push({ x: point.x, y: point.y, startedAt: performance.now() });
    if (pulses.length > 3) pulses.shift();
    updateStatus("Signal field / Pulse", "pulse");
    window.clearTimeout(statusTimer);
    statusTimer = window.setTimeout(() => {
      updateStatus(
        pointer.active ? "Signal field / Tracking" : "Signal field / Autonomous",
        pointer.active ? "tracking" : "idle",
      );
    }, 720);
    scheduleFrame();
  };

  const draw = (time: number) => {
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.fillStyle = "#000";
    context.fillRect(0, 0, width, height);

    pointer.x += (pointer.targetX - pointer.x) * 0.085;
    pointer.y += (pointer.targetY - pointer.y) * 0.085;

    const sceneWidth = width < 560 ? 720 : VIEW_WIDTH;
    const baseScale = Math.min(width / sceneWidth, height / VIEW_HEIGHT);
    const scale = baseScale * (width < 560 ? 0.98 : 1.1);
    const pointerOffsetX = ((pointer.x / width) - 0.5) * 13;
    const pointerOffsetY = ((pointer.y / height) - 0.5) * 9;
    layout = {
      originX: (width - sceneWidth * scale) * 0.5 + pointerOffsetX,
      originY: (height - VIEW_HEIGHT * scale) * 0.5 + pointerOffsetY,
      scale,
    };

    const brainPointer = toBrainPoint(pointer.x, pointer.y);
    const pointerStrength = pointer.active ? 1 : 0.18;

    context.save();
    context.translate(layout.originX, layout.originY);
    context.scale(scale, scale);

    drawTrailingField(context, time, pointerStrength);

    context.save();
    context.fillStyle = "#030405";
    context.shadowColor = "rgb(255 210 26 / 0.16)";
    context.shadowBlur = 34;
    context.fill(brainPath);
    context.restore();

    context.save();
    context.globalCompositeOperation = "screen";
    for (let layer = 5; layer >= 1; layer -= 1) {
      context.save();
      context.translate(layer * 1.25, layer * 0.58);
      context.strokeStyle = `rgb(255 255 255 / ${0.018 + layer * 0.01})`;
      context.lineWidth = 0.72;
      context.stroke(brainPath);
      context.restore();
    }
    context.restore();

    context.save();
    context.clip(brainPath);
    drawFoldField(context, time);
    drawAnatomicalContours(context, reducedMotion.matches ? 0 : time);

    const activePulses = pulses.filter((pulse) => time - pulse.startedAt < 1150);
    pulses.splice(0, pulses.length, ...activePulses);

    nodes.forEach((node, index) => {
      const breathing = reducedMotion.matches ? 0 : Math.sin(time * 0.00055 + node.phase) * 1.25;
      let x = node.x + breathing * node.depth;
      let y = node.y + Math.cos(time * 0.00048 + node.phase) * node.depth;

      if (pointer.active) {
        const deltaX = x - brainPointer.x;
        const deltaY = y - brainPointer.y;
        const distance = Math.max(0.001, Math.hypot(deltaX, deltaY));
        if (distance < 122) {
          const force = ((122 - distance) / 122) ** 2 * 16;
          x += (deltaX / distance) * force - (deltaY / distance) * force * 0.24;
          y += (deltaY / distance) * force + (deltaX / distance) * force * 0.24;
        }
      }

      displaced[index * 2] = x;
      displaced[index * 2 + 1] = y;
    });

    context.globalCompositeOperation = "screen";
    edges.forEach((edge) => {
      const ax = displaced[edge.a * 2];
      const ay = displaced[edge.a * 2 + 1];
      const bx = displaced[edge.b * 2];
      const by = displaced[edge.b * 2 + 1];
      const alpha = edge.signal ? 0.31 : 0.085;

      context.beginPath();
      context.moveTo(ax, ay);
      context.lineTo(bx, by);
      context.strokeStyle = edge.signal
        ? `rgb(255 210 26 / ${alpha})`
        : `rgb(255 255 255 / ${alpha})`;
      context.lineWidth = edge.signal ? 0.82 : 0.52;
      context.stroke();

      if (edge.signal && !reducedMotion.matches) {
        const progress = (time * 0.00017 * edge.speed + edge.phase) % 1;
        context.beginPath();
        context.arc(
          ax + (bx - ax) * progress,
          ay + (by - ay) * progress,
          1.35,
          0,
          TAU,
        );
        context.fillStyle = progress > 0.82 ? "#fff" : "#ffd21a";
        context.fill();
      }
    });

    nodes.forEach((node, index) => {
      const x = displaced[index * 2];
      const y = displaced[index * 2 + 1];
      let pulseBoost = 0;

      activePulses.forEach((pulse) => {
        const age = time - pulse.startedAt;
        const radius = age * 0.24;
        const distance = Math.hypot(x - pulse.x, y - pulse.y);
        pulseBoost = Math.max(pulseBoost, clamp(1 - Math.abs(distance - radius) / 24, 0, 1));
      });

      context.beginPath();
      context.arc(x, y, node.size + pulseBoost * 1.8, 0, TAU);
      context.fillStyle =
        node.signal || pulseBoost > 0.24
          ? `rgb(255 210 26 / ${0.54 + node.depth * 0.42})`
          : `rgb(255 255 255 / ${0.28 + node.depth * 0.58})`;
      context.fill();
    });

    context.save();
    context.globalCompositeOperation = "screen";
    context.shadowColor = "#ffd21a";
    context.shadowBlur = 5;
    nodes.forEach((node, index) => {
      if (!node.signal) return;
      context.beginPath();
      context.arc(displaced[index * 2], displaced[index * 2 + 1], 0.8, 0, TAU);
      context.fillStyle = "rgb(255 210 26 / 0.72)";
      context.fill();
    });
    context.restore();

    context.save();
    context.translate(522, 409);
    context.scale(1.22, 0.82);
    for (let ring = 0; ring < 6; ring += 1) {
      context.beginPath();
      context.arc(0, 0, 18 + ring * 9, Math.PI * 0.12, Math.PI * 1.88);
      context.strokeStyle =
        ring % 3 === 0 ? "rgb(255 210 26 / 0.26)" : "rgb(255 255 255 / 0.16)";
      context.lineWidth = 0.72;
      context.stroke();
    }
    context.restore();

    if (pointer.active) {
      context.beginPath();
      context.arc(brainPointer.x, brainPointer.y, 32, 0, TAU);
      context.setLineDash([2, 7]);
      context.strokeStyle = "rgb(255 210 26 / 0.38)";
      context.lineWidth = 0.85;
      context.stroke();
      context.setLineDash([]);
    }

    activePulses.forEach((pulse) => {
      const age = time - pulse.startedAt;
      context.beginPath();
      context.arc(pulse.x, pulse.y, age * 0.24, 0, TAU);
      context.strokeStyle = `rgb(255 210 26 / ${clamp(0.72 - age / 1500, 0, 0.72)})`;
      context.lineWidth = 1.35;
      context.stroke();
    });

    context.restore();

    context.save();
    context.globalCompositeOperation = "screen";
    context.strokeStyle = "rgb(255 255 255 / 0.43)";
    context.lineWidth = 1.05;
    context.shadowColor = "rgb(255 210 26 / 0.42)";
    context.shadowBlur = 7;
    context.stroke(brainPath);
    context.restore();

    context.restore();
  };

  const frame = (time: number) => {
    animationFrame = 0;
    if (!inViewport || document.visibilityState === "hidden") return;

    if (reducedMotion.matches || time - lastFrame >= 32) {
      lastFrame = time;
      draw(time);
    }

    if (!reducedMotion.matches) scheduleFrame();
  };

  function scheduleFrame() {
    if (animationFrame || !inViewport || document.visibilityState === "hidden") return;
    animationFrame = window.requestAnimationFrame(frame);
  }

  field.addEventListener("pointermove", (event) => {
    const point = fieldPoint(event.clientX, event.clientY);
    pointer.targetX = point.x;
    pointer.targetY = point.y;
    pointer.active = true;
    updateStatus("Signal field / Tracking", "tracking");
    scheduleFrame();
  });

  field.addEventListener("pointerleave", () => {
    pointer.targetX = width * 0.5;
    pointer.targetY = height * 0.46;
    pointer.active = false;
    updateStatus("Signal field / Autonomous", "idle");
    scheduleFrame();
  });

  field.addEventListener("pointerdown", (event) => {
    const point = fieldPoint(event.clientX, event.clientY);
    pointer.targetX = point.x;
    pointer.targetY = point.y;
    pointer.active = true;
    addPulse(point.x, point.y);
  });

  field.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    addPulse(width * 0.5, height * 0.46);
  });

  reducedMotion.addEventListener("change", scheduleFrame);
  document.addEventListener("visibilitychange", scheduleFrame);

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(field);

  const intersectionObserver = new IntersectionObserver(
    ([entry]) => {
      inViewport = entry?.isIntersecting ?? true;
      if (inViewport) scheduleFrame();
      else if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = 0;
      }
    },
    { rootMargin: "120px" },
  );
  intersectionObserver.observe(field);

  resize();
};

export const mountInteractiveBrains = () => {
  document.querySelectorAll<HTMLElement>(FIELD_SELECTOR).forEach(mountBrain);
};
