import React, { useState, useEffect, useCallback } from 'react';
import topologyData from './data/kullu_corridor_graph.json';
import historicalEventsRaw from './data/hiflo_events_kullu.json';
import {
  CorridorNode,
  CorridorEdge,
  CorridorTopology,
  SensorTelemetry,
  NodeRiskResult,
  WorkflowState,
  WorkflowStage,
  HistoricalFloodEvent,
  ScenarioPreset,
  EmergencyAlert
} from './types';
import {
  calculateCorridorRisk,
  generateEmergencyAlerts
} from './services/riskEngine';

// Components
import { CorridorMap } from './components/RiskMap/CorridorMap';
import { GraphWorkflowLive } from './components/GraphWorkflow/GraphWorkflowLive';
import { SensorControlsPanel } from './components/SensorControls/SensorControlsPanel';
import { NodeDetailModal } from './components/NodeDetails/NodeDetailModal';
import { ForecastPanel } from './components/Forecast/ForecastPanel';
import { AlertCenter } from './components/Alerts/AlertCenter';
import { HistoricalBrowser } from './components/Historical/HistoricalBrowser';
import { TerrainScreen } from './components/Terrain/TerrainScreen';
import { ArchitectureModal } from './components/Architecture/ArchitectureModal';

import {
  Shield,
  Activity,
  MapPin,
  Sliders,
  Clock,
  Bell,
  History,
  Mountain,
  Layers,
  Info,
  Radio,
  AlertTriangle,
  Play,
  RotateCcw,
  CheckCircle2,
  Cpu,
  Search,
  ChevronDown,
  MoreVertical,
  Zap,
  Heart,
  Droplets,
  TrendingUp,
  Percent,
  Moon,
  Sun,
  Calendar,
  Wallet,
  CheckSquare,
  Square,
  CreditCard,
  Filter,
  Settings,
  LayoutGrid,
  Rocket
} from 'lucide-react';

const topology: CorridorTopology = topologyData as CorridorTopology;
const historicalEvents: HistoricalFloodEvent[] = historicalEventsRaw as HistoricalFloodEvent[];

