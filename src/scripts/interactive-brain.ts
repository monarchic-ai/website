type Vector3 = {
  x: number;
  y: number;
  z: number;
};

type ProjectedPoint = Vector3;

type FiberRegion = "cerebrum" | "cerebellum" | "stem";

type CerebrumFamily =
  | "association"
  | "deep"
  | "temporal-longitudinal"
  | "crown-longitudinal"
  | "crown-descending"
  | "frontal-diagonal"
  | "frontal-loop"
  | "temporal-loop"
  | "posterior-fan"
  | "local-cortical";

type FiberFamily = CerebrumFamily | "cerebellar" | "stem";

type OpacityBand = 0 | 1 | 2 | 3;

type WidthBand = 0 | 1;

type Fiber = {
  points: Float32Array;
  projected: Float32Array;
  pointFade: Float32Array;
  region: FiberRegion;
  family: FiberFamily;
  active: boolean;
  particle: boolean;
  hot: boolean;
  activityKey: number;
  opacityBand: OpacityBand;
  widthBand: WidthBand;
  phase: number;
  speed: number;
  qualityRank: number;
  bundleId: number;
  strandIndex: number;
  strandCount: number;
  escapeStart: number;
  visible: boolean;
};

type Pulse = {
  fiberIndices: number[];
  startedAt: number;
};

type Lobe = {
  center: Vector3;
  radius: Vector3;
};

type FieldSample = {
  value: number;
  inward: Vector3;
};

type FiberFamilyConfig = {
  family: CerebrumFamily;
  bundleCount: number;
  bundleSpread: number;
  seed: number;
  minimum: Vector3;
  maximum: Vector3;
  fieldMinimum: number;
  fieldMaximum: number;
  lengthMinimum: number;
  lengthMaximum: number;
  lengthExponent: number;
};

type BundleFactory = (
  trunk: Float32Array,
  region: FiberRegion,
  family: FiberFamily,
  spread: number,
  field?: (point: Vector3) => FieldSample,
  escapeTail?: { random: () => number; phase: number },
) => Fiber[];

const FIELD_SELECTOR = "[data-brain-field]";
const TAU = Math.PI * 2;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const DEPTH_LEVELS = 7;
const OPACITY_LEVELS = 4;
const WIDTH_LEVELS = 2;
const MOBILE_DENSITY_CUTOFF = 0.18;
const MOBILE_CEREBELLUM_DENSITY_CUTOFF = 0.28;
const PARTICLE_FIBER_COUNT = 48;
const ACTIVE_BUNDLE_STRANDS = 5;
const DIM_BUNDLE_STRANDS = 2;
const GEOMETRY_BATCH_SIZE = 48;

type CooperativeScheduler = {
  yield?: () => Promise<void>;
};

const yieldToBrowser = () => {
  const scheduler = (
    globalThis as typeof globalThis & {
      scheduler?: CooperativeScheduler;
    }
  ).scheduler;
  if (scheduler?.yield) return scheduler.yield();
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, 0);
  });
};

const FAMILY_SEEDS = {
  association: 0x4153534f,
  deep: 0x44454550,
  temporalLongitudinal: 0x544c4f4e,
  crownLongitudinal: 0x43524c4e,
  crownDescending: 0x43524453,
  frontalDiagonal: 0x46524447,
  frontalLoop: 0x46524c50,
  temporalLoop: 0x544d4c50,
  posteriorFan: 0x5053464e,
  localCortical: 0x4c434c43,
  cerebellar: 0x4342454c,
  stem: 0x5354454d,
  style: 0x5354594c,
  particles: 0x5349474e,
} as const;

const CEREBRUM_LOBES: Lobe[] = [
  {
    center: { x: -1.16, y: 0.25, z: 0 },
    radius: { x: 1.02, y: 1.01, z: 0.86 },
  },
  {
    center: { x: -0.08, y: 0.5, z: 0 },
    radius: { x: 1.5, y: 1, z: 1.01 },
  },
  {
    center: { x: 1.16, y: 0.25, z: 0 },
    radius: { x: 1.16, y: 1.02, z: 0.92 },
  },
  {
    center: { x: -0.27, y: -0.43, z: 0.02 },
    radius: { x: 1.12, y: 0.52, z: 0.84 },
  },
];

const CEREBELLUM: Lobe = {
  center: { x: 1.14, y: -0.72, z: -0.02 },
  radius: { x: 0.62, y: 0.34, z: 0.46 },
};

const BRAINSTEM = {
  top: { x: 0.58, y: -0.44 },
  bottom: { x: 0.47, y: -0.96 },
  topRadius: { x: 0.24, z: 0.19 },
  endScale: 0.28,
} as const;

const CEREBRUM_FAMILIES: FiberFamilyConfig[] = [
  {
    family: "association",
    bundleCount: 280,
    bundleSpread: 0.01,
    seed: FAMILY_SEEDS.association,
    minimum: { x: -1.85, y: -0.28, z: -0.82 },
    maximum: { x: 1.78, y: 0.88, z: 0.82 },
    fieldMinimum: 0.08,
    fieldMaximum: 0.5,
    lengthMinimum: 0.65,
    lengthMaximum: 1.75,
    lengthExponent: 1.8,
  },
  {
    family: "deep",
    bundleCount: 150,
    bundleSpread: 0.0095,
    seed: FAMILY_SEEDS.deep,
    minimum: { x: -1.12, y: -0.44, z: -0.58 },
    maximum: { x: 1.14, y: 0.7, z: 0.58 },
    fieldMinimum: 0.46,
    fieldMaximum: 0.9,
    lengthMinimum: 0.55,
    lengthMaximum: 1.42,
    lengthExponent: 1.65,
  },
  {
    family: "temporal-longitudinal",
    bundleCount: 120,
    bundleSpread: 0.0075,
    seed: FAMILY_SEEDS.temporalLongitudinal,
    minimum: { x: -1.18, y: -0.94, z: -0.72 },
    maximum: { x: 0.92, y: -0.18, z: 0.72 },
    fieldMinimum: 0.02,
    fieldMaximum: 0.36,
    lengthMinimum: 0.5,
    lengthMaximum: 1.2,
    lengthExponent: 1.8,
  },
  {
    family: "crown-longitudinal",
    bundleCount: 40,
    bundleSpread: 0.0075,
    seed: FAMILY_SEEDS.crownLongitudinal,
    minimum: { x: -1.75, y: 0.72, z: -0.84 },
    maximum: { x: 1.72, y: 1.42, z: 0.84 },
    fieldMinimum: 0.01,
    fieldMaximum: 0.16,
    lengthMinimum: 0.55,
    lengthMaximum: 1.2,
    lengthExponent: 1.8,
  },
  {
    family: "crown-descending",
    bundleCount: 290,
    bundleSpread: 0.009,
    seed: FAMILY_SEEDS.crownDescending,
    minimum: { x: -1.65, y: 0.4, z: -0.8 },
    maximum: { x: 1.45, y: 1.17, z: 0.8 },
    fieldMinimum: 0.12,
    fieldMaximum: 0.58,
    lengthMinimum: 0.45,
    lengthMaximum: 1.1,
    lengthExponent: 1.75,
  },
  {
    family: "frontal-diagonal",
    bundleCount: 145,
    bundleSpread: 0.0095,
    seed: FAMILY_SEEDS.frontalDiagonal,
    minimum: { x: -2.02, y: -0.46, z: -0.78 },
    maximum: { x: -0.48, y: 1.18, z: 0.78 },
    fieldMinimum: 0.02,
    fieldMaximum: 0.38,
    lengthMinimum: 0.55,
    lengthMaximum: 1.55,
    lengthExponent: 1.8,
  },
  {
    family: "frontal-loop",
    bundleCount: 125,
    bundleSpread: 0.009,
    seed: FAMILY_SEEDS.frontalLoop,
    minimum: { x: -2.02, y: -0.46, z: -0.78 },
    maximum: { x: -0.48, y: 1.18, z: 0.78 },
    fieldMinimum: 0.025,
    fieldMaximum: 0.4,
    lengthMinimum: 0.55,
    lengthMaximum: 1.22,
    lengthExponent: 1.8,
  },
  {
    family: "temporal-loop",
    bundleCount: 125,
    bundleSpread: 0.008,
    seed: FAMILY_SEEDS.temporalLoop,
    minimum: { x: -1.18, y: -0.94, z: -0.72 },
    maximum: { x: 0.92, y: -0.18, z: 0.72 },
    fieldMinimum: 0.02,
    fieldMaximum: 0.38,
    lengthMinimum: 0.45,
    lengthMaximum: 1.08,
    lengthExponent: 1.85,
  },
  {
    family: "posterior-fan",
    bundleCount: 65,
    bundleSpread: 0.009,
    seed: FAMILY_SEEDS.posteriorFan,
    minimum: { x: 0.48, y: -0.58, z: -0.76 },
    maximum: { x: 2.12, y: 1.18, z: 0.76 },
    fieldMinimum: 0.02,
    fieldMaximum: 0.38,
    lengthMinimum: 0.55,
    lengthMaximum: 1.35,
    lengthExponent: 1.75,
  },
  {
    family: "local-cortical",
    bundleCount: 280,
    bundleSpread: 0.0075,
    seed: FAMILY_SEEDS.localCortical,
    minimum: { x: -1.95, y: -0.72, z: -0.86 },
    maximum: { x: 2.12, y: 1.4, z: 0.86 },
    fieldMinimum: 0.005,
    fieldMaximum: 0.16,
    lengthMinimum: 0.35,
    lengthMaximum: 0.8,
    lengthExponent: 1.55,
  },
];

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));

