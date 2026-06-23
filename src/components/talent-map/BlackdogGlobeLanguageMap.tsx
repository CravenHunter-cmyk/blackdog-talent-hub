"use client";

import dynamic from "next/dynamic";
import * as THREE from "three";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ComponentType, CSSProperties, MutableRefObject } from "react";
import { getLanguageMarkerColor } from "@/components/talent-map/talentMapColors";
import type { ContinentGroup, LanguageResource, Readiness } from "@/types/talent";
import type { GlobeMethods, GlobeProps } from "react-globe.gl";

const Globe = dynamic<GlobeProps>(() => import("react-globe.gl"), {
  ssr: false,
  loading: () => null,
}) as ComponentType<GlobeProps & { ref?: MutableRefObject<GlobeMethods | undefined> }>;

type GlobeLanguageNode = {
  id: string;
  sourceId: string;
  code: string;
  language: string;
  region: string;
  lat: number;
  lng: number;
  originalLat: number;
  originalLng: number;
  readiness: Readiness;
  total: number;
  active: number;
  online: number;
  avgDailyHours: number;
  historicalTasks: number;
  recentDelivery: number;
  displayTotal: number;
  color: string;
  isSelected: boolean;
};

type BlackdogGlobeLanguageMapProps = {
  resources: LanguageResource[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  focusedGroup?: ContinentGroup;
  variant?: "section" | "embedded";
};

type WebGlStatus = "checking" | "available" | "unavailable";

type GlobeOrbitArc = {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  color: string;
  dashInitialGap: number;
};

type MutableGlobeMaterial = {
  color?: THREE.Color;
  emissive?: THREE.Color;
  emissiveIntensity?: number;
  shininess?: number;
  opacity?: number;
  transparent?: boolean;
  needsUpdate?: boolean;
};

type GlobeRuntime = GlobeMethods & {
  globeMaterial?: () => MutableGlobeMaterial | undefined;
  renderer?: () => {
    domElement?: HTMLCanvasElement;
    setClearColor?: (color: number, alpha: number) => void;
    setClearAlpha?: (alpha: number) => void;
    setPixelRatio?: (value: number) => void;
  };
  scene?: () => THREE.Scene | undefined;
};

const readinessColorMap: Record<Readiness, string> = {
  Core: "#19C8B4",
  Stable: "#1F7BFF",
  Developing: "#F59E1B",
  Backup: "#7188A3",
  Gap: "#7C4DFF",
};

const globeNodeColorMap: Record<string, string> = {
  EN: "#1F7BFF",
  ES: "#19C8B4",
  FR: "#62B5FF",
  DE: "#F59E1B",
  AR: "#7C4DFF",
  ZH: "#7B61FF",
  JA: "#FF4D7A",
  KO: "#19C8B4",
  PT: "#19C8B4",
  TH: "#168DFF",
  ID: "#168DFF",
  RU: "#3A8BFF",
};

const DEFAULT_GLOBE_VIEW = {
  lat: 14,
  lng: 38,
  altitude: 1.8,
};

const globeViewByGroup: Record<ContinentGroup, { lat: number; lng: number; altitude: number }> = {
  Americas: { lat: 4, lng: -72, altitude: 2.08 },
  Europe: { lat: 48, lng: 18, altitude: 2.02 },
  "Middle East & Africa": { lat: 11, lng: 34, altitude: 2.04 },
  "Asia-Pacific": { lat: 12, lng: 108, altitude: 2.08 },
  "Global / RoW": DEFAULT_GLOBE_VIEW,
};

const GLOBE_TEXTURE_URL = "/textures/earth-night-blue.png";
const LANGUAGE_MARKER_STYLE: "circle" | "paw" = "circle";
const AUTO_ROTATE_SPEED = 0.95;
const FOCUS_ROTATE_SPEED = 0.22;
const MIN_STAGE_SIZE = 320;
const GLOBE_VISUAL_CONFIG = {
  oceanColor: "#0B6FAE",
  oceanEmissive: "#0A4F8F",
  oceanEmissiveIntensity: 0.48,
  oceanShininess: 24,
  oceanOpacity: 0.96,
  atmosphereColor: "#55C7FF",
  atmosphereAltitude: 0.2,
};

const GLOBE_SCENE_RADIUS = 100;
const STARLINK_ORBIT_SHELL_NAME = "blackdog-starlink-orbit-shell";
const STARLINK_ORBIT_INCLINATION_BANDS = [32, 42, 53, 70, 97];
const STARLINK_ORBIT_CONFIG = {
  enabled: true,
  orbitCount: 28,
  satelliteTotal: 99,
  radius: 1.17,
  lineOpacity: 0.16,
  brightLineOpacity: 0.24,
  glowLineOpacity: 0.075,
  brightGlowLineOpacity: 0.1,
  satelliteOpacity: 0.52,
  satelliteSize: 0.0051,
  orbitColor: "#6EDCFF",
  orbitColorSoft: "#2CA9FF",
};

const GLOBE_ORBIT_ARCS: GlobeOrbitArc[] = [];

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function sanitizeIdPart(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function isValidLatLng(lat: unknown, lng: unknown) {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
  );
}

function hasValidLatLng(value: { lat?: unknown; lng?: unknown }) {
  return isValidLatLng(value.lat, value.lng);
}

function buildGlobeNodes(resources: LanguageResource[], selectedId?: string): GlobeLanguageNode[] {
  const coordinateGroups = new Map<string, LanguageResource[]>();
  const codeTotals = new Map<string, number>();

  resources.forEach((resource) => {
    const key = `${resource.lat.toFixed(3)}::${resource.lng.toFixed(3)}`;
    const group = coordinateGroups.get(key) ?? [];
    group.push(resource);
    coordinateGroups.set(key, group);
    codeTotals.set(resource.code, (codeTotals.get(resource.code) ?? 0) + resource.totalResources);
  });

  return resources.map((resource) => {
    const key = `${resource.lat.toFixed(3)}::${resource.lng.toFixed(3)}`;
    const group = coordinateGroups.get(key) ?? [resource];
    const groupIndex = group.findIndex((item) => item.id === resource.id);
    const angle = (Math.PI * 2 * groupIndex) / Math.max(group.length, 1);
    const offsetRadius = group.length > 1 ? 0.48 : 0;
    const lat = resource.lat + Math.sin(angle) * offsetRadius;
    const lng = resource.lng + Math.cos(angle) * offsetRadius;
    const baseDelivery = Math.round(resource.activeTalents * 0.72 + resource.onlineNow * 3.6);
    const languageColor =
      globeNodeColorMap[resource.code] ??
      getLanguageMarkerColor(resource.code) ??
      readinessColorMap[resource.readiness] ??
      "#829AA3";

    return {
      id: `${sanitizeIdPart(resource.code)}-${sanitizeIdPart(resource.region)}-${resource.lat.toFixed(2)}-${resource.lng.toFixed(2)}`,
      sourceId: resource.id,
      code: resource.code,
      language: resource.language,
      region: resource.region,
      lat,
      lng,
      originalLat: resource.lat,
      originalLng: resource.lng,
      readiness: resource.readiness,
      total: resource.totalResources,
      active: resource.activeTalents,
      online: resource.onlineNow,
      avgDailyHours: Number((2.4 + resource.activeTalents * 0.09 + resource.onlineNow * 0.65).toFixed(1)),
      historicalTasks: Math.max(resource.totalResources, Math.round(resource.totalResources * 1.35 + resource.activeTalents * 2.1)),
      recentDelivery: Math.max(resource.onlineNow, baseDelivery),
      displayTotal: codeTotals.get(resource.code) ?? resource.totalResources,
      color: languageColor,
      isSelected: selectedId === resource.id,
    };
  });
}

function getAngularDistance(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const latA = toRadians(a.lat);
  const latB = toRadians(b.lat);
  const latDelta = toRadians(b.lat - a.lat);
  const lngDelta = toRadians(b.lng - a.lng);
  const h =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(latA) * Math.cos(latB) * Math.sin(lngDelta / 2) ** 2;

  return (2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)) * 180) / Math.PI;
}

