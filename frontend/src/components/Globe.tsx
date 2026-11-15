"use client";

import { useEffect, useRef } from "react";
import { DEFAULT_COLOR } from "@/lib/format";
import type { GlobeSite } from "@/lib/types";

interface Props {
  sites: GlobeSite[];
  activeId: string | null;
  onSelect: (id: string) => void;
  /** Accent color for markers. */
  color?: string;
  /** When false, wheel/pinch does not zoom — the page scrolls normally. */
  zoom?: boolean;
}

const INITIAL_POV = { lat: 15, lng: -20, altitude: 2.3 };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GlobeInstance = any;

export default function Globe({ sites, activeId, onSelect, color = DEFAULT_COLOR, zoom = true }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<GlobeInstance>(null);
  const onSelectRef = useRef(onSelect);
  const activeRef = useRef(activeId);
  const colorRef = useRef(color);
  const zoomRef = useRef(zoom);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    onSelectRef.current = onSelect;
    activeRef.current = activeId;
    colorRef.current = color;
    zoomRef.current = zoom;
  }, [onSelect, activeId, color, zoom]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let disposed = false;

    // globe.gl uses WebGL: imported only on the client.
    import("globe.gl").then(({ default: GlobeGL }) => {
      if (disposed) return;
      const globe: GlobeInstance = (new GlobeGL(el) as GlobeInstance)
        .width(el.clientWidth)
        .height(el.clientHeight)
        .backgroundColor("rgba(0,0,0,0)")
        .globeImageUrl("/textures/earth-blue-marble.jpg")
        .bumpImageUrl("/textures/earth-topology.png")
        .atmosphereColor("#7dd3fc")
        .htmlElementsData(sites)
        .htmlLat("lat")
        .htmlLng("lng")
        .htmlElement((d: GlobeSite) => {
          const wrap = document.createElement("div");
          wrap.className = "analog-marker-wrap";
          const btn = document.createElement("button");
          btn.dataset.id = d.id;
          btn.title = `${d.name} · ${d.country}`;
          btn.setAttribute("aria-label", `${d.name}, ${d.country}`);
          btn.className = "analog-marker";
          btn.style.setProperty("--c", colorRef.current);
          btn.onclick = () => onSelectRef.current(d.id);
          const label = document.createElement("span");
          label.className = "analog-marker-label";
          label.textContent = d.name;
          wrap.appendChild(btn);
          wrap.appendChild(label);
          btn.dataset.labelFor = d.id;
          wrap.dataset.id = d.id;
          return wrap;
        })
        .ringsData(sites)
        .ringColor(() => () => colorRef.current)
        .ringMaxRadius(3)
        .ringPropagationSpeed(1.5)
        .ringRepeatPeriod(2200);

      const controls = globe.controls();
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.35;
      controls.enableZoom = zoomRef.current;
      controls.minDistance = 160;
      controls.maxDistance = 520;
      controls.enablePan = false;
      // Pause auto-rotation while the user drags; resume later if nothing is selected.
      controls.addEventListener("start", () => {
        controls.autoRotate = false;
        if (resumeTimer.current) clearTimeout(resumeTimer.current);
      });
      controls.addEventListener("end", () => {
        if (resumeTimer.current) clearTimeout(resumeTimer.current);
        resumeTimer.current = setTimeout(() => {
          if (!activeRef.current) controls.autoRotate = true;
        }, 2500);
      });

      globe.pointOfView(INITIAL_POV);
      globeRef.current = globe;
      // A site may already be selected (e.g. arriving via /explore?site=…) before
      // the globe finished loading — apply the pending focus now.
      const pending = sites.find((x) => x.id === activeRef.current);
      if (pending) {
        controls.autoRotate = false;
        globe.pointOfView({ lat: pending.lat, lng: pending.lng, altitude: 1.7 }, 1200);
        highlightMarker(el, pending.id);
      }
    });

    const observer = new ResizeObserver(() =>
      globeRef.current?.width(el.clientWidth).height(el.clientHeight),
    );
    observer.observe(el);

    return () => {
      disposed = true;
      observer.disconnect();
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
      globeRef.current?._destructor?.();
      globeRef.current = null;
      el.innerHTML = "";
    };
    // Color and zoom are read through refs and kept in sync by the effects below.
  }, [sites]);

  // Marker and ring color follow the selected planet without rebuilding the globe.
  useEffect(() => {
    const globe = globeRef.current;
    const el = containerRef.current;
    if (!globe || !el) return;
    el.querySelectorAll<HTMLElement>(".analog-marker").forEach((m) => m.style.setProperty("--c", color));
    globe.ringColor(() => () => color);
  }, [color]);

  useEffect(() => {
    const globe = globeRef.current;
    if (globe) globe.controls().enableZoom = zoom;
  }, [zoom]);

  // When a site is activated (marker, list or mission card) the camera travels to it.
  useEffect(() => {
    const globe = globeRef.current;
    const el = containerRef.current;
    if (!globe || !el) return;
    const site = sites.find((x) => x.id === activeId);
    if (!site) {
      globe.controls().autoRotate = true;
      globe.pointOfView(INITIAL_POV, 1500);
      highlightMarker(el, null);
      return;
    }
    globe.controls().autoRotate = false;
    globe.pointOfView({ lat: site.lat, lng: site.lng, altitude: 1.7 }, 1200);
    highlightMarker(el, activeId);
  }, [activeId, sites]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div ref={containerRef} className="absolute inset-0" />
    </div>
  );
}

function highlightMarker(root: HTMLElement, id: string | null) {
  root.querySelectorAll<HTMLElement>(".analog-marker-wrap").forEach((m) => {
    m.classList.toggle("is-active", m.dataset.id === id);
  });
}
