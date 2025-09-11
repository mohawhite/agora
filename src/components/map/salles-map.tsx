"use client"

import { useEffect, useState, useRef } from 'react'

// Type pour éviter les erreurs TypeScript
declare global {
  interface Window {
    L: any
  }
}

// Composant simple sans SSR
function LoadScript({ src, onLoad }: { src: string; onLoad: () => void }) {
  useEffect(() => {
    const script = document.createElement('script')
    script.src = src
    script.onload = onLoad
    document.head.appendChild(script)
    
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)
    
    return () => {
      document.head.removeChild(script)
      document.head.removeChild(link)
    }
  }, [src, onLoad])
  
  return null
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
  favorites?: string[]
  onToggleFavorite?: (salleId: string) => void
}

export default function SallesMap({ salles, onSalleClick, favorites = [], onToggleFavorite }: SallesMapProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [map, setMap] = useState<any>(null)
  const mapRef = useRef<HTMLDivElement>(null)

  const initMap = () => {
    if (!mapRef.current || !window.L) return

    const L = window.L
    
    // Créer la carte
    const mapInstance = L.map(mapRef.current, {
      attributionControl: false
    }).setView([48.8566, 2.3522], 6)
    
    // Ajouter les tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: ''
    }).addTo(mapInstance)

    setMap(mapInstance)
  }

  // Fonction globale pour gérer les favoris depuis les popups
  useEffect(() => {
    if (onToggleFavorite) {
      (window as any).toggleMapFavorite = onToggleFavorite
    }
    return () => {
      delete (window as any).toggleMapFavorite
    }
  }, [onToggleFavorite])

  // Géolocaliser et ajouter les marqueurs
  useEffect(() => {
    if (!map || !salles.length) return

    const L = window.L
    
    const geocodeSalles = async () => {
      const markers: any[] = []
      
      for (const salle of salles) {
        try {
          const query = encodeURIComponent(`${salle.address}, ${salle.city}, France`)
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`
          )
          const data = await response.json()
          
          if (data && data.length > 0) {
            const lat = parseFloat(data[0].lat)
            const lng = parseFloat(data[0].lon)
            
            const isFavorite = favorites.includes(salle.id)
            const popupContent = `
              <div style="font-family: system-ui, -apple-system, sans-serif;">
                <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06); transition: box-shadow 0.3s; position: relative;">
                  <!-- Cœur en position absolue tout en haut à droite -->
                  <div 
                    style="position: absolute; top: 8px; right: 8px; z-index: 10; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border-radius: 4px; cursor: pointer;" 
                    onclick="event.stopPropagation(); window.toggleMapFavorite('${salle.id}')"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="${isFavorite ? '#ef4444' : 'none'}" stroke="${isFavorite ? '#ef4444' : '#4b5563'}" stroke-width="2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                  </div>
                  
                  <div style="cursor: pointer;" onclick="window.location.href='/salles/${salle.id}'">
                    <div style="display: flex; gap: 16px; padding-right: 32px;">
                      <!-- Image -->
                      <div style="width: 128px; height: 96px; background: #f3f4f6; border-radius: 8px; flex-shrink: 0; overflow: hidden;">
                        ${salle.image ? 
                          `<img src="${salle.image}" alt="${salle.name}" style="width: 100%; height: 100%; object-fit: cover;" />` : 
                          `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
                             <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2">
                               <path d="M3 21h18"/>
                               <path d="M5 21V7l8-4v18"/>
                               <path d="M19 21V11l-6-4"/>
                             </svg>
                           </div>`
                        }
                      </div>
                      
                      <!-- Contenu -->
                      <div style="flex: 1; min-width: 0;">
                        <div style="display: flex; align-items: start; justify-content: space-between; margin-bottom: 8px;">
                          <div>
                            <h3 style="font-weight: 600; font-size: 14px; margin: 0; color: #000000; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${salle.name}</h3>
                            <div style="display: flex; align-items: center; gap: 4px; font-size: 12px; color: #4b5563; margin-top: 4px;">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                                <circle cx="12" cy="10" r="3"/>
                              </svg>
                              ${salle.city}
                            </div>
                          </div>
                        </div>
                        
                        <div style="display: flex; align-items: center; gap: 12px; font-size: 12px;">
                          <div style="display: flex; align-items: center; gap: 4px; color: #4b5563;">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                              <circle cx="9" cy="7" r="4"/>
                              <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                            </svg>
                            ${salle.capacity}
                          </div>
                          <div style="display: flex; align-items: center; gap: 4px; font-weight: 500;">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <path d="M4 10h12"/>
                              <path d="M4 14h9"/>
                              <path d="M19 6a7.7 7.7 0 0 0-5.2-2A7.9 7.9 0 0 0 6 12a7.9 7.9 0 0 0 7.8 8 7.7 7.7 0 0 0 5.2-2"/>
                            </svg>
                            ${salle.price}€/h
                          </div>
                        </div>
                        
                        <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">
                          Par ${salle.mairie}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            `
            
            // Créer une icône personnalisée avec l'image de la salle
            let customIcon;
            if (salle.image) {
              customIcon = L.divIcon({
                html: `
                  <div style="
                    width: 50px; 
                    height: 50px; 
                    border-radius: 50%; 
                    overflow: hidden; 
                    border: 3px solid white; 
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    background: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                  ">
                    <img src="${salle.image}" style="
                      width: 100%; 
                      height: 100%; 
                      object-fit: cover;
                    " />
                  </div>
                `,
                className: 'custom-marker',
                iconSize: [50, 50],
                iconAnchor: [25, 50]
              })
            } else {
              customIcon = L.divIcon({
                html: `
                  <div style="
                    width: 50px; 
                    height: 50px; 
                    border-radius: 50%; 
                    overflow: hidden; 
                    border: 3px solid white; 
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    background: #f3f4f6;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                  ">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2">
                      <path d="M3 21h18"/>
                      <path d="M5 21V7l8-4v18"/>
                      <path d="M19 21V11l-6-4"/>
                    </svg>
                  </div>
                `,
                className: 'custom-marker',
                iconSize: [50, 50],
                iconAnchor: [25, 50]
              })
            }

            const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map)
            marker.bindPopup(popupContent)
            markers.push(marker)
          }
        } catch (error) {
          console.error(`Erreur géolocalisation pour ${salle.name}:`, error)
        }
        
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      // Centrer la carte sur les marqueurs
      console.log(`Géolocalisation terminée: ${markers.length} marqueurs créés`)
      
      if (markers.length > 0) {
        try {
          const group = new L.featureGroup(markers)
          const bounds = group.getBounds()
          
          // Vérifier que les bounds sont valides
          if (bounds.isValid()) {
            map.fitBounds(bounds.pad(0.1))
            console.log('Carte centrée sur les marqueurs')
          } else {
            console.warn('Bounds invalides, centrage sur la France')
            map.setView([46.603354, 1.8883335], 6)
          }
        } catch (error) {
          console.warn('Erreur lors du centrage de la carte:', error)
          // En cas d'erreur, centrer sur la France
          map.setView([46.603354, 1.8883335], 6)
        }
      } else {
        console.log('Aucun marqueur trouvé, centrage sur la France')
        map.setView([46.603354, 1.8883335], 6)
      }
    }

    geocodeSalles()
  }, [map, salles])

  useEffect(() => {
    if (isLoaded && !map) {
      setTimeout(initMap, 100)
    }
  }, [isLoaded, map])

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <LoadScript 
        src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        onLoad={() => setIsLoaded(true)}
      />
      {isLoaded && <div ref={mapRef} style={{ height: '100%', width: '100%' }} />}
    </div>
  )
}