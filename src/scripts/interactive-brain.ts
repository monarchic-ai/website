type Vector3 = {
  x: number;
  y: number;
  z: number;
};

type ProjectedPoint = Vector3;

type FiberRegion = "cerebrum" | "cerebellum" | "stem";

type CerebrumFamily =
  | "crown"
  | "frontal"
  | "center"
  | "temporal"
  | "deep"
  | "posterior";

type FiberFamily = CerebrumFamily | "cerebellar" | "stem";

type OpacityBand = 0 | 1 | 2 | 3;

type WidthBand = 0 | 1;

type Fiber = {
  points: Float32Array;
  projected: Float32Array;
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
  count: number;
  seed: number;
  minimum: Vector3;
  maximum: Vector3;
  fieldMinimum: number;
  fieldMaximum: number;
  lengthMinimum: number;
  lengthMaximum: number;
};

const FIELD_SELECTOR = "[data-brain-field]";
const TAU = Math.PI * 2;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const DEPTH_LEVELS = 7;
const OPACITY_LEVELS = 4;
const WIDTH_LEVELS = 2;
const MOBILE_DENSITY_CUTOFF = 0.78;
const PARTICLE_FIBER_COUNT = 24;

const FAMILY_SEEDS = {
  crown: 0x43524f57,
  frontal: 0x46524f4e,
  center: 0x43454e54,
  temporal: 0x54454d50,
  deep: 0x44454550,
  posterior: 0x504f5354,
  cerebellar: 0x4342454c,
  stem: 0x5354454d,
  style: 0x5354594c,
  particles: 0x5349474e,
} as const;

const CEREBRUM_LOBES: Lobe[] = [
  {
    center: { x: -1.12, y: 0.22, z: 0 },
    radius: { x: 1.15, y: 1.1, z: 0.88 },
  },
  {
    center: { x: -0.04, y: 0.47, z: 0 },
    radius: { x: 1.56, y: 1.03, z: 1.02 },
  },
  {
    center: { x: 1.2, y: 0.16, z: 0 },
    radius: { x: 1.02, y: 0.94, z: 0.86 },
  },
  {
    center: { x: -0.02, y: -0.56, z: 0.02 },
    radius: { x: 1.36, y: 0.69, z: 0.92 },
  },
];

const CEREBELLUM: Lobe = {
  center: { x: 1.04, y: -0.72, z: 0 },
  radius: { x: 0.5, y: 0.3, z: 0.44 },
};

