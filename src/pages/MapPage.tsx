import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getErrorMessage } from '../api/client'
import { getMapData } from '../api/caresetuApi'
import { ErrorBanner, Page, PageHeader } from '../components/ui/Page'
import { Section } from '../components/ui/Section'

type Point = {
  id: string
  name: string
  stage: string
  type: string
  risk: string
  lat: number
  lng: number
}

type Fac = {
  code: string
  shortName: string
  facilityType: string
  latitude: number
  longitude: number
}

const RISK_W: Record<string, number> = { HIGH: 0.9, MED: 0.55, LOW: 0.25 }

export function MapPage() {
  const [patients, setPatients] = useState<Point[]>([])
  const [facilities, setFacilities] = useState<Fac[]>([])
  const [filter, setFilter] = useState('ALL')
  const [error, setError] = useState<string | null>(null)
  const mapEl = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const heatRef = useRef<L.LayerGroup | null>(null)

  useEffect(() => {
    getMapData()
      .then((data) => {
        setPatients((data.patients as Point[]) || [])
        setFacilities((data.facilities as Fac[]) || [])
      })
      .catch((e) => setError(getErrorMessage(e)))
  }, [])

  const filtered = useMemo(
    () => patients.filter((p) => filter === 'ALL' || p.risk === filter || p.type === filter),
    [patients, filter],
  )

  useEffect(() => {
    if (!mapEl.current || mapRef.current) return
    const map = L.map(mapEl.current, { zoomControl: true }).setView([23.2156, 72.6369], 11)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 18,
    }).addTo(map)
    heatRef.current = L.layerGroup().addTo(map)
    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const heat = heatRef.current
    if (!map || !heat) return
    heat.clearLayers()

    facilities.forEach((f) => {
      if (f.latitude == null || f.longitude == null) return
      L.circleMarker([f.latitude, f.longitude], {
        radius: 8,
        color: '#0d3b6e',
        fillColor: '#0a8f86',
        fillOpacity: 0.85,
        weight: 2,
      })
        .bindPopup(`<b>${f.shortName}</b><br/>${f.facilityType}`)
        .addTo(heat)
    })

    filtered.forEach((p) => {
      const w = RISK_W[p.risk] ?? 0.4
      L.circle([p.lat, p.lng], {
        radius: 180 + w * 420,
        color: p.risk === 'HIGH' ? '#b42318' : p.risk === 'MED' ? '#9c5c05' : '#1b7a50',
        fillColor: p.risk === 'HIGH' ? '#b42318' : p.risk === 'MED' ? '#9c5c05' : '#1b7a50',
        fillOpacity: 0.18 + w * 0.25,
        weight: 1,
      })
        .bindPopup(
          `<b>${p.name}</b><br/>${p.type} · ${p.stage} · ${p.risk}<br/><a href="/patients/${p.id}">Open</a>`,
        )
        .addTo(heat)
      L.circleMarker([p.lat, p.lng], {
        radius: 5,
        color: '#17202e',
        fillColor: '#fff',
        fillOpacity: 1,
        weight: 1,
      }).addTo(heat)
    })

    const pts: L.LatLngExpression[] = [
      ...facilities.filter((f) => f.latitude != null).map((f) => [f.latitude, f.longitude] as L.LatLngExpression),
      ...filtered.map((p) => [p.lat, p.lng] as L.LatLngExpression),
    ]
    if (pts.length > 0) map.fitBounds(L.latLngBounds(pts), { padding: [28, 28], maxZoom: 13 })
  }, [filtered, facilities])

  return (
    <Page>
      <PageHeader
        eyebrow="Programme · GIS"
        title="Map & heatmap"
        subtitle="Gandhinagar catchment · risk heat + facilities"
        actions={
          <select className="lang-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="ALL">All points</option>
            <option value="HIGH">High risk</option>
            <option value="MED">Medium risk</option>
            <option value="LOW">Low risk</option>
            <option value="oral">Oral</option>
            <option value="breast">Breast</option>
            <option value="cervical">Cervical</option>
          </select>
        }
      />
      {error && <ErrorBanner message={error} />}
      <div className="map-shell card">
        <div ref={mapEl} className="leaflet-host" />
        <div className="maplegend">
          <span>
            <i className="hi" /> High
          </span>
          <span>
            <i className="med" /> Med
          </span>
          <span>
            <i className="lo" /> Low
          </span>
          <span>
            <i className="fac" /> Facility
          </span>
        </div>
      </div>
      <div className="split">
        <Section title={`Facilities (${facilities.length})`}>
          <div className="list">
            {facilities.map((f) => (
              <div key={f.code} className="mini">
                <b>{f.shortName}</b>
                <span className="muted small">{f.facilityType}</span>
              </div>
            ))}
          </div>
        </Section>
        <Section title={`Patients on map (${filtered.length})`}>
          <div className="list">
            {filtered.map((p) => (
              <Link key={p.id} to={`/patients/${p.id}`} className="patient-card">
                <div className="pc-top">
                  <div className="pc-avatar" aria-hidden>
                    {p.name
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((x) => x[0])
                      .join('')
                      .toUpperCase()}
                  </div>
                  <div className="pc-main">
                    <div className="pc-name">{p.name}</div>
                    <div className="muted small">
                      {p.lat.toFixed(4)}, {p.lng.toFixed(4)}
                    </div>
                  </div>
                  <div className="chips">
                    <span className={`chip ${p.risk.toLowerCase()}`}>{p.risk}</span>
                    <span className="chip">{p.stage}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Section>
      </div>
    </Page>
  )
}
