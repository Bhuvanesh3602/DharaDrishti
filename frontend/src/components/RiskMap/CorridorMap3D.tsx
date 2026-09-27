import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CorridorNode, CorridorEdge, NodeRiskResult, SensorTelemetry } from '../../types';
import {
  Rotate3d,
  Sliders,
  TrendingDown,
  Mountain
} from 'lucide-react';

interface Props {
  nodes: CorridorNode[];
  edges: CorridorEdge[];
  riskMap: Record<string, NodeRiskResult>;
  telemetryMap: Record<string, SensorTelemetry>;
  selectedNodeId: string;
  onSelectNode: (nodeId: string) => void;
}

// ── Color helpers matching the 2D map risk scale ──────────────────
function riskHexColor(score: number): number {
  if (score >= 75) return 0xef4444; // Crimson Red
  if (score >= 50) return 0xf97316; // Vivid Orange
  if (score >= 25) return 0xeab308; // Amber Gold
  return 0x10b981; // Emerald Green
}

function riskColorStr(score: number): string {
  if (score >= 75) return '#ef4444';
  if (score >= 50) return '#f97316';
  if (score >= 25) return '#eab308';
  return '#10b981';
}

// ── Real-world Beas & Parbati river waypoints ──────────────────────
const BEAS_MAIN_STEM: [number, number][] = [
  [32.330, 77.155],
  [32.315, 77.158], // Solang Nullah (N01) - 2480m
  [32.300, 77.162],
  [32.287, 77.168], // Palchan (N02) - 2210m
  [32.268, 77.175],
  [32.243, 77.189], // Manali (N03) - 2050m
  [32.210, 77.183],
  [32.175, 77.178],
  [32.138, 77.172], // Naggar (N04) - 1760m
  [32.100, 77.155],
  [32.062, 77.132], // Raison (N05) - 1430m
  [32.020, 77.118],
  [31.958, 77.109], // Kullu (N06) - 1220m
  [31.938, 77.118],
  [31.916, 77.126], // Mohal (N07) - 1150m
  [31.905, 77.135],
  [31.895, 77.142], // Shamshi (N09) - 1110m
  [31.878, 77.153], // Bhuntar (N10) - 1080m
  [31.862, 77.155],
  [31.849, 77.158], // Bajaura (N11) - 960m
  [31.820, 77.180],
  [31.785, 77.218], // Larji (N12) - 910m
];

const PARBATI_TRIBUTARY: [number, number][] = [
  [32.060, 77.380], // Upper Parbati gorge ~2200m
  [32.035, 77.355],
  [32.010, 77.316], // Kasol (N08) - 1580m
  [31.990, 77.285],
  [31.968, 77.250],
  [31.945, 77.215],
  [31.920, 77.185],
  [31.895, 77.160],
  [31.878, 77.153], // Bhuntar confluence - 1080m
];

// Coordinate bounds of the corridor
const BOUNDS = {
  minLat: 31.75,
  maxLat: 32.35,
  minLon: 77.08,
  maxLon: 77.40,
  minElev: 850,
  maxElev: 2600,
  peakElev: 3800, // Flanking Himalayan peaks (Dhauladhar / Pir Panjal)
};

// 3D Scene scale dimensions
const SCENE_WIDTH = 130;  // X axis (Lon)
const SCENE_LENGTH = 180; // Z axis (Lat: -Z is North, +Z is South)
const BASE_HEIGHT = 20;   // Y axis max elevation scale

// Geographic to 3D Scene coordinate converter
function geoTo3D(lat: number, lon: number, elev: number, exaggeration: number = 1.5): [number, number, number] {
  // Lon -> X (-SCENE_WIDTH/2 to SCENE_WIDTH/2)
  const normLon = (lon - BOUNDS.minLon) / (BOUNDS.maxLon - BOUNDS.minLon);
  const x = (normLon - 0.5) * SCENE_WIDTH;

  // Lat -> Z (Three.js: -Z is North/High Lat, +Z is South/Low Lat)
  const normLat = (lat - BOUNDS.minLat) / (BOUNDS.maxLat - BOUNDS.minLat);
  const z = -(normLat - 0.5) * SCENE_LENGTH;

  // Elev -> Y
  const normElev = Math.max(0, (elev - BOUNDS.minElev) / (BOUNDS.maxElev - BOUNDS.minElev));
  const y = (normElev * BASE_HEIGHT + 1.2) * exaggeration;

  return [x, y, z];
}

// Distance from point to line segment in 2D
function distToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
}