const CEREBRUM_FAMILIES: FiberFamilyConfig[] = [
  {
    family: "crown",
    count: 92,
    seed: FAMILY_SEEDS.crown,
    minimum: { x: -1.75, y: 0.45, z: -0.82 },
    maximum: { x: 1.55, y: 1.45, z: 0.82 },
    fieldMinimum: 0.015,
    fieldMaximum: 0.26,
    lengthMinimum: 1.65,
    lengthMaximum: 3.15,
  },
  {
    family: "frontal",
    count: 90,
    seed: FAMILY_SEEDS.frontal,
    minimum: { x: -2.18, y: -0.78, z: -0.8 },
    maximum: { x: -0.7, y: 1.25, z: 0.8 },
    fieldMinimum: 0.02,
    fieldMaximum: 0.32,
    lengthMinimum: 1.25,
    lengthMaximum: 2.35,
  },
  {
    family: "center",
    count: 102,
    seed: FAMILY_SEEDS.center,
    minimum: { x: -1.55, y: -0.45, z: -0.82 },
    maximum: { x: 1.65, y: 0.58, z: 0.82 },
    fieldMinimum: 0.12,
    fieldMaximum: 0.62,
    lengthMinimum: 1.7,
    lengthMaximum: 3.2,
  },
  {
    family: "temporal",
    count: 68,
    seed: FAMILY_SEEDS.temporal,
    minimum: { x: -1.3, y: -1.18, z: -0.75 },
    maximum: { x: 0.95, y: -0.25, z: 0.75 },
    fieldMinimum: 0.02,
    fieldMaximum: 0.34,
    lengthMinimum: 1.25,
    lengthMaximum: 2.35,
  },
  {
    family: "deep",
    count: 42,
    seed: FAMILY_SEEDS.deep,
    minimum: { x: -1, y: -0.58, z: -0.58 },
    maximum: { x: 1.05, y: 0.72, z: 0.58 },
    fieldMinimum: 0.42,
    fieldMaximum: 0.92,
    lengthMinimum: 1.45,
    lengthMaximum: 2.75,
  },
  {
    family: "posterior",
    count: 30,
    seed: FAMILY_SEEDS.posterior,
    minimum: { x: 0.75, y: -0.62, z: -0.72 },
    maximum: { x: 1.92, y: 0.82, z: 0.72 },
    fieldMinimum: 0.015,
    fieldMaximum: 0.3,
    lengthMinimum: 1.05,
    lengthMaximum: 1.85,
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

const cerebrumField = (point: Vector3) =>
  fieldForLobes(point, CEREBRUM_LOBES);

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
  if (family === "frontal") {
    return normalize({
      x: 0.3 + 0.08 * Math.cos(point.y + phase),
      y: 0.95,
      z: 0.2 * Math.sin(1.2 * point.y + phase),
    });
  }
  if (family === "temporal") {
    return normalize({
      x: 0.92,
      y: 0.25 + 0.1 * Math.cos(point.x + phase),
      z: 0.2 * Math.sin(point.x + phase),
    });
  }
  if (family === "deep") {
    return normalize({
      x: 1,
      y: 0.15 * Math.sin(1.1 * point.x + phase),
      z: 0.3 * Math.cos(0.8 * point.x + phase),
    });
  }
  if (family === "posterior") {
    return normalize({
      x: 0.42,
      y: -0.86 + 0.16 * Math.sin(point.x + phase),
      z: 0.2 * Math.cos(point.x + phase),
    });
  }
  if (family === "center") {
    return normalize({
      x: 1,
      y: 0.2 * Math.sin(1.35 * point.x + phase),
      z: 0.26 * Math.cos(0.95 * point.x + phase),
    });
  }
  return normalize({
    x: 1,
    y: 0.24 * Math.sin(1.1 * point.x + phase),
    z: 0.32 * Math.cos(0.85 * point.x + phase),
  });
};

const cerebrumVelocity = (
  point: Vector3,
  family: CerebrumFamily,
  phase: number,
  targetField: number,
  directionSign: number,
) => {
  const sample = cerebrumField(point);
  const axisTangent = projectTangent(
    familyAxis(family, point, phase),
    sample.inward,
  );
  const rawCorticalTurn = projectTangent(
    cross({ x: 0, y: 0, z: 1 }, sample.inward),
    sample.inward,
  );
  const corticalTurn =
    dot(rawCorticalTurn, axisTangent) < 0
      ? multiply(rawCorticalTurn, -1)
      : rawCorticalTurn;
  const turnWeight =
    family === "posterior"
      ? 0.7
      : family === "frontal"
        ? 0.5
        : family === "temporal"
          ? 0.38
          : family === "crown"
            ? 0.3
            : family === "deep"
              ? 0.24
              : 0.16;
  const tangent = normalize(
    add(
      multiply(axisTangent, 1 - turnWeight),
      multiply(corticalTurn, turnWeight),
    ),
  );
  const side = normalize(cross(sample.inward, tangent));
  const variation =
    0.09 +
    0.07 * Math.sin(point.x * 1.7 + point.y * 1.1 + phase);
  const confinement = clamp(
    (targetField - sample.value) * 1.65,
    -0.32,
    0.32,
  );
  return normalize(
    add(
      multiply(add(tangent, multiply(side, variation)), directionSign),
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

  for (let attempt = 0; attempt < 5000; attempt += 1) {
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
      field(next).value < -0.025
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
      x: 0.22,
      y: 0.07 * Math.sin(phase),
      z: 0.04 * Math.cos(phase),
    }),
    add(exit, {
      x: 0.55 + random() * 0.15,
      y: 0.15 * Math.sin(phase + 0.7),
      z: 0.1 * Math.cos(phase + 0.4),
    }),
    add(exit, {
      x: 0.82 + random() * 0.36,
      y: 0.22 * Math.sin(phase + 1.1),
      z: 0.16 * Math.cos(phase + 0.9),
    }),
  ];
  const tailSamples = 10;
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
  escapeStart = -1,
): Fiber => ({
  points,
  projected: new Float32Array(points.length),
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
  escapeStart,
  visible: true,
});

const createCerebrumFibers = () => {
  const fibers: Fiber[] = [];
  CEREBRUM_FAMILIES.forEach((config) => {
    const random = seededRandom(config.seed);
    for (let index = 0; index < config.count; index += 1) {
      const seed = sampleSeed(
        random,
        config.minimum,
        config.maximum,
        config.fieldMinimum,
        config.fieldMaximum,
        cerebrumField,
      );
      const phase = random() * TAU;
      const lengthBudget = lerp(
        config.lengthMinimum,
        config.lengthMaximum,
        random(),
      );
      const trajectory = traceCerebrumFiber(
        seed,
        config.family,
        phase,
        lengthBudget,
      );
      let points: Float32Array = resampleTrajectory(
        smoothTrajectory(trajectory),
        0.07,
      );
      const escaping = config.family === "posterior" && index < 18;
      points = trimPosteriorEnd(
        points,
        escaping
          ? lerp(1.44, 1.78, random())
          : config.family === "posterior"
            ? lerp(1.86, 2.14, random())
            : lerp(1.64, 2.08, random()),
      );
      let escapeStart = -1;
      if (escaping) {
        const extended = appendEscapeTail(points, random, phase);
        points = extended.points;
        escapeStart = extended.escapeStart;
      }
      fibers.push(
        createFiber(points, "cerebrum", config.family, escapeStart),
      );
    }
  });
  return fibers;
};

const createCerebellumFibers = () => {
  const fibers: Fiber[] = [];
  const random = seededRandom(FAMILY_SEEDS.cerebellar);
  for (let index = 0; index < 72; index += 1) {
    const phase = random() * TAU;
    const depth = lerp(-0.72, 0.72, random()) * CEREBELLUM.radius.z;
    const depthScale = Math.sqrt(
      Math.max(0.16, 1 - (depth / CEREBELLUM.radius.z) ** 2),
    );
    const layer = lerp(0.52, 0.94, random());
    const verticalOffset =
      lerp(-0.72, 0.72, random()) *
      CEREBELLUM.radius.y *
      depthScale;
    const arch = lerp(-0.11, 0.11, random());
    const controls: Vector3[] = [];
    for (let step = 0; step <= 6; step += 1) {
      const position = step / 6;
      controls.push(
        constrainToLobe(
          {
            x:
              CEREBELLUM.center.x +
              lerp(-0.86, 0.86, position) *
                CEREBELLUM.radius.x *
                layer,
            y:
              CEREBELLUM.center.y +
              verticalOffset +
              Math.sin(position * Math.PI) * arch +
              Math.sin(position * TAU + phase) * 0.025,
            z:
              CEREBELLUM.center.z +
              depth +
              Math.sin(position * Math.PI + phase) * 0.055,
          },
          CEREBELLUM,
        ),
      );
    }
    const points = resampleTrajectory(
      smoothTrajectory(controls),
      0.045,
      18,
      32,
    );
    fibers.push(createFiber(points, "cerebellum", "cerebellar"));
  }
  return fibers;
};

const createStemFibers = () => {
  const fibers: Fiber[] = [];
  const random = seededRandom(FAMILY_SEEDS.stem);
  for (let index = 0; index < 20; index += 1) {
    const lateral =
      lerp(-0.9, 0.9, (index + 0.5) / 20) +
      (random() - 0.5) * 0.08;
    const initialAngle =
      index * GOLDEN_ANGLE + (random() - 0.5) * 0.18;
    const phase = random() * TAU;
    const controls: Vector3[] = [];
    for (let step = 0; step <= 10; step += 1) {
      const position = step / 10;
      const center = {
        x:
          0.45 -
          0.08 * position -
          0.035 * Math.sin(Math.PI * position),
        y: -0.74 - 0.6 * position,
        z: 0,
      };
      const radiusX = lerp(0.22, 0.055, position);
      const radiusZ = lerp(0.16, 0.04, position);
      const angle =
        initialAngle +
        0.2 * Math.sin(Math.PI * position + phase);
      controls.push({
        x:
          center.x +
          radiusX *
            (0.78 * lateral + 0.18 * Math.cos(angle)),
        y: center.y,
        z:
          center.z +
          radiusZ * 0.72 * Math.sin(angle),
      });
    }
    const points = resampleTrajectory(
      smoothTrajectory(controls),
      0.045,
      18,
      28,
    );
    fibers.push(createFiber(points, "stem", "stem"));
  }
  return fibers;
};

const styleFibers = (fibers: Fiber[]) => {
  const random = seededRandom(FAMILY_SEEDS.style);
  fibers.forEach((fiber, index) => {
    const opacityRoll = random();
    fiber.opacityBand =
      opacityRoll < 0.22
        ? 0
        : opacityRoll < 0.55
          ? 1
          : opacityRoll < 0.84
            ? 2
            : 3;
    if (fiber.region === "stem") {
      fiber.opacityBand = 3;
      fiber.widthBand = index % 5 === 0 ? 1 : 0;
      fiber.qualityRank = 0;
    }
    if (fiber.region === "cerebellum") {
      fiber.opacityBand = Math.max(1, fiber.opacityBand) as OpacityBand;
    }
    if (fiber.escapeStart >= 0) {
      fiber.opacityBand = Math.max(2, fiber.opacityBand) as OpacityBand;
    }
    fiber.widthBand = random() < 0.34 ? 1 : 0;
    fiber.activityKey = random();
    fiber.phase = random();
    fiber.speed = 1 / lerp(2500, 6000, random());
    fiber.qualityRank = random();
  });

  const activateRegion = (region: FiberRegion, count: number) => {
    fibers
      .map((fiber, index) => ({ fiber, index }))
      .filter(({ fiber }) => fiber.region === region)
      .sort((left, right) => left.fiber.activityKey - right.fiber.activityKey)
      .slice(0, count)
      .forEach(({ index }) => {
        fibers[index].active = true;
      });
  };
  activateRegion("cerebrum", 57);
  activateRegion("cerebellum", 9);
  activateRegion("stem", 3);

  const particleRandom = seededRandom(FAMILY_SEEDS.particles);
  const particleIndices: number[] = [];
  const selectParticles = (region: FiberRegion, count: number) => {
    const selected = fibers
      .map((fiber, index) => ({ fiber, index, key: particleRandom() }))
      .filter(({ fiber }) => fiber.region === region && fiber.active)
      .sort((left, right) => left.key - right.key)
      .slice(0, count)
      .map(({ index }) => index);
    particleIndices.push(...selected);
  };
  selectParticles("cerebrum", 20);
  selectParticles("cerebellum", 3);
  selectParticles("stem", 1);
  particleIndices
    .slice(0, PARTICLE_FIBER_COUNT)
    .forEach((index, rank) => {
      fibers[index].particle = true;
      fibers[index].hot = rank < 7;
    });
};

const createFiberField = () => {
  const fibers = [
    ...createCerebrumFibers(),
    ...createCerebellumFibers(),
    ...createStemFibers(),
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

const transformPoint = (
  x: number,
  y: number,
  z: number,
  matrix: number[],
): Vector3 => ({
  x: matrix[0] * x + matrix[1] * y + matrix[2] * z,
  y: matrix[3] * x + matrix[4] * y + matrix[5] * z,
  z: matrix[6] * x + matrix[7] * y + matrix[8] * z,
});

const endpointFade = (
  fiber: Fiber,
  pointIndex: number,
  pointCount: number,
) => {
  const position = pointIndex / Math.max(1, pointCount - 1);
  if (fiber.region === "stem") {
    return 1 - smoothstep(0.86, 1, position);
  }
  let fade =
    smoothstep(0, 0.17, position) *
    (1 - smoothstep(0.83, 1, position));
  if (fiber.escapeStart >= 0 && pointIndex >= fiber.escapeStart) {
    const escapePosition =
      (pointIndex - fiber.escapeStart) /
      Math.max(1, pointCount - 1 - fiber.escapeStart);
    fade *= 1 - smoothstep(0, 1, escapePosition);
  }
  return fade;
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

const mountBrain = (field: HTMLElement) => {
  if (field.dataset.brainMounted === "true") return;

  const canvas =
    field.querySelector<HTMLCanvasElement>("[data-brain-canvas]");
  const status =
    field.querySelector<HTMLElement>("[data-brain-status]");
  const context = canvas?.getContext("2d", { alpha: false });
  if (!canvas || !context || !status) return;

  field.dataset.brainMounted = "true";

  const fibers = createFiberField();
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
    const modelScale = Math.min(width / 5.25, height / 4.2);
    const centerX = width * 0.42;
    const centerY = height * 0.47;
    const cameraDistance = 7.8;
    const mobile = width < 520;
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
        fiber.qualityRank <= MOBILE_DENSITY_CUTOFF;
      if (!fiber.visible) return;

      const pointCount = fiber.points.length / 3;
      for (let pointIndex = 0; pointIndex < pointCount; pointIndex += 1) {
        const offset = pointIndex * 3;
        const rotated = transformPoint(
          fiber.points[offset],
          fiber.points[offset + 1],
          fiber.points[offset + 2],
          matrix,
        );
        const perspective =
          cameraDistance / (cameraDistance - rotated.z);
        const projectedX =
          centerX + rotated.x * modelScale * perspective;
        const projectedY =
          centerY - rotated.y * modelScale * perspective;
        fiber.projected[offset] = projectedX;
        fiber.projected[offset + 1] = projectedY;
        fiber.projected[offset + 2] = rotated.z;
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
    const passiveAlpha = [0.026, 0.058, 0.106, 0.18];
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
            (widthBand === 0 ? 0.34 : 0.5) +
            depthBand * 0.012;
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
            (fadeBand === 0 ? 0.021 : 0.044) *
              depthStrength,
          );
          context.lineWidth =
            widthBand === 0 ? 2.2 : 2.8;
          context.stroke(activePaths[index]);
          context.strokeStyle = rgba(
            255,
            183 + depthBand * 4,
            10,
            (fadeBand === 0 ? 0.2 : 0.42) *
              depthStrength,
          );
          context.lineWidth =
            widthBand === 0 ? 0.62 : 0.82;
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

    const particleLimit = mobile ? 7 : 12;
    let particleCount = 0;
    let hotCount = 0;
    fibers.forEach((fiber) => {
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
    .forEach(mountBrain);
};
