import React, { useEffect, useRef, useMemo, useState } from 'react';
import L from 'leaflet';
import { CorridorNode, CorridorEdge, NodeRiskResult, SensorTelemetry, HistoricalFloodEvent } from '../../types';
import { MapPin, Rotate3d, Layers } from 'lucide-react';
import { CorridorMap3D } from './CorridorMap3D';

interface Props {
  nodes: CorridorNode[];
  edges: CorridorEdge[];
  riskMap: Record<string, NodeRiskResult>;
  telemetryMap: Record<string, SensorTelemetry>;
  selectedNodeId: string;
  onSelectNode: (nodeId: string) => void;
  historicalEvents?: HistoricalFloodEvent[];
  showHistoricalOverlay?: boolean;
}

// ── Color helpers with attractive risk hierarchy ──────────────────
function riskColor(score: number): string {
  if (score >= 75) return '#ef4444'; // Crimson Red
  if (score >= 50) return '#f97316'; // Vivid Orange
  if (score >= 25) return '#eab308'; // Amber Gold
  return '#10b981'; // Emerald Green
}

function riskBorderColor(score: number): string {
  if (score >= 75) return '#b91c1c';
  if (score >= 50) return '#c2410c';
  if (score >= 25) return '#a16207';
  return '#047857';
}

function riskZoneColor(score: number): string {
  if (score >= 75) return 'rgba(239, 68, 68, 0.28)';
  if (score >= 50) return 'rgba(249, 115, 22, 0.22)';
  if (score >= 25) return 'rgba(234, 179, 8, 0.18)';
  return 'rgba(16, 185, 129, 0.14)';
}

function riskZoneStroke(score: number): string {
  if (score >= 75) return '#ef4444';
  if (score >= 50) return '#f97316';
  if (score >= 25) return '#eab308';
  return '#10b981';
}

function riskZoneRadius(score: number): number {
  if (score >= 75) return 1800;
  if (score >= 50) return 1400;
  if (score >= 25) return 1000;
  return 700;
}

// ── Approximate Beas & tributary river waypoints ──────────────────
// These are real-world approximate coordinates along the actual river course
// derived from the node coordinates already in the project data.
// They are NOT fabricated flood boundaries — just cartographic river centrelines.
const BEAS_MAIN_STEM: [number, number][] = [
  [32.330, 77.155],   // above Solang
  [32.315, 77.158],   // Solang Nullah (N01)
  [32.300, 77.162],
  [32.287, 77.168],   // Palchan (N02)
  [32.268, 77.175],
  [32.243, 77.189],   // Manali (N03)
  [32.210, 77.183],
  [32.175, 77.178],
  [32.138, 77.172],   // Naggar (N04)
  [32.100, 77.155],
  [32.062, 77.132],   // Raison (N05)
  [32.020, 77.118],
  [31.958, 77.109],   // Kullu (N06)
  [31.938, 77.118],
  [31.916, 77.126],   // Mohal (N07)
  [31.905, 77.135],
  [31.895, 77.142],   // Shamshi (N09)
  [31.878, 77.153],   // Bhuntar (N10)
  [31.862, 77.155],
  [31.849, 77.158],   // Bajaura (N11)
  [31.820, 77.180],
  [31.785, 77.218],   // Larji (N12)
];

const PARBATI_TRIBUTARY: [number, number][] = [
  [32.060, 77.380],   // upper Parbati
  [32.035, 77.355],
  [32.010, 77.316],   // Kasol (N08)
  [31.990, 77.285],
  [31.968, 77.250],
  [31.945, 77.215],
  [31.920, 77.185],
  [31.895, 77.160],
  [31.878, 77.153],   // merges at Bhuntar (N10)
];

const SOLANG_TRIBUTARY: [number, number][] = [
  [32.350, 77.148],
  [32.335, 77.152],
  [32.315, 77.158],   // Solang Nullah → joins Beas
];

