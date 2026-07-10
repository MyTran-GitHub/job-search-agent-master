# Master CV for Geospatial Engineer-adjacent roles


[MY TRAN] | [tran@uni.minerva.edu] | [https://www.linkedin.com/in/mee-tran-34530725b/] | [+1 6282526649] | https://github.com/MyTran-GitHub [San Francisco, CA]

## Summary

Geospatial Engineer building scalable Earth Observation systems to help organizations measure impact of climate interventions and prioritize where to act. My work spans 5 countries, from GeoAI foundation models for climate program evaluation to geospatial modeling for wildfire intelligence platforms and climate-resilient agriculture.

## Education

**[Minerva University]** — [B.S. Data Science, Minor in Economics and Sustainability] | May 2026
Courses: Machine Learning, Geospatial & Remote Sensing, Econometrics, Statistical Modeling, Bayesian Statistics

---

## Skills

Geospatial: Google Earth Engine, QGIS | GeoPandas, Shapely, Rasterio, GDAL, Xarray | Sentinel-2, Landsat, MODIS, ERA5
Cloud & Spatial Data Engineering: AWS S3, STAC, COG | Zarr, NetCDF, Parquet | PostgreSQL/PostGIS, Dask
Programming: Python, R, JavaScript, SQL | PyTorch, TensorFlow, Computer Vision, Foundational EO | Git, Docker, Slurm
Data Products & Visualization: Mapbox, Streamlit, Plotly, Folium, Leaflet, Tableau


---

## EXPERIENCE

Geospatial Engineer Assistant |  **Planetary Causal Inference Lab** | Sep 2025 - Current     

- Built geospatial ETL pipeline (25 years of Landsat imagery, 3 countries ~1M km²), integrating STAC-based retrieval from AWS S3, implemented Dask-backed chunked Xarray parallel processing on TACC HPC for out-of-core tiling/ mosaicking, generating GeoParquet satellite embeddings for downstream environmental analysis
- Extended open-source package CausalImagesR with modular backend abstraction for 4+ satellite feature extractors (CNN, Vision Transformer, Clay, AlphaEarth), enabling reproducible benchmarking of satellite representations for environmental outcome measurement across 3 anti-poverty and conservation RCTs

Geospatial Analyst Intern  |  **Minerva University Satellite Lab** | Sep 2024 - Aug 2025
- Fine-tuned a U-Net land cover segmentation model in PyTorch on Sentinel-2 imagery, improving validation mIoU from 86% to 95% and generating higher-fidelity land-cover inputs for downstream hydrological model
- Spatialized non-spatial water balance model into raster-based simulation over co-registered soil moisture and evapotranspiration rasters, enabling pixel-level climate impact comparison under alternative irrigation scenarios
- Produced nation-wide Alternative Wet Drying (AWD) irrigation suitability maps for Japan Rice Institute, identifying potential AWD adoption zones projected to reduce water use by 60% and methane emissions by 24%

ESG Analytics Intern |  **Vietnam Military Commercial Joint Stock Bank** | May 2024 - Aug 2024
- Reprojected, resampled, aligned, quality-assured multi-scale solar irradiance, wind speed, terrain rasters (ERA5, PVGIS, SRTM) onto common grid, enabling structural renewable energy suitability analysis of 20+ sites
- Computed regional wind and solar variability metrics using zonal statistics and temporal aggregation, producing 10+ GIS screening reports used in team reviews to compare regional renewable energy investment opportunities

Urban Analyst Intern  |  **Gyeonggi Housing & Urban Development Corporation** | Sep 2023 - Dec 2023
- Conducted spatial joins and polygon aggregation in PostGIS to integrate land surface temperature, building footprints, and socioeconomic datasets, generating building-level spatial features across 200+ buildings
- Computed composite heat-energy burden index to rank 20 high-risk retrofit candidates and built Streamlit dashboard enabling building managers to compare baseline energy performance and track post-retrofit consumption


---

## Projects

**Fuego.Earth Wildfire Spread Simulation Interface** | Dec 2025 - Current
Engineered geospatial data pipeline for wildfire simulation platform, automated LANDFIRE acquisition from USGS API, transformed raster datasets into Cell2Fire inputs, and vectorized burn spread into GeoJSON time-series for FastAPI backend and React/Mapbox frontend, enabling sub-minute reruns through cached terrain preprocessing

**[Undergraduate Thesis] Evaluate impact of Prescribed burn programs in reducing wildfire risks:** | Oct 2025 - April 2026

Constructed satellite embedding pipeline using AlphaEarth foundation model inference over historical Landsat imagery in California, performed Top-K cosine-similarity retrieval to construct counterfactual control pools, and estimated causal impact of prescribed burn interventions (15–20% reduction in wildfire ignition events)

