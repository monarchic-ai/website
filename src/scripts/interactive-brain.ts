type Vector3 = {
  x: number;
  y: number;
  z: number;
};

type SurfaceRegion = "cortex" | "cerebellum" | "stem";

type SurfaceVertex = {
  position: Vector3;
  normal: Vector3;
  activity: number;
  dissolve: number;
  region: SurfaceRegion;
};

type SurfaceEdge = {
  a: number;
  b: number;
  activity: number;
  dissolve: number;
  phase: number;
};

type SurfaceFace = {
  a: number;
  b: number;
  c: number;
  activity: number;
  dissolve: number;
  phase: number;
};

type Hub = {
  position: Vector3;
  radius: number;
  strength: number;
  code: string;
};

type NeuralNode = {
  position: Vector3;
  region: number;
  hub: boolean;
  phase: number;
  size: number;
};

type NeuralLink = {
  a: number;
  b: number;
  activity: number;
  phase: number;
};

type NeuralRoute = {
  from: number;
  to: number;
  points: Vector3[];
  phase: number;
};

type Fragment = {
  position: Vector3;
  drift: Vector3;
  phase: number;
  size: number;
  dash: boolean;
};

type NeuralPulse = {
  hub: number;
  startedAt: number;
};

type Geometry = {
  vertices: SurfaceVertex[];
  edges: SurfaceEdge[];
  faces: SurfaceFace[];
  nodes: NeuralNode[];
  links: NeuralLink[];
  routes: NeuralRoute[];
  fragments: Fragment[];
};

type Curve3 = [Vector3, Vector3, Vector3, Vector3];

const FIELD_SELECTOR = "[data-brain-field]";
const TAU = Math.PI * 2;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const SHELL_LEVELS = 6;

const HUBS: Hub[] = [
  { position: { x: 0.02, y: 0.04, z: 0.34 }, radius: 0.62, strength: 1, code: "CORE / 00" },
  { position: { x: -1.08, y: 0.38, z: 0.58 }, radius: 0.58, strength: 0.9, code: "NODE / 01" },
  { position: { x: -0.1, y: 0.55, z: 0.7 }, radius: 0.52, strength: 1, code: "NODE / 02" },
  { position: { x: -0.2, y: -0.66, z: 0.62 }, radius: 0.5, strength: 0.88, code: "NODE / 03" },
  { position: { x: 1.2, y: 0.12, z: 0.5 }, radius: 0.56, strength: 0.8, code: "NODE / 04" },
  { position: { x: 1.28, y: -1.13, z: 0.31 }, radius: 0.42, strength: 0.72, code: "NODE / 05" },
];

const SULCUS_GUIDES: Curve3[] = [
  [
    { x: -1.55, y: -0.04, z: 0.7 },
    { x: -0.82, y: -0.33, z: 1.02 },
    { x: 0.18, y: -0.31, z: 1.04 },
    { x: 1.06, y: -0.55, z: 0.72 },
  ],
  [
    { x: -0.34, y: 1.3, z: 0.58 },
    { x: -0.2, y: 0.8, z: 1.02 },
    { x: 0.02, y: 0.22, z: 1.08 },
    { x: 0.22, y: -0.42, z: 0.84 },
  ],
  [
    { x: -1.42, y: 0.63, z: 0.66 },
    { x: -0.72, y: 0.38, z: 1 },
    { x: 0.16, y: 0.5, z: 1.04 },
    { x: 0.94, y: 0.79, z: 0.72 },
  ],
  [
    { x: 0.73, y: 1.06, z: 0.66 },
    { x: 0.84, y: 0.7, z: 0.93 },
    { x: 1.12, y: 0.45, z: 0.88 },
    { x: 1.49, y: 0.2, z: 0.62 },
  ],
];

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));

const smoothstep = (minimum: number, maximum: number, value: number) => {
  const normalized = clamp((value - minimum) / (maximum - minimum), 0, 1);
  return normalized * normalized * (3 - 2 * normalized);
};

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

const gaussian = (random: () => number) => {
  const first = Math.max(random(), 0.000001);
  const second = random();
  return Math.sqrt(-2 * Math.log(first)) * Math.cos(TAU * second);
};

const add = (left: Vector3, right: Vector3): Vector3 => ({
  x: left.x + right.x,
  y: left.y + right.y,
  z: left.z + right.z,
});

const subtract = (left: Vector3, right: Vector3): Vector3 => ({
  x: left.x - right.x,
  y: left.y - right.y,
  z: left.z - right.z,
});

const multiply = (vector: Vector3, scalar: number): Vector3 => ({
  x: vector.x * scalar,
  y: vector.y * scalar,
  z: vector.z * scalar,
});

const dot = (left: Vector3, right: Vector3) =>
  left.x * right.x + left.y * right.y + left.z * right.z;

