# Job Function Taxonomy

Classification rules for `engine/classify_job_function.ts` and requirement normalization.

## Job Functions

| Function | ID | Title Keywords | Description Keywords |
|---|---|---|---|
| Geospatial Engineering | `GeospatialEngineering` | geospatial engineer, GIS developer, spatial engineer, mapping engineer | PostGIS, GDAL, spatial databases, ETL pipelines, cloud geoprocessing |
| GIS Analyst | `GISAnalyst` | GIS analyst, cartographer, spatial analyst, mapping specialist | ArcGIS, QGIS, cartography, spatial analysis, field data collection |
| GeoAI / ML Research | `GeoAIResearch` | GeoAI, remote sensing, earth observation, satellite scientist/analyst | deep learning, satellite imagery, Earth Engine, computer vision, PyTorch, TensorFlow |
| Environmental Data Science | `EnvironmentalDS` | environmental data scientist, environmental analyst, climate data/analyst, sustainability analyst, wildfire analyst, environmental intelligence | environmental modeling, hydrology, ecology, climate data, ESG, wildfire, sustainability |
| Other | `Other` | software engineer, data engineer, backend | (fallback when no geospatial signal) |

## Classification Rules

1. **Title match first** — score each function by keyword hits in `title`.
2. **Description fallback** — if title is ambiguous (e.g. "Data Scientist"), score `description` + `requirements`.
3. **Tie-break** — prefer more specific geo function over `Other`.
4. **Minimum score** — require at least 1 title hit OR 2 description hits to assign a geo function.

## Requirement Normalization Map

Maps JD terminology → candidate vocabulary for resume optimization.

| JD Term | Normalized / Resume Term |
|---|---|
| raster/vector analysis | geoprocessing, spatial analysis, GIS raster workflows |
| cloud computing | AWS, GCP, distributed pipelines |
| machine learning | PyTorch, scikit-learn, GeoAI models |
| remote sensing | satellite imagery, earth observation, multispectral analysis |
| spatial databases | PostGIS, GeoPackage, spatial SQL |
| ETL | data pipelines, geospatial ETL, batch processing |
| cartography | map design, visualization, symbology |
| field data collection | GPS surveying, ground-truthing, mobile GIS |

## Hard Requirement Signals (blocking)

- US citizen only / citizenship required
- no OPT / no CPT / no sponsorship
- security clearance (TS, SCI, TS/SCI)
- permanent residency required
- active {state} bar / medical license / PE license required
- PhD required (for practitioner roles)

## Preferred Signals (non-blocking)

- 3–5 years experience (unless paired with entry-level title + >3yr → hard reject)
- Master's degree preferred
- nice-to-have tools

## Entry-Level Detection

Title contains: entry-level, junior, jr, associate, new grad, graduate, intern (without senior/lead/principal).

Experience reject rules:
- Entry-level title + requires >3 years → REJECT
- Non-entry title + requires 3+ years → REJECT (for entry-level candidates per constraints)
- 0–1 years or bachelor degree → ACCEPT
- Ambiguous → pass to optimization stage