// Interpolate river elevation along river waypoints
function getRiverBaseElevation(lat: number, lon: number): { distToBeas: number; distToParbati: number; riverElev: number } {
  let minBeasDist = Infinity;
  let beasElev = 1200;

  for (let i = 0; i < BEAS_MAIN_STEM.length - 1; i++) {
    const p1 = BEAS_MAIN_STEM[i];
    const p2 = BEAS_MAIN_STEM[i + 1];
    const d = distToSegment(lat, lon, p1[0], p1[1], p2[0], p2[1]);
    if (d < minBeasDist) {
      minBeasDist = d;
      // Linear elevation drop along the 22 Beas waypoints (Solang 2480m -> Larji 910m)
      const frac = i / (BEAS_MAIN_STEM.length - 1);
      beasElev = 2480 - frac * (2480 - 910);
    }
  }

  let minParbatiDist = Infinity;
  let parbatiElev = 1580;
  for (let i = 0; i < PARBATI_TRIBUTARY.length - 1; i++) {
    const p1 = PARBATI_TRIBUTARY[i];
    const p2 = PARBATI_TRIBUTARY[i + 1];
    const d = distToSegment(lat, lon, p1[0], p1[1], p2[0], p2[1]);
    if (d < minParbatiDist) {
      minParbatiDist = d;
      const frac = i / (PARBATI_TRIBUTARY.length - 1);
      parbatiElev = 2200 - frac * (2200 - 1080);
    }
  }

  // Convert angular distance to approx kilometers (1 deg lat ~ 111km)
  const distToBeasKm = minBeasDist * 111;
  const distToParbatiKm = minParbatiDist * 111;

  let riverElev = beasElev;
  if (distToParbatiKm < distToBeasKm && lon > 77.16) {
    riverElev = parbatiElev;
  }

  return { distToBeas: distToBeasKm, distToParbati: distToParbatiKm, riverElev };
}

// Procedural Himalayan Valley Elevation Sampler
function sampleTerrainHeight(lat: number, lon: number, exaggeration: number): number {
  const { distToBeas, distToParbati, riverElev } = getRiverBaseElevation(lat, lon);
  const riverDist = Math.min(distToBeas, distToParbati);

  // V-shaped Himalayan gorge profile:
  // Valley floor: flat near river, then steep climb up 25-40 degree mountain slopes
  const valleyWidthKm = 1.0;
  let valleyWallRise = 0;

  if (riverDist > valleyWidthKm) {
    const distancePastFloor = riverDist - valleyWidthKm;
    // Himalayan slopes rising up to 3600-4000m
    valleyWallRise = Math.pow(Math.min(distancePastFloor / 10, 1.0), 0.75) * (BOUNDS.peakElev - riverElev);
  }

  // Realistic mountain ridgeline crags & noise
  const mountainCrags =
    Math.sin(lat * 120 + lon * 80) * 110 +
    Math.cos(lat * 240 - lon * 160) * 65 +
    Math.sin(lat * 480 + lon * 320) * 30;

  const totalElevMeters = Math.min(BOUNDS.peakElev, Math.max(riverElev, riverElev + valleyWallRise + mountainCrags));

  // Normalized to 3D units
  const normElev = Math.max(0, (totalElevMeters - BOUNDS.minElev) / (BOUNDS.maxElev - BOUNDS.minElev));
  return (normElev * BASE_HEIGHT + 0.4) * exaggeration;
}

// Hypsometric tint colormap for terrain vertex colors
function getHypsometricColor(heightMeters: number, slopeDeg: number): THREE.Color {
  const color = new THREE.Color();
  
  if (heightMeters > 3100) {
    // Perpetual snow & alpine frost peaks
    color.setRGB(0.92, 0.95, 0.98);
  } else if (heightMeters > 2600) {
    // Slate rocky ridge and high crags
    color.setRGB(0.48, 0.50, 0.54);
  } else if (heightMeters > 2000) {
    // Upper sub-alpine alpine pine & scree
    color.setRGB(0.24, 0.38, 0.28);
  } else if (heightMeters > 1300) {
    // Lush Himalayan deodar cedar forest
    color.setRGB(0.14, 0.32, 0.18);
  } else {
    // Alluvial valley floor & riverine vegetation
    color.setRGB(0.22, 0.42, 0.26);
  }

  // Steeper rock walls are darker grey rock face
  if (slopeDeg > 32 && heightMeters > 1400) {
    color.lerp(new THREE.Color(0.35, 0.36, 0.38), 0.65);
  }

  return color;
}