const cross = (left: Vector3, right: Vector3): Vector3 => ({
  x: left.y * right.z - left.z * right.y,
  y: left.z * right.x - left.x * right.z,
  z: left.x * right.y - left.y * right.x,
});

const length = (vector: Vector3) => Math.hypot(vector.x, vector.y, vector.z);

const normalize = (vector: Vector3): Vector3 => {
  const vectorLength = Math.max(length(vector), 0.000001);
  return multiply(vector, 1 / vectorLength);
};

const distanceSquared = (left: Vector3, right: Vector3) => {
  const deltaX = left.x - right.x;
  const deltaY = left.y - right.y;
  const deltaZ = left.z - right.z;
  return deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ;
};

const signedPower = (value: number, power: number) =>
  Math.sign(value) * Math.abs(value) ** power;

const cubicVector = (curve: Curve3, position: number): Vector3 => {
  const inverse = 1 - position;
  return {
    x:
      inverse ** 3 * curve[0].x +
      3 * inverse ** 2 * position * curve[1].x +
      3 * inverse * position ** 2 * curve[2].x +
      position ** 3 * curve[3].x,
    y:
      inverse ** 3 * curve[0].y +
      3 * inverse ** 2 * position * curve[1].y +
      3 * inverse * position ** 2 * curve[2].y +
      position ** 3 * curve[3].y,
    z:
      inverse ** 3 * curve[0].z +
      3 * inverse ** 2 * position * curve[1].z +
      3 * inverse * position ** 2 * curve[2].z +
      position ** 3 * curve[3].z,
  };
};

const activityAt = (position: Vector3) => {
  let activity = 0;
  HUBS.slice(1).forEach((hub) => {
    const influence = hub.strength * Math.exp(-distanceSquared(position, hub.position) / (2 * hub.radius ** 2));
    activity = Math.max(activity, influence);
  });
  return clamp(activity, 0, 1);
};

const cerebrumPoint = (direction: Vector3): Vector3 => {
  let position: Vector3 = {
    x: 2.22 * signedPower(direction.x, 0.9),
    y: 1.42 * signedPower(direction.y, 0.94),
    z: 1.04 * direction.z,
  };

  const frontal = Math.exp(-(((position.x + 1.28) / 0.78) ** 2) - ((position.y - 0.18) / 0.9) ** 2);
  const temporal = Math.exp(-(((position.x + 0.12) / 1.08) ** 2) - ((position.y + 0.76) / 0.34) ** 2);
  const occipital = Math.exp(-(((position.x - 1.55) / 0.55) ** 2) - ((position.y - 0.02) / 0.82) ** 2);

  position = {
    x: position.x - frontal * 0.1 - occipital * 0.08,
    y: position.y + frontal * 0.07 - temporal * 0.17,
    z: position.z * (1 + temporal * 0.08),
  };

  return position;
};

const cerebellumPoint = (direction: Vector3): Vector3 => {
  const longitude = Math.atan2(direction.z, direction.x);
  const latitude = Math.asin(clamp(direction.y, -1, 1));
  const ripple = 1 + Math.sin(longitude * 9 + latitude * 2) * 0.025;
  return {
    x: 1.3 + direction.x * 0.79 * ripple,
    y: -1.14 + direction.y * 0.59 * ripple,
    z: 0.02 + direction.z * 0.69 * ripple,
  };
};

const fibonacciDirections = (count: number, seed: number) => {
  const random = seededRandom(seed);
  const directions: Vector3[] = [];

  for (let index = 0; index < count; index += 1) {
    const y = 1 - ((index + 0.5) / count) * 2;
    const radius = Math.sqrt(Math.max(0, 1 - y * y));
    const angle = index * GOLDEN_ANGLE + (random() - 0.5) * 0.13;
    directions.push({ x: Math.cos(angle) * radius, y, z: Math.sin(angle) * radius });
  }

  return directions;
};

const clusteredDirections = (hub: Hub, count: number, seed: number) => {
  const random = seededRandom(seed);
  const center = normalize({
    x: hub.position.x / 2.22,
    y: hub.position.y / 1.42,
    z: Math.max(0.36, hub.position.z) / 1.04,
  });
  const reference = Math.abs(center.y) < 0.88 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 };
  const tangentOne = normalize(cross(reference, center));
  const tangentTwo = normalize(cross(center, tangentOne));

  return Array.from({ length: count }, () =>
    normalize(
      add(
        center,
        add(
          multiply(tangentOne, gaussian(random) * 0.16),
          multiply(tangentTwo, gaussian(random) * 0.16),
        ),
      ),
    ),
  );
};