const smoothstep = (minimum: number, maximum: number, value: number) => {
  const normalized = clamp((value - minimum) / (maximum - minimum), 0, 1);
  return normalized * normalized * (3 - 2 * normalized);
};

const lerp = (minimum: number, maximum: number, position: number) =>
  minimum + (maximum - minimum) * position;

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

const vectorLength = (vector: Vector3) =>
  Math.hypot(vector.x, vector.y, vector.z);

const normalize = (vector: Vector3): Vector3 => {
  const length = Math.max(vectorLength(vector), 0.000001);
  return multiply(vector, 1 / length);
};

const distance = (left: Vector3, right: Vector3) =>
  vectorLength(subtract(left, right));

const rgba = (red: number, green: number, blue: number, alpha: number) =>
  "rgba(" + red + ", " + green + ", " + blue + ", " + alpha.toFixed(4) + ")";

const fieldForLobes = (point: Vector3, lobes: Lobe[]): FieldSample => {
  const scores: number[] = [];
  const gradients: Vector3[] = [];
  let maximum = Number.NEGATIVE_INFINITY;

  lobes.forEach((lobe) => {
    const normalizedX = (point.x - lobe.center.x) / lobe.radius.x;
    const normalizedY = (point.y - lobe.center.y) / lobe.radius.y;
    const normalizedZ = (point.z - lobe.center.z) / lobe.radius.z;
    const score =
      1 -
      normalizedX * normalizedX -
      normalizedY * normalizedY -
      normalizedZ * normalizedZ;
    scores.push(score);
    gradients.push({
      x: (-2 * (point.x - lobe.center.x)) / (lobe.radius.x * lobe.radius.x),
      y: (-2 * (point.y - lobe.center.y)) / (lobe.radius.y * lobe.radius.y),
      z: (-2 * (point.z - lobe.center.z)) / (lobe.radius.z * lobe.radius.z),
    });
    maximum = Math.max(maximum, score);
  });

  const sharpness = 8;
  let totalWeight = 0;
  let gradient = { x: 0, y: 0, z: 0 };
  scores.forEach((score, index) => {
    const weight = Math.exp(sharpness * (score - maximum));
    totalWeight += weight;
    gradient = add(gradient, multiply(gradients[index], weight));
  });

  return {
    value: maximum + Math.log(totalWeight) / sharpness - 0.055,
    inward: normalize(multiply(gradient, 1 / Math.max(totalWeight, 0.000001))),
  };
};

const intersectFields = (samples: FieldSample[]): FieldSample => {
  const minimum = Math.min(...samples.map((sample) => sample.value));
  const sharpness = 14;
  let totalWeight = 0;
  let value = 0;
  let inward = { x: 0, y: 0, z: 0 };
  samples.forEach((sample) => {
    const weight = Math.exp(-sharpness * (sample.value - minimum));
    totalWeight += weight;
    value += sample.value * weight;
    inward = add(inward, multiply(sample.inward, weight));
  });
  return {
    value: value / Math.max(totalWeight, 0.000001),
    inward: normalize(inward),
  };
};

const cerebrumField = (point: Vector3) => {
  const lobeUnion = fieldForLobes(point, CEREBRUM_LOBES);
  const floorY = -0.96 + smoothstep(0.35, 1.45, point.x) * 0.045;
  const floor: FieldSample = {
    value: (point.y - floorY) * 2.8,
    inward: { x: 0, y: 1, z: 0 },
  };
  const frontalBoundary = -2.08 + 0.1 * (point.y - 0.25);
  const frontalCap: FieldSample = {
    value: (point.x - frontalBoundary) * 2.4,
    inward: normalize({ x: 1, y: -0.1, z: 0 }),
  };
  const notchCenter = { x: 0.58, y: -0.82, z: 0 };
  const notchRadius = { x: 0.48, y: 0.15, z: 0.82 };
  const notchOffset = subtract(point, notchCenter);
  const notch: FieldSample = {
    value:
      ((notchOffset.x / notchRadius.x) ** 2 +
        (notchOffset.y / notchRadius.y) ** 2 +
        (notchOffset.z / notchRadius.z) ** 2 -
        1) *
      0.27,
    inward: normalize({
      x: notchOffset.x / (notchRadius.x * notchRadius.x),
      y: notchOffset.y / (notchRadius.y * notchRadius.y),
      z: notchOffset.z / (notchRadius.z * notchRadius.z),
    }),
  };
  return intersectFields([lobeUnion, floor, frontalCap, notch]);
};

const cerebellumField = (point: Vector3) =>
  fieldForLobes(point, [CEREBELLUM]);

const brainstemField = (point: Vector3) => {
  const verticalSpan = BRAINSTEM.top.y - BRAINSTEM.bottom.y;
  const position = clamp(
    (BRAINSTEM.top.y - point.y) / verticalSpan,
    0,
    1,
  );
  const centerX =
    lerp(BRAINSTEM.top.x, BRAINSTEM.bottom.x, position) -
    0.022 * Math.sin(Math.PI * position);
  const taper = lerp(
    1,
    BRAINSTEM.endScale,
    smoothstep(0.18, 1, position),
  );
  const radiusX = BRAINSTEM.topRadius.x * taper;
  const radiusZ = BRAINSTEM.topRadius.z * taper;
  const offsetX = point.x - centerX;
  const radial: FieldSample = {
    value:
      1 -
      (offsetX / radiusX) ** 2 -
      (point.z / radiusZ) ** 2,
    inward: normalize({
      x: (-2 * offsetX) / (radiusX * radiusX),
      y: 0,
      z: (-2 * point.z) / (radiusZ * radiusZ),
    }),
  };
  const top: FieldSample = {
    value: (BRAINSTEM.top.y - point.y) * 4,
    inward: { x: 0, y: -1, z: 0 },
  };
  const bottom: FieldSample = {
    value: (point.y - BRAINSTEM.bottom.y) * 4,
    inward: { x: 0, y: 1, z: 0 },
  };
  return intersectFields([radial, top, bottom]);
};

const projectTangent = (axis: Vector3, normal: Vector3) => {
  const projected = subtract(axis, multiply(normal, dot(axis, normal)));
  if (vectorLength(projected) > 0.0001) return normalize(projected);
  return normalize(cross(normal, { x: 0, y: 0, z: 1 }));
};

