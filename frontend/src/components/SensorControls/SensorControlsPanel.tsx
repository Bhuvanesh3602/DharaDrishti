import React from 'react';
import { Sliders, Power, RotateCcw, CloudRain, Droplets, Mountain, Gauge, AlertOctagon, CheckCircle2, Wifi, WifiOff } from 'lucide-react';
import { CorridorNode, SensorTelemetry, ScenarioPreset } from '../../types';

interface Props {
  nodes: CorridorNode[];
  selectedNodeId: string;
  onSelectNode: (nodeId: string) => void;
  telemetryMap: Record<string, SensorTelemetry>;
  onUpdateSensor: (sensorId: string, param: keyof SensorTelemetry, value: any) => void;
  onApplyScenario: (preset: ScenarioPreset) => void;
  onResetSensors: () => void;
  currentScenario: ScenarioPreset;
}

interface MetricRowProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  step: number;
  minLabel: string;
  midLabel?: string;
  maxLabel: string;
  trackColor: string;
  disabled: boolean;
  onChange: (v: number) => void;
  riskThreshold?: number;
  formatValue?: (v: number) => string;
}

const MetricRow: React.FC<MetricRowProps> = ({
  icon,
  label,
  value,
  unit,
  min,
  max,
  step,
  minLabel,
  maxLabel,
  trackColor,
  disabled,
  onChange,
  riskThreshold,
  formatValue
}) => {
  const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  const isHigh = riskThreshold !== undefined && value >= riskThreshold;
  const displayValue = formatValue ? formatValue(value) : (step < 1 ? value.toFixed(1) : value.toFixed(0));

  return (
    <div className={`rounded-2xl border p-3.5 transition-all select-none ${
      disabled 
        ? 'bg-slate-50/60 border-slate-200/50 opacity-60'
        : isHigh 
        ? 'bg-rose-50/70 border-rose-200 shadow-sm' 
        : 'bg-white border-slate-200/80 shadow-xs'
    }`}>
      {/* ── ROW 1: [icon] METRIC NAME (left) ... VALUE UNIT (right) ── */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`shrink-0 ${disabled ? 'text-slate-400' : isHigh ? 'text-rose-500' : 'text-slate-700'}`}>
            {icon}
          </span>
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-800 truncate">
            {label}
          </span>
        </div>
        <div className="text-right shrink-0">
          <span className={`font-mono font-black text-sm tabular-nums ${
            disabled ? 'text-slate-400' : isHigh ? 'text-rose-600' : 'text-slate-900'
          }`}>
            {displayValue}
          </span>
          <span className="text-[11px] font-semibold text-slate-500 ml-1">
            {unit}
          </span>
        </div>
      </div>

      {/* ── ROW 2: DESCRIPTIVE SCALE / SLIDER ── */}
      <div className="relative flex items-center py-1">
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-150"
            style={{ 
              width: `${pct}%`, 
              backgroundColor: disabled ? '#cbd5e1' : isHigh ? '#ef4444' : trackColor 
            }}
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={e => onChange(parseFloat(e.target.value))}
          aria-label={label}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
      </div>

      {/* ── ROW 3: MINIMUM ... CURRENT ... MAXIMUM ── */}
      <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wide text-slate-400 mt-1">
        <span>{minLabel}</span>
        <span className={`font-mono ${disabled ? 'text-slate-400' : isHigh ? 'text-rose-600 font-bold' : 'text-slate-600'}`}>
          {displayValue} {unit}
        </span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
};

export const SensorControlsPanel: React.FC<Props> = ({
  nodes,
  selectedNodeId,
  onSelectNode,
  telemetryMap,
  onUpdateSensor,
  onApplyScenario,
  onResetSensors,
  currentScenario
}) => {
  const selectedNode = nodes.find(n => n.id === selectedNodeId) || nodes.find(n => n.id === 'N05') || nodes[0];
  const telemetry = telemetryMap[selectedNode.sensorId] || {
    sensorId: selectedNode.sensorId,
    nodeId: selectedNode.id,
    name: selectedNode.name,
    rainfall: selectedNode.defaultRain,
    humidity: 72,
    soilMoisture: selectedNode.defaultSoil,
    waterLevel: selectedNode.defaultWaterLevel,
    slopeInstability: 35,
    isOnline: true,
    lastUpdated: 'Just now'
  };

  const onlineSensors = Object.values(telemetryMap).filter(t => t.isOnline).length;
  const totalSensors = Object.values(telemetryMap).length;
  const allOnline = onlineSensors === totalSensors;

  return (
    <div className="bg-white rounded-[28px] p-5 shadow-sm border border-slate-200/60 text-slate-900 flex flex-col gap-4">

      {/* ── PANEL HEADER ── */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
            <Sliders className="w-4 h-4 text-slate-800" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 leading-tight">
              SENSOR SIMULATOR
            </h3>
            <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
              Adjust inputs → GraphSAGE pipeline updates
            </p>
          </div>
        </div>
        <button
          onClick={onResetSensors}
          title="Reset all sensors to baseline"
          className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition shadow-xs shrink-0"
        >
          <RotateCcw className="w-3 h-3" />
          <span>RESET</span>
        </button>
      </div>

      {/* ── LIVE SIMULATION STATUS (REQUIREMENT 4) ── */}
      <div className="flex items-center justify-between px-3 py-2 bg-amber-50/80 border border-amber-200/80 rounded-xl shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-900">
            DEMONSTRATION SCENARIO
          </span>
        </div>
        <span className="text-[9px] font-bold text-amber-700 uppercase tracking-wide">
          SIMULATED REAL-TIME INPUTS
        </span>
      </div>

      {/* ── SENSOR HEALTH & DRILL (REQUIREMENT 9) ── */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl shrink-0">
        <div className="flex items-center gap-2">
          {allOnline ? (
            <Wifi className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-rose-500 shrink-0" />
          )}
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-700">
            SENSOR HEALTH
          </span>
        </div>
        <span className={`text-[10px] font-mono font-black uppercase tabular-nums ${
          allOnline ? 'text-emerald-700' : 'text-rose-600'
        }`}>
          {onlineSensors}/{totalSensors} CHANNELS ONLINE
          {!allOnline && (
            <span className="ml-1 text-[9px] text-amber-600 font-sans font-bold">
              (CONF ↓)
            </span>
          )}
        </span>
      </div>

      {/* ── DEMO SCENARIO PRESETS (REQUIREMENT 7) ── */}
      <div className="shrink-0">
        <div className="text-[10px] uppercase font-black tracking-wider text-slate-400 mb-2">
          DEMONSTRATION SCENARIOS:
        </div>
        <div className="grid grid-cols-1 gap-2">
          {[
            {
              preset: 'NORMAL_MONSOON' as ScenarioPreset,
              label: '1. NORMAL MONSOON',
              sub: '30–45 mm/h · Baselines normal',
              accent: 'text-emerald-500',
              badge: 'NORMAL/WATCH'
            },
            {
              preset: 'HEAVY_RAIN' as ScenarioPreset,
              label: '2. HEAVY RAINFALL',
              sub: '65–75 mm/h · Watch & warnings active',
              accent: 'text-[#b9b6f8]',
              badge: 'WATCH/WARNING'
            },
            {
              preset: 'EXTREME_CLOUDBURST' as ScenarioPreset,
              label: '3. EXTREME CLOUDBURST',
              sub: 'Raison 95+ mm/h · Critical flash flood',
              accent: 'text-rose-500',
              danger: true,
              badge: 'WARNING/CRITICAL'
            },
          ].map(({ preset, label, sub, accent, danger, badge }) => (
            <button
              key={preset}
              onClick={() => onApplyScenario(preset)}
              className={`w-full px-3.5 py-2.5 rounded-2xl border text-left transition-all ${
                currentScenario === preset
                  ? 'bg-[#18191c] border-[#18191c] text-white shadow-md'
                  : danger
                  ? 'bg-rose-50/50 border-rose-200/80 hover:bg-rose-100/60 text-slate-800'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`font-black text-[11px] uppercase tracking-tight ${
                  currentScenario === preset ? accent : 'text-slate-900'
                }`}>
                  {label}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                    currentScenario === preset 
                      ? 'bg-white/15 text-slate-200' 
                      : 'bg-slate-200/80 text-slate-700'
                  }`}>
                    {badge}
                  </span>
                  {currentScenario === preset && (
                    danger ? (
                      <AlertOctagon className={`w-3.5 h-3.5 ${accent} shrink-0 animate-pulse`} />
                    ) : (
                      <CheckCircle2 className={`w-3.5 h-3.5 ${accent} shrink-0`} />
                    )
                  )}
                </div>
              </div>
              <div className={`text-[10px] font-medium mt-0.5 ${
                currentScenario === preset ? 'text-slate-300' : 'text-slate-500'
              }`}>
                {sub}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── STATION SELECTOR ── */}
      <div className="shrink-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">
            ACTIVE SENSOR NODE:
          </span>
          <span className="text-[10px] font-black uppercase text-slate-800">
            {selectedNode.name} ({selectedNode.id})
          </span>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {nodes.map(n => {
            const isSel = n.id === selectedNode.id;
            const isDemo = n.id === 'N05';
            return (
              <button
                key={n.id}
                onClick={() => onSelectNode(n.id)}
                className={`px-3 py-1 rounded-full whitespace-nowrap border text-[10px] font-black transition ${
                  isSel
                    ? 'bg-[#18191c] border-[#18191c] text-white shadow-md'
                    : isDemo
                    ? 'bg-slate-100 border-slate-300 text-slate-900 hover:bg-slate-200'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {n.name.split(' ')[0].toUpperCase()} {isDemo ? '★' : ''}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── ACTIVE STATION METRIC SLIDERS ── */}
      <div className="p-4 bg-[#f0f1f4] border border-slate-200/80 rounded-[22px] flex flex-col gap-3">
        {/* Node status row with drill power button */}
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/70">
          <div className="min-w-0 flex-1 mr-2">
            <div className="text-xs font-black uppercase text-slate-900 flex items-center gap-1.5 flex-wrap">
              <span className="truncate">{selectedNode.name}</span>
              <span className="px-2 py-0.5 text-[8px] font-black rounded-full bg-white text-slate-700 shadow-2xs border border-slate-200">
                {selectedNode.sensorType}
              </span>
            </div>
            <div className="text-[9px] text-slate-500 mt-0.5 font-medium truncate">
              ID: {selectedNode.sensorId} · {selectedNode.elevation}m · {selectedNode.river.toUpperCase()}
            </div>
          </div>
          <button
            onClick={() => onUpdateSensor(selectedNode.sensorId, 'isOnline', !telemetry.isOnline)}
            title={telemetry.isOnline ? "Click to simulate sensor outage (Fault Drill)" : "Click to restore sensor online"}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black rounded-full border transition shadow-sm shrink-0 ${
              telemetry.isOnline
                ? 'bg-[#18191c] border-[#18191c] text-white hover:bg-black'
                : 'bg-rose-600 border-rose-500 text-white hover:bg-rose-700'
            }`}
          >
            <Power className={`w-3 h-3 ${telemetry.isOnline ? 'text-[#d4f84c]' : 'text-white'}`} />
            <span>{telemetry.isOnline ? 'ONLINE' : 'OFFLINE (DRILL)'}</span>
          </button>
        </div>

        {/* Consistent Metric Rows */}
        <div className="space-y-2.5">
          <MetricRow
            icon={<CloudRain className="w-3.5 h-3.5" />}
            label="Rainfall Intensity"
            value={telemetry.rainfall}
            unit="mm/h"
            min={0}
            max={150}
            step={1}
            minLabel="0 mm/h (Dry)"
            maxLabel="150 mm/h (Cloudburst)"
            trackColor="#0ea5e9"
            disabled={!telemetry.isOnline}
            onChange={v => onUpdateSensor(selectedNode.sensorId, 'rainfall', v)}
            riskThreshold={80}
          />
          <MetricRow
            icon={<Droplets className="w-3.5 h-3.5 text-violet-500" />}
            label="Soil Saturation"
            value={telemetry.soilMoisture}
            unit="%"
            min={0}
            max={100}
            step={1}
            minLabel="0% (Parched)"
            maxLabel="100% (Saturated)"
            trackColor="#8b5cf6"
            disabled={!telemetry.isOnline}
            onChange={v => onUpdateSensor(selectedNode.sensorId, 'soilMoisture', v)}
            riskThreshold={80}
          />
          <MetricRow
            icon={<Gauge className="w-3.5 h-3.5 text-cyan-500" />}
            label="River Gauge Stage"
            value={telemetry.waterLevel}
            unit="m"
            min={0.5}
            max={6.0}
            step={0.1}
            minLabel="0.5 m (Baseflow)"
            maxLabel="6.0 m (Major Flood)"
            trackColor="#06b6d4"
            disabled={!telemetry.isOnline}
            onChange={v => onUpdateSensor(selectedNode.sensorId, 'waterLevel', v)}
            riskThreshold={3.5}
            formatValue={v => v.toFixed(1)}
          />
          <MetricRow
            icon={<Mountain className="w-3.5 h-3.5 text-amber-500" />}
            label="Slope Instability Index"
            value={telemetry.slopeInstability}
            unit="/ 100"
            min={0}
            max={100}
            step={1}
            minLabel="0 (Stable Granite)"
            maxLabel="100 (Active Debris)"
            trackColor="#f59e0b"
            disabled={!telemetry.isOnline}
            onChange={v => onUpdateSensor(selectedNode.sensorId, 'slopeInstability', v)}
            riskThreshold={70}
          />
        </div>
      </div>

      {/* ── SENSOR OUTAGE NOTIFICATION (REQUIREMENT 9) ── */}
      {!telemetry.isOnline && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl">
          <div className="flex items-center gap-2 mb-1 text-rose-800 font-black text-[11px] uppercase tracking-wide">
            <WifiOff className="w-4 h-4 text-rose-600 shrink-0" />
            <span>CONFIDENCE DECREASED</span>
          </div>
          <div className="text-[10px] text-rose-700 leading-relaxed font-medium space-y-1">
            <p><strong>Reason:</strong> Missing local observation ({selectedNode.sensorId}).</p>
            <p className="text-slate-600">
              System continues prediction using remaining spatial inputs, upstream hydrographs, and GraphSAGE topological imputation.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