const addSurfaceGroup = (
  geometry: Geometry,
  directions: Vector3[],
  mapper: (direction: Vector3) => Vector3,
  region: SurfaceRegion,
  seed: number,
  edgeKeys: Set<string>,
) => {
  const random = seededRandom(seed);
  const indices = directions.map((direction) => {
    const position = mapper(direction);
    const dissolve = region === "cortex"
      ? smoothstep(1.05, 2.05, position.x) * smoothstep(-0.22, 1.1, position.y)
      : 0;
    const index = geometry.vertices.length;
    geometry.vertices.push({
      position,
      normal: normalize(direction),
      activity: activityAt(position),
      dissolve,
      region,
    });
    return index;
  });

  const neighbors = new Map<number, number[]>();

  const addSurfaceEdge = (a: number, b: number) => {
    const minimum = Math.min(a, b);
    const maximum = Math.max(a, b);
    const key = `${minimum}:${maximum}`;
    if (edgeKeys.has(key)) return;
    edgeKeys.add(key);
    const left = geometry.vertices[a];
    const right = geometry.vertices[b];
    geometry.edges.push({
      a,
      b,
      activity: Math.max(left.activity, right.activity),
      dissolve: (left.dissolve + right.dissolve) * 0.5,
      phase: random(),
    });
    neighbors.set(a, [...(neighbors.get(a) ?? []), b]);
    neighbors.set(b, [...(neighbors.get(b) ?? []), a]);
  };

  indices.forEach((vertexIndex) => {
    const vertex = geometry.vertices[vertexIndex];
    const nearest = indices
      .filter((candidate) => candidate !== vertexIndex)
      .map((candidate) => ({
        candidate,
        distance: distanceSquared(vertex.position, geometry.vertices[candidate].position),
      }))
      .sort((left, right) => left.distance - right.distance)
      .slice(0, 7);

    nearest.slice(0, 3).forEach(({ candidate }) => addSurfaceEdge(vertexIndex, candidate));
    nearest.slice(3).forEach(({ candidate }, rank) => {
      const regionBias = region === "cerebellum" ? 0.18 : region === "stem" ? 0.12 : 0;
      const keepChance = 0.06 + regionBias + vertex.activity * 0.48 - rank * 0.035;
      if (random() < keepChance) addSurfaceEdge(vertexIndex, candidate);
    });
  });

  if (region === "stem") return;

  const faceKeys = new Set<string>();
  indices.forEach((vertexIndex) => {
    const vertex = geometry.vertices[vertexIndex];
    const adjacent = neighbors.get(vertexIndex) ?? [];
    if (adjacent.length < 2) return;
    const reference = Math.abs(vertex.normal.y) < 0.88 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 };
    const tangentOne = normalize(cross(reference, vertex.normal));
    const tangentTwo = normalize(cross(vertex.normal, tangentOne));
    const ordered = adjacent
      .map((candidate) => {
        const delta = subtract(geometry.vertices[candidate].position, vertex.position);
        return {
          candidate,
          angle: Math.atan2(dot(delta, tangentTwo), dot(delta, tangentOne)),
        };
      })
      .sort((left, right) => left.angle - right.angle);

    ordered.forEach((entry, position) => {
      const next = ordered[(position + 1) % ordered.length];
      const edgeKey = `${Math.min(entry.candidate, next.candidate)}:${Math.max(entry.candidate, next.candidate)}`;
      if (!edgeKeys.has(edgeKey)) return;
      const face = [vertexIndex, entry.candidate, next.candidate].sort((left, right) => left - right);
      const faceKey = face.join(":");
      if (faceKeys.has(faceKey)) return;
      const activity = Math.max(
        vertex.activity,
        geometry.vertices[entry.candidate].activity,
        geometry.vertices[next.candidate].activity,
      );
      if (random() > 0.09 + activity * 0.22) return;
      faceKeys.add(faceKey);
      geometry.faces.push({
        a: vertexIndex,
        b: entry.candidate,
        c: next.candidate,
        activity,
        dissolve:
          (vertex.dissolve +
            geometry.vertices[entry.candidate].dissolve +
            geometry.vertices[next.candidate].dissolve) /
          3,
        phase: random(),
      });
    });
  });
};

const addIrregularStem = (geometry: Geometry, edgeKeys: Set<string>) => {
  const random = seededRandom(0x5354454d);
  const directions: Vector3[] = [];
  const mapper = (direction: Vector3): Vector3 => {
    const progress = clamp((direction.y + 1) * 0.5, 0, 1);
    const angle = Math.atan2(direction.z, direction.x);
    const radius = 0.29 * (1 - progress * 0.4);
    return {
      x: 0.77 + progress * 0.31 + Math.sin(progress * Math.PI) * 0.05 + Math.cos(angle) * radius,
      y: -1.1 - progress * 1.08,
      z: 0.03 + Math.sin(angle) * radius * 0.9,
    };
  };

  for (let index = 0; index < 74; index += 1) {
    const progress = (index + 0.5) / 74;
    const angle = index * GOLDEN_ANGLE + (random() - 0.5) * 0.14;
    directions.push({ x: Math.cos(angle), y: progress * 2 - 1, z: Math.sin(angle) });
  }
  addSurfaceGroup(geometry, directions, mapper, "stem", 0x53544d32, edgeKeys);
};

