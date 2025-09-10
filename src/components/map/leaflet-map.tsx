"use client"

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

// Dynamic import to avoid SSR issues with Leaflet
const DynamicMap = dynamic(() => import('./map-component'), {
  ssr: false,
  loading: () => (
    <div className="h-64 w-full bg-muted rounded-lg flex items-center justify-center">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Chargement de la carte...</span>
      </div>
    </div>
  )
})

interface LeafletMapProps {
  center?: [number, number]
  zoom?: number
  markers?: Array<{
    id: string
    position: [number, number]
    title: string
    description?: string
    onClick?: () => void
  }>
  height?: string
  width?: string
  showSearch?: boolean
  onLocationSelect?: (location: { lat: number; lng: number; address?: string }) => void
}

export default function LeafletMap({
  center = [46.603354, 1.888334], // Centre de la France
  zoom = 6,
  markers = [],
  height = 'h-64',
  width = 'w-full',
  showSearch = false,
  onLocationSelect
}: LeafletMapProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return (
      <div className={`${height} ${width} bg-muted rounded-lg flex items-center justify-center`}>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Initialisation de la carte...</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`${height} ${width} rounded-lg overflow-hidden border`}>
      <DynamicMap
        center={center}
        zoom={zoom}
        markers={markers}
        showSearch={showSearch}
        onLocationSelect={onLocationSelect}
      />
    </div>
  )
}