const familyAxis = (
  family: CerebrumFamily,
  point: Vector3,
  phase: number,
): Vector3 => {
  if (family === "association") {
    return normalize({
      x: 1,
      y: 0.12 * Math.sin(point.x * 1.35 + phase),
      z: 0.2 * Math.cos(point.x * 0.9 + phase),
    });
  }
  if (family === "deep") {
    return normalize({
      x: 0.94,
      y: 0.2 * Math.sin(point.x * 1.1 + phase),
      z: 0.27 * Math.cos(point.x * 0.8 + phase),
    });
  }
  if (family === "temporal-longitudinal") {
    return normalize({
      x: 0.92,
      y: 0.28 + 0.12 * Math.cos(point.x + phase),
      z: 0.22 * Math.sin(point.x + phase),
    });
  }
  if (family === "crown-longitudinal") {
    return normalize({
      x: 1,
      y: 0.16 * Math.sin(point.x * 1.45 + phase),
      z: 0.2 * Math.cos(point.x + phase),
    });
  }
  if (family === "crown-descending") {
    return normalize({
      x:
        0.68 * Math.sin(point.y * 2.15 + phase) +
        0.16 * Math.sin(point.x * 1.4 - phase),
      y: -0.78,
      z: 0.18 * Math.cos(point.y + phase),
    });
  }
  if (family === "frontal-diagonal") {
    return normalize({
      x: 0.58 + 0.08 * Math.sin(point.y + phase),
      y: 0.82,
      z: 0.2 * Math.cos(point.x + phase),
    });
  }
  if (family === "frontal-loop") {
    const relative = subtract(point, { x: -1.05, y: 0.18, z: 0 });
    return normalize({
      x: 0.5 - relative.y * 0.75 + 0.08 * Math.sin(phase),
      y: 0.34 + relative.x * 0.56,
      z: 0.2 * Math.sin(point.y * 1.2 + phase),
    });
  }
  if (family === "temporal-loop") {
    const relative = subtract(point, { x: -0.15, y: -0.52, z: 0 });
    return normalize({
      x: 0.38 - relative.y * 0.82,
      y: 0.2 + relative.x * 0.48,
      z: 0.18 * Math.cos(point.x + phase),
    });
  }
  if (family === "posterior-fan") {
    const relative = subtract(point, { x: 0.52, y: -0.18, z: 0 });
    return normalize({
      x: 0.58 + Math.max(0, relative.x) * 0.16,
      y: 0.72 * relative.y + 0.5 * Math.sin(phase),
      z: 0.22 * Math.sin(point.y + phase),
    });
  }
  const sample = cerebrumField(point);
  const firstTangent = projectTangent({ x: 1, y: 0, z: 0 }, sample.inward);
  const secondTangent = normalize(cross(sample.inward, firstTangent));
  return normalize(
    add(
      multiply(firstTangent, Math.cos(phase)),
      multiply(secondTangent, Math.sin(phase)),
    ),
  );
};

const cerebrumVelocity = (
  point: Vector3,
  family: CerebrumFamily,
  phase: number,
  targetField: number,
  directionSign: number,
) => {
  const sample = cerebrumField(point);
  const rawAxis = familyAxis(family, point, phase);
  const axisTangent = projectTangent(
    rawAxis,
    sample.inward,
  );
  const volumeWeight =
    family === "crown-descending"
      ? 0.45
      : family === "frontal-diagonal"
        ? 0.48
        : family === "posterior-fan"
          ? 0.4
          : family === "deep"
            ? 0.22
            : 0.08;
  const directedAxis = normalize(
    add(
      multiply(axisTangent, 1 - volumeWeight),
      multiply(rawAxis, volumeWeight),
    ),
  );
  const side = normalize(cross(sample.inward, directedAxis));
  const variation =
    0.09 +
    0.07 * Math.sin(point.x * 1.7 + point.y * 1.1 + phase);
  const confinementStrength =
    family === "crown-descending"
      ? 0.65
      : family === "frontal-diagonal" || family === "posterior-fan"
        ? 0.82
        : 1.55;
  const confinement = clamp(
    (targetField - sample.value) * confinementStrength,
    -0.32,
    0.32,
  );
  return normalize(
    add(
      multiply(
        add(directedAxis, multiply(side, variation)),
        directionSign,
      ),
      multiply(sample.inward, confinement),
    ),
  );
};

const randomPoint = (
  random: () => number,
  minimum: Vector3,
  maximum: Vector3,
): Vector3 => ({
  x: lerp(minimum.x, maximum.x, random()),
  y: lerp(minimum.y, maximum.y, random()),
  z: lerp(minimum.z, maximum.z, random()),
});

const sampleSeed = (
  random: () => number,
  minimum: Vector3,
  maximum: Vector3,
  fieldMinimum: number,
  fieldMaximum: number,
  field: (point: Vector3) => FieldSample,
) => {
  const target = (fieldMinimum + fieldMaximum) * 0.5;
  let bestPoint = randomPoint(random, minimum, maximum);
  let bestDistance = Number.POSITIVE_INFINITY;

  for (let attempt = 0; attempt < 384; attempt += 1) {
    const candidate = randomPoint(random, minimum, maximum);
    const value = field(candidate).value;
    if (value >= fieldMinimum && value <= fieldMaximum) return candidate;
    const candidateDistance = Math.abs(value - target);
    if (candidateDistance < bestDistance) {
      bestDistance = candidateDistance;
      bestPoint = candidate;
    }
  }

  return bestPoint;
};

const traceDirection = (
  seed: Vector3,
  step: number,
  lengthBudget: number,
  directionSign: number,
  velocity: (point: Vector3, directionSign: number) => Vector3,
  field: (point: Vector3) => FieldSample,
  bounds: { minimum: Vector3; maximum: Vector3 },
) => {
  const points: Vector3[] = [];
  let current = seed;
  let previousVelocity: Vector3 | undefined;
  const maximumSteps = Math.ceil(lengthBudget / step);

  for (let index = 0; index < maximumSteps; index += 1) {
    const initialVelocity = velocity(current, directionSign);
    const midpoint = add(current, multiply(initialVelocity, step * 0.5));
    const midpointVelocity = velocity(midpoint, directionSign);
    const next = add(current, multiply(midpointVelocity, step));
    if (
      next.x < bounds.minimum.x ||
      next.x > bounds.maximum.x ||
      next.y < bounds.minimum.y ||
      next.y > bounds.maximum.y ||
      next.z < bounds.minimum.z ||
      next.z > bounds.maximum.z ||
      field(next).value < 0.005
    ) {
      break;
    }
    if (
      previousVelocity &&
      dot(previousVelocity, midpointVelocity) < -0.258
    ) {
      break;
    }
    points.push(next);
    current = next;
    previousVelocity = midpointVelocity;
  }

  return points;
};

const traceCerebrumFiber = (
  seed: Vector3,
  family: CerebrumFamily,
  phase: number,
  lengthBudget: number,
) => {
  const targetField = cerebrumField(seed).value;
  const velocity = (point: Vector3, directionSign: number) =>
    cerebrumVelocity(
      point,
      family,
      phase,
      targetField,
      directionSign,
    );
  const bounds = {
    minimum: { x: -2.5, y: -1.45, z: -1.12 },
    maximum: { x: 2.45, y: 1.72, z: 1.12 },
  };
  const backwards = traceDirection(
    seed,
    0.085,
    lengthBudget * 0.5,
    -1,
    velocity,
    cerebrumField,
    bounds,
  ).reverse();
  const forwards = traceDirection(
    seed,
    0.085,
    lengthBudget * 0.5,
    1,
    velocity,
    cerebrumField,
    bounds,
  );
  return [...backwards, seed, ...forwards];
};

const trajectoryArcLength = (points: Vector3[]) => {
  let length = 0;
  for (let index = 1; index < points.length; index += 1) {
    length += distance(points[index - 1], points[index]);
  }
  return length;
};

const minimumArcLength = (family: CerebrumFamily) => {
  if (family === "local-cortical") return 0.28;
  if (
    family === "frontal-loop" ||
    family === "temporal-loop" ||
    family === "crown-descending"
  ) {
    return 0.38;
  }
  if (
    family === "temporal-longitudinal" ||
    family === "crown-longitudinal"
  ) {
    return 0.42;
  }
  return 0.5;
};

const interpolateVector = (
  left: Vector3,
  right: Vector3,
  position: number,
): Vector3 => ({
  x: lerp(left.x, right.x, position),
  y: lerp(left.y, right.y, position),
  z: lerp(left.z, right.z, position),
});

const catmullRomPoint = (
  pointZero: Vector3,
  pointOne: Vector3,
  pointTwo: Vector3,
  pointThree: Vector3,
  position: number,
) => {
  const knotZero = 0;
  const knotOne =
    knotZero + Math.sqrt(Math.max(distance(pointZero, pointOne), 0.0001));
  const knotTwo =
    knotOne + Math.sqrt(Math.max(distance(pointOne, pointTwo), 0.0001));
  const knotThree =
    knotTwo + Math.sqrt(Math.max(distance(pointTwo, pointThree), 0.0001));
  const knot = lerp(knotOne, knotTwo, position);
  const first = interpolateVector(
    pointZero,
    pointOne,
    (knot - knotZero) / (knotOne - knotZero),
  );
  const second = interpolateVector(
    pointOne,
    pointTwo,
    (knot - knotOne) / (knotTwo - knotOne),
  );
  const third = interpolateVector(
    pointTwo,
    pointThree,
    (knot - knotTwo) / (knotThree - knotTwo),
  );
  const fourth = interpolateVector(
    first,
    second,
    (knot - knotZero) / (knotTwo - knotZero),
  );
  const fifth = interpolateVector(
    second,
    third,
    (knot - knotOne) / (knotThree - knotOne),
  );
  return interpolateVector(
    fourth,
    fifth,
    (knot - knotOne) / (knotTwo - knotOne),
  );
};