const addNeuralLink = (
  geometry: Geometry,
  keys: Set<string>,
  a: number,
  b: number,
  random: () => number,
) => {
  const minimum = Math.min(a, b);
  const maximum = Math.max(a, b);
  const key = `${minimum}:${maximum}`;
  if (keys.has(key)) return;
  keys.add(key);
  geometry.links.push({
    a,
    b,
    activity: Math.max(activityAt(geometry.nodes[a].position), activityAt(geometry.nodes[b].position)),
    phase: random(),
  });
};

const createNeuralLattice = (geometry: Geometry) => {
  const random = seededRandom(0x4e455552);
  HUBS.forEach((hub, region) => {
    geometry.nodes.push({ position: hub.position, region, hub: true, phase: random(), size: region === 0 ? 3.8 : 2.7 });
  });

  HUBS.slice(1).forEach((hub, offset) => {
    const region = offset + 1;
    const nodeCount = region === 5 ? 8 : 11;
    for (let index = 0; index < nodeCount; index += 1) {
      geometry.nodes.push({
        position: {
          x: hub.position.x + gaussian(random) * (region === 5 ? 0.22 : 0.3),
          y: hub.position.y + gaussian(random) * (region === 5 ? 0.18 : 0.24),
          z: hub.position.z + gaussian(random) * 0.18,
        },
        region,
        hub: false,
        phase: random(),
        size: 0.7 + random() * 0.65,
      });
    }
  });

  for (let index = 0; index < 22; index += 1) {
    const direction = normalize({
      x: random() * 2 - 1,
      y: random() * 2 - 1,
      z: random() * 2 - 1,
    });
    const radius = 0.28 + Math.cbrt(random()) * 0.62;
    geometry.nodes.push({
      position: {
        x: direction.x * 1.56 * radius,
        y: direction.y * 1.02 * radius,
        z: direction.z * 0.68 * radius + 0.08,
      },
      region: 0,
      hub: false,
      phase: random(),
      size: 0.55 + random() * 0.55,
    });
  }

  const linkKeys = new Set<string>();
  geometry.nodes.forEach((node, nodeIndex) => {
    if (node.hub) return;
    const hubIndex = node.region;
    const hubPosition = HUBS[hubIndex].position;
    const distanceToHub = distanceSquared(node.position, hubPosition);
    const candidates = geometry.nodes
      .map((candidate, candidateIndex) => ({ candidate, candidateIndex }))
      .filter(({ candidate, candidateIndex }) =>
        candidateIndex !== nodeIndex &&
        candidate.region === node.region &&
        distanceSquared(candidate.position, hubPosition) < distanceToHub,
      )
      .map(({ candidate, candidateIndex }) => ({
        candidateIndex,
        distance: distanceSquared(node.position, candidate.position),
      }))
      .sort((left, right) => left.distance - right.distance);

    addNeuralLink(geometry, linkKeys, nodeIndex, candidates[0]?.candidateIndex ?? hubIndex, random);

    const nearestExtra = geometry.nodes
      .map((candidate, candidateIndex) => ({
        candidate,
        candidateIndex,
        distance: distanceSquared(node.position, candidate.position),
      }))
      .filter(({ candidate, candidateIndex }) =>
        candidateIndex !== nodeIndex && candidate.region === node.region,
      )
      .sort((left, right) => left.distance - right.distance)[1];
    if (nearestExtra && random() < 0.52) {
      addNeuralLink(geometry, linkKeys, nodeIndex, nearestExtra.candidateIndex, random);
    }
  });

  HUBS.slice(1).forEach((hub, offset) => {
    const hubIndex = offset + 1;
    const start = HUBS[0].position;
    const end = hub.position;
    const controlOne = add(multiply(start, 0.7), multiply(end, 0.3));
    const controlTwo = add(multiply(start, 0.28), multiply(end, 0.72));
    controlOne.z += 0.28;
    controlTwo.z += 0.2;
    controlOne.y += offset % 2 === 0 ? 0.12 : -0.08;
    controlTwo.y += offset % 2 === 0 ? 0.08 : -0.06;
    const curve: Curve3 = [start, controlOne, controlTwo, end];
    geometry.routes.push({
      from: 0,
      to: hubIndex,
      points: Array.from({ length: 34 }, (_, index) => cubicVector(curve, index / 33)),
      phase: random(),
    });
  });
};

