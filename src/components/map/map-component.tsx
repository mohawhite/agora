"use client"

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default markers in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Custom marker icons
const createCustomIcon = (color: string = 'red') => new L.Icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

interface MapComponentProps {
  center: [number, number]
  zoom: number
  markers: Array<{
    id: string
    position: [number, number]
    title: string
    description?: string
    onClick?: () => void
  }>
  showSearch?: boolean
  onLocationSelect?: (location: { lat: number; lng: number; address?: string }) => void
}

function LocationMarker({ onLocationSelect }: { onLocationSelect?: (location: { lat: number; lng: number; address?: string }) => void }) {
  const [position, setPosition] = useState<L.LatLng | null>(null)

  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng)
      if (onLocationSelect) {
        // Reverse geocoding pour obtenir l'adresse
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${e.latlng.lat}&lon=${e.latlng.lng}`)
          .then(response => response.json())
          .then(data => {
            onLocationSelect({
              lat: e.latlng.lat,
              lng: e.latlng.lng,
              address: data.display_name || 'Adresse non trouvée'
            })
          })
          .catch(() => {
            onLocationSelect({
              lat: e.latlng.lat,
              lng: e.latlng.lng
            })
          })
      }
    },
    locationfound(e) {
      setPosition(e.latlng)
      map.flyTo(e.latlng, map.getZoom())
    },
  })

  return position === null ? null : (
    <Marker position={position} icon={createCustomIcon('green')}>
      <Popup>
        <div className="text-center">
          <p className="font-medium">Position sélectionnée</p>
          <p className="text-sm text-muted-foreground">
            {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
          </p>
        </div>
      </Popup>
    </Marker>
  )
}

export default function MapComponent({
  center,
  zoom,
  markers,
  showSearch,
  onLocationSelect
}: MapComponentProps) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Markers existants */}
      {markers.map((marker) => (
        <Marker
          key={marker.id}
          position={marker.position}
          icon={createCustomIcon('blue')}
          eventHandlers={{
            click: () => {
              if (marker.onClick) {
                marker.onClick()
              }
            }
          }}
        >
          <Popup>
            <div className="text-center">
              <h3 className="font-medium">{marker.title}</h3>
              {marker.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {marker.description}
                </p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Marker pour sélection de position */}
      {onLocationSelect && <LocationMarker onLocationSelect={onLocationSelect} />}
    </MapContainer>
  )
}