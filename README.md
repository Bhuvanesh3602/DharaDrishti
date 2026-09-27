# 🌊 DharaDrishti (धारादृष्टि)
### Terrain-Aware Hyperlocal Flash Flood Decision Support System

[![Smart India Hackathon](https://img.shields.io/badge/SIH%202026-PS%2026192-orange.svg)](https://sih.gov.in/)
[![Target Agency](https://img.shields.io/badge/Agency-NDRF%20%7C%20MHA-blue.svg)](https://www.ndrf.gov.in/)
[![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20TypeScript%20%7C%20PyTorch-green.svg)](#technology-stack)
[![Focus Region](https://img.shields.io/badge/Focus-Kullu--Manali%20Corridor%2C%20HP-red.svg)](#focus-corridor)

---

## 📌 Overview

**DharaDrishti** is an AI-powered, terrain-aware emergency decision support system designed specifically for steep Himalayan river catchments prone to cloudbursts and flash floods.

Traditional early warning setups evaluate monitoring gauges in isolation. **DharaDrishti** models entire river corridors as a **Directed Hydrological Drainage Graph (DHDG)**. By combining **Inductive Graph Neural Networks (GraphSAGE)** with multi-source telemetry and digital elevation data, the system predicts upstream risk accumulation and downstream hydraulic cascades with actionable lead-time for disaster responders.

* **Target Agency:** National Disaster Response Force (NDRF), Disaster Management Division, Ministry of Home Affairs (MHA), Government of India.
* **Primary Demonstration Area:** Upper Beas River Catchment (Solang – Manali – Raison – Kullu – Bhuntar – Larji, Himachal Pradesh).

---

## 🚀 Key Features

* **🕸️ Hydrological Graph Modeling (GraphSAGE):** Models river nodes, confluences, and tributaries as directed graph edges based on elevation gradients rather than simple Euclidean distances.
* **⚡ 8-Stage Visual Explainability Engine:** Real-time state machine showing judges and responders exactly how upstream sensor spikes aggregate through Graph Neural Network layers to trigger downstream village alerts.
* **🎛️ "What-If" Cloudburst Simulator:** Interactive scenario testing to simulate sudden cloudbursts (e.g., +50 mm/h at Raison) and evaluate localized flooding impacts.
* **⚠️ Uncertainty & Sensor Degradation Engine:** Dynamically calculates forecast confidence. If critical upstream telemetry sensors drop offline, confidence scores drop and fallback ground patrol protocols are recommended.
* **🚨 CAP-Compliant NDRF Alert Center:** Issues standardized Common Alerting Protocol (CAP) alerts specifying urgency, severity, certainty, and tactical deployment instructions.
* **📜 HiFlo-DAT Historical Replay:** Built-in interactive replay and validation engine using authentic, peer-reviewed flood records (1846–2020) for the Kullu Valley.

---

## 🏗️ System Architecture

```
[ Rainfall Telemetry | Soil Moisture | River Stage | Slope Instability ]
                                │
                                ▼
                    ┌───────────────────────┐
                    │  MULTI-SOURCE FUSION  │
                    └───────────┬───────────┘
                                ▼
                    ┌───────────────────────┐
                    │ TOPOGRAPHY / DEM GRIDS│
                    │ Elevation, Slope, Flow│
                    └───────────┬───────────┘
                                ▼
                    ┌───────────────────────┐
                    │ DIRECTED DRAINAGE     │
                    │ HYDROLOGICAL GRAPH    │
                    └───────────┬───────────┘
                                ▼
                    ┌───────────────────────┐
                    │ GRAPH NEURAL NETWORK  │
                    │ GraphSAGE Aggregator  │
                    └───────────┬───────────┘
                                ▼
                    ┌───────────────────────┐
                    │ SPATIO-TEMPORAL RISK  │
                    │ (NOW, +1h, +2h, +3h)  │
                    └───────────┬───────────┘
                                ▼
                    ┌───────────────────────┐
                    │ ACTIONABLE NDRF CAP   │
                    │ Tactical Alert Center │
                    └───────────────────────┘
```

---

## 💻 Technology Stack

* **Frontend Dashboard:** React 19, TypeScript, Vite, Tailwind CSS
* **Mapping & GIS:** Leaflet.js, React-Leaflet (OpenStreetMap Topo & Carto basemaps)
* **Data Visualization:** Recharts, Lucide Icons, Three.js
* **Machine Learning & Graph Engine:** PyTorch, GraphSAGE (Mean Aggregation), NumPy, Pandas
* **Datasets Integrated:**
  * **HiFlo-DAT Historical Database:** 128 documented historical flood events (1846–2020) in the Upper Beas Catchment.
  * **Synthetic Multi-Variable Pan-India Dataset:** 10,000 baseline records for pipeline validation.

---

## 🛠️ Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) (v18 or higher)
* [Python](https://www.python.org/) 3.9+ (optional, for ML pipeline scripts)

### Installation & Launch

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Bhuvanesh3602/DharaDrishti.git
   cd DharaDrishti
   ```

2. **Run the Dashboard:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Open your browser at `http://localhost:5173`.

   *(On Windows, you can also double-click `start_dharadrishti.bat` from the root folder).*

---

## 📂 Project Structure

```
├── frontend/                     # React + Vite Tactical Command Dashboard
│   ├── src/
│   │   ├── components/           # Map, Workflow, Sensor Controls, Alerts
│   │   ├── data/                 # Graph topology & pre-processed datasets
│   │   ├── services/             # Risk calculation engine & alert generator
│   │   └── App.tsx               # Main application controller
│   └── package.json
├── ml/
│   └── graphsage_model.py        # PyTorch GraphSAGE architecture
├── processed_data/               # Cleaned corridor graph and event archives
├── scripts/
│   └── process_datasets.py       # Data processing and graph generation pipeline
├── DATASET_README.md             # Dataset audit & scientific integrity report
├── PROTOTYPE_BUILD_PLAN.txt      # Architecture blueprint & judge presentation script
└── start_dharadrishti.bat        # Windows one-click launch script
```

---

## 📜 Citation & Credits
* Developed for **Smart India Hackathon (SIH 2026)**.
* Historical event archive adapted from the peer-reviewed **HiFlo-DAT** dataset for the Upper Beas River Basin.