const createBrainGeometry = () => {
  const geometry: Geometry = {
    vertices: [],
    edges: [],
    faces: [],
    nodes: [],
    links: [],
    routes: [],
    fragments: [],
  };
  const edgeKeys = new Set<string>();
  const cortexDirections = fibonacciDirections(340, 0x434f5254);
  HUBS.slice(1, 5).forEach((hub, index) => {
    cortexDirections.push(...clusteredDirections(hub, 28, 0x48423130 + index));
  });
  addSurfaceGroup(geometry, cortexDirections, cerebrumPoint, "cortex", 0x43545832, edgeKeys);
  addSurfaceGroup(
    geometry,
    fibonacciDirections(142, 0x4342524c),
    cerebellumPoint,
    "cerebellum",
    0x43424c32,
    edgeKeys,
  );
  addIrregularStem(geometry, edgeKeys);
  createNeuralLattice(geometry);

  const fragmentRandom = seededRandom(0x46524147);
  geometry.vertices
    .filter((vertex) => vertex.region === "cortex" && vertex.dissolve > 0.2)
    .sort((left, right) => right.dissolve - left.dissolve)
    .forEach((vertex) => {
      if (geometry.fragments.length >= 62 || fragmentRandom() > 0.62) return;
      const outward = normalize(add(vertex.normal, { x: 0.72, y: 0.02, z: 0 }));
      geometry.fragments.push({
        position: vertex.position,
        drift: outward,
        phase: fragmentRandom(),
        size: 0.55 + fragmentRandom() * 1.05,
        dash: fragmentRandom() < 0.28,
      });
    });

  return geometry;
};

const rotatePoint = (point: Vector3, yaw: number, pitch: number, roll: number): Vector3 => {
  const cosYaw = Math.cos(yaw);
  const sinYaw = Math.sin(yaw);
  const yawX = point.x * cosYaw + point.z * sinYaw;
  const yawZ = -point.x * sinYaw + point.z * cosYaw;
  const cosPitch = Math.cos(pitch);
  const sinPitch = Math.sin(pitch);
  const pitchY = point.y * cosPitch - yawZ * sinPitch;
  const pitchZ = point.y * sinPitch + yawZ * cosPitch;
  const cosRoll = Math.cos(roll);
  const sinRoll = Math.sin(roll);
  return {
    x: yawX * cosRoll - pitchY * sinRoll,
    y: yawX * sinRoll + pitchY * cosRoll,
    z: pitchZ,
  };
};

const quietShellColors = [
  "rgb(92 55 0 / 0.018)",
  "rgb(112 67 0 / 0.03)",
  "rgb(139 84 0 / 0.05)",
  "rgb(170 105 0 / 0.085)",
  "rgb(207 140 0 / 0.14)",
  "rgb(240 174 0 / 0.24)",
] as const;

const activeShellColors = [
  "rgb(116 70 0 / 0.025)",
  "rgb(143 86 0 / 0.05)",
  "rgb(177 108 0 / 0.09)",
  "rgb(210 143 0 / 0.16)",
  "rgb(242 181 0 / 0.27)",
  "rgb(255 203 24 / 0.43)",
] as const;