const smoothTrajectory = (points: Vector3[]) => {
  if (points.length < 4) return points;
  const smoothed: Vector3[] = [points[0]];
  for (let index = 0; index < points.length - 1; index += 1) {
    const pointZero = points[Math.max(0, index - 1)];
    const pointOne = points[index];
    const pointTwo = points[index + 1];
    const pointThree = points[Math.min(points.length - 1, index + 2)];
    for (let step = 1; step <= 3; step += 1) {
      smoothed.push(
        catmullRomPoint(
          pointZero,
          pointOne,
          pointTwo,
          pointThree,
          step / 3,
        ),
      );
    }
  }
  return smoothed;
};

const resampleTrajectory = (
  points: Vector3[],
  spacing: number,
  minimumCount = 18,
  maximumCount = 48,
) => {
  if (points.length < 2) {
    const point = points[0] ?? { x: 0, y: 0, z: 0 };
    return new Float32Array([
      point.x,
      point.y,
      point.z,
      point.x + 0.001,
      point.y,
      point.z,
    ]);
  }

  const cumulative = new Float32Array(points.length);
  let totalLength = 0;
  for (let index = 1; index < points.length; index += 1) {
    totalLength += distance(points[index - 1], points[index]);
    cumulative[index] = totalLength;
  }
  const sampleCount = clamp(
    Math.ceil(totalLength / spacing) + 1,
    minimumCount,
    maximumCount,
  );
  const result = new Float32Array(sampleCount * 3);
  let segment = 1;
  for (let index = 0; index < sampleCount; index += 1) {
    const targetDistance =
      (index / Math.max(1, sampleCount - 1)) * totalLength;
    while (
      segment < points.length - 1 &&
      cumulative[segment] < targetDistance
    ) {
      segment += 1;
    }
    const startDistance = cumulative[segment - 1];
    const endDistance = cumulative[segment];
    const position =
      endDistance === startDistance
        ? 0
        : (targetDistance - startDistance) /
          (endDistance - startDistance);
    const point = interpolateVector(
      points[segment - 1],
      points[segment],
      position,
    );
    result[index * 3] = point.x;
    result[index * 3 + 1] = point.y;
    result[index * 3 + 2] = point.z;
  }
  return result;
};

const reversePoints = (points: Float32Array) => {
  const count = points.length / 3;
  const reversed = new Float32Array(points.length);
  for (let index = 0; index < count; index += 1) {
    const source = (count - index - 1) * 3;
    const target = index * 3;
    reversed[target] = points[source];
    reversed[target + 1] = points[source + 1];
    reversed[target + 2] = points[source + 2];
  }
  return reversed;
};

const trimPosteriorEnd = (
  source: Float32Array,
  cutoff: number,
) => {
  let points = source;
  if (points[0] > points[points.length - 3]) {
    points = reversePoints(points);
  }
  const pointCount = points.length / 3;
  let finalIndex = pointCount - 1;
  while (finalIndex > 3 && points[finalIndex * 3] > cutoff) {
    finalIndex -= 1;
  }
  if (finalIndex === pointCount - 1) return points;
  const retainedCount = Math.min(pointCount, finalIndex + 2);
  const trimmed = new Float32Array(retainedCount * 3);
  trimmed.set(points.subarray(0, retainedCount * 3));
  return trimmed;
};

const constrainToLobe = (point: Vector3, lobe: Lobe, inset = 0.94) => {
  const normalized = {
    x: (point.x - lobe.center.x) / lobe.radius.x,
    y: (point.y - lobe.center.y) / lobe.radius.y,
    z: (point.z - lobe.center.z) / lobe.radius.z,
  };
  const radius = vectorLength(normalized);
  if (radius <= inset) return point;
  const scale = inset / Math.max(radius, 0.0001);
  return {
    x: lobe.center.x + normalized.x * scale * lobe.radius.x,
    y: lobe.center.y + normalized.y * scale * lobe.radius.y,
    z: lobe.center.z + normalized.z * scale * lobe.radius.z,
  };
};

const appendEscapeTail = (
  source: Float32Array,
  random: () => number,
  phase: number,
) => {
  let points = source;
  const firstX = points[0];
  const lastX = points[points.length - 3];
  if (firstX > lastX) points = reversePoints(points);
  const last = points.length - 3;
  const exit = {
    x: points[last],
    y: points[last + 1],
    z: points[last + 2],
  };
  const curve = [
    exit,
    add(exit, {
      x: 0.14,
      y: 0.07 * Math.sin(phase),
      z: 0.04 * Math.cos(phase),
    }),
    add(exit, {
      x: 0.3 + random() * 0.08,
      y: 0.1 * Math.sin(phase + 0.7),
      z: 0.07 * Math.cos(phase + 0.4),
    }),
    add(exit, {
      x: 0.42 + random() * 0.18,
      y: 0.14 * Math.sin(phase + 1.1),
      z: 0.1 * Math.cos(phase + 0.9),
    }),
  ];
  const tailSamples = 7;
  const combined = new Float32Array(points.length + tailSamples * 3);
  combined.set(points);
  for (let index = 1; index <= tailSamples; index += 1) {
    const position = index / tailSamples;
    const inverse = 1 - position;
    const point = {
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
    const offset = points.length + (index - 1) * 3;
    combined[offset] = point.x;
    combined[offset + 1] = point.y;
    combined[offset + 2] = point.z;
  }
  return {
    points: combined,
    escapeStart: points.length / 3 - 1,
  };
};

const createFiber = (
  points: Float32Array,
  region: FiberRegion,
  family: FiberFamily,
  bundleId: number,
  strandIndex: number,
  strandCount: number,
  escapeStart = -1,
): Fiber => {
  const pointCount = points.length / 3;
  const pointFade = new Float32Array(pointCount);
  for (let pointIndex = 0; pointIndex < pointCount; pointIndex += 1) {
    const position = pointIndex / Math.max(1, pointCount - 1);
    if (region === "stem") {
      pointFade[pointIndex] = 1 - smoothstep(0.84, 1, position);
      continue;
    }
    let fade =
      smoothstep(0, 0.08, position) *
      (1 - smoothstep(0.92, 1, position));
    if (escapeStart >= 0 && pointIndex >= escapeStart) {
      const escapePosition =
        (pointIndex - escapeStart) /
        Math.max(1, pointCount - 1 - escapeStart);
      fade *= 1 - smoothstep(0, 1, escapePosition);
    }
    pointFade[pointIndex] = fade;
  }
  return {
    points,
    projected: new Float32Array(points.length),
    pointFade,
    region,
    family,
    active: false,
    particle: false,
    hot: false,
    activityKey: 0,
    opacityBand: 0,
    widthBand: 0,
    phase: 0,
    speed: 0,
    qualityRank: 0,
    bundleId,
    strandIndex,
    strandCount,
    escapeStart,
    visible: true,
  };
};

const offsetParallelStrand = (
  trunk: Float32Array,
  strandIndex: number,
  strandCount: number,
  spread: number,
  field?: (point: Vector3) => FieldSample,
) => {
  const pointCount = trunk.length / 3;
  const points = new Float32Array(trunk.length);
  const centered = strandIndex - (strandCount - 1) * 0.5;
  const secondarySign = strandIndex % 2 === 0 ? -1 : 1;
  const secondaryMagnitude =
    Math.ceil(Math.abs(centered)) * spread * 0.32 * secondarySign;
  let transportedNormal: Vector3 | undefined;

  for (let pointIndex = 0; pointIndex < pointCount; pointIndex += 1) {
    const previousIndex = Math.max(0, pointIndex - 1) * 3;
    const nextIndex = Math.min(pointCount - 1, pointIndex + 1) * 3;
    const offset = pointIndex * 3;
    let source = {
      x: trunk[offset],
      y: trunk[offset + 1],
      z: trunk[offset + 2],
    };
    if (field) {
      for (let attempt = 0; attempt < 6; attempt += 1) {
        const sample = field(source);
        if (sample.value >= 0.005) break;
        const correction = clamp(
          0.012 + (0.005 - sample.value) * 0.24,
          0.012,
          0.055,
        );
        source = add(source, multiply(sample.inward, correction));
      }
    }
    const tangent = normalize({
      x: trunk[nextIndex] - trunk[previousIndex],
      y: trunk[nextIndex + 1] - trunk[previousIndex + 1],
      z: trunk[nextIndex + 2] - trunk[previousIndex + 2],
    });
    let normal: Vector3;
    if (transportedNormal) {
      const projectedNormal = subtract(
        transportedNormal,
        multiply(tangent, dot(transportedNormal, tangent)),
      );
      normal =
        vectorLength(projectedNormal) > 0.0001
          ? normalize(projectedNormal)
          : normalize(
              cross(
                tangent,
                Math.abs(tangent.z) < 0.86
                  ? { x: 0, y: 0, z: 1 }
                  : { x: 0, y: 1, z: 0 },
              ),
            );
    } else {
      const reference =
        Math.abs(tangent.z) < 0.86
          ? { x: 0, y: 0, z: 1 }
          : { x: 0, y: 1, z: 0 };
      normal = normalize(cross(tangent, reference));
    }
    transportedNormal = normal;
    const binormal = normalize(cross(tangent, normal));
    const position = pointIndex / Math.max(1, pointCount - 1);
    const drift =
      1 + 0.12 * Math.sin(position * TAU + strandIndex * 1.7);
    const primaryOffset = centered * spread * drift;
    let candidate = add(
      source,
      add(
        multiply(normal, primaryOffset),
        multiply(binormal, secondaryMagnitude),
      ),
    );
    if (field && field(candidate).value < 0.005) {
      const offsetVector = subtract(candidate, source);
      let insideScale = 0;
      let outsideScale = 1;
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const testScale = (insideScale + outsideScale) * 0.5;
        const testPoint = add(source, multiply(offsetVector, testScale));
        if (field(testPoint).value >= 0.005) {
          insideScale = testScale;
        } else {
          outsideScale = testScale;
        }
      }
      candidate = add(source, multiply(offsetVector, insideScale));
    }
    points[offset] = candidate.x;
    points[offset + 1] = candidate.y;
    points[offset + 2] = candidate.z;
  }
  return points;
};

