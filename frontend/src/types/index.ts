export type RiskLevel = 'NORMAL' | 'WATCH' | 'WARNING' | 'CRITICAL';

export interface CorridorNode {
  id: string;
  name: string;
  basin: string;
  lat: number;
  lon: number;
  elevation: number;
  slope: number;
  river: string;
  sensorId: string;
  sensorType: string;
  defaultRain: number;
  defaultSoil: number;
  defaultWaterLevel: number;
  population: number;
  isPrimaryDemo?: boolean;
  upstream: string[];
  downstream: string[];
}

export interface CorridorEdge {
  id: string;
  source: string;
  target: string;
  name: string;
  lengthKm: number;
  gradientMpk: number;
  travelTimeMin: number;
}

export interface CorridorTopology {
  corridor: string;
  district: string;
  nodes: CorridorNode[];
  edges: CorridorEdge[];
  primaryDemoNode: string;
}

export interface SensorTelemetry {
  sensorId: string;
  nodeId: string;
  name: string;
  rainfall: number;           // mm/h
  humidity: number;           // %
  soilMoisture: number;       // %
  waterLevel: number;         // m
  slopeInstability: number;   // 0-100 index
  isOnline: boolean;
  lastUpdated: string;
}

export interface RiskFactors {
  rainfallContribution: number;
  soilContribution: number;
  waterLevelContribution: number;
  slopeContribution: number;
  upstreamInfluence: number;
}

export interface NodeRiskResult {
  nodeId: string;
  riskScore: number;          // 0 - 100
  previousRisk: number;
  riskDelta: number;
  level: RiskLevel;
  confidence: number;         // 0 - 100 %
  factors: RiskFactors;
  reasoning: string[];
  embeddingVector: number[];  // GraphSAGE node embedding
}

export type WorkflowStage =
  | 'IDLE'
  | 'STAGE_1_SENSOR_CHANGE'
  | 'STAGE_2_NODE_FEATURE_UPDATE'
  | 'STAGE_3_NEIGHBOR_AGGREGATION'
  | 'STAGE_4_GRAPHSAGE'
  | 'STAGE_5_RISK_UPDATE'
  | 'STAGE_6_PROPAGATION'
  | 'STAGE_7_VILLAGE_IMPACT'
  | 'STAGE_8_ALERT_GENERATION'
  | 'COMPLETE';

export interface WorkflowState {
  currentStage: WorkflowStage;
  activeNodeId: string;
  changedParam: string;
  prevValue: number;
  newValue: number;
  aggregationNeighbors: string[];
  propagatedNodes: { nodeId: string; prevRisk: number; newRisk: number; delaySec: number }[];
  isSimulating: boolean;
  stageProgress: number; // 1 to 8
}

export interface ForecastPoint {
  timeOffset: string;     // "NOW", "+1h", "+2h", "+3h"
  leadTimeHours: number;
  riskScore: number;
  rainfallMm: number;
  waterLevelM: number;
  confidence: number;
  level: RiskLevel;
}

export interface EmergencyAlert {
  id: string;
  timestamp: string;
  headline: string;
  targetNodeId: string;
  locationName: string;
  riskScore: number;
  level: RiskLevel;
  confidence: number;
  leadTime: string;
  factors: string[];
  recommendedAction: string;
  capUrgency: 'Immediate' | 'Expected' | 'Future';
  capSeverity: 'Extreme' | 'Severe' | 'Moderate' | 'Minor';
  capCertainty: 'Observed' | 'Likely' | 'Possible';
}

export interface HistoricalFloodEvent {
  id: string;
  eventNumber: string;
  year: string;
  month: number;
  day: number;
  dateStr: string;
  durationDays: number;
  river: string;
  settlement: string;
  lat: number;
  lon: number;
  processType: string;
  rainfallMm: number;
  rainDurationHours: number;
  rainIntensityMmh: number;
  peakDischargeM3s: number;
  slopeInstability: boolean;
  fatalities: number;
  injured: number;
  evacuated: number;
  totalAffected: number;
  notes: string;
}

export type ScenarioPreset = 'NORMAL_MONSOON' | 'HEAVY_RAIN' | 'EXTREME_CLOUDBURST';
