# Projects

<!-- Master experience database — source of truth for project work. -->

## project-geoai-wetlands

**Title:** Wetland Classification with Sentinel-2 Imagery  
**Dates:** Jan 2024 – May 2024  
**Technologies:** Python, PyTorch, GDAL, scikit-learn, Sentinel-2  
**Keywords:** remote sensing, GeoAI, raster analysis, machine learning, wetland mapping  

- Built U-Net segmentation model on Sentinel-2 multispectral imagery achieving 87% IoU on wetland boundaries
- Preprocessed 12-band rasters with GDAL; created training pipeline with augmentation for seasonal variation
- Deployed inference script processing 500+ km² tiles via batch geoprocessing workflow

## project-postgis-pipeline

**Title:** PostGIS Spatial Data Pipeline  
**Dates:** Sep 2023 – Dec 2023  
**Technologies:** PostGIS, Python, GeoPandas, AWS S3, QGIS  
**Keywords:** spatial databases, ETL, geoprocessing, vector analysis  

- Designed PostGIS schema for 2M+ parcel records with spatial indexing reducing query time by 60%
- Built Python ETL ingesting shapefiles and GeoJSON into normalized spatial tables
- Validated topology and CRS consistency across 15 county datasets
