# DHARADRISHTI — DATASET AUDIT & SPECIFICATION DOCUMENT

**Smart India Hackathon (SIH) — Problem Statement 26192**  
*Flash Flood Prediction System for Hilly Regions using Multi-Source Data*  
**Department / Agency:** National Disaster Response Force (NDRF), Disaster Management Division, Ministry of Home Affairs  
**Primary Demonstration Corridor:** Upper Beas Basin (Kullu–Manali River Valley, Himachal Pradesh)  

---

## 1. Executive Summary of Available Datasets

The project workspace contains three primary source files:
1. `flood_risk_dataset_india.csv` (1.85 MB) — Tabular Flood Risk Dataset
2. `HiFlo-DAT_Merged_FINAL_24.8.21.xlsx` (134 KB) — Upper Beas Historical Flood Events (1846–2020)
3. `HiFlo-DAT_Unmerged_FINAL_24.8.21.xlsx` (324 KB) — Primary Source Citation & Historical Record Inventory

In strict adherence to scientific integrity principles:
- **No original dataset files are altered or overwritten.**
- **All derived products are stored in a dedicated `processed_data/` layer.**
- **No synthetic data is falsely attributed as empirical Kullu measurements.**
- **No missing metrics or accuracies are fabricated.**

---

## 2. Dataset 1: Kaggle "Flood Risk in India"

### 2.1 File Characteristics
- **File Name:** `flood_risk_dataset_india.csv`
- **File Size:** 1,854,311 bytes (~1.85 MB)
- **Record Count:** 10,000 rows
- **Attribute Count:** 14 columns
- **Missing / Null Values:** 0 (100% complete)

### 2.2 Column-by-Column Schema
| Column Name | Data Type | Value Range / Domain | Nulls | Description |
| :--- | :--- | :--- | :--- | :--- |
| `Latitude` | `float64` | 8.0003°N to 36.9918°N | 0 | Geographic latitude (Pan-India bounding box) |
| `Longitude` | `float64` | 68.0045°E to 96.9978°E | 0 | Geographic longitude (Pan-India bounding box) |
| `Rainfall (mm)` | `float64` | 0.014 mm to 299.97 mm | 0 | Accumulated/event precipitation |
| `Temperature (°C)` | `float64` | 15.00°C to 44.99°C | 0 | Ambient surface temperature |
| `Humidity (%)` | `float64` | 20.00% to 100.00% | 0 | Relative air humidity |
| `River Discharge (m³/s)`| `float64` | 0.042 m³/s to 4,999.70 m³/s | 0 | Fluvial discharge rate |
| `Water Level (m)` | `float64` | 0.003 m to 9.997 m | 0 | River stage / hydrometric water depth |
| `Elevation (m)` | `float64` | 1.15 m to 8,846.89 m | 0 | Topographic altitude |
| `Land Cover` | `object` | 5 categories: Water Body (2,046), Desert (2,033), Forest (2,005), Agricultural (1,978), Urban (1,938) | 0 | Categorical land use / land cover |
| `Soil Type` | `object` | 5 categories: Peat (2,052), Silt (2,044), Clay (1,978), Loam (1,972), Sandy (1,954) | 0 | Soil classification |
| `Population Density` | `float64` | 2.29 to 9,999.17 persons/km² | 0 | Demographic density |
| `Infrastructure` | `int64` | Binary: {0: 4,980, 1: 5,020} | 0 | Infrastructure presence flag |
| `Historical Floods` | `int64` | Binary: {0: 5,013, 1: 4,987} | 0 | Past flood occurrence indicator |
| `Flood Occurred` | `int64` | Binary: {0: 4,943, 1: 5,057} | 0 | **Target Variable**: Flood event flag |

### 2.3 Statistical Diagnosis & Honest Classification
- **Distribution Analysis:** Every continuous attribute (`Rainfall`, `River Discharge`, `Water Level`, `Elevation`, `Population Density`) exhibits a near-perfect uniform random distribution across its entire range.
- **Cross-Correlation:** Pearson correlations between environmental predictors and `Flood Occurred` are near zero (`r = -0.015` to `+0.027`).
- **Classification:** **SYNTHETIC / SAMPLE BENCHMARK DATASET**.
- **Role in DharaDrishti:** Used strictly to test tabular machine learning baselines (Random Forest, Gradient Boosting, MLP) and feature normalization pipelines. It is **never** used as empirical real-time ground truth for the Kullu Valley.

---

## 3. Dataset 2: HiFlo-DAT (Merged & Unmerged)