function findNearestNode(
  coords: { lat: number; lng: number },
  nodes: GlobeLanguageNode[],
) {
  return nodes.reduce<{ node: GlobeLanguageNode | null; distance: number }>(
    (nearest, node) => {
      const distance = getAngularDistance(coords, { lat: node.lat, lng: node.lng });
      return distance < nearest.distance ? { node, distance } : nearest;
    },
    { node: null, distance: Number.POSITIVE_INFINITY },
  );
}

function checkWebGlAvailable() {
  try {
    const canvas = document.createElement("canvas");
    const context =
      canvas.getContext("webgl2", { failIfMajorPerformanceCaveat: false }) ??
      canvas.getContext("webgl", { failIfMajorPerformanceCaveat: false });

    if (!context) return false;

    return true;
  } catch {
    return false;
  }
}

function applyGlobeVisualMaterial(runtime: GlobeRuntime | undefined) {
  const material = runtime?.globeMaterial?.();
  if (!material) return;

  material.color = new THREE.Color(GLOBE_VISUAL_CONFIG.oceanColor);
  material.emissive = new THREE.Color(GLOBE_VISUAL_CONFIG.oceanEmissive);
  material.emissiveIntensity = GLOBE_VISUAL_CONFIG.oceanEmissiveIntensity;
  material.shininess = GLOBE_VISUAL_CONFIG.oceanShininess;
  material.opacity = GLOBE_VISUAL_CONFIG.oceanOpacity;
  material.transparent = false;
  material.needsUpdate = true;
}