const createBundleFactory = (): BundleFactory => {
  let nextBundleId = 0;
  return (
    trunk,
    region,
    family,
    spread,
    field,
    escapeTail,
  ) => {
    const bundleId = nextBundleId;
    nextBundleId += 1;
    const tierSlot = bundleId % 10;
    const strandCount =
      tierSlot === 0
        ? ACTIVE_BUNDLE_STRANDS
        : tierSlot <= 3
          ? 1
          : DIM_BUNDLE_STRANDS;
    const bundleSpread =
      strandCount === DIM_BUNDLE_STRANDS ? spread * 2.2 : spread;
    const centerStrand = Math.floor((strandCount - 1) * 0.5);
    const fibers: Fiber[] = [];
    for (let strandIndex = 0; strandIndex < strandCount; strandIndex += 1) {
      let points = offsetParallelStrand(
        trunk,
        strandIndex,
        strandCount,
        bundleSpread,
        field,
      );
      let escapeStart = -1;
      if (escapeTail && strandIndex === centerStrand) {
        const extended = appendEscapeTail(
          points,
          escapeTail.random,
          escapeTail.phase,
        );
        points = extended.points;
        escapeStart = extended.escapeStart;
      }
      fibers.push(
        createFiber(
          points,
          region,
          family,
          bundleId,
          strandIndex,
          strandCount,
          escapeStart,
        ),
      );
    }
    return fibers;
  };
};

const createCerebrumFibers = async (createBundle: BundleFactory) => {
  const fibers: Fiber[] = [];
  let generatedBundles = 0;
  for (const config of CEREBRUM_FAMILIES) {
    const random = seededRandom(config.seed);
    for (let index = 0; index < config.bundleCount; index += 1) {
      let phase = 0;
      let trajectory: Vector3[] = [];
      for (let attempt = 0; attempt < 4; attempt += 1) {
        const seed = sampleSeed(
          random,
          config.minimum,
          config.maximum,
          config.fieldMinimum,
          config.fieldMaximum,
          cerebrumField,
        );
        phase = random() * TAU;
        const lengthBudget = lerp(
          config.lengthMinimum,
          config.lengthMaximum,
          random() ** config.lengthExponent,
        );
        trajectory = traceCerebrumFiber(
          seed,
          config.family,
          phase,
          lengthBudget,
        );
        if (trajectoryArcLength(trajectory) >= minimumArcLength(config.family)) {
          break;
        }
      }
      let points: Float32Array = resampleTrajectory(
        smoothTrajectory(trajectory),
        0.065,
        12,
        48,
      );
      const escaping = config.family === "posterior-fan" && index < 4;
      if (config.family === "posterior-fan") {
        points = trimPosteriorEnd(
          points,
          escaping
            ? lerp(1.62, 1.82, random())
            : lerp(1.94, 2.2, random()),
        );
      }
      fibers.push(
        ...createBundle(
          points,
          "cerebrum",
          config.family,
          config.bundleSpread,
          cerebrumField,
          escaping ? { random, phase } : undefined,
        ),
      );
      generatedBundles += 1;
      if (generatedBundles % GEOMETRY_BATCH_SIZE === 0) {
        await yieldToBrowser();
      }
    }
  }
  return fibers;
};

const createCerebellumFibers = async (createBundle: BundleFactory) => {
  const fibers: Fiber[] = [];
  const random = seededRandom(FAMILY_SEEDS.cerebellar);
  for (let index = 0; index < 224; index += 1) {
    const layer = Math.floor(index / 14);
    const lane = index % 14;
    const normalizedY =
      lerp(-0.8, 0.78, layer / 15) + (random() - 0.5) * 0.028;
    const depth =
      lerp(-0.58, 0.58, ((lane * 9) % 14) / 13) *
      CEREBELLUM.radius.z;
    const sectionScale = Math.sqrt(
      Math.max(
        0.12,
        1 -
          normalizedY * normalizedY -
          (depth / CEREBELLUM.radius.z) ** 2 * 0.58,
      ),
    );
    const halfWidth = CEREBELLUM.radius.x * sectionScale * 0.9;
    const halfSpan = halfWidth * lerp(0.66, 0.9, random());
    const centerOffset =
      (random() - 0.5) * Math.max(0, halfWidth - halfSpan) * 0.7;
    const startX = CEREBELLUM.center.x + centerOffset - halfSpan;
    const endX = CEREBELLUM.center.x + centerOffset + halfSpan;
    const baseY =
      CEREBELLUM.center.y + normalizedY * CEREBELLUM.radius.y;
    const upperLayer = layer >= 8;
    const arch =
      lerp(0.018, 0.05, random()) *
      (random() < 0.5 ? -1 : 1) *
      (upperLayer ? 0.38 : 1);
    const turns = lerp(1, 1.75, random());
    const phase = random() * TAU;
    const controls: Vector3[] = [];
    for (let step = 0; step <= 8; step += 1) {
      const position = step / 8;
      controls.push(
        constrainToLobe(
          {
            x: lerp(startX, endX, position),
            y:
              baseY +
              Math.sin(position * Math.PI) * arch +
              Math.sin(position * Math.PI * turns + phase) *
                (upperLayer ? 0.007 : 0.016),
            z:
              CEREBELLUM.center.z +
              depth +
              Math.sin(position * Math.PI + phase) * 0.024,
          },
          CEREBELLUM,
          0.91,
        ),
      );
    }
    const trunk = resampleTrajectory(
      smoothTrajectory(controls),
      0.04,
      14,
      32,
    );
    fibers.push(
      ...createBundle(
        trunk,
        "cerebellum",
        "cerebellar",
        0.006,
        cerebellumField,
      ),
    );
    if ((index + 1) % GEOMETRY_BATCH_SIZE === 0) {
      await yieldToBrowser();
    }
  }

  for (let index = 0; index < 18; index += 1) {
    const lane = (index + 0.5) / 18;
    const depth = lerp(-0.24, 0.24, ((index * 7) % 18) / 17);
    const phase = random() * TAU;
    const controls: Vector3[] = [];
    for (let step = 0; step <= 6; step += 1) {
      const progress = step / 6;
      controls.push({
        x:
          lerp(lerp(0.72, 0.9, lane), lerp(0.58, 0.66, lane), progress) +
          Math.sin(progress * Math.PI + phase) * 0.025,
        y:
          lerp(lerp(-0.7, -0.52, lane), lerp(-0.46, -0.38, lane), progress) +
          Math.sin(progress * Math.PI) * 0.018,
        z: lerp(depth, depth * 0.38, progress),
      });
    }
    const trunk = resampleTrajectory(
      smoothTrajectory(controls),
      0.04,
      10,
      20,
    );
    fibers.push(
      ...createBundle(
        trunk,
        "cerebellum",
        "cerebellar",
        0.006,
      ),
    );
  }
  await yieldToBrowser();
  return fibers;
};

