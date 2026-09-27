import { CorridorNode, CorridorEdge, SensorTelemetry, NodeRiskResult, RiskLevel, EmergencyAlert, ForecastPoint } from '../types';
import inferenceWeights from '../data/graphsage_demo_inference.json';

export function getRiskLevel(score: number): RiskLevel {
  if (score >= 75) return 'CRITICAL';
  if (score >= 50) return 'WARNING';
  if (score >= 25) return 'WATCH';
  return 'NORMAL';
}

export function calculateConfidence(
  node: CorridorNode,
  telemetryMap: Record<string, SensorTelemetry>,
  allNodes: CorridorNode[]
): number {
  const localSensor = telemetryMap[node.sensorId];
  if (!localSensor || !localSensor.isOnline) {
    return 48; // Serious penalty for offline station
  }

  let conf = 88;
  
  // Upstream sensor check
  for (const upId of node.upstream) {
    const upNode = allNodes.find(n => n.id === upId);
    if (upNode) {
      const upSensor = telemetryMap[upNode.sensorId];
      if (!upSensor || !upSensor.isOnline) {
        conf -= 14;
      }
    }
  }

  // Extreme event variance
  if (localSensor.rainfall > 100) {
    conf -= 6; // Historical non-linear tail uncertainty
  }

  return Math.max(25, Math.min(96, conf));
}

export function calculateCorridorRisk(
  nodes: CorridorNode[],
  edges: CorridorEdge[],
  telemetryMap: Record<string, SensorTelemetry>,
  previousRisks?: Record<string, number>
): Record<string, NodeRiskResult> {
  const results: Record<string, NodeRiskResult> = {};
  
  // Topological processing from upstream to downstream (Solang/Palchan -> Larji)
  for (const node of nodes) {
    const telemetry = telemetryMap[node.sensorId] || {
      sensorId: node.sensorId,
      nodeId: node.id,
      name: node.name,
      rainfall: node.defaultRain,
      humidity: 70,
      soilMoisture: node.defaultSoil,
      waterLevel: node.defaultWaterLevel,
      slopeInstability: 35,
      isOnline: true,
      lastUpdated: new Date().toLocaleTimeString()
    };

    // Calculate upstream risk influence
    let upstreamExcessScore = 0;
    const contributingUpstream: string[] = [];
    for (const upId of node.upstream) {
      const upResult = results[upId];
      if (upResult && upResult.riskScore > 35) {
        const excess = (upResult.riskScore - 35) * 0.35;
        upstreamExcessScore = Math.max(upstreamExcessScore, excess);
        contributingUpstream.push(upResult.nodeId);
      }
    }

    // Individual parameter contributions
    // Normalizing ranges:
    // Rain: 0 to 120 mm/h -> 0 to 35 pts
    const rainFactor = Math.min(35, (telemetry.rainfall / 110) * 35);
    // Soil: 0 to 100 % -> 0 to 25 pts
    const soilFactor = Math.min(25, (telemetry.soilMoisture / 100) * 25);
    // Water Level: 0 to 4.5 m -> 0 to 20 pts
    const waterFactor = Math.min(20, (telemetry.waterLevel / 4.0) * 20);
    // Slope Instability index: 0 to 100 -> 0 to 10 pts
    const slopeFactor = Math.min(10, ((telemetry.slopeInstability || 30) / 100) * 10);
    // Upstream Influence: 0 to 15 pts
    const upstreamFactor = Math.min(15, upstreamExcessScore);

    const rawScore = rainFactor + soilFactor + waterFactor + slopeFactor + upstreamFactor;
    const clampedScore = Math.max(5, Math.min(98, Math.round(rawScore)));

    const prev = previousRisks?.[node.id] ?? clampedScore;
    const delta = clampedScore - prev;

    const confidence = calculateConfidence(node, telemetryMap, nodes);

    const reasoning: string[] = [];
    if (telemetry.rainfall > 60) reasoning.push(`Intense precipitation (${telemetry.rainfall.toFixed(0)} mm/h)`);
    if (telemetry.soilMoisture > 75) reasoning.push(`High soil saturation (${telemetry.soilMoisture.toFixed(0)}%)`);
    if (telemetry.waterLevel > 2.0) reasoning.push(`Elevated river stage (${telemetry.waterLevel.toFixed(1)} m)`);
    if (upstreamFactor > 5) reasoning.push(`Upstream drainage surge from connected nodes`);
    if (!telemetry.isOnline) reasoning.push(`Local sensor OFFLINE - operating under degraded confidence`);

    if (reasoning.length === 0) reasoning.push('Hydrological parameters within normal seasonal baselines');

    // Retrieve precomputed or simulated GraphSAGE embedding
    const rawWeights = (inferenceWeights as Record<string, any>)[node.id];
    const baseEmbed = rawWeights?.embedding || [0.12, 0.45, 0.32, 0.67, 0.89, 0.23, 0.54, 0.76];
    // Dynamic modification based on current risk
    const dynamicEmbedding = baseEmbed.map((val: number, i: number) => {
      const shift = (clampedScore / 100) * (i % 2 === 0 ? 0.3 : -0.2);
      return Math.max(0, Math.min(1, Math.round((val + shift) * 1000) / 1000));
    });

    results[node.id] = {
      nodeId: node.id,
      riskScore: clampedScore,
      previousRisk: prev,
      riskDelta: delta,
      level: getRiskLevel(clampedScore),
      confidence,
      factors: {
        rainfallContribution: Math.round(rainFactor),
        soilContribution: Math.round(soilFactor),
        waterLevelContribution: Math.round(waterFactor),
        slopeContribution: Math.round(slopeFactor),
        upstreamInfluence: Math.round(upstreamFactor)
      },
      reasoning,
      embeddingVector: dynamicEmbedding
    };
  }

  return results;
}