function disposeObject3D(object: THREE.Object3D) {
  object.traverse((child) => {
    const disposable = child as THREE.Object3D & {
      geometry?: THREE.BufferGeometry;
      material?: THREE.Material | THREE.Material[];
    };

    disposable.geometry?.dispose();

    if (Array.isArray(disposable.material)) {
      disposable.material.forEach((material) => material.dispose());
    } else {
      disposable.material?.dispose();
    }
  });
}

function createOrbitRing(radius: number, color: string, opacity: number) {
  const segments = 192;
  const points: THREE.Vector3[] = [];

  for (let index = 0; index < segments; index += 1) {
    const angle = (index / segments) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0));
  }

  const createLine = (lineRadius: number, lineColor: string, lineOpacity: number) => {
    const linePoints = lineRadius === radius
      ? points
      : points.map((point) => point.clone().setLength(lineRadius));
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(linePoints);
    const material = new THREE.LineBasicMaterial({
      color: new THREE.Color(lineColor),
      transparent: true,
      opacity: lineOpacity,
      blending: THREE.AdditiveBlending,
      depthTest: true,
      depthWrite: false,
    });

    return new THREE.LineLoop(lineGeometry, material);
  };

  const group = new THREE.Group();
  const glowOpacity =
    opacity > STARLINK_ORBIT_CONFIG.lineOpacity
      ? STARLINK_ORBIT_CONFIG.brightGlowLineOpacity
      : STARLINK_ORBIT_CONFIG.glowLineOpacity;

  group.add(createLine(radius * 1.002, STARLINK_ORBIT_CONFIG.orbitColorSoft, glowOpacity));
  group.add(createLine(radius, color, opacity));

  return group;
}

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function createStarlinkOrbitShell() {
  const shell = new THREE.Group();
  shell.name = STARLINK_ORBIT_SHELL_NAME;

  const orbitRadius = GLOBE_SCENE_RADIUS * STARLINK_ORBIT_CONFIG.radius;
  const satelliteSize = GLOBE_SCENE_RADIUS * STARLINK_ORBIT_CONFIG.satelliteSize;
  const satelliteCount = STARLINK_ORBIT_CONFIG.satelliteTotal;
  const baseSatellitesPerOrbit = Math.floor(
    STARLINK_ORBIT_CONFIG.satelliteTotal / STARLINK_ORBIT_CONFIG.orbitCount,
  );
  const extraSatelliteOrbits =
    STARLINK_ORBIT_CONFIG.satelliteTotal %
    STARLINK_ORBIT_CONFIG.orbitCount;
  const satelliteGeometry = new THREE.SphereGeometry(satelliteSize, 8, 8);
  const satelliteMaterial = new THREE.MeshBasicMaterial({
    color: "#AEEBFF",
    transparent: true,
    opacity: STARLINK_ORBIT_CONFIG.satelliteOpacity,
    blending: THREE.AdditiveBlending,
    depthTest: true,
    depthWrite: false,
  });
  const satellites = new THREE.InstancedMesh(
    satelliteGeometry,
    satelliteMaterial,
    satelliteCount,
  );
  const satelliteTransform = new THREE.Object3D();
  let satelliteIndex = 0;

  for (let index = 0; index < STARLINK_ORBIT_CONFIG.orbitCount; index += 1) {
    const inclinationBand =
      STARLINK_ORBIT_INCLINATION_BANDS[index % STARLINK_ORBIT_INCLINATION_BANDS.length];
    const inclination = inclinationBand + ((index % 3) - 1) * 2.5;
    const rotation = (360 / STARLINK_ORBIT_CONFIG.orbitCount) * index;
    const orbitColor =
      index % 4 === 0
        ? STARLINK_ORBIT_CONFIG.orbitColor
        : STARLINK_ORBIT_CONFIG.orbitColorSoft;
    const orbitOpacity =
      index % 5 === 0
        ? STARLINK_ORBIT_CONFIG.brightLineOpacity
        : STARLINK_ORBIT_CONFIG.lineOpacity;
    const orbitGroup = new THREE.Group();
    const orbitEuler = new THREE.Euler(
      THREE.MathUtils.degToRad(inclination),
      THREE.MathUtils.degToRad(rotation * 0.35),
      THREE.MathUtils.degToRad(rotation),
      "XYZ",
    );

    orbitGroup.rotation.copy(orbitEuler);
    orbitGroup.add(createOrbitRing(orbitRadius, orbitColor, orbitOpacity));
    shell.add(orbitGroup);

    const phaseOffset = seededRandom(index * 71 + 17);
    const satelliteCountForOrbit =
      baseSatellitesPerOrbit +
      (((index * 13) % STARLINK_ORBIT_CONFIG.orbitCount) < extraSatelliteOrbits ? 1 : 0);

    for (let satellite = 0; satellite < satelliteCountForOrbit; satellite += 1) {
      const stableJitter =
        (seededRandom(index * 1000 + satellite * 37) - 0.5) *
        (Math.PI * 2 / satelliteCountForOrbit) *
        0.34;
      const phase =
        ((satellite + phaseOffset) / satelliteCountForOrbit) * Math.PI * 2 +
        stableJitter;
      const position = new THREE.Vector3(
        Math.cos(phase) * orbitRadius,
        Math.sin(phase) * orbitRadius,
        0,
      ).applyEuler(orbitEuler);
      const satelliteScale = 0.82 + ((index + satellite) % 5) * 0.045;

      satelliteTransform.position.copy(position);
      satelliteTransform.scale.setScalar(satelliteScale);
      satelliteTransform.updateMatrix();
      satellites.setMatrixAt(satelliteIndex, satelliteTransform.matrix);
      satelliteIndex += 1;
    }
  }

  satellites.instanceMatrix.needsUpdate = true;
  shell.add(satellites);

  return shell;
}