const createStemFibers = async (createBundle: BundleFactory) => {
  const fibers: Fiber[] = [];
  const random = seededRandom(FAMILY_SEEDS.stem);
  for (let index = 0; index < 80; index += 1) {
    const initialAngle = index * GOLDEN_ANGLE + random() * 0.12;
    const radial = Math.sqrt((index + 0.5) / 80);
    const offsetX = Math.cos(initialAngle) * BRAINSTEM.topRadius.x * radial;
    const offsetZ = Math.sin(initialAngle) * BRAINSTEM.topRadius.z * radial;
    const phase = random() * TAU;
    const controls: Vector3[] = [];
    for (let step = 0; step <= 8; step += 1) {
      const position = step / 8;
      const center = {
        x:
          lerp(BRAINSTEM.top.x, BRAINSTEM.bottom.x, position) -
          0.022 * Math.sin(Math.PI * position),
        y: lerp(BRAINSTEM.top.y, BRAINSTEM.bottom.y, position),
        z: 0,
      };
      const taper = lerp(
        1,
        BRAINSTEM.endScale,
        smoothstep(0.18, 1, position),
      );
      controls.push({
        x:
          center.x +
          offsetX * taper +
          Math.sin(position * Math.PI + phase) * 0.008,
        y: center.y,
        z: center.z + offsetZ * taper,
      });
    }
    const trunk = resampleTrajectory(
      smoothTrajectory(controls),
      0.04,
      12,
      24,
    );
    fibers.push(
      ...createBundle(
        trunk,
        "stem",
        "stem",
        0.006,
        brainstemField,
      ),
    );
    if ((index + 1) % GEOMETRY_BATCH_SIZE === 0) {
      await yieldToBrowser();
    }
  }
  return fibers;
};

const styleFibers = (fibers: Fiber[]) => {
  const random = seededRandom(FAMILY_SEEDS.style);
  const bundleMap = new Map<number, Fiber[]>();
  fibers.forEach((fiber) => {
    const bundle = bundleMap.get(fiber.bundleId) ?? [];
    bundle.push(fiber);
    bundleMap.set(fiber.bundleId, bundle);
  });
  const bundles = Array.from(bundleMap.values());
  bundles.forEach((bundle) => {
    const activityKey = random();
    const phase = random();
    const speed = 1 / lerp(2500, 6000, random());
    const qualityRank = random();
    const centerStrand = (bundle[0].strandCount - 1) * 0.5;
    bundle.forEach((fiber) => {
      const centerDistance = Math.abs(fiber.strandIndex - centerStrand);
      fiber.active = false;
      fiber.particle = false;
      fiber.hot = false;
      fiber.opacityBand =
        fiber.strandCount === ACTIVE_BUNDLE_STRANDS
          ? centerDistance <= 1
            ? 3
            : 2
          : fiber.strandCount === 1
            ? 2
            : activityKey < 0.48
              ? 0
              : 1;
      fiber.widthBand = centerDistance === 0 ? 1 : 0;
      fiber.active =
        fiber.strandCount === ACTIVE_BUNDLE_STRANDS &&
        centerDistance === 0;
      fiber.activityKey = activityKey;
      fiber.phase = (phase + fiber.strandIndex * 0.027) % 1;
      fiber.speed = speed * (1 + fiber.strandIndex * 0.012);
      fiber.qualityRank = qualityRank;
    });
  });

  const stratifyFamily = (family: FiberFamily) => {
    const ranked = bundles
      .filter((bundle) => bundle[0].family === family)
      .sort(
        (left, right) =>
          left[0].qualityRank - right[0].qualityRank,
      );
    ranked.forEach((bundle, rank) => {
      const qualityRank = (rank + 0.5) / Math.max(1, ranked.length);
      bundle.forEach((fiber) => {
        fiber.qualityRank = qualityRank;
      });
    });
  };
  Array.from(new Set(bundles.map((bundle) => bundle[0].family))).forEach(
    stratifyFamily,
  );

  bundles.forEach((bundle) => {
    if (bundle[0].region === "stem") {
      bundle.forEach((fiber) => {
        fiber.qualityRank = 0;
      });
    }
    if (
      (bundle[0].region === "stem" ||
        bundle[0].region === "cerebellum") &&
      bundle[0].opacityBand === 0
    ) {
      bundle.forEach((fiber) => {
        fiber.opacityBand = 1;
      });
    }
    if (bundle.some((fiber) => fiber.escapeStart >= 0)) {
      bundle.forEach((fiber) => {
        fiber.active = false;
        fiber.opacityBand = 0;
        fiber.widthBand = 0;
      });
    }
  });

  const particleRandom = seededRandom(FAMILY_SEEDS.particles);
  const particleFibers: Fiber[] = [];
  const selectParticles = (region: FiberRegion, count: number) => {
    const selected = bundles
      .filter(
        (bundle) =>
          bundle[0].region === region &&
          bundle.some((fiber) => fiber.active),
      )
      .map((bundle) => ({ bundle, key: particleRandom() }))
      .sort((left, right) => left.key - right.key)
      .slice(0, count)
      .map(({ bundle }) => bundle.find((fiber) => fiber.active) ?? bundle[0]);
    particleFibers.push(...selected);
  };
  selectParticles("cerebrum", 40);
  selectParticles("cerebellum", 6);
  selectParticles("stem", 2);
  particleFibers
    .slice(0, PARTICLE_FIBER_COUNT)
    .forEach((fiber, rank) => {
      fiber.particle = true;
      fiber.hot = rank < 7;
    });
};

const createFiberField = async () => {
  const createBundle = createBundleFactory();
  const fibers = [
    ...(await createCerebrumFibers(createBundle)),
    ...(await createCerebellumFibers(createBundle)),
    ...(await createStemFibers(createBundle)),
  ];
  styleFibers(fibers);
  return fibers;
};

const buildRotationMatrix = (
  yaw: number,
  pitch: number,
  roll: number,
) => {
  const cosineYaw = Math.cos(yaw);
  const sineYaw = Math.sin(yaw);
  const cosinePitch = Math.cos(pitch);
  const sinePitch = Math.sin(pitch);
  const cosineRoll = Math.cos(roll);
  const sineRoll = Math.sin(roll);
  return [
    cosineRoll * cosineYaw -
      sineRoll * sinePitch * sineYaw,
    -sineRoll * cosinePitch,
    cosineRoll * sineYaw +
      sineRoll * sinePitch * cosineYaw,
    sineRoll * cosineYaw +
      cosineRoll * sinePitch * sineYaw,
    cosineRoll * cosinePitch,
    sineRoll * sineYaw -
      cosineRoll * sinePitch * cosineYaw,
    -cosinePitch * sineYaw,
    sinePitch,
    cosinePitch * cosineYaw,
  ];
};

const endpointFade = (
  fiber: Fiber,
  pointIndex: number,
  _pointCount: number,
) => {
  return fiber.pointFade[pointIndex] ?? 0;
};

const pathPointAt = (
  fiber: Fiber,
  position: number,
): ProjectedPoint => {
  const pointCount = fiber.projected.length / 3;
  const exactIndex =
    clamp(position, 0, 1) * Math.max(1, pointCount - 1);
  const start = Math.min(pointCount - 1, Math.floor(exactIndex));
  const end = Math.min(pointCount - 1, start + 1);
  const progress = exactIndex - start;
  return {
    x: lerp(
      fiber.projected[start * 3],
      fiber.projected[end * 3],
      progress,
    ),
    y: lerp(
      fiber.projected[start * 3 + 1],
      fiber.projected[end * 3 + 1],
      progress,
    ),
    z: lerp(
      fiber.projected[start * 3 + 2],
      fiber.projected[end * 3 + 2],
      progress,
    ),
  };
};

