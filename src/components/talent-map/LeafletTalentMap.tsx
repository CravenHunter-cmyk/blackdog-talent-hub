"use client";

import L from "leaflet";
import { useEffect } from "react";
import { Marker, MapContainer, TileLayer, Tooltip, useMap } from "react-leaflet";
import type { ContinentGroup, LanguageResource, Readiness } from "@/types/talent";

type LeafletTalentMapProps = {
  resources: LanguageResource[];
  selectedId: string;
  onSelect: (id: string) => void;
  focusedGroup: ContinentGroup;
};

const focusViewByGroup: Record<ContinentGroup, { center: [number, number]; zoom: number }> = {
  Americas: { center: [5, -75], zoom: 3 },
  Europe: { center: [50, 15], zoom: 4 },
  "Middle East & Africa": { center: [15, 30], zoom: 3 },
  "Asia-Pacific": { center: [15, 105], zoom: 3 },
  "Global / RoW": { center: [15, 20], zoom: 2 },
};

function markerColor(readiness: Readiness) {
  const colors = {
    Core: "#214d3a",
    Stable: "#6b7d3a",
    Developing: "#c9852b",
    Backup: "#8a8175",
    Gap: "#b8aea2",
  };

  return colors[readiness];
}

function markerIcon(item: LanguageResource, isSelected: boolean) {
  const size = isSelected ? 34 : item.readiness === "Core" ? 30 : 28;
  const color = markerColor(item.readiness);
  const textColor = item.readiness === "Developing" || item.readiness === "Gap" ? "#2b2118" : "#fffdf8";

  return L.divIcon({
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `
      <div
        style="
          width:${size}px;
          height:${size}px;
          border-radius:9999px;
          border:${isSelected ? 3 : 2}px solid ${isSelected ? "#1f2933" : "#ffffff"};
          background:${color};
          color:${textColor};
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:10px;
          font-weight:700;
          line-height:1;
          box-sizing:border-box;
          box-shadow:${isSelected ? "0 0 0 4px #fffdf8, 0 0 0 7px #214d3a" : "0 3px 8px rgba(31,41,51,0.22)"};
        "
      >
        ${item.code}
      </div>
    `,
  });
}

function FocusController({ focusedGroup }: { focusedGroup: ContinentGroup }) {
  const map = useMap();

  useEffect(() => {
    const view = focusViewByGroup[focusedGroup];
    map.flyTo(view.center, view.zoom, { duration: 0.8 });
  }, [focusedGroup, map]);

  return null;
}

export function LeafletTalentMap({
  resources,
  selectedId,
  onSelect,
  focusedGroup,
}: LeafletTalentMapProps) {
  return (
    <MapContainer
      center={[18, 18]}
      zoom={2}
      minZoom={2}
      maxZoom={6}
      scrollWheelZoom
      worldCopyJump
      className="h-full w-full"
      zoomControl
      attributionControl={false}
    >
      <FocusController focusedGroup={focusedGroup} />
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png"
        subdomains={["a", "b", "c", "d"]}
      />

      {resources.map((item) => (
        <Marker
          key={item.id}
          position={[item.lat, item.lng]}
          icon={markerIcon(item, selectedId === item.id)}
          eventHandlers={{
            click: () => onSelect(item.id),
          }}
        >
          <Tooltip direction="top" offset={[0, -12]} opacity={0.95}>
            {item.language} - {item.region}
          </Tooltip>
        </Marker>
      ))}
    </MapContainer>
  );
}
