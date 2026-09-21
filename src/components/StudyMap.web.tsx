import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import type {
  FillExtrusionLayerSpecification,
  LayerSpecification,
} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import { UTS_MAP_CENTER } from '../data/mapSpots';
import type { StudySpot } from '../services/studySpots';
import { COLORS } from '../theme';

type StudyMapProps = {
  spots: StudySpot[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
};

const MAPTILER_KEY =
  process.env.EXPO_PUBLIC_MAPTILER_KEY;

if (!MAPTILER_KEY) {
  throw new Error(
    'Missing EXPO_PUBLIC_MAPTILER_KEY'
  );
}

const MAP_STYLE =
  `https://api.maptiler.com/maps/hybrid/style.json?key=${MAPTILER_KEY}`;

const CROWD_COLORS = {
  quiet: COLORS.green,
  moderate: COLORS.amber,
  busy: COLORS.pink,
};

export default function StudyMap({
  spots,
  selectedId,
  onSelect,
}: StudyMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<
    Map<string, maplibregl.Marker>
  >(new Map());
  const onSelectRef = useRef(onSelect);
  const [mapReady, setMapReady] = useState(false);

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
          (layer: LayerSpecification) =>
            layer.type === 'symbol'
        )?.id;

      const vectorSourceId = Object.entries(
  map.getStyle().sources
).find(
  ([, source]) => source.type === 'vector'
)?.[0];

if (
  vectorSourceId &&
  !map.getLayer('studyspot-3d-buildings')
) {
        const buildingLayer: FillExtrusionLayerSpecification =
          {
            id: 'studyspot-3d-buildings',
            type: 'fill-extrusion',
            source: vectorSourceId,
            'source-layer': 'building',
            minzoom: 14,
            paint: {
              'fill-extrusion-color': [
  'interpolate',
  ['linear'],
  [
    'to-number',
    [
      'coalesce',
      ['get', 'render_height'],
      ['get', 'height'],
      8,
    ],
  ],
  0,
  '#E1DED8',
  25,
  '#D4D0C8',
  60,
  '#C2BEB6',
  120,
  '#AAA69F',
],
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
              'fill-extrusion-opacity': 1,
              'fill-extrusion-vertical-gradient': true,
            },
          };

        map.addLayer(buildingLayer, firstLabelLayer);
        map.setLight({
          anchor: 'map',
          color: '#FFFFFF',
          intensity: 0.7,
          position: [1.2, 210, 30],
        });
      }

      setMapReady(true);
    });

    map.on('click', () => {
      onSelectRef.current(null);
    });

    const resizeObserver = new ResizeObserver(() => {
      map.resize();
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      setMapReady(false);
      resizeObserver.disconnect();

      markersRef.current.forEach((marker) => {
        marker.remove();
      });
      markersRef.current.clear();

      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !mapReady) {
      return;
    }

    markersRef.current.forEach((marker) => {
      marker.remove();
    });
    markersRef.current.clear();

    spots.forEach((spot) => {
      const markerContainer =
        document.createElement('div');
      const markerButton =
        document.createElement('button');

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
        backgroundColor:
          CROWD_COLORS[spot.crowd_level],
        boxShadow:
          '0 3px 12px rgba(0, 0, 0, 0.45)',
        transition:
          'width 150ms ease, height 150ms ease',
      });

      markerButton.addEventListener(
        'click',
        (event) => {
          event.stopPropagation();
          onSelectRef.current(spot.id);
        }
      );

      markerContainer.appendChild(markerButton);

      const marker = new maplibregl.Marker({
        element: markerContainer,
        anchor: 'bottom',
      })
        .setLngLat([
          spot.longitude,
          spot.latitude,
        ])
        .addTo(map);

      markersRef.current.set(spot.id, marker);
    });
  }, [spots, mapReady]);

  useEffect(() => {
    markersRef.current.forEach((marker, id) => {
      const button = marker
        .getElement()
        .querySelector(
          'button'
        ) as HTMLButtonElement | null;

      if (!button) {
        return;
      }

      const isSelected = id === selectedId;

      button.style.width = isSelected
        ? '32px'
        : '24px';
      button.style.height = isSelected
        ? '32px'
        : '24px';
      button.style.boxShadow = isSelected
        ? `0 0 0 5px ${COLORS.purple}55, 0 4px 16px rgba(0, 0, 0, 0.55)`
        : '0 3px 12px rgba(0, 0, 0, 0.45)';
    });
  }, [selectedId, spots, mapReady]);

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