// ── Helper: draw an arrowhead on a polyline ──────────────────────
function createArrowhead(
  from: [number, number],
  to: [number, number],
  color: string,
  layer: L.LayerGroup
) {
  const dx = to[1] - from[1];
  const dy = to[0] - from[0];
  const angle = Math.atan2(dy, dx);
  const arrowLen = 0.008; // length in degrees
  const spread = 0.45;     // ~25°

  const tipLat = to[0];
  const tipLon = to[1];
  const leftLat = tipLat - arrowLen * Math.cos(angle - spread);
  const leftLon = tipLon - arrowLen * Math.sin(angle - spread) / Math.cos(tipLat * Math.PI / 180);
  const rightLat = tipLat - arrowLen * Math.cos(angle + spread);
  const rightLon = tipLon - arrowLen * Math.sin(angle + spread) / Math.cos(tipLat * Math.PI / 180);

  L.polygon(
    [[tipLat, tipLon], [leftLat, leftLon], [rightLat, rightLon]],
    { color, fillColor: color, fillOpacity: 0.9, weight: 1, interactive: false }
  ).addTo(layer);
}

// ══════════════════════════════════════════════════════════════════
// Component
// ══════════════════════════════════════════════════════════════════
export const CorridorMap: React.FC<Props> = ({
  nodes,
  edges,
  riskMap,
  telemetryMap,
  selectedNodeId,
  onSelectNode,
  historicalEvents = [],
  showHistoricalOverlay = false
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Persistent layer groups — we keep them across renders and only clear/redraw content
  const riverLayerRef    = useRef<L.LayerGroup | null>(null);
  const zoneLayerRef     = useRef<L.LayerGroup | null>(null);
  const edgeLayerRef     = useRef<L.LayerGroup | null>(null);
  const labelLayerRef    = useRef<L.LayerGroup | null>(null);
  const nodeLayerRef     = useRef<L.LayerGroup | null>(null);
  const historicalLayerRef = useRef<L.LayerGroup | null>(null);

  const [viewMode, setViewMode] = useState<'2D' | '3D'>('2D');

  // Maximum risk across corridor for header display
  const maxRisk = useMemo(() => {
    return Math.max(0, ...Object.values(riskMap).map(r => r.riskScore));
  }, [riskMap]);

  // Invalidate Leaflet map size when switching back to 2D
  useEffect(() => {
    if (viewMode === '2D' && mapInstanceRef.current) {
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 60);
    }
  }, [viewMode]);

  // ── 1. Initialise map (runs once) ────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [32.04, 77.17],
      zoom: 11,
      minZoom: 9,
      maxZoom: 16,
      zoomControl: false,
      attributionControl: false
    });

    // Zoom control top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Attribution bottom-right (collapsed)
    L.control.attribution({ position: 'bottomright', prefix: false })
      .addAttribution('© <a href="https://openstreetmap.org">OSM</a>')
      .addTo(map);

    // ── BASEMAP: OpenStreetMap standard tiles (no API key required) ──
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      className: 'dd-basemap-tiles'   // we desaturate/darken via CSS
    }).addTo(map);

    // Build layer groups in correct visual order (bottom → top)
    const riverLayer    = L.layerGroup().addTo(map);
    const zoneLayer     = L.layerGroup().addTo(map);
    const edgeLayer     = L.layerGroup().addTo(map);
    const labelLayer    = L.layerGroup().addTo(map);
    const historicalLayer = L.layerGroup().addTo(map);
    const nodeLayer     = L.layerGroup().addTo(map);

    riverLayerRef.current    = riverLayer;
    zoneLayerRef.current     = zoneLayer;
    edgeLayerRef.current     = edgeLayer;
    labelLayerRef.current    = labelLayer;
    historicalLayerRef.current = historicalLayer;
    nodeLayerRef.current     = nodeLayer;
    mapInstanceRef.current   = map;

    // ── Draw rivers (static — only once) ──
    // Beas main stem (clean hydrological blue, no neon glow)
    L.polyline(BEAS_MAIN_STEM, {
      color: '#0284c7', weight: 3.5, opacity: 0.75, smoothFactor: 1.5, interactive: false
    }).addTo(riverLayer);

    // Parbati tributary
    L.polyline(PARBATI_TRIBUTARY, {
      color: '#0284c7', weight: 2.5, opacity: 0.65, smoothFactor: 1.5, interactive: false
    }).addTo(riverLayer);

    // Solang tributary
    L.polyline(SOLANG_TRIBUTARY, {
      color: '#0284c7', weight: 2, opacity: 0.60, smoothFactor: 1.5, interactive: false
    }).addTo(riverLayer);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // ── 2. Draw dynamic layers (runs when state changes) ──────────
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const zoneLayer   = zoneLayerRef.current!;
    const edgeLayer   = edgeLayerRef.current!;
    const labelLayer  = labelLayerRef.current!;
    const nodeLayer   = nodeLayerRef.current!;
    const histLayer   = historicalLayerRef.current!;

    zoneLayer.clearLayers();
    edgeLayer.clearLayers();
    labelLayer.clearLayers();
    nodeLayer.clearLayers();
    histLayer.clearLayers();

    // Build coord lookup
    const coordOf: Record<string, [number, number]> = {};
    nodes.forEach(n => { coordOf[n.id] = [n.lat, n.lon]; });

    // ── A. Risk zones (subtle circles underneath everything) ──
    nodes.forEach(node => {
      const score = riskMap[node.id]?.riskScore ?? 20;
      L.circle([node.lat, node.lon], {
        radius: riskZoneRadius(score),
        color: riskZoneStroke(score),
        fillColor: riskZoneColor(score),
        fillOpacity: 1,
        weight: 1,
        interactive: false
      }).addTo(zoneLayer);
    });

    // ── B. Directed drainage edges with arrowheads ──
    edges.forEach(edge => {
      const src = coordOf[edge.source];
      const tgt = coordOf[edge.target];
      if (!src || !tgt) return;

      const srcScore = riskMap[edge.source]?.riskScore ?? 0;
      const tgtScore = riskMap[edge.target]?.riskScore ?? 0;
      const peak = Math.max(srcScore, tgtScore);

      // Edge styling by risk severity
      let lineColor: string;
      let lineWeight: number;
      let lineOpacity: number;
      let cssClass: string;

      if (peak >= 75) {
        lineColor = '#ef4444';
        lineWeight = 4;
        lineOpacity = 0.85;
        cssClass = 'dd-edge-critical';
      } else if (peak >= 50) {
        lineColor = '#f97316';
        lineWeight = 3.5;
        lineOpacity = 0.75;
        cssClass = 'dd-edge-warning';
      } else if (peak >= 25) {
        lineColor = '#eab308';
        lineWeight = 3;
        lineOpacity = 0.60;
        cssClass = 'dd-edge-watch';
      } else {
        lineColor = '#94a3b8';
        lineWeight = 2.5;
        lineOpacity = 0.45;
        cssClass = 'dd-edge-normal';
      }

      // Faint shadow line for depth
      L.polyline([src, tgt], {
        color: lineColor, weight: lineWeight + 4, opacity: lineOpacity * 0.15,
        interactive: false, className: cssClass
      }).addTo(edgeLayer);

      // Main edge line
      const polyline = L.polyline([src, tgt], {
        color: lineColor,
        weight: lineWeight,
        opacity: lineOpacity,
        lineCap: 'round',
        dashArray: peak >= 50 ? '10 5' : undefined,
        className: cssClass
      });

      polyline.bindTooltip(
        `<div style="font-family:ui-monospace,monospace;font-size:11px;line-height:1.4;padding:2px 0">
          <strong style="color:#f8fafc">${edge.name}</strong><br/>
          <span style="color:#94a3b8">Length:</span> ${edge.lengthKm} km &nbsp;
          <span style="color:#94a3b8">Gradient:</span> ${edge.gradientMpk} m/km<br/>
          <span style="color:#94a3b8">Travel time:</span> ~${edge.travelTimeMin} min
        </div>`,
        { sticky: true, className: 'dd-tooltip' }
      );
      polyline.addTo(edgeLayer);

      // Arrowhead at 70% along the segment (not at node — avoids overlap)
      const midLat = src[0] + (tgt[0] - src[0]) * 0.70;
      const midLon = src[1] + (tgt[1] - src[1]) * 0.70;
      createArrowhead(
        [src[0] + (tgt[0] - src[0]) * 0.55, src[1] + (tgt[1] - src[1]) * 0.55],
        [midLat, midLon],
        lineColor,
        edgeLayer
      );
    });

    // ── C. Location labels (placed offset from nodes) ──
    nodes.forEach(node => {
      const shortName = node.name.replace(/ \(.*\)/, '').replace(' River Station', '').replace(' Heritage Hub', '');
      const score = riskMap[node.id]?.riskScore ?? 20;
      const labelColor = score >= 75 ? '#fca5a5' : score >= 50 ? '#fed7aa' : '#cbd5e1';

      const labelIcon = L.divIcon({
        className: 'dd-label-icon',
        html: `<div class="dd-node-label" style="color:${labelColor}">${shortName}<span class="dd-label-elev">${node.elevation}m</span></div>`,
        iconSize: [0, 0],
        iconAnchor: [-18, 6]
      });
      L.marker([node.lat, node.lon], { icon: labelIcon, interactive: false }).addTo(labelLayer);
    });

    // ── D. Historical flood pins ──
    if (showHistoricalOverlay && historicalEvents.length > 0) {
      historicalEvents.slice(0, 30).forEach(ev => {
        const hIcon = L.divIcon({
          className: 'dd-hist-icon',
          html: `<div class="dd-hist-marker">H</div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        });

        const marker = L.marker([ev.lat, ev.lon], { icon: hIcon });
        marker.bindPopup(
          `<div style="font-family:system-ui;font-size:12px;max-width:220px;line-height:1.45">
            <div style="font-weight:700;color:#7c3aed;margin-bottom:4px">HISTORICAL: ${ev.settlement}</div>
            <div><strong>Year:</strong> ${ev.year} &nbsp; <strong>River:</strong> ${ev.river}</div>
            <div><strong>Process:</strong> ${ev.processType}</div>
            <div><strong>Fatalities:</strong> ${ev.fatalities} &nbsp; <strong>Affected:</strong> ${ev.totalAffected}</div>
            ${ev.notes ? `<div style="color:#6b7280;margin-top:3px;font-size:11px">${ev.notes.slice(0, 90)}…</div>` : ''}
          </div>`,
          { className: 'dd-popup' }
        );
        marker.addTo(histLayer);
      });
    }

    // ── E. Corridor monitoring nodes ──
    nodes.forEach(node => {
      const risk  = riskMap[node.id];
      const tel   = telemetryMap[node.sensorId];
      const score = risk?.riskScore ?? 20;
      const level = risk?.level ?? 'NORMAL';
      const conf  = risk?.confidence ?? 80;
      const isSel = node.id === selectedNodeId;
      const isOff = tel && !tel.isOnline;

      const bg   = riskColor(score);
      const bdr  = isSel ? '#ffffff' : riskBorderColor(score);
      const size = isSel ? 30 : 26;

      // Critical: subtle CSS pulse ring; Warning: slower pulse
      let pulseRing = '';
      if (level === 'CRITICAL') {
        pulseRing = `<div class="dd-pulse-ring" style="border-color:${bg}"></div>`;
      } else if (level === 'WARNING') {
        pulseRing = `<div class="dd-pulse-ring dd-pulse-slow" style="border-color:${bg}"></div>`;
      }

      const html = `
        <div class="dd-node-wrap" style="width:${size + 12}px;height:${size + 12}px">
          ${pulseRing}
          <div class="dd-node-dot" style="
            width:${size}px;height:${size}px;
            background:${bg};
            border:2px solid ${bdr};
            font-size:${isSel ? 12 : 11}px;
          ">${score}</div>
          ${isOff ? '<div class="dd-offline-badge">OFF</div>' : ''}
          ${tel && tel.isOnline ? '<div class="dd-sensor-pip"></div>' : ''}
        </div>`;

      const icon = L.divIcon({
        className: 'dd-node-icon',
        html,
        iconSize: [size + 12, size + 12],
        iconAnchor: [(size + 12) / 2, (size + 12) / 2]
      });

      const marker = L.marker([node.lat, node.lon], { icon, zIndexOffset: isSel ? 1000 : score });
      marker.on('click', () => onSelectNode(node.id));

      // Tooltip
      marker.bindTooltip(
        `<div class="dd-tip">
          <div class="dd-tip-name">${node.name}</div>
          <div class="dd-tip-meta">${node.river} · Elev ${node.elevation} m</div>
          <div class="dd-tip-row">
            <span>Risk</span>
            <strong style="color:${bg}">${score}/100 ${level}</strong>
          </div>
          <div class="dd-tip-row">
            <span>Confidence</span>
            <strong>${conf}%</strong>
          </div>
          <div class="dd-tip-row">
            <span>Rainfall</span>
            <strong>${tel?.rainfall?.toFixed(0) ?? '--'} mm/h</strong>
          </div>
          <div class="dd-tip-row">
            <span>Sensor</span>
            <strong style="color:${isOff ? '#f87171' : '#4ade80'}">${isOff ? 'OFFLINE' : 'Online'}</strong>
          </div>
        </div>`,
        { direction: 'top', offset: [0, -(size / 2 + 6)], className: 'dd-tooltip' }
      );

      marker.addTo(nodeLayer);
    });

  }, [nodes, edges, riskMap, telemetryMap, selectedNodeId, showHistoricalOverlay, historicalEvents, onSelectNode]);

  // ── 3. Render JSX overlay chrome ────────────────────────────
  const maxRiskColor = riskColor(maxRisk);

  return (
    <div className="relative w-full h-full min-h-[520px] rounded-[28px] overflow-hidden border border-slate-200/60 shadow-sm bg-slate-900">
      {/* ── Top-Center / Right: 2D GIS / 3D DIGITAL TWIN SWITCHER (Always Visible) ── */}
      <div className="absolute top-4 right-14 z-[1001] pointer-events-auto select-none">
        <div className="flex items-center gap-1 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-full p-1 shadow-2xl">
          <button
            onClick={() => setViewMode('2D')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black tracking-wider uppercase transition-all duration-150 ${
              viewMode === '2D'
                ? 'bg-sky-500 text-slate-950 shadow-md scale-105'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>2D GIS MAP</span>
          </button>
          <button
            onClick={() => setViewMode('3D')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black tracking-wider uppercase transition-all duration-150 ${
              viewMode === '3D'
                ? 'bg-[#d4f84c] text-slate-950 shadow-md scale-105'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Rotate3d className="w-3.5 h-3.5" />
            <span>3D DIGITAL TWIN</span>
          </button>
        </div>
      </div>

      {/* ═══ 2D LEAFLET MAP VIEW ═══ */}
      <div className={`w-full h-full relative ${viewMode === '2D' ? 'block' : 'hidden'}`}>
        {/* Leaflet canvas */}
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* ── Top-left: corridor information card (IN CAPS) ── */}
        <div className="absolute top-4 left-4 z-[1000] pointer-events-auto select-none">
          <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-[20px] px-4 py-3 shadow-xl"
               style={{ minWidth: 230 }}>
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-sky-400 shrink-0" />
              <span className="text-xs font-black tracking-wider text-white uppercase">UPPER BEAS CORRIDOR</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-800/80 rounded-xl px-2 py-1.5 border border-slate-700/60">
                <div className="text-[9px] font-black uppercase text-slate-400 mb-0.5">NODES</div>
                <div className="text-sm font-black font-mono text-white">{nodes.length}</div>
              </div>
              <div className="bg-slate-800/80 rounded-xl px-2 py-1.5 border border-slate-700/60">
                <div className="text-[9px] font-black uppercase text-slate-400 mb-0.5">EDGES</div>
                <div className="text-sm font-black font-mono text-sky-400">{edges.length}</div>
              </div>
              <div className="bg-slate-800/80 rounded-xl px-2 py-1.5 border border-slate-700/60">
                <div className="text-[9px] font-black uppercase text-slate-400 mb-0.5">MAX RISK</div>
                <div className="text-sm font-black font-mono" style={{ color: maxRiskColor }}>{maxRisk}</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom-left: compact legend (IN CAPS) ── */}
        <div className="absolute bottom-4 left-4 z-[1000] pointer-events-none select-none">
          <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl px-4 py-2.5 shadow-xl text-[10px] text-white">
            {/* Risk scale row */}
            <div className="flex items-center gap-3 mb-1.5">
              <span className="text-slate-400 font-black uppercase tracking-wider text-[9px]">RISK SCALE:</span>
              <span className="flex items-center gap-1 font-bold uppercase"><span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 border border-emerald-400" />NORMAL 0–24</span>
              <span className="flex items-center gap-1 font-bold uppercase"><span className="inline-block w-2.5 h-2.5 rounded-full bg-yellow-400 border border-yellow-300" />WATCH 25–49</span>
              <span className="flex items-center gap-1 font-bold uppercase"><span className="inline-block w-2.5 h-2.5 rounded-full bg-orange-500 border border-orange-400" />WARNING 50–74</span>
              <span className="flex items-center gap-1 font-bold uppercase"><span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-500 border border-rose-400" />CRITICAL 75–100</span>
            </div>
            {/* Graph & river row */}
            <div className="flex items-center gap-4 text-slate-400 font-semibold uppercase text-[9px]">
              <span className="flex items-center gap-1">
                <svg width="16" height="8"><line x1="0" y1="4" x2="16" y2="4" stroke="#0284c7" strokeWidth="2.5" opacity="0.9"/></svg>
                RIVER BEAS
              </span>
              <span className="flex items-center gap-1">
                <svg width="16" height="8"><line x1="0" y1="4" x2="12" y2="4" stroke="#38bdf8" strokeWidth="2"/><polygon points="12,1 16,4 12,7" fill="#38bdf8"/></svg>
                UPSTREAM → DOWNSTREAM
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 6px #10b981' }} />
                SENSOR ONLINE
              </span>
            </div>
          </div>
        </div>

        {/* ── Prototype badge (IN CAPS) ── */}
        <div className="absolute bottom-4 right-4 z-[1000] pointer-events-none select-none">
          <div className="bg-slate-900/90 backdrop-blur-sm border border-slate-700/80 rounded-full px-3 py-1 text-[9px] font-bold text-slate-300 uppercase">
            PROTOTYPE RISK ZONES · REAL-TIME SENSORS
          </div>
        </div>
      </div>

      {/* ═══ 3D HIGH-FIDELITY DIGITAL TWIN VIEW ═══ */}
      {viewMode === '3D' && (
        <CorridorMap3D
          nodes={nodes}
          edges={edges}
          riskMap={riskMap}
          telemetryMap={telemetryMap}
          selectedNodeId={selectedNodeId}
          onSelectNode={onSelectNode}
        />
      )}
    </div>
  );
};