const createGlowSprite = () => {
  const sprite = document.createElement("canvas");
  sprite.width = 20;
  sprite.height = 20;
  const spriteContext = sprite.getContext("2d");
  if (!spriteContext) return sprite;
  const gradient = spriteContext.createRadialGradient(
    10,
    10,
    0,
    10,
    10,
    10,
  );
  gradient.addColorStop(0, "rgba(255, 232, 128, 0.9)");
  gradient.addColorStop(0.18, "rgba(255, 191, 18, 0.5)");
  gradient.addColorStop(0.5, "rgba(255, 165, 0, 0.13)");
  gradient.addColorStop(1, "rgba(255, 146, 0, 0)");
  spriteContext.fillStyle = gradient;
  spriteContext.fillRect(0, 0, 20, 20);
  return sprite;
};

const drawParticle = (
  context: CanvasRenderingContext2D,
  sprite: HTMLCanvasElement,
  point: ProjectedPoint,
  hot: boolean,
  alpha: number,
  size: number,
) => {
  context.save();
  context.globalCompositeOperation = "lighter";
  context.globalAlpha = alpha;
  context.drawImage(
    sprite,
    point.x - 8,
    point.y - 8,
    16,
    16,
  );
  context.fillStyle = hot
    ? "rgb(255, 248, 210)"
    : "rgb(255, 194, 32)";
  context.beginPath();
  context.arc(point.x, point.y, size, 0, TAU);
  context.fill();
  context.restore();
};

const drawCornerBrackets = (
  context: CanvasRenderingContext2D,
  minimumX: number,
  minimumY: number,
  maximumX: number,
  maximumY: number,
) => {
  if (!Number.isFinite(minimumX) || !Number.isFinite(minimumY)) return;
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
  context.strokeStyle = "rgba(255, 197, 18, 0.26)";
  context.lineWidth = 0.7;
  context.stroke();
};