### 3.1 Overview & Provenance
HiFlo-DAT is an authoritative, peer-reviewed historical database specifically documenting extreme hydrometeorological events and flash floods in the **Upper Beas River Catchment (Kullu District, Himachal Pradesh)** spanning **1846 to 2020**.

### 3.2 File 1: `HiFlo-DAT_Merged_FINAL_24.8.21.xlsx`
- **Structure:** 132 rows × 82 columns
  - Row 0: Column number indexing (1–82)
  - Row 1: High-level thematic categories (`WHEN`, `WHERE`, `WHAT`, `DAMAGES`, `CASUALTIES`)
  - Row 2: Standard attribute header names
  - Row 3: Measurement explanations and coding protocols
  - Rows 4–131: **128 consolidated flood event records**
- **Geographic Coverage:**
  - Latitude: **31.784951°N to 32.353175°N**
  - Longitude: **77.087647°E to 77.448293°E**
  - **100% of records** possess valid, pinpointed georeferenced coordinates in the Kullu–Manali Valley.
- **Key Settlement Locations Included:**
  - Manali (Old Manali, Manaslu, Aleo)
  - Naggar / Patlikuhl
  - Raison / Dobhi / 15 Mile
  - Kullu Town (Sultanpur, Akhara Bazaar, Sarvari)
  - Mohal
  - Shamshi
  - Bhuntar (Airport, Beas–Parbati confluence)
  - Bajaura / Hat
  - Kasol / Manikaran (Parbati Valley)
  - Palchan / Solang Nullah
- **Key Rivers & Tributaries:**
  - Beas River (Main Stem)
  - Parbati River
  - Sarvari Nalla
  - Solang River
  - Manaslu Khad
  - Duhangan Nalla
  - Mohal Khad
  - Khokhan Torrent
- **Process Classification:**
  - Flash Floods (FF): Short-duration torrential runoff, cloudbursts
  - River Floods (RF): Long-duration continuous monsoon inundation
  - Landslide/Debris Floods (L)
  - Glacial Lake Outburst / Snowmelt (GLOF/SM)

### 3.3 File 2: `HiFlo-DAT_Unmerged_FINAL_24.8.21.xlsx`
- **Structure:** 313 rows × 96 columns
  - Rows 4–312: **309 granular historical citations & eyewitness accounts**
- **Source Breakdown:**
  - Newspaper Reports (N): 227 (The Tribune, Amar Ujala, Dainik Jagran)
  - Government / Agency Technical Reports (R): 34 (GSI, CWC, HP PWD)
  - Academic Journal Articles (A): 25 (e.g., Cunningham 1848, Asiatic Society)
  - Books & Memoirs (B): 10 (Harcourt 1871, Howell 1917)
  - Satellite & Orthophoto Ground Surveys (O): 11
- **Role in DharaDrishti:**
  - Provides rich historical event narration and damage metrics (fatalities, bridge washaways, road closures)
  - Serves as the backbone for the **Historical Event Replay** module, allowing emergency managers to test the DharaDrishti graph against historical cloudburst events (such as the September 1995 Beas flood and July 2023 catastrophe).

---

## 4. Derived Data Processing Architecture

To keep the raw data completely pristine, a Python normalization pipeline extracts and serializes:
```
processed_data/
├── hiflo_events_kullu.json          <- Cleaned, geocoded 128 historical events with damage metrics
├── hiflo_sources_kullu.json         <- 309 cross-referenced citations and eyewitness records
├── kullu_graph_topology.json        <- 11 corridor nodes, 13 directed hydrological edges, DEM elevation
└── kaggle_benchmark_metadata.json   <- Normalized feature distributions for ML pipeline benchmarks
```

---

## 5. Summary of Roles in the DharaDrishti Architecture

| Dataset | Nature | System Label | Primary Function in Prototype |
| :--- | :--- | :--- | :--- |
| **HiFlo-DAT** | Empirical Ground Truth | `HISTORICAL OBSERVATIONS` | Historical event catalog, spatial calibration, event replay, vulnerability mapping |
| **Kaggle Flood Risk** | Synthetic Benchmark | `SYNTHETIC BENCHMARK` | Tabular ML pipeline testing, standard feature scaling evaluation |
| **IoT Telemetry** | Simulated Real-Time Stream | `SIMULATED LIVE IOT` | Interactive sensor controls, cloudburst trigger, graph neighbor aggregation demo |
| **GNN / GraphSAGE** | Spatial Graph Representation | `GRAPH INTELLIGENCE ENGINE`| Directed spatial neighbor aggregation and downstream flood risk propagation |
