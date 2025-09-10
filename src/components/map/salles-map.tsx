"use client"

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

// Leaflet icon fix
let DefaultIcon: any
let salleIcon: any

if (typeof window !== 'undefined') {
  const L = require('leaflet')
  
  delete L.Icon.Default.prototype._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  })

  DefaultIcon = L.Icon.Default
  
  salleIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  })
}

interface SalleMapData {
  id: string
  name: string
  address: string
  city: string
  price: number
  capacity: number
  image?: string
  mairie: string
}

interface SallesMapProps {
  salles: SalleMapData[]
  onSalleClick?: (salleId: string) => void
}

export default function SallesMap({ salles, onSalleClick }: SallesMapProps) {
  const [markersData, setMarkersData] = useState<Array<{
    id: string
    position: [number, number]
    data: SalleMapData
  }>>([])

  // Géolocaliser les salles
  useEffect(() => {
    const geocodeSalles = async () => {
      const markers = []
      
      for (const salle of salles) {
        try {
          const query = encodeURIComponent(`${salle.address}, ${salle.city}, France`)
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`
          )
          const data = await response.json()
          
          if (data && data.length > 0) {
            markers.push({
              id: salle.id,
              position: [parseFloat(data[0].lat), parseFloat(data[0].lon)] as [number, number],
              data: salle
            })
          }
        } catch (error) {
          console.error(`Erreur géolocalisation pour ${salle.name}:`, error)
        }
        
        // Pause pour éviter de surcharger l'API
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      setMarkersData(markers)
    }

    if (salles.length > 0) {
      geocodeSalles()
    }
  }, [salles])

  // Centre par défaut (Paris)
  const defaultCenter: [number, number] = [48.8566, 2.3522]
  
  // Calculer le centre si on a des marqueurs
  const mapCenter = markersData.length > 0 
    ? [
        markersData.reduce((sum, m) => sum + m.position[0], 0) / markersData.length,
        markersData.reduce((sum, m) => sum + m.position[1], 0) / markersData.length
      ] as [number, number]
    : defaultCenter

  return (
    <MapContainer
      center={mapCenter}
      zoom={markersData.length > 0 ? 10 : 6}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {markersData.map((marker) => (
        <Marker
          key={marker.id}
          position={marker.position}
          icon={salleIcon || undefined}
          eventHandlers={{
            click: () => {
              if (onSalleClick) {
                onSalleClick(marker.id)
              }
            }
          }}
        >
          <Popup>
            <div className="min-w-[250px]">
              {marker.data.image && (
                <img
                  src={marker.data.image}
                  alt={marker.data.name}
                  className="w-full h-32 object-cover rounded-lg mb-3"
                />
              )}
              <h3 className="font-semibold text-lg mb-2">{marker.data.name}</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <p>📍 {marker.data.address}, {marker.data.city}</p>
                <p>👥 Capacité: {marker.data.capacity} personnes</p>
                <p>💰 {marker.data.price}€/heure</p>
                <p>🏛️ Par {marker.data.mairie}</p>
              </div>
              <button
                onClick={() => onSalleClick?.(marker.id)}
                className="mt-3 w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Voir les détails
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}