// Create billboard canvas texture for node labels and badges
function createNodeBadgeTexture(name: string, elevation: number, score: number, isSelected: boolean): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  // Background card
  ctx.fillStyle = isSelected ? 'rgba(15, 23, 42, 0.95)' : 'rgba(15, 23, 42, 0.82)';
  ctx.beginPath();
  ctx.roundRect(10, 10, 236, 108, 16);
  ctx.fill();

  ctx.lineWidth = isSelected ? 4 : 2;
  ctx.strokeStyle = isSelected ? '#ffffff' : riskColorStr(score);
  ctx.stroke();

  // Score circle
  ctx.fillStyle = riskColorStr(score);
  ctx.beginPath();
  ctx.arc(45, 64, 24, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 22px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(score.toString(), 45, 64);

  // Station Name
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(name.slice(0, 14), 80, 52);

  // Elevation
  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 15px monospace';
  ctx.fillText(`${elevation}m AMSL`, 80, 78);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// ══════════════════════════════════════════════════════════════════
// Component Implementation
// ══════════════════════════════════════════════════════════════════
export const CorridorMap3D: React.FC<Props> = ({
  nodes,
  edges,
  riskMap,
  telemetryMap,
  selectedNodeId,
  onSelectNode
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Controls state
  const [exaggeration, setExaggeration] = useState<number>(1.6);
  const [showWireframe, setShowWireframe] = useState<boolean>(false);
  const [showFlowParticles, setShowFlowParticles] = useState<boolean>(true);
  const [showDropBadges, setShowDropBadges] = useState<boolean>(true);
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(false);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);

  // Three.js instances ref
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Dynamic mesh groups for easy re-building when exaggeration/state changes
  const terrainMeshRef = useRef<THREE.Mesh | null>(null);
  const nodeMarkersGroupRef = useRef<THREE.Group | null>(null);
  const edgeCurvesGroupRef = useRef<THREE.Group | null>(null);
  const particlesGroupRef = useRef<THREE.Group | null>(null);
  const dropBadgesGroupRef = useRef<THREE.Group | null>(null);
  const riverMeshRef = useRef<THREE.Line | null>(null);

  // Maximum risk across corridor
  const maxRisk = useMemo(() => {
    return Math.max(0, ...Object.values(riskMap).map(r => r.riskScore));
  }, [riskMap]);

  // ── 1. Initialize Scene, Camera, Renderer, Lights (Once) ────────
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene with atmospheric Himalayan haze
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b1120);
    scene.fog = new THREE.FogExp2(0x0b1120, 0.0035);
    sceneRef.current = scene;

    // 2. Camera (default isometric Himalayan view looking north-east)
    const camera = new THREE.PerspectiveCamera(42, width / height, 1, 1000);
    camera.position.set(0, 75, 140);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2 - 0.05; // Prevent flipping below terrain
    controls.minDistance = 25;
    controls.maxDistance = 320;
    controls.target.set(0, 10, 0);
    controlsRef.current = controls;

    // 5. Lighting: Golden-hour Himalayan sun + cool ambient sky light
    const ambientLight = new THREE.AmbientLight(0xdbeafe, 0.65);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffedd5, 1.4);
    sunLight.position.set(-80, 120, 60);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 350;
    sunLight.shadow.camera.left = -100;
    sunLight.shadow.camera.right = 100;
    sunLight.shadow.camera.top = 100;
    sunLight.shadow.camera.bottom = -100;
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.4);
    rimLight.position.set(80, 40, -90);
    scene.add(rimLight);

    // Groups
    const nodeGroup = new THREE.Group();
    const edgeGroup = new THREE.Group();
    const partGroup = new THREE.Group();
    const dropGroup = new THREE.Group();
    scene.add(nodeGroup);
    scene.add(edgeGroup);
    scene.add(partGroup);
    scene.add(dropGroup);
    nodeMarkersGroupRef.current = nodeGroup;
    edgeCurvesGroupRef.current = edgeGroup;
    particlesGroupRef.current = partGroup;
    dropBadgesGroupRef.current = dropGroup;

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    const clock = new THREE.Clock();
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      controls.update();

      // Animate downstream flow particles along 3D edge splines
      if (partGroup && partGroup.children.length > 0) {
        partGroup.children.forEach((child: any) => {
          if (child.userData && child.userData.curve && child.userData.speed) {
            child.userData.progress = (child.userData.progress + child.userData.speed * delta) % 1.0;
            const pt = child.userData.curve.getPointAt(child.userData.progress);
            child.position.copy(pt);
          }
        });
      }

      // Billboard labels always face camera
      if (nodeMarkersGroupRef.current) {
        nodeMarkersGroupRef.current.children.forEach(item => {
          if (item.userData && item.userData.isBillboard) {
            item.quaternion.copy(camera.quaternion);
          }
        });
      }
      if (dropBadgesGroupRef.current) {
        dropBadgesGroupRef.current.children.forEach(item => {
          item.quaternion.copy(camera.quaternion);
        });
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // ── 2. Build 3D Terrain Mesh (runs when exaggeration or wireframe changes) ──
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (terrainMeshRef.current) {
      scene.remove(terrainMeshRef.current);
      terrainMeshRef.current.geometry.dispose();
      (terrainMeshRef.current.material as THREE.Material).dispose();
      terrainMeshRef.current = null;
    }

    // Grid resolution: 140x140 vertices for high-detail canyon ridges
    const gridX = 140;
    const gridZ = 160;
    const geometry = new THREE.PlaneGeometry(SCENE_WIDTH, SCENE_LENGTH, gridX, gridZ);
    geometry.rotateX(-Math.PI / 2); // Lay flat on XZ plane

    const pos = geometry.attributes.position;
    const colors: number[] = [];

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);

      // Convert 3D scene (x, z) back to approximate (lat, lon)
      const normLon = x / SCENE_WIDTH + 0.5;
      const lon = BOUNDS.minLon + normLon * (BOUNDS.maxLon - BOUNDS.minLon);

      const normLat = -(z / SCENE_LENGTH) + 0.5;
      const lat = BOUNDS.minLat + normLat * (BOUNDS.maxLat - BOUNDS.minLat);

      const y = sampleTerrainHeight(lat, lon, exaggeration);
      pos.setY(i, y);

      // Height in real-world meters approx
      const meters = BOUNDS.minElev + (y / (BASE_HEIGHT * exaggeration)) * (BOUNDS.maxElev - BOUNDS.minElev);
      const slopeDeg = 25; // average slope approximation
      const c = getHypsometricColor(meters, slopeDeg);
      colors.push(c.r, c.g, c.b);
    }

    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.85,
      metalness: 0.1,
      wireframe: showWireframe,
      flatShading: false
    });

    const terrainMesh = new THREE.Mesh(geometry, material);
    terrainMesh.receiveShadow = true;
    terrainMesh.castShadow = true;
    scene.add(terrainMesh);
    terrainMeshRef.current = terrainMesh;

    // ── Draw 3D River Ribbons along Valley Floor ──
    if (riverMeshRef.current) {
      scene.remove(riverMeshRef.current);
      riverMeshRef.current.geometry.dispose();
      (riverMeshRef.current.material as THREE.Material).dispose();
      riverMeshRef.current = null;
    }

    const beasRiverPoints: THREE.Vector3[] = BEAS_MAIN_STEM.map(pt => {
      const [x, , z] = geoTo3D(pt[0], pt[1], 0, exaggeration);
      const y = sampleTerrainHeight(pt[0], pt[1], exaggeration) + 0.25;
      return new THREE.Vector3(x, y, z);
    });

    const riverCurve = new THREE.CatmullRomCurve3(beasRiverPoints);
    const riverGeo = new THREE.TubeGeometry(riverCurve, 100, 0.7, 8, false);
    const riverMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      emissive: 0x0369a1,
      emissiveIntensity: 0.5,
      roughness: 0.2,
      metalness: 0.8,
      transparent: true,
      opacity: 0.85
    });
    const riverMesh = new THREE.Mesh(riverGeo, riverMat);
    scene.add(riverMesh);

    // Parbati River ribbon
    const parbatiPoints: THREE.Vector3[] = PARBATI_TRIBUTARY.map(pt => {
      const [x, , z] = geoTo3D(pt[0], pt[1], 0, exaggeration);
      const y = sampleTerrainHeight(pt[0], pt[1], exaggeration) + 0.25;
      return new THREE.Vector3(x, y, z);
    });
    const parbatiCurve = new THREE.CatmullRomCurve3(parbatiPoints);
    const parbatiGeo = new THREE.TubeGeometry(parbatiCurve, 60, 0.5, 8, false);
    const parbatiMesh = new THREE.Mesh(parbatiGeo, riverMat);
    scene.add(parbatiMesh);

  }, [exaggeration, showWireframe]);

  // ── 3. Build 3D Elevated Nodes & Downhill Drainage Arcs ────────
  useEffect(() => {
    const nodeGroup = nodeMarkersGroupRef.current;
    const edgeGroup = edgeCurvesGroupRef.current;
    const partGroup = particlesGroupRef.current;
    const dropGroup = dropBadgesGroupRef.current;
    if (!nodeGroup || !edgeGroup || !partGroup || !dropGroup) return;

    // Clear previous children
    while (nodeGroup.children.length > 0) {
      const obj = nodeGroup.children[0] as any;
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach((m: any) => m.dispose());
        else obj.material.dispose();
      }
      nodeGroup.remove(obj);
    }
    while (edgeGroup.children.length > 0) {
      const obj = edgeGroup.children[0] as any;
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
      edgeGroup.remove(obj);
    }
    while (partGroup.children.length > 0) {
      const obj = partGroup.children[0] as any;
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
      partGroup.remove(obj);
    }
    while (dropGroup.children.length > 0) {
      const obj = dropGroup.children[0] as any;
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
      dropGroup.remove(obj);
    }

    // Node 3D positions lookup
    const nodePosMap: Record<string, THREE.Vector3> = {};
    const terrainBasePosMap: Record<string, THREE.Vector3> = {};

    nodes.forEach(node => {
      const [x, y, z] = geoTo3D(node.lat, node.lon, node.elevation, exaggeration);
      // Actual terrain surface height underneath
      const groundY = sampleTerrainHeight(node.lat, node.lon, exaggeration);
      // Floating node hovering above pedestal
      const elevatedY = Math.max(y, groundY + 4);

      nodePosMap[node.id] = new THREE.Vector3(x, elevatedY, z);
      terrainBasePosMap[node.id] = new THREE.Vector3(x, groundY, z);
    });

    // ── A. DRAW ELEVATED-TO-LOWER DOWNHILL CONNECTOR ARCS ───────────
    edges.forEach(edge => {
      const pUp = nodePosMap[edge.source];
      const pDown = nodePosMap[edge.target];
      if (!pUp || !pDown) return;

      const srcNode = nodes.find(n => n.id === edge.source);
      const tgtNode = nodes.find(n => n.id === edge.target);
      const elevDrop = (srcNode?.elevation ?? 0) - (tgtNode?.elevation ?? 0);

      const srcRisk = riskMap[edge.source]?.riskScore ?? 20;
      const tgtRisk = riskMap[edge.target]?.riskScore ?? 20;
      const peakRisk = Math.max(srcRisk, tgtRisk);

      // Graceful 3D catenary curve descending from higher node to lower node
      const midPoint = new THREE.Vector3()
        .addVectors(pUp, pDown)
        .multiplyScalar(0.5);
      // Arc slightly upward to give hydraulic trajectory clarity
      midPoint.y += 3.0;

      const curve = new THREE.QuadraticBezierCurve3(pUp, midPoint, pDown);

      // Tube radius and color based on risk severity
      const tubeRadius = peakRisk >= 50 ? 0.45 : 0.3;
      const tubeColor = riskHexColor(peakRisk);

      const tubeGeo = new THREE.TubeGeometry(curve, 32, tubeRadius, 8, false);
      const tubeMat = new THREE.MeshStandardMaterial({
        color: tubeColor,
        emissive: tubeColor,
        emissiveIntensity: 0.6,
        roughness: 0.3,
        metalness: 0.8,
        transparent: true,
        opacity: 0.85
      });
      const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
      edgeGroup.add(tubeMesh);

      // ── B. ANIMATED DOWNHILL SURGE FLOW PARTICLES ──
      if (showFlowParticles) {
        const particleCount = 4;
        // Faster particle speed on steeper slopes (Solang 64 m/km vs Larji 5 m/km)
        const speed = Math.max(0.12, (edge.gradientMpk / 70) * 0.32);

        for (let i = 0; i < particleCount; i++) {
          const pGeo = new THREE.SphereGeometry(0.55, 8, 8);
          const pMat = new THREE.MeshBasicMaterial({
            color: 0x38bdf8,
            transparent: true,
            opacity: 0.95
          });
          const pMesh = new THREE.Mesh(pGeo, pMat);
          pMesh.userData = {
            curve,
            speed,
            progress: i / particleCount,
            edgeId: edge.id
          };
          const initialPos = curve.getPointAt(pMesh.userData.progress);
          pMesh.position.copy(initialPos);
          partGroup.add(pMesh);
        }
      }

      // ── C. 3D ELEVATION DROP BADGE (MID-ARC CALLOUT) ──
      if (showDropBadges && elevDrop > 0) {
        const badgeCanvas = document.createElement('canvas');
        badgeCanvas.width = 180;
        badgeCanvas.height = 64;
        const bCtx = badgeCanvas.getContext('2d')!;

        bCtx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        bCtx.beginPath();
        bCtx.roundRect(4, 4, 172, 56, 12);
        bCtx.fill();
        bCtx.lineWidth = 2;
        bCtx.strokeStyle = '#38bdf8';
        bCtx.stroke();

        bCtx.fillStyle = '#38bdf8';
        bCtx.font = 'bold 16px sans-serif';
        bCtx.textAlign = 'center';
        bCtx.fillText(`▼ -${elevDrop}m DROP`, 90, 26);

        bCtx.fillStyle = '#94a3b8';
        bCtx.font = 'bold 12px monospace';
        bCtx.fillText(`${edge.gradientMpk} m/km · ~${edge.travelTimeMin}m`, 90, 48);

        const bTexture = new THREE.CanvasTexture(badgeCanvas);
        const bMat = new THREE.SpriteMaterial({ map: bTexture, transparent: true });
        const sprite = new THREE.Sprite(bMat);
        sprite.scale.set(7, 2.5, 1);
        sprite.position.copy(midPoint).add(new THREE.Vector3(0, 2.2, 0));
        dropGroup.add(sprite);
      }
    });

    // ── D. DRAW ELEVATED NODE MARKERS & LIGHT PILLARS ──────────────
    nodes.forEach(node => {
      const pos = nodePosMap[node.id];
      const groundPos = terrainBasePosMap[node.id];
      if (!pos || !groundPos) return;

      const risk = riskMap[node.id];
      const score = risk?.riskScore ?? 20;
      const isSelected = node.id === selectedNodeId;
      const color = riskHexColor(score);

      // 1. Vertical Light Pillar / Pedestal (anchors elevated node to valley floor)
      const pillarHeight = pos.y - groundPos.y;
      const pillarGeo = new THREE.CylinderGeometry(0.2, 0.35, pillarHeight, 8);
      const pillarMat = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: isSelected ? 0.75 : 0.35
      });
      const pillarMesh = new THREE.Mesh(pillarGeo, pillarMat);
      pillarMesh.position.set(pos.x, groundPos.y + pillarHeight / 2, pos.z);
      nodeGroup.add(pillarMesh);

      // Ground anchor ring
      const groundRingGeo = new THREE.RingGeometry(0.8, 1.2, 16);
      groundRingGeo.rotateX(-Math.PI / 2);
      const groundRingMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5, side: THREE.DoubleSide });
      const groundRing = new THREE.Mesh(groundRingGeo, groundRingMat);
      groundRing.position.set(pos.x, groundPos.y + 0.1, pos.z);
      nodeGroup.add(groundRing);

      // 2. Main Elevated Risk Orb
      const orbRadius = isSelected ? 1.6 : 1.2;
      const orbGeo = new THREE.SphereGeometry(orbRadius, 16, 16);
      const orbMat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: isSelected ? 0.9 : 0.5,
        roughness: 0.2,
        metalness: 0.5
      });
      const orbMesh = new THREE.Mesh(orbGeo, orbMat);
      orbMesh.position.copy(pos);
      orbMesh.userData = { nodeId: node.id, isClickable: true };
      nodeGroup.add(orbMesh);

      // 3. Selection / Pulsing Halo
      if (isSelected || score >= 50) {
        const haloGeo = new THREE.RingGeometry(orbRadius * 1.3, orbRadius * 1.7, 24);
        const haloMat = new THREE.MeshBasicMaterial({
          color: isSelected ? 0xffffff : color,
          transparent: true,
          opacity: 0.7,
          side: THREE.DoubleSide
        });
        const haloMesh = new THREE.Mesh(haloGeo, haloMat);
        haloMesh.position.copy(pos);
        haloMesh.userData = { isBillboard: true };
        nodeGroup.add(haloMesh);
      }

      // 4. Billboard Station Information Badge
      const badgeTexture = createNodeBadgeTexture(node.name, node.elevation, score, isSelected);
      const spriteMat = new THREE.SpriteMaterial({ map: badgeTexture, transparent: true });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.scale.set(isSelected ? 11 : 9.5, isSelected ? 5.5 : 4.75, 1);
      sprite.position.set(pos.x, pos.y + 3.8, pos.z);
      sprite.userData = { nodeId: node.id, isClickable: true };
      nodeGroup.add(sprite);
    });

  }, [nodes, edges, riskMap, selectedNodeId, exaggeration, showFlowParticles, showDropBadges]);

  // ── 4. Raycasting: Click & Hover on 3D Nodes ────────────────────
  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current || !cameraRef.current || !sceneRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

    if (!nodeMarkersGroupRef.current) return;
    const intersects = raycaster.intersectObjects(nodeMarkersGroupRef.current.children, true);

    const hit = intersects.find(i => i.object.userData && i.object.userData.nodeId);
    if (hit) {
      const nodeId = hit.object.userData.nodeId;
      onSelectNode(nodeId);
    }
  }, [onSelectNode]);

  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current || !cameraRef.current || !sceneRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

    if (!nodeMarkersGroupRef.current) return;
    const intersects = raycaster.intersectObjects(nodeMarkersGroupRef.current.children, true);

    const hit = intersects.find(i => i.object.userData && i.object.userData.nodeId);
    if (hit) {
      setHoveredNodeId(hit.object.userData.nodeId);
      setHoverPos({ x: event.clientX - rect.left, y: event.clientY - rect.top });
    } else {
      setHoveredNodeId(null);
      setHoverPos(null);
    }
  }, []);

  // ── 5. Camera Presets ───────────────────────────────────────────
  const setCameraPreset = (preset: 'OVERVIEW' | 'SOLANG' | 'PARBATI' | 'GORGE' | 'TOPDOWN') => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    if (preset === 'OVERVIEW') {
      camera.position.set(0, 80, 140);
      controls.target.set(0, 10, 0);
    } else if (preset === 'SOLANG') {
      // Focus on headwaters at ~Solang (Z ~ -80)
      camera.position.set(-15, 50, -35);
      controls.target.set(-10, 25, -75);
    } else if (preset === 'PARBATI') {
      // Focus on Kasol & Bhuntar confluence
      camera.position.set(45, 35, 40);
      controls.target.set(20, 15, 10);
    } else if (preset === 'GORGE') {
      // Low angle looking up the canyon from Larji toward Manali
      camera.position.set(0, 20, 110);
      controls.target.set(0, 30, -40);
    } else if (preset === 'TOPDOWN') {
      // True top-down orthographic-style perspective (matching 2D map)
      camera.position.set(0, 190, 0.1);
      controls.target.set(0, 0, 0);
    }
    controls.update();
  };

  // Toggle Auto-rotate
  const toggleAutoRotate = () => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = !isAutoRotating;
      controlsRef.current.autoRotateSpeed = 1.2;
      setIsAutoRotating(!isAutoRotating);
    }
  };

  const hoveredNode = useMemo(() => {
    return nodes.find(n => n.id === hoveredNodeId);
  }, [nodes, hoveredNodeId]);

  const maxRiskColor = riskColorStr(maxRisk);

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      className="relative w-full h-full min-h-[520px] rounded-[28px] overflow-hidden border border-slate-700/80 shadow-2xl bg-[#0b1120] select-none cursor-grab active:cursor-grabbing"
    >
      {/* ── Top-Left: Corridor Information Badge ── */}
      <div className="absolute top-4 left-4 z-20 pointer-events-auto">
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-[20px] px-4 py-3 shadow-xl"
             style={{ minWidth: 230 }}>
          <div className="flex items-center gap-2 mb-2">
            <Mountain className="w-4 h-4 text-[#d4f84c] shrink-0" />
            <span className="text-xs font-black tracking-wider text-white uppercase">3D HIMALAYAN DIGITAL TWIN</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-800/80 rounded-xl px-2 py-1.5 border border-slate-700/60">
              <div className="text-[9px] font-black uppercase text-slate-400 mb-0.5">NODES</div>
              <div className="text-sm font-black font-mono text-white">{nodes.length}</div>
            </div>
            <div className="bg-slate-800/80 rounded-xl px-2 py-1.5 border border-slate-700/60">
              <div className="text-[9px] font-black uppercase text-slate-400 mb-0.5">DROP ARCS</div>
              <div className="text-sm font-black font-mono text-sky-400">{edges.length}</div>
            </div>
            <div className="bg-slate-800/80 rounded-xl px-2 py-1.5 border border-slate-700/60">
              <div className="text-[9px] font-black uppercase text-slate-400 mb-0.5">MAX RISK</div>
              <div className="text-sm font-black font-mono" style={{ color: maxRiskColor }}>{maxRisk}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Top-Right: Camera Presets & Vertical Exaggeration HUD ── */}
      <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2 pointer-events-auto">
        {/* Preset Camera Views */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-full p-1 shadow-xl">
          <button
            onClick={() => setCameraPreset('OVERVIEW')}
            className="px-2.5 py-1 rounded-full text-[10px] font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition uppercase"
            title="Full Corridor Isometric View"
          >
            PANORAMIC
          </button>
          <button
            onClick={() => setCameraPreset('SOLANG')}
            className="px-2.5 py-1 rounded-full text-[10px] font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition uppercase"
            title="Headwaters Solang 2480m"
          >
            SOLANG (2480m)
          </button>
          <button
            onClick={() => setCameraPreset('PARBATI')}
            className="px-2.5 py-1 rounded-full text-[10px] font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition uppercase"
            title="Kasol & Confluence"
          >
            PARBATI
          </button>
          <button
            onClick={() => setCameraPreset('GORGE')}
            className="px-2.5 py-1 rounded-full text-[10px] font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition uppercase"
            title="Looking up canyon from Larji"
          >
            GORGE FLY-IN
          </button>
          <button
            onClick={() => setCameraPreset('TOPDOWN')}
            className="px-2.5 py-1 rounded-full text-[10px] font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition uppercase"
            title="Planar 2.5D View"
          >
            2.5D PLANAR
          </button>
        </div>

        {/* 3D Visual Layer Toggles & Exaggeration Controls */}
        <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl px-3 py-1.5 shadow-xl text-[10px] text-white">
          <span className="text-slate-400 font-bold uppercase text-[9px] flex items-center gap-1">
            <Sliders className="w-3 h-3 text-[#d4f84c]" />
            RELIEF EXAGGERATION:
          </span>
          {[1.0, 1.5, 2.0, 2.5].map(val => (
            <button
              key={val}
              onClick={() => setExaggeration(val)}
              className={`px-2 py-0.5 rounded-md font-mono font-bold transition ${
                exaggeration === val
                  ? 'bg-[#d4f84c] text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {val}x
            </button>
          ))}

          <div className="w-px h-3.5 bg-slate-700 mx-1" />

          {/* Toggle downhill flow particles */}
          <button
            onClick={() => setShowFlowParticles(!showFlowParticles)}
            className={`px-2 py-0.5 rounded-md font-bold uppercase transition ${
              showFlowParticles ? 'bg-sky-500/30 text-sky-300 border border-sky-500/50' : 'text-slate-500 hover:text-slate-300'
            }`}
            title="Toggle animated downhill water/surge pulses"
          >
            PULSES {showFlowParticles ? 'ON' : 'OFF'}
          </button>

          {/* Toggle drop badges */}
          <button
            onClick={() => setShowDropBadges(!showDropBadges)}
            className={`px-2 py-0.5 rounded-md font-bold uppercase transition ${
              showDropBadges ? 'bg-sky-500/30 text-sky-300 border border-sky-500/50' : 'text-slate-500 hover:text-slate-300'
            }`}
            title="Toggle elevation drop callouts"
          >
            Δh DROP
          </button>

          {/* Toggle wireframe */}
          <button
            onClick={() => setShowWireframe(!showWireframe)}
            className={`px-2 py-0.5 rounded-md font-bold uppercase transition ${
              showWireframe ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50' : 'text-slate-500 hover:text-slate-300'
            }`}
            title="Toggle DEM wireframe mesh"
          >
            CONTOUR
          </button>

          {/* Toggle Auto-rotate */}
          <button
            onClick={toggleAutoRotate}
            className={`p-1 rounded-md transition ${
              isAutoRotating ? 'bg-[#d4f84c] text-slate-950' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Auto-rotate scene"
          >
            <Rotate3d className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Bottom-Left: 3D Legend & Fluvial Elevation Scale ── */}
      <div className="absolute bottom-4 left-4 z-20 pointer-events-none select-none">
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl px-4 py-2.5 shadow-xl text-[10px] text-white">
          {/* Vertical drop notice */}
          <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-slate-800">
            <TrendingDown className="w-3.5 h-3.5 text-[#d4f84c]" />
            <span className="font-mono font-bold text-white uppercase">
              1,570m VERTICAL DESCENT · SOLANG (2480m) → LARJI (910m)
            </span>
          </div>

          {/* Risk scale row */}
          <div className="flex items-center gap-3 mb-1.5">
            <span className="text-slate-400 font-black uppercase tracking-wider text-[9px]">STATUS:</span>
            <span className="flex items-center gap-1 font-bold uppercase"><span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 border border-emerald-400" />NORMAL</span>
            <span className="flex items-center gap-1 font-bold uppercase"><span className="inline-block w-2.5 h-2.5 rounded-full bg-yellow-400 border border-yellow-300" />WATCH</span>
            <span className="flex items-center gap-1 font-bold uppercase"><span className="inline-block w-2.5 h-2.5 rounded-full bg-orange-500 border border-orange-400" />WARNING</span>
            <span className="flex items-center gap-1 font-bold uppercase"><span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-500 border border-rose-400" />CRITICAL</span>
          </div>

          {/* 3D symbols row */}
          <div className="flex items-center gap-4 text-slate-400 font-semibold uppercase text-[9px]">
            <span className="flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 14 14"><line x1="2" y1="12" x2="12" y2="2" stroke="#38bdf8" strokeWidth="2.5"/><circle cx="2" cy="12" r="1.5" fill="#38bdf8"/><circle cx="12" cy="2" r="1.5" fill="#38bdf8"/></svg>
              DOWNHILL 3D ARC
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-sky-400 animate-ping" />
              GRAVITY RUNOFF PULSE
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-2 h-3.5 bg-gradient-to-t from-emerald-500/20 to-emerald-400 rounded-sm" />
              ELEVATION PEDESTAL
            </span>
          </div>
        </div>
      </div>

      {/* ── Bottom-Right: Navigation Instructions ── */}
      <div className="absolute bottom-4 right-4 z-20 pointer-events-none select-none">
        <div className="bg-slate-900/90 backdrop-blur-sm border border-slate-700/80 rounded-full px-3.5 py-1 text-[9px] font-bold text-slate-300 uppercase flex items-center gap-2">
          <span>LEFT DRAG: ORBIT</span>
          <span className="text-slate-600">•</span>
          <span>RIGHT DRAG: PAN</span>
          <span className="text-slate-600">•</span>
          <span>SCROLL: ZOOM</span>
          <span className="text-slate-600">•</span>
          <span>CLICK: INSPECT NODE</span>
        </div>
      </div>

      {/* ── Hover Tooltip Card ── */}
      {hoveredNode && hoverPos && (
        <div
          className="absolute z-30 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-3"
          style={{ left: hoverPos.x, top: hoverPos.y }}
        >
          <div className="bg-slate-900/95 backdrop-blur-md border border-slate-600/80 rounded-2xl p-3 shadow-2xl text-xs text-white min-w-[200px]">
            <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-slate-700">
              <span className="font-black text-white uppercase text-[11px]">{hoveredNode.name}</span>
              <span className="px-2 py-0.2 rounded-full text-[9px] font-mono font-black"
                    style={{ backgroundColor: riskColorStr(riskMap[hoveredNode.id]?.riskScore ?? 20), color: '#0f172a' }}>
                {riskMap[hoveredNode.id]?.riskScore ?? '--'}/100
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
              <div>
                <span className="text-slate-400 block text-[9px]">ELEVATION</span>
                <strong className="text-sky-300">{hoveredNode.elevation} m</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[9px]">SLOPE</span>
                <strong className="text-slate-200">{hoveredNode.slope}°</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[9px]">RIVER</span>
                <strong className="text-slate-300 truncate block">{hoveredNode.river.split('/')[0]}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[9px]">STATUS</span>
                <strong className="text-emerald-400">{telemetryMap[hoveredNode.sensorId]?.isOnline ? 'Online' : 'Offline'}</strong>
              </div>
            </div>
            <div className="mt-2 pt-1 border-t border-slate-800 text-[9px] text-[#d4f84c] font-black uppercase text-center">
              CLICK TO OPEN NODE TELEMETRY →
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