function removeStarlinkOrbitShell(runtime: GlobeRuntime | undefined) {
  const scene = runtime?.scene?.();
  const existing = scene?.getObjectByName(STARLINK_ORBIT_SHELL_NAME);

  if (!scene || !existing) return;

  scene.remove(existing);
  disposeObject3D(existing);
}

function installStarlinkOrbitShell(runtime: GlobeRuntime | undefined) {
  if (!STARLINK_ORBIT_CONFIG.enabled) return;

  const scene = runtime?.scene?.();
  if (!scene) return;

  removeStarlinkOrbitShell(runtime);
  scene.add(createStarlinkOrbitShell());
}

function getArcStartLat(arc: object) {
  return (arc as GlobeOrbitArc).startLat;
}

function getArcStartLng(arc: object) {
  return (arc as GlobeOrbitArc).startLng;
}

function getArcEndLat(arc: object) {
  return (arc as GlobeOrbitArc).endLat;
}

function getArcEndLng(arc: object) {
  return (arc as GlobeOrbitArc).endLng;
}

function getArcColor(arc: object) {
  return (arc as GlobeOrbitArc).color;
}

function getArcDashInitialGap(arc: object) {
  return (arc as GlobeOrbitArc).dashInitialGap;
}

function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  const updateSize = useCallback(() => {
    const element = ref.current;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const width = Math.max(MIN_STAGE_SIZE, Math.floor(rect.width));
    const height = Math.max(MIN_STAGE_SIZE, Math.floor(rect.height));
    setSize((previous) => (
      previous.width === width && previous.height === height ? previous : { width, height }
    ));
  }, []);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const animationFrame = window.requestAnimationFrame(updateSize);
    const observer = new ResizeObserver(updateSize);
    observer.observe(element);
    window.addEventListener("resize", updateSize);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      observer.disconnect();
      window.removeEventListener("resize", updateSize);
    };
  }, [updateSize]);

  return [ref, size, updateSize] as const;
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="blackdog-globe-map__stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function LanguageInfoPanel({
  node,
  onReset,
}: {
  node: GlobeLanguageNode;
  onReset: () => void;
}) {
  return (
    <>
      <div className="blackdog-globe-map__panel-heading">
        <div>
          <span className="blackdog-globe-map__eyebrow">Code</span>
          <div className="blackdog-globe-map__code" style={{ color: node.color }}>
            {node.code}
          </div>
        </div>
        <div className="blackdog-globe-map__readiness">
          <span>Readiness</span>
          <strong>{node.readiness}</strong>
        </div>
      </div>

      <div className="blackdog-globe-map__selected-copy">
        <div>
          <span>Language</span>
          <h3>{node.language}</h3>
        </div>
        <div>
          <span>Region</span>
          <p>{node.region}</p>
        </div>
      </div>

      <div className="blackdog-globe-map__metric-grid">
        <StatTile label="Total" value={formatNumber(node.total)} />
        <StatTile label="Active" value={formatNumber(node.active)} />
        <StatTile label="Online" value={formatNumber(node.online)} />
      </div>

      <section className="blackdog-globe-map__snapshot">
        <div className="blackdog-globe-map__snapshot-title">Operation Snapshot</div>
        <div className="blackdog-globe-map__snapshot-list">
          <StatTile label="Avg. Daily Hours" value={`${node.avgDailyHours}h`} />
          <StatTile label="Historical Tasks" value={formatNumber(node.historicalTasks)} />
          <StatTile label="Recent Delivery" value={formatNumber(node.recentDelivery)} />
        </div>
      </section>

      <button className="blackdog-globe-map__global-button" type="button" onClick={onReset}>
        Global View
      </button>
    </>
  );
}

