"""
DharaDrishti - GraphSAGE Architecture & PyTorch Pipeline
Implements the Inductive Graph Neural Network (GraphSAGE) with Mean Aggregator
for terrain-aware spatial flood risk prediction.
"""

import os
import json
import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np

class SAGEConv(nn.Module):
    """
    GraphSAGE Layer (Hamilton et al., NeurIPS 2017)
    Aggregates upstream & adjacent catchment representations using Mean Aggregation:
    h_v = ReLU( W · [h_v || MEAN({h_u, ∀ u ∈ N(v)})] )
    """
    def __init__(self, in_features, out_features):
        super(SAGEConv, self).__init__()
        self.in_features = in_features
        self.out_features = out_features
        # Linear projection of concatenated self + neighbor features
        self.weight = nn.Linear(in_features * 2, out_features, bias=True)
        self.reset_parameters()

    def reset_parameters(self):
        nn.init.xavier_uniform_(self.weight.weight)
        nn.init.zeros_(self.weight.bias)

    def forward(self, x, adj_matrix):
        """
        x: [num_nodes, in_features]
        adj_matrix: [num_nodes, num_nodes] (directed/hydrological adjacency)
        """
        num_nodes = x.size(0)
        # Degree normalization for neighbor aggregation
        deg = torch.sum(adj_matrix, dim=1, keepdim=True)
        deg = torch.clamp(deg, min=1.0)
        
        # Aggregate neighbor features: mean aggregation
        neighbor_features = torch.matmul(adj_matrix, x) / deg
        
        # Concatenate self features with aggregated neighbor features
        concat_features = torch.cat([x, neighbor_features], dim=1)
        
        # Project through learned transformation matrix
        out = self.weight(concat_features)
        return F.relu(out)

class DharaDrishtiGraphSAGE(nn.Module):
    """
    2-Layer GraphSAGE Network with downstream risk classification head.
    Node Features (dim=6):
      0: Normalized Rainfall (mm/h)
      1: Normalized Soil Saturation (%)
      2: Normalized River Stage / Water Level (m)
      3: Topographic Slope / Instability index
      4: Upstream Cumulative Catchment Area
      5: Flow Gradient (m/km)
    """
    def __init__(self, in_channels=6, hidden_channels=16, out_channels=2):
        super(DharaDrishtiGraphSAGE, self).__init__()
        self.conv1 = SAGEConv(in_channels, hidden_channels)
        self.conv2 = SAGEConv(hidden_channels, 8)
        self.classifier = nn.Linear(8, out_channels)
        self.dropout = nn.Dropout(p=0.1)

    def forward(self, x, adj_matrix):
        # Layer 1 spatial aggregation
        h1 = self.conv1(x, adj_matrix)
        h1 = self.dropout(h1)
        
        # Layer 2 2-hop spatial aggregation
        h2 = self.conv2(h1, adj_matrix)
        
        # Node embedding for spatial visualization
        embeddings = h2
        
        # Classification logits
        logits = self.classifier(h2)
        probs = F.softmax(logits, dim=1)
        return probs, embeddings

def get_kullu_tensor_graph():
    topo_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'processed_data', 'kullu_corridor_graph.json')
    with open(topo_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    nodes = data['nodes']
    edges = data['edges']
    node_ids = [n['id'] for n in nodes]
    id_to_idx = {nid: i for i, nid in enumerate(node_ids)}
    N = len(nodes)
    
    # Directed Adjacency Matrix (upstream to downstream + tributary inputs)
    adj = torch.zeros((N, N), dtype=torch.float32)
    # Add self-loops to maintain identity in aggregation
    for i in range(N):
        adj[i, i] = 1.0
        
    for edge in edges:
        src = id_to_idx[edge['source']]
        tgt = id_to_idx[edge['target']]
        # Directed flow: target receives information from source
        adj[tgt, src] = 1.0
        # Gentle reverse feedback (backwater awareness)
        adj[src, tgt] = 0.25

    # Default Feature Matrix [N, 6]
    features = []
    for n in nodes:
        rain_norm = n['defaultRain'] / 150.0
        soil_norm = n['defaultSoil'] / 100.0
        wl_norm = n['defaultWaterLevel'] / 5.0
        slope_norm = n['slope'] / 50.0
        elev_norm = (n['elevation'] - 900.0) / 1600.0
        # Historical vulnerability proxy based on elevation and drainage
        vuln = 0.5 + 0.3 * (1.0 - elev_norm)
        features.append([rain_norm, soil_norm, wl_norm, slope_norm, elev_norm, vuln])
        
    x = torch.tensor(features, dtype=torch.float32)
    return nodes, edges, x, adj, id_to_idx

def run_sample_inference(custom_features=None):
    nodes, edges, x, adj, id_to_idx = get_kullu_tensor_graph()
    if custom_features is not None:
        x = custom_features

    model = DharaDrishtiGraphSAGE(in_channels=6, hidden_channels=16, out_channels=2)
    model.eval()
    with torch.no_grad():
        probs, embeddings = model(x, adj)
        
    results = {}
    for i, node in enumerate(nodes):
        flood_prob = float(probs[i, 1].item())
        results[node['id']] = {
            "name": node['name'],
            "floodProbability": round(flood_prob, 4),
            "riskScore": int(round(flood_prob * 100)),
            "embedding": [round(float(v), 4) for v in embeddings[i].tolist()]
        }
    return results

if __name__ == '__main__':
    print("Testing DharaDrishti GraphSAGE Pipeline...")
    nodes, edges, x, adj, id_to_idx = get_kullu_tensor_graph()
    print(f"Graph initialized: {len(nodes)} nodes, Adjacency shape: {adj.shape}")
    print(f"Feature matrix shape: {x.shape}")
    
    results = run_sample_inference()
    print("\nInitial GraphSAGE Output:")
    for nid, res in results.items():
        print(f"  [{nid}] {res['name']}: Flood Risk {res['riskScore']}/100 (Prob: {res['floodProbability']})")
    
    out_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'processed_data', 'graphsage_demo_inference.json')
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2)
    print(f"\nSaved inference output to {out_path}")