export function generateForecastSeries(
  node: CorridorNode,
  currentRisk: NodeRiskResult,
  telemetry: SensorTelemetry
): ForecastPoint[] {
  const baseRisk = currentRisk.riskScore;
  const baseRain = telemetry.rainfall;
  const baseWater = telemetry.waterLevel;
  const baseConf = currentRisk.confidence;

  // 4-step forecast projection: NOW, +1h, +2h, +3h
  const trends = [
    { offset: 'NOW', hours: 0, multRain: 1.0, multWater: 1.0, riskShift: 0, confShift: 0 },
    { offset: '+1 HOUR', hours: 1, multRain: baseRain > 70 ? 1.15 : 0.95, multWater: 1.12, riskShift: baseRain > 70 ? 8 : -3, confShift: -4 },
    { offset: '+2 HOURS', hours: 2, multRain: baseRain > 70 ? 1.05 : 0.85, multWater: 1.25, riskShift: baseRain > 70 ? 14 : -7, confShift: -8 },
    { offset: '+3 HOURS', hours: 3, multRain: baseRain > 70 ? 0.80 : 0.70, multWater: 1.18, riskShift: baseRain > 70 ? 6 : -12, confShift: -14 }
  ];

  return trends.map(t => {
    const fRisk = Math.max(5, Math.min(99, Math.round(baseRisk + t.riskShift)));
    const fRain = Math.max(0, Math.round(baseRain * t.multRain));
    const fWater = Math.max(0.4, Math.round(baseWater * t.multWater * 10) / 10);
    const fConf = Math.max(20, Math.round(baseConf + t.confShift));

    return {
      timeOffset: t.offset,
      leadTimeHours: t.hours,
      riskScore: fRisk,
      rainfallMm: fRain,
      waterLevelM: fWater,
      confidence: fConf,
      level: getRiskLevel(fRisk)
    };
  });
}

export function generateEmergencyAlerts(
  nodes: CorridorNode[],
  riskMap: Record<string, NodeRiskResult>,
  telemetryMap: Record<string, SensorTelemetry>
): EmergencyAlert[] {
  const alerts: EmergencyAlert[] = [];

  for (const node of nodes) {
    const risk = riskMap[node.id];
    if (!risk) continue;

    if (risk.level === 'CRITICAL' || risk.level === 'WARNING') {
      const telemetry = telemetryMap[node.sensorId];
      const isCritical = risk.level === 'CRITICAL';
      
      const leadTime = isCritical ? '~45 min to 1.5 hrs' : '~2.0 to 3.5 hrs';
      const action = isCritical
        ? 'IMMEDIATE EVACUATION of riverine dwellings, bridge access restrictions, NDRF 14th Bn on standby at Bhuntar'
        : 'ACTIVE PATROL along low-lying embankments, issue sirens, prepare shelter centres';

      alerts.push({
        id: `ALT-${node.id}-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        headline: `${risk.level} FLASH FLOOD ALERT: ${node.name.toUpperCase()} CORRIDOR`,
        targetNodeId: node.id,
        locationName: `${node.name} (${node.basin})`,
        riskScore: risk.riskScore,
        level: risk.level,
        confidence: risk.confidence,
        leadTime,
        factors: risk.reasoning,
        recommendedAction: action,
        capUrgency: isCritical ? 'Immediate' : 'Expected',
        capSeverity: isCritical ? 'Extreme' : 'Severe',
        capCertainty: risk.confidence >= 70 ? 'Observed' : 'Possible'
      });
    }
  }

  return alerts;
}