function NodeList({
  nodes,
  onSelect,
}: {
  nodes: GlobeLanguageNode[];
  onSelect: (node: GlobeLanguageNode) => void;
}) {
  return (
    <div className="blackdog-globe-map__list-shell">
      <div className="blackdog-globe-map__list-header">
        <span>Language Nodes</span>
        <strong>{formatNumber(nodes.length)}</strong>
      </div>
      <div className="blackdog-globe-map__language-list" aria-label="Language node list">
        {nodes.map((node) => (
          <button
            key={node.id}
            type="button"
            onClick={() => onSelect(node)}
            className={node.isSelected ? "is-selected" : ""}
            style={{ "--node-color": node.color } as CSSProperties}
          >
            <span>{node.code}</span>
            <strong>
              {node.language} - {node.region}
            </strong>
          </button>
        ))}
      </div>
    </div>
  );
}

export function BlackdogGlobeLanguageMap({
  resources,
  selectedId,
  onSelect,
  focusedGroup = "Global / RoW",
  variant = "section",
}: BlackdogGlobeLanguageMapProps) {
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const [stageRef, stageSize, refreshStageSize] = useElementSize<HTMLDivElement>();
  const [internalSelectedId, setInternalSelectedId] = useState<string | undefined>();
  const [isReady, setIsReady] = useState(false);
  const [webGlStatus, setWebGlStatus] = useState<WebGlStatus>("checking");
  const lastFocusedNodeRef = useRef<string | null>(null);
  const lastFocusedGroupRef = useRef<ContinentGroup | null>(null);
  const resumeAutoRotateTimerRef = useRef<number | null>(null);
  const activeSelectedId = selectedId ?? internalSelectedId;

  const defaultGlobeView = DEFAULT_GLOBE_VIEW;

  const safeResources = useMemo(() => {
    const filtered = resources.filter((resource) => hasValidLatLng(resource));
    if (filtered.length !== resources.length) {
      console.warn("BlackDog globe skipped invalid language coordinates", {
        total: resources.length,
        valid: filtered.length,
      });
    }
    return filtered;
  }, [resources]);

  const nodes = useMemo(
    () => buildGlobeNodes(safeResources, activeSelectedId).filter(hasValidLatLng),
    [safeResources, activeSelectedId],
  );
  const globeOrbitArcs = useMemo(() => GLOBE_ORBIT_ARCS, []);

  const selected = activeSelectedId
    ? nodes.find((node) => node.sourceId === activeSelectedId) ?? null
    : null;
  const displayNode = selected ?? nodes[0];
  const hasMeasuredStage = stageSize.width > 0 && stageSize.height > 0;
  const renderWidth = stageSize.width;
  const renderHeight = stageSize.height;

  const configureControls = useCallback((autoRotate = true) => {
    const controls = globeRef.current?.controls();
    if (!controls) return;

    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = autoRotate ? AUTO_ROTATE_SPEED : FOCUS_ROTATE_SPEED;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
  }, []);

  const clearAutoRotateResume = useCallback(() => {
    if (resumeAutoRotateTimerRef.current === null) return;

    window.clearTimeout(resumeAutoRotateTimerRef.current);
    resumeAutoRotateTimerRef.current = null;
  }, []);

  const scheduleAutoRotateResume = useCallback(() => {
    clearAutoRotateResume();
    resumeAutoRotateTimerRef.current = window.setTimeout(() => {
      configureControls(true);
      resumeAutoRotateTimerRef.current = null;
    }, 3000);
  }, [clearAutoRotateResume, configureControls]);

  const resetGlobeView = useCallback((duration = 0) => {
    globeRef.current?.pointOfView(defaultGlobeView, duration);
  }, [defaultGlobeView]);

  const focusNode = useCallback((node: GlobeLanguageNode, duration = 1200) => {
    lastFocusedNodeRef.current = node.sourceId;
    configureControls(false);
    globeRef.current?.pointOfView(
      {
        lat: node.originalLat,
        lng: node.originalLng,
        altitude: DEFAULT_GLOBE_VIEW.altitude,
      },
      duration,
    );
    scheduleAutoRotateResume();
  }, [configureControls, scheduleAutoRotateResume]);

  const handleSelectLanguage = useCallback(
    (node: GlobeLanguageNode) => {
      setInternalSelectedId(node.sourceId);
      onSelect?.(node.sourceId);
      focusNode(node);
    },
    [focusNode, onSelect],
  );

  const handleResetView = useCallback(() => {
    setInternalSelectedId(undefined);
    clearAutoRotateResume();
    configureControls(true);
    resetGlobeView(1200);
  }, [clearAutoRotateResume, configureControls, resetGlobeView]);

  const createHtmlNode = useCallback((value: object) => {
    const node = value as GlobeLanguageNode;
    const element = document.createElement("button");
    element.type = "button";
    element.className = [
      "blackdog-globe-map__node",
      LANGUAGE_MARKER_STYLE === "paw" ? "blackdog-globe-map__node--paw" : "blackdog-globe-map__node--circle",
      node.isSelected ? "blackdog-globe-map__node--selected is-selected" : "",
    ]
      .filter(Boolean)
      .join(" ");
    element.style.setProperty("--node-color", node.color);
    element.style.setProperty("--marker-color", node.color);
    element.setAttribute("aria-label", `${node.language} - ${node.region}`);
    element.dataset.languageCode = node.code;

    if (LANGUAGE_MARKER_STYLE === "paw") {
      const shapeElement = document.createElement("span");
      shapeElement.className = "official-paw-marker__shape";
      shapeElement.setAttribute("aria-hidden", "true");
      element.appendChild(shapeElement);

      const codeElement = document.createElement("span");
      codeElement.className = "official-paw-marker__code";
      codeElement.textContent = node.code;
      element.appendChild(codeElement);
    } else {
      element.textContent = node.code;
    }

    element.addEventListener("click", (event) => {
      event.stopPropagation();
      handleSelectLanguage(node);
    });
    return element;
  }, [handleSelectLanguage]);

  const handleGlobeClick = useCallback(
    (coords: { lat: number; lng: number }) => {
      const nearest = findNearestNode(coords, nodes);
      if (nearest.node && nearest.distance <= 9.5) {
        handleSelectLanguage(nearest.node);
      }
    },
    [handleSelectLanguage, nodes],
  );

  const handleGlobeReady = useCallback(() => {
    const runtime = globeRef.current as GlobeRuntime | undefined;

    try {
      applyGlobeVisualMaterial(runtime);

      const scene = runtime?.scene?.();
      if (scene) scene.background = null;
      installStarlinkOrbitShell(runtime);

      const renderer = runtime?.renderer?.();
      renderer?.setClearColor?.(0x000000, 0);
      renderer?.setClearAlpha?.(0);
      renderer?.setPixelRatio?.(Math.min(window.devicePixelRatio || 1, 1.25));
      if (renderer?.domElement) {
        renderer.domElement.style.background = "transparent";
      }
    } catch (error) {
      console.warn("BlackDog globe renderer setup failed", error);
    }

    configureControls(true);
    resetGlobeView(0);
    setIsReady(true);
  }, [configureControls, resetGlobeView]);

  useEffect(() => {
    const animationFrame = window.requestAnimationFrame(() => {
      setWebGlStatus(checkWebGlAvailable() ? "available" : "unavailable");
    });

    return () => window.cancelAnimationFrame(animationFrame);
  }, []);

  useEffect(() => {
    return () => clearAutoRotateResume();
  }, [clearAutoRotateResume]);

  useEffect(() => {
    if (!isReady) return undefined;

    const runtime = globeRef.current as GlobeRuntime | undefined;

    return () => removeStarlinkOrbitShell(runtime);
  }, [isReady]);


  useEffect(() => {
    if (!isReady || !hasMeasuredStage) return;

    const animationFrame = window.requestAnimationFrame(() => {
      resetGlobeView(0);
      refreshStageSize();
    });

    return () => window.cancelAnimationFrame(animationFrame);
  }, [hasMeasuredStage, isReady, refreshStageSize, resetGlobeView]);

  useEffect(() => {
    if (!isReady || !activeSelectedId) return;
    if (lastFocusedNodeRef.current === activeSelectedId) return;

    const nextNode = nodes.find((node) => node.sourceId === activeSelectedId);
    if (!nextNode) return;

    focusNode(nextNode, 900);
  }, [activeSelectedId, focusNode, isReady, nodes]);

  useEffect(() => {
    if (!isReady || !focusedGroup) return;
    if (lastFocusedGroupRef.current === focusedGroup) return;

    lastFocusedGroupRef.current = focusedGroup;
    const nextView = focusedGroup === "Global / RoW" ? defaultGlobeView : globeViewByGroup[focusedGroup];

    if (focusedGroup === "Global / RoW") {
      configureControls(true);
    } else {
      configureControls(false);
    }

    globeRef.current?.pointOfView(nextView, 900);
  }, [configureControls, defaultGlobeView, focusedGroup, isReady]);

  const shouldRenderGlobe = webGlStatus === "available" && hasMeasuredStage;

  const globeStage = (
    <div
      className={`blackdog-globe-map__stage${
        variant === "embedded" ? " blackdog-globe-map__stage--embedded" : ""
      }`}
      ref={stageRef}
    >
      <div className="blackdog-globe-nebula" />
      <div className="blackdog-globe-stars" aria-hidden="true" />

      {webGlStatus === "unavailable" && (
        <div className="blackdog-globe-map__fallback" role="status">
          <span>WebGL unavailable in this browser session</span>
          <button type="button" onClick={() => setWebGlStatus(checkWebGlAvailable() ? "available" : "unavailable")}>
            Retry Globe
          </button>
        </div>
      )}

      {webGlStatus !== "unavailable" && !isReady && (
        <div className="blackdog-globe-map__fallback" role="status">
          <span>Loading global network</span>
        </div>
      )}

      {shouldRenderGlobe && (
        <div
          className={`blackdog-globe-map__globe-render${
            isReady ? " blackdog-globe-map__globe-render--ready" : ""
          }`}
        >
          <Globe
            ref={globeRef}
            width={renderWidth}
            height={renderHeight}
            animateIn={false}
            waitForGlobeReady
            rendererConfig={{
              alpha: true,
              antialias: false,
              failIfMajorPerformanceCaveat: false,
              powerPreference: "default",
              preserveDrawingBuffer: false,
            }}
            backgroundColor="rgba(0,0,0,0)"
            globeImageUrl={GLOBE_TEXTURE_URL}
            bumpImageUrl={null}
            showAtmosphere={true}
            atmosphereColor={GLOBE_VISUAL_CONFIG.atmosphereColor}
            atmosphereAltitude={GLOBE_VISUAL_CONFIG.atmosphereAltitude}
            showGraticules={false}
            globeCurvatureResolution={4}
            arcsData={globeOrbitArcs}
            arcStartLat={getArcStartLat}
            arcStartLng={getArcStartLng}
            arcEndLat={getArcEndLat}
            arcEndLng={getArcEndLng}
            arcColor={getArcColor}
            arcAltitude={0.22}
            arcStroke={0.55}
            arcDashLength={0.34}
            arcDashGap={1.6}
            arcDashInitialGap={getArcDashInitialGap}
            arcDashAnimateTime={5200}
            htmlElementsData={nodes}
            htmlLat={(node) => (node as GlobeLanguageNode).lat}
            htmlLng={(node) => (node as GlobeLanguageNode).lng}
            htmlAltitude={(node) => ((node as GlobeLanguageNode).isSelected ? 0.13 : 0.1)}
            htmlElement={createHtmlNode}
            onGlobeClick={(coords) => handleGlobeClick(coords)}
            onGlobeReady={handleGlobeReady}
          />
        </div>
      )}

    </div>
  );

  if (variant === "embedded") {
    return globeStage;
  }

  return (
    <section className="blackdog-globe-map" aria-labelledby="blackdog-globe-map-title">
      <div className="blackdog-globe-map__header">
        <div>
          <p>3D Globe Language Map</p>
          <h2 id="blackdog-globe-map-title">Global Language Network</h2>
          <span>A live 3D view of BlackDog&apos;s multilingual talent coverage across regions.</span>
        </div>
        <div className="blackdog-globe-map__summary">
          <strong>{formatNumber(nodes.length)}</strong>
          <span>language nodes</span>
        </div>
      </div>

      <div className="blackdog-globe-map__layout">
        {globeStage}

        <aside className="blackdog-globe-map__panel">
          <LanguageInfoPanel node={displayNode} onReset={handleResetView} />
          <NodeList nodes={nodes} onSelect={handleSelectLanguage} />
        </aside>
      </div>
    </section>
  );
}