const mountBrain = async (field: HTMLElement) => {
  if (field.dataset.brainMounted === "true") return;

  const canvas =
    field.querySelector<HTMLCanvasElement>("[data-brain-canvas]");
  const status =
    field.querySelector<HTMLElement>("[data-brain-status]");
  const context = canvas?.getContext("2d", { alpha: false });
  if (!canvas || !context || !status) return;

  field.dataset.brainMounted = "true";
  field.dataset.brainState = "assembling";
  status.textContent = "MODEL FIELD / ASSEMBLING";

  const fibers = await createFiberField();
  field.dataset.brainState = "idle";
  status.textContent = "MODEL FIELD / LIVE";
  const particleCerebrum = fibers.filter(
    (fiber) => fiber.particle && fiber.region === "cerebrum",
  );
  const particleCerebellum = fibers.filter(
    (fiber) => fiber.particle && fiber.region === "cerebellum",
  );
  const particleStem = fibers.filter(
    (fiber) => fiber.particle && fiber.region === "stem",
  );
  const particleFibers = [
    ...particleCerebrum.slice(0, 6),
    ...particleCerebellum.slice(0, 1),
    ...particleStem.slice(0, 1),
    ...particleCerebrum.slice(6, 10),
    ...particleCerebellum.slice(1, 3),
    ...particleCerebrum.slice(10),
    ...particleCerebellum.slice(3),
    ...particleStem.slice(1),
  ];
  const glowSprite = createGlowSprite();
  const pulses: Pulse[] = [];
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  );
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
  let yaw = -0.34;
  let pitch = -0.055;
  let statusTimer = 0;

  const updateStatus = (
    label: string,
    state: "idle" | "tracking" | "pulse",
  ) => {
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
    pointer.y = pointer.y || height * 0.47;
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
    const candidates: { index: number; distance: number }[] = [];
    fibers.forEach((fiber, fiberIndex) => {
      if (!fiber.visible) return;
      let nearestDistance = Number.POSITIVE_INFINITY;
      const pointCount = fiber.projected.length / 3;
      for (let pointIndex = 0; pointIndex < pointCount; pointIndex += 2) {
        const deltaX = fiber.projected[pointIndex * 3] - x;
        const deltaY = fiber.projected[pointIndex * 3 + 1] - y;
        nearestDistance = Math.min(
          nearestDistance,
          deltaX * deltaX + deltaY * deltaY,
        );
      }
      candidates.push({ index: fiberIndex, distance: nearestDistance });
    });
    const signalCount = width < 520 ? 7 : 9;
    const fiberIndices = candidates
      .sort((left, right) => left.distance - right.distance)
      .slice(0, signalCount)
      .map(({ index }) => index);
    pulses.push({
      fiberIndices,
      startedAt: performance.now(),
    });
    if (pulses.length > 2) pulses.shift();
    updateStatus("MODEL FIELD / SIGNAL", "pulse");
    window.clearTimeout(statusTimer);
    statusTimer = window.setTimeout(() => {
      updateStatus(
        pointer.active
          ? "MODEL FIELD / TRACKING"
          : "MODEL FIELD / LIVE",
        pointer.active ? "tracking" : "idle",
      );
    }, 720);
    scheduleFrame();
  };

  const draw = (time: number) => {
    context.setTransform(
      pixelRatio,
      0,
      0,
      pixelRatio,
      0,
      0,
    );
    context.fillStyle = "#000";
    context.fillRect(0, 0, width, height);

    pointer.x += (pointer.targetX - pointer.x) * 0.075;
    pointer.y += (pointer.targetY - pointer.y) * 0.075;
    const normalizedPointerX = pointer.x / width - 0.5;
    const normalizedPointerY = pointer.y / height - 0.5;
    const idleYaw = reducedMotion.matches
      ? -0.34
      : -0.34 + Math.sin((time / 26000) * TAU) * 0.105;
    const idlePitch = reducedMotion.matches
      ? -0.055
      : -0.055 + Math.sin((time / 23000) * TAU) * 0.024;
    const targetYaw = pointer.active
      ? -0.34 + normalizedPointerX * 0.35
      : idleYaw;
    const targetPitch = pointer.active
      ? -0.055 - normalizedPointerY * 0.21
      : idlePitch;
    if (reducedMotion.matches) {
      yaw = targetYaw;
      pitch = targetPitch;
    } else {
      yaw += (targetYaw - yaw) * 0.055;
      pitch += (targetPitch - pitch) * 0.055;
    }

    const matrix = buildRotationMatrix(yaw, pitch, -0.018);
    const mobile = width < 520;
    const modelScale = mobile
      ? Math.min(width / 4.77, height / 3.82)
      : Math.min(width / 4.69, height / 3.75);
    const centerX = width * (mobile ? 0.44 : 0.42);
    const centerY = height * 0.47;
    const cameraDistance = 7.8;
    const passivePaths = Array.from(
      {
        length:
          OPACITY_LEVELS * DEPTH_LEVELS * WIDTH_LEVELS,
      },
      () => new Path2D(),
    );
    const activePaths = Array.from(
      { length: DEPTH_LEVELS * WIDTH_LEVELS * 2 },
      () => new Path2D(),
    );
    let minimumX = Number.POSITIVE_INFINITY;
    let minimumY = Number.POSITIVE_INFINITY;
    let maximumX = Number.NEGATIVE_INFINITY;
    let maximumY = Number.NEGATIVE_INFINITY;

    fibers.forEach((fiber) => {
      fiber.visible =
        !mobile ||
        fiber.active ||
        fiber.strandCount === ACTIVE_BUNDLE_STRANDS ||
        fiber.qualityRank <=
          (fiber.region === "cerebellum"
            ? MOBILE_CEREBELLUM_DENSITY_CUTOFF
            : MOBILE_DENSITY_CUTOFF);
      if (!fiber.visible) return;

      const pointCount = fiber.points.length / 3;
      for (let pointIndex = 0; pointIndex < pointCount; pointIndex += 1) {
        const offset = pointIndex * 3;
        const pointX = fiber.points[offset];
        const pointY = fiber.points[offset + 1];
        const pointZ = fiber.points[offset + 2];
        const rotatedX =
          matrix[0] * pointX + matrix[1] * pointY + matrix[2] * pointZ;
        const rotatedY =
          matrix[3] * pointX + matrix[4] * pointY + matrix[5] * pointZ;
        const rotatedZ =
          matrix[6] * pointX + matrix[7] * pointY + matrix[8] * pointZ;
        const perspective =
          cameraDistance / (cameraDistance - rotatedZ);
        const projectedX =
          centerX + rotatedX * modelScale * perspective;
        const projectedY =
          centerY - rotatedY * modelScale * perspective;
        fiber.projected[offset] = projectedX;
        fiber.projected[offset + 1] = projectedY;
        fiber.projected[offset + 2] = rotatedZ;
        if (
          fiber.region !== "cerebrum" ||
          fiber.escapeStart < 0 ||
          pointIndex <= fiber.escapeStart
        ) {
          minimumX = Math.min(minimumX, projectedX);
          minimumY = Math.min(minimumY, projectedY);
          maximumX = Math.max(maximumX, projectedX);
          maximumY = Math.max(maximumY, projectedY);
        }
      }

      for (let pointIndex = 1; pointIndex < pointCount; pointIndex += 1) {
        const previousOffset = (pointIndex - 1) * 3;
        const offset = pointIndex * 3;
        const depth =
          (fiber.projected[previousOffset + 2] +
            fiber.projected[offset + 2]) *
          0.5;
        const front = smoothstep(-0.92, 0.92, depth);
        const depthBand = Math.min(
          DEPTH_LEVELS - 1,
          Math.floor(front * DEPTH_LEVELS),
        );
        const fade = Math.min(
          endpointFade(fiber, pointIndex - 1, pointCount),
          endpointFade(fiber, pointIndex, pointCount),
        );
        if (fade < 0.025) continue;
        const fadeLoss =
          fade < 0.18 ? 3 : fade < 0.42 ? 2 : fade < 0.72 ? 1 : 0;
        const opacityBand = Math.max(
          0,
          fiber.opacityBand - fadeLoss,
        );
        const passiveIndex =
          ((opacityBand * DEPTH_LEVELS + depthBand) *
            WIDTH_LEVELS +
            fiber.widthBand);
        const passivePath = passivePaths[passiveIndex];
        passivePath.moveTo(
          fiber.projected[previousOffset],
          fiber.projected[previousOffset + 1],
        );
        passivePath.lineTo(
          fiber.projected[offset],
          fiber.projected[offset + 1],
        );

        if (fiber.active && fade >= 0.1) {
          const fadeBand = fade >= 0.56 ? 1 : 0;
          const activeIndex =
            ((fadeBand * DEPTH_LEVELS + depthBand) *
              WIDTH_LEVELS +
              fiber.widthBand);
          const activePath = activePaths[activeIndex];
          activePath.moveTo(
            fiber.projected[previousOffset],
            fiber.projected[previousOffset + 1],
          );
          activePath.lineTo(
            fiber.projected[offset],
            fiber.projected[offset + 1],
          );
        }
      }
    });

    context.lineCap = "round";
    context.lineJoin = "round";
    const passiveAlpha = [0.011, 0.0205, 0.032, 0.045];
    for (
      let opacityBand = 0;
      opacityBand < OPACITY_LEVELS;
      opacityBand += 1
    ) {
      for (
        let depthBand = 0;
        depthBand < DEPTH_LEVELS;
        depthBand += 1
      ) {
        const depthStrength =
          0.34 +
          (depthBand / (DEPTH_LEVELS - 1)) * 0.66;
        for (
          let widthBand = 0;
          widthBand < WIDTH_LEVELS;
          widthBand += 1
        ) {
          const index =
            ((opacityBand * DEPTH_LEVELS + depthBand) *
              WIDTH_LEVELS +
              widthBand);
          context.strokeStyle = rgba(
            244,
            161 + depthBand * 3,
            0,
            passiveAlpha[opacityBand] * depthStrength,
          );
          context.lineWidth =
            (widthBand === 0 ? 0.27 : 0.39) +
            depthBand * 0.009;
          context.stroke(passivePaths[index]);
        }
      }
    }

    context.save();
    context.globalCompositeOperation = "lighter";
    for (let fadeBand = 0; fadeBand < 2; fadeBand += 1) {
      for (
        let depthBand = 0;
        depthBand < DEPTH_LEVELS;
        depthBand += 1
      ) {
        const depthStrength =
          0.32 +
          (depthBand / (DEPTH_LEVELS - 1)) * 0.68;
        for (
          let widthBand = 0;
          widthBand < WIDTH_LEVELS;
          widthBand += 1
        ) {
          const index =
            ((fadeBand * DEPTH_LEVELS + depthBand) *
              WIDTH_LEVELS +
              widthBand);
          context.strokeStyle = rgba(
            255,
            172 + depthBand * 4,
            0,
            (fadeBand === 0 ? 0.004 : 0.009) *
              depthStrength,
          );
          context.lineWidth =
            widthBand === 0 ? 1.7 : 2.2;
          context.stroke(activePaths[index]);
          context.strokeStyle = rgba(
            255,
            183 + depthBand * 4,
            10,
            (fadeBand === 0 ? 0.05 : 0.11) *
              depthStrength,
          );
          context.lineWidth =
            widthBand === 0 ? 0.54 : 0.72;
          context.stroke(activePaths[index]);
        }
      }
    }
    context.restore();

    const activePulses = pulses.filter(
      (pulse) => time - pulse.startedAt < 2200,
    );
    pulses.splice(0, pulses.length, ...activePulses);
    activePulses.forEach((pulse) => {
      const age = time - pulse.startedAt;
      const fade = clamp(1 - age / 2200, 0, 1);
      const pulsePath = new Path2D();
      pulse.fiberIndices.forEach((fiberIndex) => {
        const fiber = fibers[fiberIndex];
        if (!fiber.visible) return;
        const pointCount = fiber.projected.length / 3;
        for (
          let pointIndex = 0;
          pointIndex < pointCount;
          pointIndex += 1
        ) {
          const offset = pointIndex * 3;
          if (pointIndex === 0) {
            pulsePath.moveTo(
              fiber.projected[offset],
              fiber.projected[offset + 1],
            );
          } else {
            pulsePath.lineTo(
              fiber.projected[offset],
              fiber.projected[offset + 1],
            );
          }
        }
      });
      context.save();
      context.globalCompositeOperation = "lighter";
      context.strokeStyle = rgba(255, 174, 0, 0.045 * fade);
      context.lineWidth = 3.2;
      context.stroke(pulsePath);
      context.strokeStyle = rgba(255, 211, 42, 0.52 * fade);
      context.lineWidth = 0.88;
      context.stroke(pulsePath);
      context.restore();

      pulse.fiberIndices.forEach((fiberIndex, rank) => {
        const fiber = fibers[fiberIndex];
        if (!fiber.visible) return;
        const progress = reducedMotion.matches
          ? 0.48 + rank * 0.035
          : clamp(age / 1900 - rank * 0.045, 0, 1);
        if (!reducedMotion.matches && progress <= 0) return;
        const point = pathPointAt(fiber, progress);
        const front = smoothstep(-0.92, 0.92, point.z);
        drawParticle(
          context,
          glowSprite,
          point,
          rank < 2,
          fade * (0.46 + front * 0.54),
          rank < 2 ? 1.35 : 1.05,
        );
      });
    });

    const particleLimit = mobile ? 8 : 14;
    let particleCount = 0;
    let hotCount = 0;
    particleFibers.forEach((fiber) => {
      if (
        particleCount >= particleLimit ||
        !fiber.visible ||
        !fiber.particle
      ) {
        return;
      }
      const progress = reducedMotion.matches
        ? fiber.phase
        : (fiber.phase + time * fiber.speed) % 1;
      const point = pathPointAt(fiber, progress);
      const front = smoothstep(-0.92, 0.92, point.z);
      if (front < 0.08) return;
      const hot = fiber.hot && hotCount < 3;
      if (hot) hotCount += 1;
      drawParticle(
        context,
        glowSprite,
        point,
        hot,
        0.34 + front * 0.5,
        hot ? 1.25 : 0.9,
      );
      particleCount += 1;
    });

    drawCornerBrackets(
      context,
      minimumX,
      minimumY,
      maximumX,
      maximumY,
    );
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
    if (
      animationFrame ||
      !inViewport ||
      document.visibilityState === "hidden"
    ) {
      return;
    }
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
    pointer.targetY = height * 0.47;
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
    addPulse(width * 0.46, height * 0.47);
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
  document
    .querySelectorAll<HTMLElement>(FIELD_SELECTOR)
    .forEach((field) => {
      void mountBrain(field);
    });
};
