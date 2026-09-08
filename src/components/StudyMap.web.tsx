import * as maplibregl from 'maplibre-gl';
import type {
  FillExtrusionLayerSpecification,
  LayerSpecification,
} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import { MAP_SPOTS, UTS_MAP_CENTER } from '../data/mapSpots';
import { COLORS } from '../theme';
import { useEffect, useRef } from 'react';

type StudyMapProps = {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
};

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

const CROWD_COLORS = {
  quiet: COLORS.green,
  moderate: COLORS.amber,
  busy: COLORS.pink,
};

export default function StudyMap({
  selectedId,
  onSelect,
}: StudyMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const onSelectRef = useRef(onSelect);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: UTS_MAP_CENTER,
      zoom: 15.5,
      pitch: 60,
      bearing: -20,
      canvasContextAttributes: {
        antialias: true,
    },
      attributionControl: false,
    });

    mapRef.current = map;

    map.on('load', () => {
      const firstLabelLayer = map
        .getStyle()
        .layers?.find(
            (layer: LayerSpecification) => layer.type === 'symbol'
        )?.id;

      if (
        map.getSource('openmaptiles') &&
        !map.getLayer('studyspot-3d-buildings')
      ) {
        const buildingLayer: FillExtrusionLayerSpecification = {
          id: 'studyspot-3d-buildings',
          type: 'fill-extrusion',
          source: 'openmaptiles',
          'source-layer': 'building',
          minzoom: 14,
          paint: {
            'fill-extrusion-color': '#252938',
            'fill-extrusion-height': [
              'coalesce',
              ['get', 'render_height'],
              ['get', 'height'],
              8,
            ],
            'fill-extrusion-base': [
              'coalesce',
              ['get', 'render_min_height'],
              0,
            ],
            'fill-extrusion-opacity': 0.88,
          },
        };

        map.addLayer(buildingLayer, firstLabelLayer);
      }

      MAP_SPOTS.forEach((spot) => {
        const markerContainer = document.createElement('div');
        const markerButton = document.createElement('button');

        markerButton.type = 'button';
        markerButton.title = spot.name;
        markerButton.dataset.spotId = spot.id;

        Object.assign(markerButton.style, {
          width: '24px',
          height: '24px',
          display: 'block',
          padding: '0',
          cursor: 'pointer',
          borderRadius: '50%',
          border: '3px solid white',
          backgroundColor: CROWD_COLORS[spot.crowd],
          boxShadow: '0 3px 12px rgba(0, 0, 0, 0.45)',
          transition: 'width 150ms ease, height 150ms ease',
        });

        markerButton.addEventListener('click', (event) => {
          event.stopPropagation();
          onSelectRef.current(spot.id);
        });

        markerContainer.appendChild(markerButton);

        const marker = new maplibregl.Marker({
          element: markerContainer,
          anchor: 'bottom',
        })
          .setLngLat(spot.coordinates)
          .addTo(map);

        markersRef.current.set(spot.id, marker);
      });
    });

    map.on('click', () => {
      onSelectRef.current(null);
    });

    const resizeObserver = new ResizeObserver(() => {
      map.resize();
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();

      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current.clear();

      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    markersRef.current.forEach((marker, id) => {
      const button = marker
        .getElement()
        .querySelector('button') as HTMLButtonElement | null;

      if (!button) {
        return;
      }

      const isSelected = id === selectedId;

      button.style.width = isSelected ? '32px' : '24px';
      button.style.height = isSelected ? '32px' : '24px';
      button.style.boxShadow = isSelected
        ? `0 0 0 5px ${COLORS.purple}55, 0 4px 16px rgba(0, 0, 0, 0.55)`
        : '0 3px 12px rgba(0, 0, 0, 0.45)';
    });
  }, [selectedId]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    />
  );
}