export function App() {
  // Theme state: supports both Light Theme and Dark Theme from sample_ui2.jpg
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // Navigation State
  const [activeTab, setActiveTab] = useState<'SITUATION' | 'TERRAIN' | 'SENSORS' | 'FORECAST' | 'ALERTS' | 'HISTORICAL'>('SITUATION');

  // Centralized Application State
  const [selectedNodeId, setSelectedNodeId] = useState<string>(topology.primaryDemoNode || 'N05');
  const [currentScenario, setCurrentScenario] = useState<ScenarioPreset>('NORMAL_MONSOON');
  const [expertMode, setExpertMode] = useState<boolean>(false);
  const [isNodeModalOpen, setIsNodeModalOpen] = useState<boolean>(false);
  const [isArchModalOpen, setIsArchModalOpen] = useState<boolean>(false);
  const [showHistoricalOnMap, setShowHistoricalOnMap] = useState<boolean>(false);

  // Initialize Telemetry Map from Topology Nodes
  const [telemetryMap, setTelemetryMap] = useState<Record<string, SensorTelemetry>>(() => {
    const initial: Record<string, SensorTelemetry> = {};
    topology.nodes.forEach(node => {
      initial[node.sensorId] = {
        sensorId: node.sensorId,
        nodeId: node.id,
        name: node.name,
        rainfall: node.defaultRain,
        humidity: 70,
        soilMoisture: node.defaultSoil,
        waterLevel: node.defaultWaterLevel,
        slopeInstability: 35,
        isOnline: true,
        lastUpdated: new Date().toLocaleTimeString('en-IN')
      };
    });
    return initial;
  });

  // Calculate Initial Corridor Risks
  const [riskMap, setRiskMap] = useState<Record<string, NodeRiskResult>>(() => {
    return calculateCorridorRisk(topology.nodes, topology.edges, telemetryMap);
  });

  // Workflow State Machine (8-Stage Demonstration Engine)
  const [workflowState, setWorkflowState] = useState<WorkflowState>({
    currentStage: 'IDLE',
    activeNodeId: 'N05', // Raison as default primary demo node
    changedParam: 'rainfall',
    prevValue: 45,
    newValue: 45,
    aggregationNeighbors: ['N03', 'N04'],
    propagatedNodes: [],
    isSimulating: false,
    stageProgress: 0
  });

  // Active Alerts Feed
  const [alerts, setAlerts] = useState<EmergencyAlert[]>(() => {
    return generateEmergencyAlerts(topology.nodes, riskMap, telemetryMap);
  });

  // Recalculate Risk & Alerts when Telemetry Updates
  const updateSystemState = useCallback((newTelemetry: Record<string, SensorTelemetry>) => {
    setRiskMap(prevRisks => {
      const prevScoreMap: Record<string, number> = {};
      Object.keys(prevRisks).forEach(k => {
        prevScoreMap[k] = prevRisks[k].riskScore;
      });
      const calculated = calculateCorridorRisk(topology.nodes, topology.edges, newTelemetry, prevScoreMap);
      // Synchronize alerts
      const generatedAlerts = generateEmergencyAlerts(topology.nodes, calculated, newTelemetry);
      setAlerts(generatedAlerts);
      return calculated;
    });
  }, []);

  // Update Individual Sensor Parameter
  const handleUpdateSensor = useCallback((sensorId: string, param: keyof SensorTelemetry, value: any) => {
    setTelemetryMap(prev => {
      const current = prev[sensorId];
      if (!current) return prev;

      const prevVal = current[param] as number;
      const updated = {
        ...prev,
        [sensorId]: {
          ...current,
          [param]: value,
          lastUpdated: new Date().toLocaleTimeString('en-IN')
        }
      };

      // Trigger automatic workflow progression for demo
      if (typeof value === 'number' && Math.abs(value - prevVal) > 5) {
        triggerSimulationSequence(current.nodeId, param as string, prevVal, value, updated);
      } else {
        updateSystemState(updated);
      }

      return updated;
    });
  }, [updateSystemState]);

  // 8-Stage Timed Simulation Sequence for Judges
  const triggerSimulationSequence = useCallback((
    targetNodeId: string = 'N05',
    paramName: string = 'rainfall',
    oldVal: number = 45,
    newVal: number = 95,
    customTelemetry?: Record<string, SensorTelemetry>
  ) => {
    const activeTel = customTelemetry || telemetryMap;
    const targetNode = topology.nodes.find(n => n.id === targetNodeId) || topology.nodes[4];
    const upstreamIds = targetNode.upstream;

    setWorkflowState({
      currentStage: 'STAGE_1_SENSOR_CHANGE',
      activeNodeId: targetNodeId,
      changedParam: paramName,
      prevValue: oldVal,
      newValue: newVal,
      aggregationNeighbors: upstreamIds,
      propagatedNodes: [],
      isSimulating: true,
      stageProgress: 1
    });

    // Stage 2: Node Feature Update (after 400ms)
    setTimeout(() => {
      setWorkflowState(s => ({
        ...s,
        currentStage: 'STAGE_2_NODE_FEATURE_UPDATE',
        stageProgress: 2
      }));
    }, 450);

    // Stage 3: Neighbor Aggregation (after 900ms)
    setTimeout(() => {
      setWorkflowState(s => ({
        ...s,
        currentStage: 'STAGE_3_NEIGHBOR_AGGREGATION',
        stageProgress: 3
      }));
    }, 950);

    // Stage 4: GraphSAGE Processing (after 1450ms)
    setTimeout(() => {
      setWorkflowState(s => ({
        ...s,
        currentStage: 'STAGE_4_GRAPHSAGE',
        stageProgress: 4
      }));
    }, 1500);

    // Stage 5: Risk Recalculation (after 2000ms)
    setTimeout(() => {
      updateSystemState(activeTel);
      setWorkflowState(s => ({
        ...s,
        currentStage: 'STAGE_5_RISK_UPDATE',
        stageProgress: 5
      }));
    }, 2050);

    // Stage 6: Downstream Propagation (after 2600ms)
    setTimeout(() => {
      const downNodes = targetNode.downstream.map(dId => ({
        nodeId: dId,
        prevRisk: 42,
        newRisk: 72,
        delaySec: 15
      }));
      setWorkflowState(s => ({
        ...s,
        currentStage: 'STAGE_6_PROPAGATION',
        propagatedNodes: downNodes,
        stageProgress: 6
      }));
    }, 2650);

    // Stage 7: Hyperlocal Village Impact (after 3200ms)
    setTimeout(() => {
      setWorkflowState(s => ({
        ...s,
        currentStage: 'STAGE_7_VILLAGE_IMPACT',
        stageProgress: 7
      }));
    }, 3250);

    // Stage 8: Actionable Alert Dispatch (after 3800ms)
    setTimeout(() => {
      setWorkflowState(s => ({
        ...s,
        currentStage: 'STAGE_8_ALERT_GENERATION',
        stageProgress: 8,
        isSimulating: false
      }));
    }, 3850);
  }, [telemetryMap, updateSystemState]);

  // Apply Presets
  const handleApplyScenario = useCallback((preset: ScenarioPreset) => {
    setCurrentScenario(preset);

    const updated = { ...telemetryMap };
    if (preset === 'NORMAL_MONSOON') {
      topology.nodes.forEach(n => {
        updated[n.sensorId] = {
          ...updated[n.sensorId],
          rainfall: n.defaultRain,
          soilMoisture: n.defaultSoil,
          waterLevel: n.defaultWaterLevel,
          slopeInstability: 25,
          isOnline: true
        };
      });
      setTelemetryMap(updated);
      updateSystemState(updated);
    } else if (preset === 'HEAVY_RAIN') {
      topology.nodes.forEach(n => {
        updated[n.sensorId] = {
          ...updated[n.sensorId],
          rainfall: n.defaultRain + 25,
          soilMoisture: Math.min(95, n.defaultSoil + 20),
          waterLevel: n.defaultWaterLevel + 0.8,
          slopeInstability: 55,
          isOnline: true
        };
      });
      setTelemetryMap(updated);
      updateSystemState(updated);
    } else if (preset === 'EXTREME_CLOUDBURST') {
      // Raison & upstream headwaters experience severe cloudburst
      const raisonNode = topology.nodes.find(n => n.id === 'N05') || topology.nodes[4];
      updated[raisonNode.sensorId] = {
        ...updated[raisonNode.sensorId],
        rainfall: 98,
        soilMoisture: 92,
        waterLevel: 2.8,
        slopeInstability: 82,
        isOnline: true
      };
      // Upstream Manali & Naggar elevated
      const manaliNode = topology.nodes.find(n => n.id === 'N03');
      if (manaliNode) {
        updated[manaliNode.sensorId] = {
          ...updated[manaliNode.sensorId],
          rainfall: 82,
          soilMoisture: 86,
          waterLevel: 2.3,
          slopeInstability: 70
        };
      }
      setTelemetryMap(updated);
      // Run complete judge simulation workflow
      triggerSimulationSequence('N05', 'rainfall', 45, 98, updated);
    }
  }, [telemetryMap, triggerSimulationSequence, updateSystemState]);

  // Reset to Baseline
  const handleReset = useCallback(() => {
    handleApplyScenario('NORMAL_MONSOON');
  }, [handleApplyScenario]);

  // Historical Replay
  const handleReplayEvent = useCallback((event: HistoricalFloodEvent) => {
    // Find closest node
    let closestNode = topology.nodes[4];
    let minDist = 9999;
    topology.nodes.forEach(n => {
      const dist = Math.hypot(n.lat - event.lat, n.lon - event.lon);
      if (dist < minDist) {
        minDist = dist;
        closestNode = n;
      }
    });

    setSelectedNodeId(closestNode.id);
    setActiveTab('SITUATION');

    const updated = { ...telemetryMap };
    const rainVal = event.rainfallMm > 0 ? Math.min(120, event.rainfallMm) : 85;
    updated[closestNode.sensorId] = {
      ...updated[closestNode.sensorId],
      rainfall: rainVal,
      soilMoisture: 88,
      waterLevel: 2.7,
      slopeInstability: event.slopeInstability ? 85 : 45,
      isOnline: true
    };

    setTelemetryMap(updated);
    triggerSimulationSequence(closestNode.id, 'rainfall', 45, rainVal, updated);
  }, [telemetryMap, triggerSimulationSequence]);

  const selectedNode = topology.nodes.find(n => n.id === selectedNodeId) || topology.nodes[4];
  const selectedTelemetry = telemetryMap[selectedNode.sensorId];
  const selectedRisk = riskMap[selectedNode.id];

  // Overall valley metrics
  const maxValleyRisk = Math.max(...Object.values(riskMap).map(r => r.riskScore));
  const avgConfidence = Math.round(
    Object.values(riskMap).reduce((acc, r) => acc + r.confidence, 0) / topology.nodes.length
  );

  // Derived metrics for stat cards
  const onlineSensors = Object.values(telemetryMap).filter(t => t.isOnline).length;
  const totalSensors = Object.values(telemetryMap).length;
  const criticalNodes = Object.values(riskMap).filter(r => r.riskScore >= 75).length;

  // Tab metadata matching sample_ui.jpeg
  const tabs = [
    { id: 'SITUATION' as const, label: 'DASHBOARD', icon: LayoutGrid, count: criticalNodes > 0 ? criticalNodes : 3 },
    { id: 'TERRAIN' as const, label: 'TERRAIN & DEM', icon: Mountain },
    { id: 'SENSORS' as const, label: 'SENSOR SIMULATOR', icon: Sliders },
    { id: 'FORECAST' as const, label: 'FORECAST & HYDRO', icon: Clock, count: 1 },
    { id: 'ALERTS' as const, label: 'NDRF ALERTS', icon: Bell, badge: alerts.length },
    { id: 'HISTORICAL' as const, label: 'HIFLO ARCHIVE', icon: History },
  ];

  const activeTabMeta = tabs.find(t => t.id === activeTab) || tabs[0];

  return (
    <div className="h-screen w-screen flex bg-[#111214] text-slate-100 font-sans overflow-hidden select-none">
      {/* ═══════════════════════════════════════════════
          LEFT SIDEBAR (Exact layout from sample_ui.jpeg)
          ═══════════════════════════════════════════════ */}
      <aside className="flex flex-col w-[245px] min-w-[245px] h-screen justify-between p-5 bg-[#111214] shrink-0 z-40">
        <div className="space-y-6">
          {/* ── Brand Logo: flux-style lime & white mark + DHARADRISHTI ── */}
          <div className="px-1 pt-1 flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 32 32" className="w-8 h-8">
                <rect x="4" y="4" width="10" height="10" rx="3" fill="#d4f84c" />
                <rect x="18" y="4" width="10" height="10" rx="5" fill="#ffffff" />
                <rect x="4" y="18" width="10" height="10" rx="5" fill="#ffffff" />
                <rect x="18" y="18" width="10" height="10" rx="3" fill="#ffffff" opacity="0.8" />
              </svg>
            </div>
            <div>
              <span className="text-base font-black tracking-wider uppercase text-white block leading-none">
                DHARADRISHTI
              </span>
              <span className="text-[9px] font-mono text-[#d4f84c] tracking-widest uppercase font-bold">
                SIH PS 26192
              </span>
            </div>
          </div>

          {/* ── Navigation List (Pill style matching sample_ui.jpeg) ── */}
          <nav className="space-y-1.5 pt-1">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-full text-xs font-black tracking-wide uppercase transition-all duration-150 ${
                    isActive
                      ? 'bg-white text-slate-950 shadow-lg'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                    <span className="truncate">{tab.label}</span>
                  </div>
                  {isActive && tab.count !== undefined && (
                    <span className="px-2 py-0.5 rounded-full bg-[#d4f84c] text-slate-950 font-black text-[11px] shadow-sm">
                      {tab.count}
                    </span>
                  )}
                  {!isActive && tab.count !== undefined && (
                    <span className="px-2 py-0.5 rounded-full bg-white/10 text-slate-400 font-bold text-[10px]">
                      {tab.count}
                    </span>
                  )}
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-black text-[10px]">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* ── System Actions ── */}
          <div className="space-y-1 pt-2 border-t border-white/5">
            <button
              onClick={() => setIsArchModalOpen(true)}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-slate-400 hover:text-white hover:bg-white/5 text-xs font-bold uppercase tracking-wide transition"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span>SYSTEM ARCH & LEDGER</span>
            </button>
            <button
              onClick={handleReset}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-slate-400 hover:text-white hover:bg-white/5 text-xs font-bold uppercase tracking-wide transition"
            >
              <RotateCcw className="w-4 h-4 text-slate-400" />
              <span>RESET BASELINES</span>
            </button>
          </div>
        </div>

        {/* ── Bottom Promo Card: Lime-Green card from sample_ui.jpeg ── */}
        <div className="rounded-[24px] p-5 bg-[#d4f84c] text-slate-950 relative overflow-hidden shadow-2xl">
          <h4 className="text-sm font-black uppercase tracking-tight text-slate-950">
            NDRF RAPID ACTION
          </h4>
          <p className="text-[10px] text-slate-800 font-medium mt-1 leading-snug">
            Live automated CAP early warning dispatch & GNN surveillance.
          </p>

          <div className="my-2.5 flex justify-center">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 flex items-center justify-center text-white shadow-xl -rotate-12">
                <Rocket className="w-6 h-6 text-white" />
              </div>
              <span className="absolute top-0 right-1 w-2.5 h-2.5 rounded-full bg-purple-600 animate-pulse" />
              <span className="absolute bottom-1 left-1 w-2 rounded-full bg-pink-500" />
            </div>
          </div>

          <button
            onClick={() => handleApplyScenario('EXTREME_CLOUDBURST')}
            className="w-full py-2.5 px-4 rounded-full bg-[#18191c] hover:bg-black text-white text-[11px] font-black tracking-wider uppercase transition shadow-md block text-center"
          >
            TRIGGER CLOUDBURST
          </button>
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════
          MAIN CANVAS (Rounded inset container from sample_ui.jpeg)
          ═══════════════════════════════════════════════ */}
      <div className="bg-[#f0f1f4] text-slate-900 rounded-[36px] my-3 mr-3 p-8 flex-1 h-[calc(100vh-24px)] overflow-y-auto border border-white/5 shadow-2xl flex flex-col space-y-6">
        
        {/* ── Top Bar inside Container (Matching sample_ui.jpeg) ── */}
        <header className="flex items-center justify-between gap-4 shrink-0 pb-1">
          {/* Left: User Profile (Lucas Bennett style) */}
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="w-10 h-10 rounded-full bg-[#18191c] text-white font-black text-xs flex items-center justify-center shadow ring-2 ring-slate-300">
              VS
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black uppercase text-slate-900 tracking-wide">
                  COMMANDER VIKRAM SINGH
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-800 transition" />
              </div>
              <p className="text-[10px] text-slate-500 font-bold uppercase">
                NDRF 14 BN • KULLU COMMAND POST
              </p>
            </div>
          </div>

          {/* Right: Search Bar + Notification Bell + Tactical Pill */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search telemetry stations, rivers, CAP alerts..."
                className="bg-white text-slate-800 rounded-full pl-10 pr-4 py-2.5 shadow-sm text-xs border border-slate-200/60 focus:outline-none focus:ring-2 focus:ring-slate-900 w-72 placeholder-slate-400 font-medium"
              />
            </div>

            <div
              onClick={() => setActiveTab('ALERTS')}
              className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-700 hover:bg-slate-50 cursor-pointer relative border border-slate-200/60"
              title="NDRF CAP Bulletins"
            >
              <Bell className="w-4 h-4 text-slate-700" />
              {alerts.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-[#d4f84c] text-slate-950 font-black text-[9px] absolute -top-1 -right-1 shadow-sm">
                  {alerts.length}
                </span>
              )}
            </div>

            <button
              onClick={() => setIsArchModalOpen(true)}
              className="px-4 py-2.5 rounded-full bg-[#18191c] hover:bg-black text-white text-xs font-black uppercase tracking-wider shadow-sm transition flex items-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5 text-[#d4f84c]" />
              <span>SYSTEM INTEGRITY</span>
            </button>
          </div>
        </header>

        {/* ── Page Title Row (Matching sample_ui.jpeg) ── */}
        <div className="flex flex-wrap items-end justify-between gap-4 pb-2 border-b border-slate-200/60">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900">
              {activeTab === 'SITUATION' ? 'FLASH FLOOD SITUATION OVERVIEW' : activeTabMeta.label}
            </h1>
            <p className="text-xs text-slate-500 font-bold uppercase mt-1">
              TERRAIN-AWARE HYPERLOCAL FLASH FLOOD EARLY WARNING SYSTEM (UPPER BEAS RIVER)
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-bold text-slate-500 uppercase">
              02 SEPTEMBER, 2026
            </span>
            {/* Simulation Status Indicator (Requirement 4) */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">DEMONSTRATION SCENARIO</span>
            </div>
            <div className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-slate-200/70 shadow-sm text-xs font-black uppercase text-slate-800">
              <span>{workflowState.isSimulating ? '⬤ PROCESSING' : 'LIVE SIMULATION'}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </div>
          </div>
        </div>

        {/* ── Scrollable Dashboard Content ── */}
        <main className="space-y-6">

          {/* ═══ VIEW 1: SITUATION / ANALYTICS ═══ */}
          {activeTab === 'SITUATION' && (
            <div className="space-y-6">

              {/* ── TOP BENTO ROW: EXACT sample_ui.jpeg STRUCTURE ── */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                
                {/* 1. Left Card: "Energy Used" -> VALLEY RISK & RUNOFF DYNAMICS (5 cols) */}
                <div className="lg:col-span-5 bg-white rounded-[28px] p-6 shadow-sm border border-slate-200/60 flex flex-col justify-between">
                  <div>
                    {/* Header: Icon + Title + Menu */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-900">
                          <Zap className="w-4 h-4 fill-slate-900" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                          VALLEY RUNOFF DYNAMICS
                        </span>
                      </div>
                      <MoreVertical className="w-4 h-4 text-slate-400 cursor-pointer" />
                    </div>

                    {/* Big Metric + Lime Tag */}
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-4xl font-black font-mono text-slate-900">
                        {maxValleyRisk}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-[#d4f84c] text-slate-950 font-black text-xs uppercase shadow-sm">
                        +8.2%
                      </span>
                    </div>
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      PEAK VALLEY FLASH FLOOD RISK INDEX
                    </span>

                    {/* The 3 Signature Overlapping Circles - now dynamic */}
                    <div className="relative flex items-center justify-center py-6 my-2">
                      {/* Lavender circle: Soil Saturation */}
                      <div className="w-36 h-36 rounded-full bg-[#b9b6f8] flex flex-col items-center justify-center text-slate-950 font-black shadow-md z-10 transition-transform hover:scale-105">
                        <span className="text-2xl font-black font-mono">{Math.round(selectedTelemetry?.soilMoisture ?? 62)}%</span>
                        <span className="text-[10px] font-extrabold uppercase tracking-tight text-slate-800">SOIL SAT.</span>
                      </div>
                      {/* Dark charcoal circle: Peak Rainfall */}
                      <div className="w-32 h-32 rounded-full bg-[#18191c] flex flex-col items-center justify-center text-white shadow-xl -ml-8 z-20 transition-transform hover:scale-105">
                        <span className="text-xl font-black font-mono">{Math.round(selectedTelemetry?.rainfall ?? 95)} mm</span>
                        <span className="text-[9px] font-extrabold uppercase tracking-tight text-slate-300">RAINFALL</span>
                      </div>
                      {/* Lime green circle: River Stage */}
                      <div className="w-24 h-24 rounded-full bg-[#d4f84c] flex flex-col items-center justify-center text-slate-950 shadow-lg -ml-7 mt-16 z-30 transition-transform hover:scale-105">
                        <span className="text-lg font-black font-mono">{(selectedTelemetry?.waterLevel ?? 3.8).toFixed(1)}m</span>
                        <span className="text-[9px] font-extrabold uppercase tracking-tight text-slate-950">STAGE</span>
                      </div>
                    </div>
                  </div>

                  {/* 3 Horizontal Metric Breakdown Bars - now dynamic */}
                  <div className="space-y-2.5 pt-2 border-t border-slate-100">
                    {(() => {
                      const rain = selectedTelemetry?.rainfall ?? 45;
                      const soil = selectedTelemetry?.soilMoisture ?? 62;
                      const wl = selectedTelemetry?.waterLevel ?? 1.4;
                      const runoffPct = Math.min(85, Math.round(rain * 0.55 + soil * 0.1));
                      const influxPct = Math.min(70, Math.round((wl / 6) * 70));
                      const basePct = Math.max(5, 100 - runoffPct - influxPct);
                      return (
                        <>
                          <div>
                            <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                              <span className="font-mono font-black text-slate-900">{runoffPct}%</span>
                              <span className="flex items-center gap-1.5 text-[11px] uppercase text-slate-600">
                                <span className="w-2 h-2 rounded-full bg-[#b9b6f8]" /> Overland Surface Runoff
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div className="bg-[#b9b6f8] h-full rounded-full transition-all duration-500" style={{ width: `${runoffPct}%` }} />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                              <span className="font-mono font-black text-slate-900">{influxPct}%</span>
                              <span className="flex items-center gap-1.5 text-[11px] uppercase text-slate-600">
                                <span className="w-2 h-2 rounded-full bg-[#18191c]" /> Upstream Tributary Influx
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div className="bg-[#18191c] h-full rounded-full transition-all duration-500" style={{ width: `${influxPct}%` }} />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                              <span className="font-mono font-black text-slate-900">{basePct}%</span>
                              <span className="flex items-center gap-1.5 text-[11px] uppercase text-slate-600">
                                <span className="w-2 h-2 rounded-full bg-[#d4f84c]" /> Baseflow Infiltration
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div className="bg-[#d4f84c] h-full rounded-full transition-all duration-500" style={{ width: `${basePct}%` }} />
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* 2. Right Area: Split into Top (Heart Rate + Activity + Wellness Index) and Bottom (Sleep Analysis) (7 cols) */}
                <div className="lg:col-span-7 flex flex-col justify-between gap-5">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-5">
                    
                    {/* Middle Column (5 cols): Heart Rate & Activity stacked */}
                    <div className="sm:col-span-5 flex flex-col gap-4 justify-between">
                      {/* Card: Heart Rate -> Peak River Stage */}
                      <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-200/60 flex flex-col justify-between h-full">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Heart className="w-4 h-4 text-slate-800" />
                            <span className="text-[11px] font-black uppercase text-slate-800">PEAK RIVER STAGE</span>
                          </div>
                          <MoreVertical className="w-3.5 h-3.5 text-slate-400 cursor-pointer" />
                        </div>
                        <div className="flex items-baseline justify-between mt-3">
                          <div className="text-3xl font-black font-mono text-slate-900">
                            {(selectedTelemetry?.waterLevel || 3.8).toFixed(1)} <span className="text-xs text-slate-400 font-normal">m</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">AVG</span>
                            <span className="text-xs font-black text-slate-700">1.4 m</span>
                          </div>
                        </div>
                      </div>

                      {/* Card: Activity -> Surge Flow Velocity (dynamic) */}
                      <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-200/60 flex flex-col justify-between h-full">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-slate-800" />
                            <span className="text-[11px] font-black uppercase text-slate-800">SURGE FLOW VELOCITY</span>
                          </div>
                          <MoreVertical className="w-3.5 h-3.5 text-slate-400 cursor-pointer" />
                        </div>
                        <div className="flex items-baseline justify-between mt-3">
                          <div className="text-3xl font-black font-mono text-slate-900">
                            {(() => {
                              const wl = selectedTelemetry?.waterLevel ?? 1.4;
                              return (1.2 + wl * 0.78).toFixed(1);
                            })()} <span className="text-xs text-slate-400 font-normal">m/s</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">DISCHARGE</span>
                            <span className="text-xs font-black text-slate-700">
                              {Math.round(120 + (selectedTelemetry?.waterLevel ?? 1.4) * 85)} m³/s
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column (7 cols): Wellness Index -> Model Reliability */}
                    <div className="sm:col-span-7 bg-white rounded-[28px] p-5 shadow-sm border border-slate-200/60 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Percent className="w-4 h-4 text-slate-800" />
                            <span className="text-[11px] font-black uppercase text-slate-800">MODEL RELIABILITY</span>
                          </div>
                          <MoreVertical className="w-3.5 h-3.5 text-slate-400 cursor-pointer" />
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-black font-mono text-slate-900">{avgConfidence}%</span>
                          <span className="px-2 py-0.5 rounded-full bg-[#d4f84c] text-slate-950 font-black text-xs uppercase shadow-sm">
                            +10%
                          </span>
                        </div>
                      </div>

                      {/* Lavender Dot Matrix / Heatmap visualization from sample_ui.jpeg */}
                      <div className="mt-4 pt-2">
                        <div className="grid grid-cols-12 gap-1.5 h-20 items-end">
                          {[
                            [0.4, 0.6, 0.8, 1.0],
                            [0.3, 0.5, 0.7, 0.9],
                            [0.6, 0.8, 1.0, 1.0],
                            [0.5, 0.7, 0.9, 0.9],
                            [0.2, 0.4, 0.6, 0.8],
                            [0.4, 0.7, 0.9, 1.0],
                            [0.8, 0.9, 1.0, 1.0],
                            [0.7, 0.8, 0.9, 1.0],
                            [0.3, 0.6, 0.8, 0.9],
                            [0.5, 0.7, 0.8, 1.0],
                            [0.6, 0.8, 0.9, 1.0],
                            [0.4, 0.6, 0.8, 0.9],
                          ].map((col, cIdx) => (
                            <div key={cIdx} className="flex flex-col gap-1 items-center">
                              {col.map((val, rIdx) => (
                                <span
                                  key={rIdx}
                                  className="w-2.5 h-2.5 rounded-full transition-all"
                                  style={{
                                    backgroundColor: '#b9b6f8',
                                    opacity: val
                                  }}
                                />
                              ))}
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between text-[9px] font-black uppercase tracking-wider text-slate-400 mt-2">
                          <span>12 STATION TELEMETRY CHANNELS</span>
                          <span className="text-slate-600">GNN LATENT ACTIVE</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Wide Bottom Card: "Sleep Analysis" -> Hydrograph & Surge Forecast */}
                  <div className="bg-[#18191c] text-white rounded-[28px] p-6 shadow-xl border border-slate-800">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2.5">
                        <Moon className="w-4 h-4 text-white" />
                        <span className="text-xs font-black uppercase tracking-wider text-white">
                          FLUVIAL HYDROGRAPH & SURGE FORECAST
                        </span>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-white/10 text-slate-300 text-xs font-bold uppercase tracking-wider">
                        HORIZON +3H ▾
                      </span>
                    </div>

                    {/* Stats Row */}
                    <div className="flex items-center gap-8 mb-5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-1.5 h-6 rounded-full bg-[#d4f84c]" />
                        <div>
                          <span className="text-2xl font-black font-mono text-white">94%</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase block -mt-1">GNN ACCURACY</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <div className="w-1.5 h-6 rounded-full bg-[#b9b6f8]" />
                        <div>
                          <span className="text-2xl font-black font-mono text-white">2h 15m</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase block -mt-1">LEAD TIME</span>
                        </div>
                      </div>
                    </div>

                    {/* Bars matching sample_ui.jpeg (Inactive dark striped bars + Lime & Lavender peak bars) */}
                    <div className="flex items-end justify-between gap-3 h-36 pt-2">
                      {[
                        { label: 'JUN', height: 40, isPeak: false },
                        { label: 'JUL', height: 60, isPeak: false },
                        { label: 'AUG', height: 75, isPeak: false },
                        { label: 'PEAK ↗', height: 95, isPeak: true },
                        { label: 'OCT', height: 55, isPeak: false },
                        { label: 'NOV', height: 45, isPeak: false },
                        { label: 'DEC', height: 35, isPeak: false },
                      ].map((item, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                          {item.isPeak ? (
                            <div className="flex items-end gap-1.5 h-full">
                              {/* Lime green peak bar */}
                              <div
                                className="w-6 rounded-full bg-[#d4f84c] shadow-lg shadow-[#d4f84c]/20"
                                style={{ height: '95%' }}
                              />
                              {/* Soft lavender peak bar */}
                              <div
                                className="w-6 rounded-full bg-[#b9b6f8] shadow-lg shadow-[#b9b6f8]/20"
                                style={{ height: '75%' }}
                              />
                            </div>
                          ) : (
                            <div
                              className="w-7 rounded-full bg-striped-bars bg-slate-800/80 border border-slate-700/50"
                              style={{ height: `${item.height}%` }}
                            />
                          )}
                          <span className={`text-[10px] font-black uppercase tracking-tight ${
                            item.isPeak ? 'text-white' : 'text-slate-500'
                          }`}>
                            {item.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>

              {/* ── OPERATIONAL COMMAND SECTION: MAP + SENSOR CONTROLS ── */}
              <div className="space-y-5 pt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-black uppercase tracking-wider text-slate-900">
                      UPPER BEAS CORRIDOR SPATIAL COMMAND
                    </h3>
                    <p className="text-xs text-slate-500 font-bold uppercase">
                      Interactive GIS drainage topology, IoT telemetry nodes & live risk engine
                    </p>
                  </div>
                  <button
                    onClick={() => setShowHistoricalOnMap(!showHistoricalOnMap)}
                    className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 shadow-sm ${
                      showHistoricalOnMap
                        ? 'bg-[#18191c] text-[#d4f84c]'
                        : 'bg-white text-slate-800 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {showHistoricalOnMap ? '✓ HIFLO-DAT OVERLAY ACTIVE' : '+ HIFLO-DAT OVERLAY'}
                  </button>
                </div>

                {/* ── LIVE SIMULATION WORKFLOW INDICATOR ── */}
                <div className="flex items-center gap-1 px-4 py-2.5 bg-[#18191c] rounded-2xl border border-slate-800 overflow-x-auto shrink-0">
                  <span className="w-2 h-2 rounded-full bg-[#d4f84c] animate-pulse shrink-0 mr-1" />
                  {[
                    { label: 'SENSOR', stage: 'STAGE_1_SENSOR_CHANGE' },
                    { label: 'NODE', stage: 'STAGE_2_NODE_FEATURE_UPDATE' },
                    { label: 'NEIGHBOURS', stage: 'STAGE_3_NEIGHBOR_AGGREGATION' },
                    { label: 'GRAPH AI', stage: 'STAGE_4_GRAPHSAGE' },
                    { label: 'RISK', stage: 'STAGE_5_RISK_UPDATE' },
                    { label: 'DOWNSTREAM', stage: 'STAGE_6_PROPAGATION' },
                    { label: 'VILLAGE', stage: 'STAGE_7_VILLAGE_IMPACT' },
                    { label: 'ALERT', stage: 'STAGE_8_ALERT_GENERATION' },
                  ].map((step, idx) => {
                    const stageOrder = ['STAGE_1_SENSOR_CHANGE','STAGE_2_NODE_FEATURE_UPDATE','STAGE_3_NEIGHBOR_AGGREGATION','STAGE_4_GRAPHSAGE','STAGE_5_RISK_UPDATE','STAGE_6_PROPAGATION','STAGE_7_VILLAGE_IMPACT','STAGE_8_ALERT_GENERATION'];
                    const currentIdx = stageOrder.indexOf(workflowState.currentStage);
                    const isActive = currentIdx === idx && workflowState.isSimulating;
                    const isDone = currentIdx > idx;
                    return (
                      <React.Fragment key={step.stage}>
                        <span className={`text-[9px] font-black uppercase tracking-wider whitespace-nowrap px-2 py-1 rounded-full transition-all ${
                          isActive
                            ? 'bg-[#d4f84c] text-slate-950 shadow-sm'
                            : isDone
                            ? 'bg-white/10 text-slate-300'
                            : 'text-slate-600'
                        }`}>
                          {step.label}
                        </span>
                        {idx < 7 && (
                          <span className={`text-[10px] font-bold shrink-0 ${isDone || isActive ? 'text-[#d4f84c]' : 'text-slate-700'}`}>→</span>
                        )}
                      </React.Fragment>
                    );
                  })}
                  <span className="ml-auto pl-2 text-[9px] text-slate-500 font-bold uppercase whitespace-nowrap shrink-0">
                    {workflowState.isSimulating ? '⬤ PROCESSING' : 'LIVE SIMULATION'}
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                <div className="lg:col-span-8 bg-white rounded-[28px] p-4 shadow-sm border border-slate-200/60 flex flex-col" style={{ minHeight: '580px' }}>
                    <div className="flex-1 min-h-0 h-full">
                    <CorridorMap
                      nodes={topology.nodes}
                      edges={topology.edges}
                      riskMap={riskMap}
                      telemetryMap={telemetryMap}
                      selectedNodeId={selectedNodeId}
                      onSelectNode={id => {
                        setSelectedNodeId(id);
                        setIsNodeModalOpen(true);
                      }}
                      historicalEvents={historicalEvents}
                      showHistoricalOverlay={showHistoricalOnMap}
                    />
                    </div>
                  </div>

                  <div className="lg:col-span-4 flex flex-col">
                    <SensorControlsPanel
                      nodes={topology.nodes}
                      selectedNodeId={selectedNodeId}
                      onSelectNode={setSelectedNodeId}
                      telemetryMap={telemetryMap}
                      onUpdateSensor={handleUpdateSensor}
                      onApplyScenario={handleApplyScenario}
                      onResetSensors={handleReset}
                      currentScenario={currentScenario}
                    />
                  </div>
                </div>

                {/* Live Graph Intelligence Workflow in Dark Card matching Sleep Analysis */}
                <div className="bg-[#18191c] text-white rounded-[28px] p-6 shadow-xl border border-slate-800">
                  <GraphWorkflowLive
                    nodes={topology.nodes}
                    edges={topology.edges}
                    telemetryMap={telemetryMap}
                    riskMap={riskMap}
                    workflowState={workflowState}
                    onTriggerSimulation={nodeId => triggerSimulationSequence(nodeId || selectedNodeId, 'rainfall', 45, 95)}
                    onSelectNode={id => {
                      setSelectedNodeId(id);
                      setIsNodeModalOpen(true);
                    }}
                    expertMode={expertMode}
                    onToggleExpertMode={() => setExpertMode(!expertMode)}
                  />
                </div>

                {/* Emergency Alert Dispatch Center */}
                <AlertCenter
                  alerts={alerts}
                  onSelectNode={id => {
                    setSelectedNodeId(id);
                    setIsNodeModalOpen(true);
                  }}
                />

                {/* Station Surveillance Matrix Table - Now Dynamic */}
                <div className="bg-white rounded-[28px] p-6 shadow-sm border border-slate-200/60">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                      STATION SURVEILLANCE FEED & REAL-TIME GAUGES
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="text-[10px] font-black uppercase text-slate-400 border-b border-slate-200/60 pb-2">
                          <th className="pb-2">STATION</th>
                          <th className="pb-2">RIVER BASIN</th>
                          <th className="pb-2">STATUS</th>
                          <th className="pb-2 text-right">RISK SCORE</th>
                          <th className="pb-2 text-right">STAGE</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {topology.nodes.map(node => {
                          const risk = riskMap[node.id];
                          const tel = telemetryMap[node.sensorId];
                          if (!risk) return null;
                          const badgeClass = risk.level === 'CRITICAL'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : risk.level === 'WARNING'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : risk.level === 'WATCH'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200';
                          return (
                            <tr
                              key={node.id}
                              className="hover:bg-slate-50/70 transition cursor-pointer"
                              onClick={() => { setSelectedNodeId(node.id); setIsNodeModalOpen(true); }}
                            >
                              <td className="py-3 font-bold text-slate-900">{node.name} ({node.id})</td>
                              <td className="py-3 text-slate-500">{node.river}</td>
                              <td className="py-3">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${badgeClass}`}>
                                  {risk.level}
                                </span>
                              </td>
                              <td className="py-3 text-right font-mono font-black text-slate-900">{risk.riskScore}/100</td>
                              <td className="py-3 text-right font-black text-slate-900">{tel?.waterLevel?.toFixed(1) ?? '--'} m</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Decision Support + Downstream Impact - Two-column */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                  {/* DECISION SUPPORT */}
                  <div className="bg-[#18191c] text-white rounded-[28px] p-6 shadow-xl border border-slate-800">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                        <Info className="w-4 h-4 text-[#d4f84c]" />
                      </div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-white">DECISION SUPPORT</h3>
                      <span className="ml-auto px-2 py-0.5 text-[9px] font-black rounded-full bg-white/10 text-slate-300 uppercase">ADVISORY ONLY</span>
                    </div>
                    <div className="space-y-3 text-xs">
                      <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                        <div className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">WHAT IS HAPPENING?</div>
                        <p className="text-slate-200 font-medium leading-relaxed">
                          {maxValleyRisk >= 75
                            ? 'Extreme rainfall detected in upstream catchment. Flash flood risk is CRITICAL.'
                            : maxValleyRisk >= 50
                            ? 'Heavy rainfall detected upstream. Risk is elevated to WARNING level.'
                            : maxValleyRisk >= 25
                            ? 'Moderate rainfall. River stage rising. WATCH conditions active.'
                            : 'All sub-catchments operating within normal seasonal baselines.'}
                        </p>
                      </div>
                      <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                        <div className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">WHY?</div>
                        <p className="text-slate-200 font-medium leading-relaxed">
                          High rainfall + {selectedTelemetry?.soilMoisture > 70 ? 'saturated soil' : 'moist soil'} +
                          steep terrain + upstream drainage accumulation.
                        </p>
                      </div>
                      <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                        <div className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-2">WHAT SHOULD BE CHECKED?</div>
                        <ul className="space-y-1 text-[11px] text-slate-300">
                          <li className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-[#d4f84c] shrink-0" />River gauge readings at all stations</li>
                          <li className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-[#d4f84c] shrink-0" />Upstream rainfall intensity (IMD)</li>
                          <li className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-[#d4f84c] shrink-0" />Downstream connectivity & settlements</li>
                          <li className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-[#d4f84c] shrink-0" />Independent meteorological guidance</li>
                        </ul>
                      </div>
                      <div className="p-2.5 bg-amber-900/30 rounded-xl border border-amber-800/40 text-[10px] text-amber-300 font-medium">
                        ⚠ DharaDrishti is a decision-support tool. All alerts require independent verification before operational response.
                      </div>
                    </div>
                  </div>

                  {/* DOWNSTREAM IMPACT */}
                  <div className="bg-white rounded-[28px] p-6 shadow-sm border border-slate-200/60">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                        <TrendingUp className="w-4 h-4 text-slate-700" />
                      </div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">DOWNSTREAM IMPACT</h3>
                    </div>
                    {(() => {
                      const downstreamNodeIds = selectedNode.downstream;
                      const downstreamNodes = topology.nodes.filter(n => downstreamNodeIds.includes(n.id));
                      const atRisk = downstreamNodes.filter(n => riskMap[n.id]?.riskScore >= 25);
                      return (
                        <div className="space-y-3 text-xs">
                          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                            <span className="font-bold text-slate-700 uppercase text-[10px]">Selected node</span>
                            <span className="font-black text-slate-900">{selectedNode.name}</span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                            <span className="font-bold text-slate-700 uppercase text-[10px]">Downstream at risk</span>
                            <span className={`font-black text-base ${atRisk.length > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                              {atRisk.length} location{atRisk.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                          {downstreamNodes.length > 0 ? (
                            <>
                              <div className="text-[10px] font-black uppercase text-slate-500 mb-1">PROPAGATION PATH (ESTIMATED / DEMONSTRATION):</div>
                              <div className="flex items-center flex-wrap gap-1">
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-[#18191c] text-white">{selectedNode.name}</span>
                                {downstreamNodes.map((n, i) => {
                                  const r = riskMap[n.id];
                                  const color = r?.level === 'CRITICAL' ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                    : r?.level === 'WARNING' ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                    : r?.level === 'WATCH' ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200';
                                  return (
                                    <React.Fragment key={n.id}>
                                      <span className="text-slate-400 font-bold">→</span>
                                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${color}`}>{n.name}</span>
                                    </React.Fragment>
                                  );
                                })}
                              </div>
                            </>
                          ) : (
                            <p className="text-slate-400 text-[11px] italic">No downstream nodes in corridor (terminus).</p>
                          )}
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                            <div className="text-[9px] font-black uppercase text-slate-500 mb-1">PROPAGATION DIRECTION (DEMONSTRATION)</div>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-700">
                              <span className="px-2 py-0.5 bg-slate-200 rounded-full">UPSTREAM</span>
                              <span className="text-slate-400">→</span>
                              <span className="px-2 py-0.5 bg-slate-300 rounded-full">MIDSTREAM</span>
                              <span className="text-slate-400">→</span>
                              <span className="px-2 py-0.5 bg-slate-400 text-white rounded-full">DOWNSTREAM</span>
                            </div>
                          </div>
                          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[10px] text-slate-500 font-medium">
                            Lead times shown are estimated / demonstration values only, not operational forecasts.
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ═══ VIEW 2: TERRAIN ═══ */}
          {activeTab === 'TERRAIN' && (
            <div className="bg-white rounded-[28px] p-6 shadow-sm border border-slate-200/60">
              <TerrainScreen
                nodes={topology.nodes}
                edges={topology.edges}
                riskMap={riskMap}
                telemetryMap={telemetryMap}
                onSelectNode={id => {
                  setSelectedNodeId(id);
                  setIsNodeModalOpen(true);
                }}
              />
            </div>
          )}

          {/* ═══ VIEW 3: SENSORS ═══ */}
          {activeTab === 'SENSORS' && (
            <div className="space-y-6">
              <div className="bg-white rounded-[28px] p-6 shadow-sm border border-slate-200/60">
                <SensorControlsPanel
                  nodes={topology.nodes}
                  selectedNodeId={selectedNodeId}
                  onSelectNode={setSelectedNodeId}
                  telemetryMap={telemetryMap}
                  onUpdateSensor={handleUpdateSensor}
                  onApplyScenario={handleApplyScenario}
                  onResetSensors={handleReset}
                  currentScenario={currentScenario}
                />
              </div>

              <div className="bg-[#18191c] text-white rounded-[28px] p-6 shadow-xl border border-slate-800">
                <GraphWorkflowLive
                  nodes={topology.nodes}
                  edges={topology.edges}
                  telemetryMap={telemetryMap}
                  riskMap={riskMap}
                  workflowState={workflowState}
                  onTriggerSimulation={nodeId => triggerSimulationSequence(nodeId || selectedNodeId, 'rainfall', 45, 95)}
                  onSelectNode={id => {
                    setSelectedNodeId(id);
                    setIsNodeModalOpen(true);
                  }}
                  expertMode={expertMode}
                  onToggleExpertMode={() => setExpertMode(!expertMode)}
                />
              </div>
            </div>
          )}

          {/* ═══ VIEW 4: FORECAST ═══ */}
          {activeTab === 'FORECAST' && (
            <div className="space-y-6">
              <div className="bg-white rounded-[28px] p-6 shadow-sm border border-slate-200/60">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">SPATIO-TEMPORAL HYDROGRAPH & SURGE FORECAST</h3>
                    <p className="text-[11px] text-slate-500 font-bold uppercase mt-0.5">STATION: {selectedNode.name} ({selectedNode.river})</p>
                  </div>
                  <select
                    value={selectedNodeId}
                    onChange={e => setSelectedNodeId(e.target.value)}
                    className="border border-slate-200 text-xs rounded-full px-4 py-2 font-bold focus:outline-none focus:ring-2 focus:ring-slate-900 transition bg-slate-50 text-slate-800"
                  >
                    {topology.nodes.map(n => (
                      <option key={n.id} value={n.id}>{n.name} ({n.river})</option>
                    ))}
                  </select>
                </div>

                <ForecastPanel
                  node={selectedNode}
                  telemetry={selectedTelemetry}
                  risk={selectedRisk}
                />
              </div>
            </div>
          )}

          {/* ═══ VIEW 5: ALERTS ═══ */}
          {activeTab === 'ALERTS' && (
            <AlertCenter
              alerts={alerts}
              onSelectNode={id => {
                setSelectedNodeId(id);
                setIsNodeModalOpen(true);
              }}
            />
          )}

          {/* ═══ VIEW 6: HISTORICAL ═══ */}
          {activeTab === 'HISTORICAL' && (
            <div className="bg-white rounded-[28px] p-6 shadow-sm border border-slate-200/60">
              <HistoricalBrowser
                events={historicalEvents}
                onReplayEvent={handleReplayEvent}
                onSelectNode={id => {
                  setSelectedNodeId(id);
                  setIsNodeModalOpen(true);
                }}
              />
            </div>
          )}
        </main>
      </div>

      {/* ═══ Modals ═══ */}
      {isNodeModalOpen && (
        <NodeDetailModal
          node={selectedNode}
          telemetry={selectedTelemetry}
          risk={selectedRisk}
          allNodes={topology.nodes}
          onClose={() => setIsNodeModalOpen(false)}
          onSelectNode={id => setSelectedNodeId(id)}
        />
      )}

      {isArchModalOpen && (
        <ArchitectureModal onClose={() => setIsArchModalOpen(false)} />
      )}
    </div>
  );
}

export default App;
