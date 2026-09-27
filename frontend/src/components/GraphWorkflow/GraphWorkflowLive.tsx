import React, { useState } from 'react';
import { 
  Activity, ArrowDown, ArrowRight, CheckCircle2, Circle, AlertTriangle, 
  HelpCircle, Zap, Layers, RefreshCw, Eye, Sliders, ShieldAlert, Cpu
} from 'lucide-react';
import { CorridorNode, CorridorEdge, SensorTelemetry, NodeRiskResult, WorkflowState, WorkflowStage } from '../../types';

interface Props {
  nodes: CorridorNode[];
  edges: CorridorEdge[];
  telemetryMap: Record<string, SensorTelemetry>;
  riskMap: Record<string, NodeRiskResult>;
  workflowState: WorkflowState;
  onTriggerSimulation: (nodeId?: string) => void;
  onSelectNode: (nodeId: string) => void;
  expertMode: boolean;
  onToggleExpertMode: () => void;
}

export const GraphWorkflowLive: React.FC<Props> = ({
  nodes,
  edges,
  telemetryMap,
  riskMap,
  workflowState,
  onTriggerSimulation,
  onSelectNode,
  expertMode,
  onToggleExpertMode
}) => {
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [beforeAfterMode, setBeforeAfterMode] = useState(false);

  const activeNode = nodes.find(n => n.id === workflowState.activeNodeId) || nodes.find(n => n.id === 'N05') || nodes[0];
  const activeTelemetry = telemetryMap[activeNode.sensorId] || {
    rainfall: activeNode.defaultRain,
    humidity: 72,
    soilMoisture: activeNode.defaultSoil,
    waterLevel: activeNode.defaultWaterLevel,
    slopeInstability: 35,
    isOnline: true
  };
  const activeRisk = riskMap[activeNode.id] || {
    riskScore: 35,
    previousRisk: 35,
    riskDelta: 0,
    level: 'WATCH',
    confidence: 85,
    factors: { rainfallContribution: 12, soilContribution: 10, waterLevelContribution: 6, slopeContribution: 3, upstreamInfluence: 4 },
    reasoning: ['Normal conditions'],
    embeddingVector: [0.15, 0.42, 0.38, 0.55, 0.72, 0.28, 0.44, 0.61]
  };

  const upstreamNodes = nodes.filter(n => activeNode.upstream.includes(n.id));
  const downstreamNodes = nodes.filter(n => activeNode.downstream.includes(n.id));

  const stageOrder: WorkflowStage[] = [
    'STAGE_1_SENSOR_CHANGE',
    'STAGE_2_NODE_FEATURE_UPDATE',
    'STAGE_3_NEIGHBOR_AGGREGATION',
    'STAGE_4_GRAPHSAGE',
    'STAGE_5_RISK_UPDATE',
    'STAGE_6_PROPAGATION',
    'STAGE_7_VILLAGE_IMPACT',
    'STAGE_8_ALERT_GENERATION'
  ];

  const currentStageIndex = stageOrder.indexOf(workflowState.currentStage);
  const isStageActive = (stageIdx: number) => {
    if (workflowState.currentStage === 'COMPLETE') return true;
    if (currentStageIndex === -1) return stageIdx === 0;
    return currentStageIndex >= stageIdx;
  };
  const isCurrentStage = (stageIdx: number) => currentStageIndex === stageIdx;

  return (
    <div className="bg-[#18191c] border border-slate-800 rounded-[28px] p-6 shadow-xl text-white">
      {/* ── HEADER IN CAPS ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-[#d4f84c] shadow-sm">
            <Zap className="w-5 h-5 fill-[#d4f84c]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black tracking-wider text-white uppercase">
                GRAPH INTELLIGENCE — LIVE MODEL WORKFLOW
              </h2>
              <span className="px-2.5 py-0.5 text-[10px] font-black rounded-full bg-[#d4f84c] text-slate-950 uppercase shadow-sm">
                GNN SPATIAL PIPELINE
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Live causal chain: Telemetry → Feature Vector → Neighbor Aggregation → GraphSAGE → Risk Propagation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* How It Works Button */}
          <button
            onClick={() => setShowHowItWorks(!showHowItWorks)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-full bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 transition shadow-sm"
          >
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>HOW THE GRAPH WORKS</span>
          </button>

          {/* Before/After Toggle */}
          <button
            onClick={() => setBeforeAfterMode(!beforeAfterMode)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-full border transition ${
              beforeAfterMode
                ? 'bg-white text-slate-950 border-white shadow-sm font-black'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{beforeAfterMode ? 'BEFORE/AFTER: ON' : 'BEFORE/AFTER'}</span>
          </button>

          {/* Expert Mode Toggle */}
          <button
            onClick={onToggleExpertMode}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-full border transition ${
              expertMode
                ? 'bg-[#b9b6f8] border-[#b9b6f8] text-slate-950 shadow-sm font-black'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>{expertMode ? 'EXPERT VIEW' : 'OPERATOR VIEW'}</span>
          </button>

          {/* Trigger Simulation Button */}
          <button
            onClick={() => onTriggerSimulation(activeNode.id)}
            disabled={workflowState.isSimulating}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-black rounded-full bg-[#d4f84c] hover:bg-[#c2e63c] text-slate-950 shadow-md transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${workflowState.isSimulating ? 'animate-spin' : ''}`} />
            <span>{workflowState.isSimulating ? 'PROCESSING...' : 'RUN PIPELINE'}</span>
          </button>
        </div>
      </div>

      {/* Explanatory Banner: "How the Graph Works" */}
      {showHowItWorks && (
        <div className="mb-5 p-5 bg-slate-800/90 border border-slate-700 rounded-[22px] text-xs leading-relaxed text-slate-300">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-[#d4f84c]" />
              HOW THE DIRECTED HYDROLOGICAL GRAPH OPERATES (15-SECOND PRIMER)
            </h4>
            <button onClick={() => setShowHowItWorks(false)} className="text-slate-400 hover:text-white font-bold">✕</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-700/60">
              <span className="font-bold text-white uppercase text-[11px]">1. GRAPH NODES</span>
              <p className="text-slate-400 mt-1">Geographic sub-catchments & river monitoring stations (Solang, Palchan, Manali, Raison, Kullu) with dynamic telemetry.</p>
            </div>
            <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-700/60">
              <span className="font-bold text-white uppercase text-[11px]">2. DIRECTED DRAINAGE EDGES</span>
              <p className="text-slate-400 mt-1">Elevation-derived drainage vectors. Information cascades from upstream headwaters to downstream floodplains.</p>
            </div>
            <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-700/60">
              <span className="font-bold text-[#d4f84c] uppercase text-[11px]">3. GRAPHSAGE SPATIAL GNN</span>
              <p className="text-slate-400 mt-1">Instead of evaluating rainfall in isolation, GraphSAGE aggregates features from upstream neighbors into a spatial risk embedding.</p>
            </div>
          </div>
        </div>
      )}

      {/* ── LIVE PIPELINE STEPPER TRACKER (ALL CAPS) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-1.5 mb-5 text-[10px] font-bold uppercase tracking-tight">
        {[
          { label: '1. SENSOR IN', icon: Sliders },
          { label: '2. NODE FEAT', icon: Layers },
          { label: '3. AGGREGATE', icon: ArrowDown },
          { label: '4. GRAPHSAGE', icon: Cpu },
          { label: '5. RISK CALC', icon: Activity },
          { label: '6. PROPAGATE', icon: ArrowRight },
          { label: '7. IMPACT', icon: Eye },
          { label: '8. NDRF ALERT', icon: ShieldAlert }
        ].map((step, idx) => {
          const active = isStageActive(idx);
          const current = isCurrentStage(idx);
          return (
            <div
              key={idx}
              className={`flex items-center gap-1.5 px-2.5 py-2 rounded-full border transition-all ${
                current
                  ? 'bg-[#d4f84c] border-[#d4f84c] text-slate-950 font-black shadow-lg shadow-[#d4f84c]/20'
                  : active
                  ? 'bg-white/10 border-white/20 text-white'
                  : 'bg-black/30 border-slate-800 text-slate-500'
              }`}
            >
              {current ? (
                <div className="w-2 h-2 rounded-full bg-slate-950 animate-ping mr-0.5" />
              ) : active ? (
                <CheckCircle2 className="w-3 h-3 text-[#d4f84c] flex-shrink-0" />
              ) : (
                <Circle className="w-3 h-3 text-slate-600 flex-shrink-0" />
              )}
              <span className="truncate">{step.label}</span>
            </div>
          );
        })}
      </div>

      {/* ── 8-STAGE VISUAL CONTENT GRID (TITLES IN CAPS) ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
        {/* Stage 1: SENSOR CHANGE */}
        <div className={`p-4 rounded-2xl border transition-all ${
          isCurrentStage(0) 
            ? 'bg-slate-800 border-2 border-blue-500 shadow-lg shadow-blue-500/10' 
            : 'bg-slate-800/80 border border-slate-700/80'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">STAGE 1: SENSOR INGESTION</span>
            {activeTelemetry.isOnline ? (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">ONLINE</span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40">OFFLINE</span>
            )}
          </div>
          <div className="text-xs font-black text-white mb-2 uppercase">{activeNode.name} SENSOR</div>
          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 uppercase text-[10px] font-semibold">RAINFALL:</span>
              <span className={`font-mono font-bold ${activeTelemetry.rainfall > 60 ? 'text-rose-400' : 'text-white'}`}>
                {activeTelemetry.rainfall.toFixed(0)} mm/h
                {workflowState.changedParam === 'rainfall' && <span className="ml-1 text-blue-400">↑</span>}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 uppercase text-[10px] font-semibold">SOIL SATURATION:</span>
              <span className="font-mono text-slate-200">{activeTelemetry.soilMoisture.toFixed(0)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 uppercase text-[10px] font-semibold">RIVER STAGE:</span>
              <span className="font-mono text-slate-200">{activeTelemetry.waterLevel.toFixed(1)} m</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 uppercase text-[10px] font-semibold">SLOPE INSTABILITY:</span>
              <span className="font-mono text-slate-200">{activeTelemetry.slopeInstability.toFixed(0)} idx</span>
            </div>
          </div>
        </div>

        {/* Stage 2 & 3: NODE UPDATE & NEIGHBOR AGGREGATION */}
        <div className={`p-4 rounded-2xl border transition-all ${
          isCurrentStage(1) || isCurrentStage(2)
            ? 'bg-slate-800 border-2 border-blue-500 shadow-lg shadow-blue-500/10' 
            : 'bg-slate-800/80 border border-slate-700/80'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">
              {isCurrentStage(1) ? 'STAGE 2: NODE FEATURE' : 'STAGE 3: NEIGHBOR AGGREGATION'}
            </span>
            <span className="text-[10px] text-blue-400 uppercase font-semibold">UPSTREAM → NODE</span>
          </div>

          <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-700/60 mb-2.5">
            <div className="text-[11px] font-bold text-white flex items-center justify-between">
              <span className="uppercase text-[10px]">UPSTREAM SOURCES:</span>
              <span className="text-blue-400 font-mono text-[10px]">{upstreamNodes.length > 0 ? upstreamNodes.map(u => u.name).join(', ') : 'Headwaters (None)'}</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1 italic">
              {activeNode.name} aggregates upstream tributary volume.
            </div>
          </div>

          <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-700/60 text-[10px] space-y-1">
            <div className="flex items-center justify-between text-slate-300">
              <span className="uppercase">SELF FEATURES:</span>
              <span className="font-mono text-blue-400">Rain={activeTelemetry.rainfall.toFixed(0)}, Soil={activeTelemetry.soilMoisture.toFixed(0)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="uppercase">NEIGHBOR INFLOW:</span>
              <span className="font-mono text-emerald-400">
                {upstreamNodes.length > 0 ? `${upstreamNodes.length} Upstream Catchments` : 'Self Root'}
              </span>
            </div>
          </div>
        </div>

        {/* Stage 4 & 5: GRAPHSAGE & RISK SCORE */}
        <div className={`p-4 rounded-2xl border transition-all ${
          isCurrentStage(3) || isCurrentStage(4)
            ? 'bg-slate-800 border-2 border-blue-500 shadow-lg shadow-blue-500/10' 
            : 'bg-slate-800/80 border border-slate-700/80'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">
              {isCurrentStage(3) ? 'STAGE 4: GRAPHSAGE' : 'STAGE 5: RISK UPDATE'}
            </span>
            <span className={`px-2 py-0.5 text-[9px] font-black rounded-full uppercase text-white shadow-sm ${
              activeRisk.level === 'CRITICAL' ? 'bg-rose-600' :
              activeRisk.level === 'WARNING' ? 'bg-amber-500' :
              activeRisk.level === 'WATCH' ? 'bg-yellow-500' :
              'bg-emerald-600'
            }`}>
              {activeRisk.level}
            </span>
          </div>

          <div className="flex items-baseline justify-between mb-2">
            <div>
              <div className="text-2xl font-black font-mono text-white">
                {activeRisk.riskScore}
                <span className="text-xs text-slate-400 font-normal"> / 100</span>
              </div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">
                CONFIDENCE: <span className="text-blue-400 font-mono font-bold">{activeRisk.confidence}%</span>
              </div>
            </div>

            {beforeAfterMode && (
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">DELTA:</span>
                <div className={`font-mono text-xs font-bold ${activeRisk.riskDelta > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {activeRisk.riskDelta >= 0 ? `+${activeRisk.riskDelta}` : activeRisk.riskDelta}
                </div>
              </div>
            )}
          </div>

          {/* Risk Factors Mini-Bars */}
          <div className="space-y-1 text-[10px]">
            <div className="flex justify-between text-slate-400 uppercase">
              <span>PRECIPITATION FACTOR</span>
              <span className="font-mono text-white">{activeRisk.factors.rainfallContribution} / 35</span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-blue-500 h-1.5 rounded-full transition-all duration-500" 
                style={{ width: `${(activeRisk.factors.rainfallContribution / 35) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Stage 6, 7 & 8: PROPAGATION, IMPACT & ALERT */}
        <div className={`p-4 rounded-2xl border transition-all ${
          isCurrentStage(5) || isCurrentStage(6) || isCurrentStage(7)
            ? 'bg-slate-800 border-2 border-blue-500 shadow-lg shadow-blue-500/10' 
            : 'bg-slate-800/80 border border-slate-700/80'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">
              {isCurrentStage(5) ? 'STAGE 6: PROPAGATE' : isCurrentStage(6) ? 'STAGE 7: IMPACT' : 'STAGE 8: NDRF ALERT'}
            </span>
            <span className="text-[10px] text-blue-400 uppercase font-semibold">FLUVIAL WAVE</span>
          </div>

          <div className="space-y-1 text-[11px] mb-2">
            <div className="text-slate-400 text-[10px] uppercase font-semibold">DOWNSTREAM CORRIDOR:</div>
            {downstreamNodes.map(down => {
              const downRisk = riskMap[down.id];
              return (
                <div key={down.id} className="flex items-center justify-between p-1.5 bg-slate-900/90 rounded-lg border border-slate-700/60 text-[10px]">
                  <span className="text-white font-bold uppercase">{down.name}</span>
                  <div className="flex items-center gap-1.5 font-mono font-bold">
                    <span className="text-white">
                      {downRisk?.riskScore ?? '--'}/100
                    </span>
                    <span className={`text-[9px] ${
                      downRisk?.level === 'CRITICAL' ? 'text-rose-400' :
                      downRisk?.level === 'WARNING' ? 'text-amber-400' :
                      'text-emerald-400'
                    }`}>({downRisk?.level ?? 'NORMAL'})</span>
                  </div>
                </div>
              );
            })}
          </div>

          {activeRisk.level === 'CRITICAL' || activeRisk.level === 'WARNING' ? (
            <div className="p-2.5 bg-rose-950/40 border border-rose-800/60 rounded-xl text-[10px] text-rose-200 flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold uppercase">CAP WARNING DISPATCHED:</span>
                <p className="text-[9px] text-rose-300 mt-0.5 leading-tight">Evacuation advisory for riverine corridor. Lead time: ~1.5h.</p>
              </div>
            </div>
          ) : (
            <div className="p-2.5 bg-emerald-950/30 border border-emerald-800/40 rounded-xl text-[10px] text-emerald-300">
              Downstream risks within safe thresholds. Continual GNN surveillance active.
            </div>
          )}
        </div>
      </div>

      {/* Expert Mode Panel */}
      {expertMode && (
        <div className="mt-4 p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-mono text-slate-300">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
            <span className="text-[10px] font-black text-blue-400 tracking-wider uppercase flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" />
              GNN FEATURE VECTOR & AGGREGATION MATRIX (NODE: {activeNode.id})
            </span>
            <span className="text-[10px] text-slate-500">PYTORCH GRAPHSAGE MEAN AGGREGATOR</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
            <div>
              <div className="text-[10px] text-slate-400 mb-1 uppercase font-semibold">LOCAL FEATURE VECTOR [H_V]:</div>
              <div className="p-2 bg-slate-900 rounded-xl border border-slate-800 overflow-x-auto text-[10px] text-blue-300">
                {`[Rain: ${(activeTelemetry.rainfall/150).toFixed(3)}, Soil: ${(activeTelemetry.soilMoisture/100).toFixed(3)}, Stage: ${(activeTelemetry.waterLevel/5.0).toFixed(3)}, Slope: ${(activeNode.slope/50).toFixed(3)}]`}
              </div>
              <div className="text-[10px] text-slate-400 mt-2 mb-1 uppercase font-semibold">GRAPHSAGE LATENT EMBEDDING [8-DIM]:</div>
              <div className="p-2 bg-slate-900 rounded-xl border border-slate-800 overflow-x-auto text-[10px] text-purple-300">
                {`[${activeRisk.embeddingVector.map(v => v.toFixed(3)).join(', ')}]`}
              </div>
            </div>

            <div>
              <div className="text-[10px] text-slate-400 mb-1 uppercase font-semibold">DIRECTED ADJACENCY (UPSTREAM PARENTS):</div>
              <div className="p-2 bg-slate-900 rounded-xl border border-slate-800 text-[10px] text-slate-300">
                {activeNode.upstream.length > 0 ? (
                  activeNode.upstream.map(u => `Node ${u} → Directed Inflow Edge (Weight = 1.0)`).join('\n')
                ) : (
                  'Solang Basin Headwater (No upstream predecessors in Beas corridor)'
                )}
              </div>
              <div className="text-[10px] text-slate-400 mt-2 mb-1 uppercase font-semibold">DOWNSTREAM TARGET EDGES:</div>
              <div className="p-2 bg-slate-900 rounded-xl border border-slate-800 text-[10px] text-slate-300">
                {activeNode.downstream.map(d => `Target ${d} (${nodes.find(n => n.id === d)?.name})`).join(', ')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── LEGEND IN CAPS ── */}
      <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-400 mt-4 pt-3 border-t border-slate-800">
        <div className="flex items-center gap-4">
          <span className="font-extrabold text-white uppercase">DATA FLOW LEGEND:</span>
          <span className="flex items-center gap-1 uppercase"><span className="w-2 h-2 rounded-full bg-blue-500" /> SENSOR / INFLOW</span>
          <span className="flex items-center gap-1 uppercase"><span className="w-2 h-2 rounded-full bg-teal-400" /> HYDROLOGICAL DRAINAGE</span>
          <span className="flex items-center gap-1 uppercase"><span className="w-2 h-2 rounded-full bg-purple-400" /> RISK PROPAGATION</span>
          <span className="flex items-center gap-1 uppercase"><span className="w-2 h-2 rounded-full bg-rose-500" /> CRITICAL ALERT</span>
        </div>
        <div className="text-slate-400 text-[10px] uppercase font-semibold">
          TARGET BASIN: <span className="text-white">KULLU–MANALI (UPPER BEAS RIVER)</span>
        </div>
      </div>
    </div>
  );
};