const mountBrain = (field: HTMLElement) => {
  if (field.dataset.brainMounted === "true") return;

  const canvas = field.querySelector<HTMLCanvasElement>("[data-brain-canvas]");
  const status = field.querySelector<HTMLElement>("[data-brain-status]");
  const context = canvas?.getContext("2d", { alpha: false });
  if (!canvas || !context || !status) return;

  field.dataset.brainMounted = "true";

  const geometry = createBrainGeometry();
  const projected = new Float32Array(geometry.vertices.length * 3);
  const projectedNodes = new Float32Array(geometry.nodes.length * 3);
  const lastHubProjection = new Float32Array(HUBS.length * 2);
  const pulses: NeuralPulse[] = [];
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
  let animationFrame = 0;
  let lastFrame = 0;
  let inViewport = true;
  let yaw = -0.42;
  let pitch = -0.075;
  let statusTimer = 0;

  const updateStatus = (label: string, state: "idle" | "tracking" | "pulse") => {
    status.textContent = label;
    field.dataset.brainState = state;
  };

  const resize = () => {
    const bounds = field.getBoundingClientRect();
    width = Math.max(1, bounds.width);
    height = Math.max(1, bounds.height);
    pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
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

  const addPulse = (x: number, y: number) => {
    let nearestHub = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;
    for (let index = 0; index < HUBS.length; index += 1) {
      const deltaX = lastHubProjection[index * 2] - x;
      const deltaY = lastHubProjection[index * 2 + 1] - y;
      const distance = deltaX * deltaX + deltaY * deltaY;
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestHub = index;
      }
    }
    pulses.push({ hub: nearestHub, startedAt: performance.now() });
    if (pulses.length > 3) pulses.shift();
    updateStatus("MODEL FIELD / SIGNAL", "pulse");
    window.clearTimeout(statusTimer);
    statusTimer = window.setTimeout(() => {
      updateStatus(pointer.active ? "MODEL FIELD / TRACKING" : "MODEL FIELD / LIVE", pointer.active ? "tracking" : "idle");
    }, 720);
    scheduleFrame();
  };

  const drawCornerBrackets = (minimumX: number, minimumY: number, maximumX: number, maximumY: number) => {
    const bracket = 14;
    const inset = 8;
    const left = minimumX - inset;
    const top = minimumY - inset;
    const right = maximumX + inset;
    const bottom = maximumY + inset;
    context.beginPath();
    context.moveTo(left, top + bracket);
    context.lineTo(left, top);
    context.lineTo(left + bracket, top);
    context.moveTo(right - bracket, bottom);
    context.lineTo(right, bottom);
    context.lineTo(right, bottom - bracket);
    context.strokeStyle = "rgb(255 197 18 / 0.3)";
    context.lineWidth = 0.75;
    context.stroke();
  };

  const draw = (time: number) => {
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.fillStyle = "#000";
    context.fillRect(0, 0, width, height);

    pointer.x += (pointer.targetX - pointer.x) * 0.09;
    pointer.y += (pointer.targetY - pointer.y) * 0.09;
    const normalizedPointerX = pointer.x / width - 0.5;
    const normalizedPointerY = pointer.y / height - 0.5;
    const idleYaw = reducedMotion.matches ? -0.42 : -0.42 + Math.sin(time * 0.00016) * 0.035;
    const idlePitch = reducedMotion.matches ? -0.075 : -0.075 + Math.sin(time * 0.00012) * 0.018;
    const targetYaw = pointer.active ? -0.42 + normalizedPointerX * 0.32 : idleYaw;
    const targetPitch = pointer.active ? -0.075 - normalizedPointerY * 0.24 : idlePitch;
    if (reducedMotion.matches) {
      yaw = targetYaw;
      pitch = targetPitch;
    } else {
      yaw += (targetYaw - yaw) * 0.075;
      pitch += (targetPitch - pitch) * 0.075;
    }

    const modelScale = Math.min(width / 5.12, height / 4.42);
    const centerX = width * 0.47;
    const centerY = height * 0.465;
    const cameraDistance = 7.3;
    const projectPoint = (position: Vector3) => {
      const rotated = rotatePoint(position, yaw, pitch, -0.025);
      const perspective = cameraDistance / (cameraDistance - rotated.z);
      return {
        x: centerX + rotated.x * modelScale * perspective,
        y: centerY - rotated.y * modelScale * perspective,
        z: rotated.z,
      };
    };

    let minimumX = Number.POSITIVE_INFINITY;
    let minimumY = Number.POSITIVE_INFINITY;
    let maximumX = Number.NEGATIVE_INFINITY;
    let maximumY = Number.NEGATIVE_INFINITY;
    geometry.vertices.forEach((vertex, index) => {
      const point = projectPoint(vertex.position);
      projected[index * 3] = point.x;
      projected[index * 3 + 1] = point.y;
      projected[index * 3 + 2] = point.z;
      minimumX = Math.min(minimumX, point.x);
      minimumY = Math.min(minimumY, point.y);
      maximumX = Math.max(maximumX, point.x);
      maximumY = Math.max(maximumY, point.y);
    });

    geometry.nodes.forEach((node, index) => {
      const point = projectPoint(node.position);
      projectedNodes[index * 3] = point.x;
      projectedNodes[index * 3 + 1] = point.y;
      projectedNodes[index * 3 + 2] = point.z;
      if (index < HUBS.length) {
        lastHubProjection[index * 2] = point.x;
        lastHubProjection[index * 2 + 1] = point.y;
      }
    });

    const facetBuckets = Array.from({ length: SHELL_LEVELS }, () => new Path2D());
    geometry.faces.forEach((face) => {
      if (face.phase < face.dissolve * 0.44) return;
      const depth = (projected[face.a * 3 + 2] + projected[face.b * 3 + 2] + projected[face.c * 3 + 2]) / 3;
      const front = smoothstep(-0.35, 0.95, depth);
      const bucket = Math.min(SHELL_LEVELS - 1, Math.floor(front * SHELL_LEVELS));
      const path = facetBuckets[bucket];
      path.moveTo(projected[face.a * 3], projected[face.a * 3 + 1]);
      path.lineTo(projected[face.b * 3], projected[face.b * 3 + 1]);
      path.lineTo(projected[face.c * 3], projected[face.c * 3 + 1]);
      path.closePath();
    });

    facetBuckets.forEach((path, index) => {
      context.fillStyle = `rgb(155 94 0 / ${0.004 + index * 0.0045})`;
      context.fill(path);
    });

    const cycleElapsed = reducedMotion.matches ? 1240 : time % 6500;
    const autoProgress = cycleElapsed <= 3800 ? cycleElapsed / 3800 : -1;
    const activePulses = pulses.filter((pulse) => time - pulse.startedAt < 1650);
    pulses.splice(0, pulses.length, ...activePulses);
    const quietBuckets = Array.from({ length: SHELL_LEVELS }, () => new Path2D());
    const activeBuckets = Array.from({ length: SHELL_LEVELS }, () => new Path2D());
    const autoWavePath = new Path2D();
    const pulsePaths = activePulses.map(() => new Path2D());

    geometry.edges.forEach((edge) => {
      if (edge.phase < edge.dissolve * 0.5) return;
      const ax = projected[edge.a * 3];
      const ay = projected[edge.a * 3 + 1];
      const bx = projected[edge.b * 3];
      const by = projected[edge.b * 3 + 1];
      const depth = (projected[edge.a * 3 + 2] + projected[edge.b * 3 + 2]) * 0.5;
      const front = smoothstep(-0.35, 0.95, depth);
      const bucket = Math.min(SHELL_LEVELS - 1, Math.floor(front * SHELL_LEVELS));
      const path = edge.activity > 0.42 ? activeBuckets[bucket] : quietBuckets[bucket];
      path.moveTo(ax, ay);
      path.lineTo(bx, by);

      const worldMidpoint = multiply(add(geometry.vertices[edge.a].position, geometry.vertices[edge.b].position), 0.5);
      if (autoProgress >= 0) {
        const distance = Math.sqrt(distanceSquared(worldMidpoint, HUBS[0].position));
        if (Math.abs(distance - autoProgress * 3.18) < 0.075) {
          autoWavePath.moveTo(ax, ay);
          autoWavePath.lineTo(bx, by);
        }
      }
      activePulses.forEach((pulse, index) => {
        const age = time - pulse.startedAt;
        const distance = Math.sqrt(distanceSquared(worldMidpoint, HUBS[pulse.hub].position));
        if (Math.abs(distance - (age / 1650) * 3.35) < 0.085) {
          pulsePaths[index].moveTo(ax, ay);
          pulsePaths[index].lineTo(bx, by);
        }
      });
    });

    context.lineCap = "butt";
    context.lineJoin = "miter";
    quietBuckets.forEach((path, index) => {
      context.strokeStyle = quietShellColors[index];
      context.lineWidth = 0.24 + index * 0.055;
      context.stroke(path);
    });
    activeBuckets.forEach((path, index) => {
      context.strokeStyle = activeShellColors[index];
      context.lineWidth = 0.28 + index * 0.065;
      context.stroke(path);
    });

    const coreX = projectedNodes[0];
    const coreY = projectedNodes[1];
    const haze = context.createRadialGradient(coreX, coreY, 0, coreX, coreY, modelScale * 0.52);
    haze.addColorStop(0, "rgb(255 184 0 / 0.065)");
    haze.addColorStop(0.38, "rgb(202 126 0 / 0.025)");
    haze.addColorStop(1, "rgb(155 94 0 / 0)");
    context.fillStyle = haze;
    context.fillRect(coreX - modelScale * 0.52, coreY - modelScale * 0.52, modelScale * 1.04, modelScale * 1.04);

    const sulcusPath = new Path2D();
    SULCUS_GUIDES.forEach((guide) => {
      for (let step = 0; step <= 30; step += 1) {
        const point = projectPoint(cubicVector(guide, step / 30));
        if (step === 0) sulcusPath.moveTo(point.x, point.y);
        else sulcusPath.lineTo(point.x, point.y);
      }
    });
    context.save();
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = "rgb(0 0 0 / 0.93)";
    context.lineWidth = 3.2;
    context.stroke(sulcusPath);
    context.strokeStyle = "rgb(173 105 0 / 0.34)";
    context.lineWidth = 0.48;
    context.stroke(sulcusPath);
    context.restore();

    const linkBuckets = Array.from({ length: 4 }, () => new Path2D());
    geometry.links.forEach((link) => {
      const depth = (projectedNodes[link.a * 3 + 2] + projectedNodes[link.b * 3 + 2]) * 0.5;
      const front = smoothstep(-0.45, 0.78, depth);
      const bucket = Math.min(3, Math.floor(front * 4));
      const path = linkBuckets[bucket];
      path.moveTo(projectedNodes[link.a * 3], projectedNodes[link.a * 3 + 1]);
      path.lineTo(projectedNodes[link.b * 3], projectedNodes[link.b * 3 + 1]);
    });
    const linkColors = [
      "rgb(116 68 0 / 0.045)",
  "rgb(166 99 0 / 0.1)",
      "rgb(220 151 0 / 0.23)",
      "rgb(255 197 18 / 0.44)",
    ] as const;
    linkBuckets.forEach((path, index) => {
      context.strokeStyle = linkColors[index];
      context.lineWidth = 0.44 + index * 0.1;
      context.stroke(path);
    });

    geometry.nodes.forEach((node, index) => {
      const depth = projectedNodes[index * 3 + 2];
      if (depth < -0.35 && !node.hub) return;
      const flicker = reducedMotion.matches ? 1 : 0.82 + Math.sin(time * 0.001 + node.phase) * 0.18;
      const size = node.size * (node.hub ? 1 : 0.72 + smoothstep(-0.2, 0.8, depth) * 0.35);
      context.fillStyle = node.hub
        ? `rgb(255 203 24 / ${0.82 * flicker})`
        : `rgb(232 164 0 / ${0.26 * flicker + smoothstep(-0.2, 0.8, depth) * 0.26})`;
      context.fillRect(projectedNodes[index * 3] - size * 0.5, projectedNodes[index * 3 + 1] - size * 0.5, size, size);
    });

    geometry.routes.forEach((route, routeIndex) => {
      const path = new Path2D();
      const routeProjection = route.points.map(projectPoint);
      routeProjection.forEach((point, index) => {
        if (index === 0) path.moveTo(point.x, point.y);
        else path.lineTo(point.x, point.y);
      });
      context.strokeStyle = "rgb(255 184 0 / 0.42)";
      context.lineWidth = 0.72;
      context.stroke(path);

      const head = (cycleElapsed - routeIndex * 135) / 3050;
      if (head < 0 || head > 1) return;
      const exactIndex = head * (routeProjection.length - 1);
      const start = Math.max(0, Math.floor(exactIndex) - 2);
      const end = Math.min(routeProjection.length - 1, Math.floor(exactIndex) + 2);
      const activePath = new Path2D();
      for (let index = start; index <= end; index += 1) {
        const point = routeProjection[index];
        if (index === start) activePath.moveTo(point.x, point.y);
        else activePath.lineTo(point.x, point.y);
      }
      context.strokeStyle = "rgb(255 218 72 / 0.92)";
      context.lineWidth = 1.05;
      context.stroke(activePath);
      const headPoint = routeProjection[Math.round(exactIndex)];
      context.fillStyle = "rgb(255 228 102 / 0.95)";
      context.fillRect(headPoint.x - 1.35, headPoint.y - 1.35, 2.7, 2.7);
    });

    context.strokeStyle = "rgb(255 197 18 / 0.72)";
    context.lineWidth = 0.82;
    context.stroke(autoWavePath);
    pulsePaths.forEach((path, index) => {
      const fade = clamp(1 - (time - activePulses[index].startedAt) / 1650, 0, 1);
      context.strokeStyle = `rgb(255 210 26 / ${0.86 * fade})`;
      context.lineWidth = 0.95;
      context.stroke(path);
    });

    geometry.fragments.forEach((fragment) => {
      const progress = reducedMotion.matches ? 0.34 : (fragment.phase + time * 0.000035) % 1;
      const position = add(fragment.position, multiply(fragment.drift, 0.08 + progress * 0.62));
      position.x += progress * 0.28;
      const point = projectPoint(position);
      const fade = Math.sin(progress * Math.PI) * smoothstep(-0.4, 0.9, point.z);
      context.fillStyle = `rgb(236 166 0 / ${0.18 + fade * 0.42})`;
      const width = fragment.dash ? fragment.size * 2.4 : fragment.size;
      context.fillRect(point.x - width * 0.5, point.y - fragment.size * 0.5, width, fragment.size);
    });

    context.fillStyle = "rgb(255 224 88 / 0.95)";
    context.fillRect(coreX - 2, coreY - 2, 4, 4);
    context.strokeStyle = "rgb(255 197 18 / 0.58)";
    context.lineWidth = 0.75;
    context.strokeRect(coreX - 5.5, coreY - 5.5, 11, 11);

    if (width >= 560) {
      const labelX = coreX + 52;
      const labelY = coreY - 36;
      context.beginPath();
      context.moveTo(coreX + 6, coreY - 6);
      context.lineTo(labelX - 8, labelY + 3);
      context.lineTo(labelX + 4, labelY + 3);
      context.strokeStyle = "rgb(255 197 18 / 0.36)";
      context.lineWidth = 0.65;
      context.stroke();
      context.fillStyle = "rgb(255 203 24 / 0.64)";
      context.font = "700 8px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
      context.fillText(HUBS[0].code, labelX + 8, labelY + 6);
    }

    drawCornerBrackets(minimumX, minimumY, maximumX, maximumY);
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
    updateStatus("MODEL FIELD / TRACKING", "tracking");
    scheduleFrame();
  });

  field.addEventListener("pointerleave", () => {
    pointer.targetX = width * 0.5;
    pointer.targetY = height * 0.46;
    pointer.active = false;
    updateStatus("MODEL FIELD / LIVE", "idle");
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
    addPulse(lastHubProjection[0] || width * 0.5, lastHubProjection[1] || height * 0.46);
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
