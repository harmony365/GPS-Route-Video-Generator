import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import type { Coordinate, Theme } from '../types';
import { WORLD_MAP_DATA } from '@/constants';

// d3 and topojson are loaded from index.html
declare const d3: any;
declare const topojson: any;

interface RouteMapProps {
  routeData: Coordinate[];
  theme: Theme;
}

export interface RouteMapHandle {
  getMapAsBase64Image: () => Promise<string | null>;
}

export const RouteMap = forwardRef<RouteMapHandle, RouteMapProps>(({ routeData, theme }, ref) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!routeData || routeData.length === 0 || !containerRef.current) return;
    
    const { width, height } = containerRef.current.getBoundingClientRect();
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous render

    const isDark = theme === 'dark';
    const mapFill = isDark ? "#2D3748" : "#E5E7EB"; // gray-800 : gray-200
    const mapStroke = isDark ? "#1A202C" : "#FFFFFF";   // gray-900 : white

    const geoJsonRoute = {
      type: "LineString",
      coordinates: routeData.map(c => [c.lon, c.lat]),
    };
    
    const world = topojson.feature(WORLD_MAP_DATA, WORLD_MAP_DATA.objects.countries);

    const projection = d3.geoMercator().fitSize([width, height], geoJsonRoute);
    const pathGenerator = d3.geoPath().projection(projection);

    // Draw world map
    svg.append("g")
      .selectAll("path")
      .data(world.features)
      .join("path")
      .attr("d", pathGenerator)
      .attr("fill", mapFill)
      .attr("stroke", mapStroke);

    // Draw route
    svg.append("path")
      .datum(geoJsonRoute)
      .attr("d", pathGenerator)
      .attr("fill", "none")
      .attr("stroke", "#A78BFA") // violet-400
      .attr("stroke-width", 3)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round");
      
    // Draw start and end points
    const startPoint = routeData[0];
    const endPoint = routeData[routeData.length - 1];

    svg.append("circle")
        .attr("cx", projection([startPoint.lon, startPoint.lat])[0])
        .attr("cy", projection([startPoint.lon, startPoint.lat])[1])
        .attr("r", 5)
        .attr("fill", "#34D399") // emerald-400
        .attr("stroke", "#10B981") // emerald-600
        .attr("stroke-width", 2);

    svg.append("circle")
        .attr("cx", projection([endPoint.lon, endPoint.lat])[0])
        .attr("cy", projection([endPoint.lon, endPoint.lat])[1])
        .attr("r", 5)
        .attr("fill", "#F87171") // red-400
        .attr("stroke", "#EF4444") // red-500
        .attr("stroke-width", 2);


  }, [routeData, theme]);

  useImperativeHandle(ref, () => ({
    getMapAsBase64Image: () => {
      return new Promise((resolve, reject) => {
        if (!svgRef.current) {
          return reject("SVG element not found");
        }
        
        const svgElement = svgRef.current;
        const { width, height } = svgElement.getBoundingClientRect();

        const svgString = new XMLSerializer().serializeToString(svgElement);
        const svgBase64 = btoa(unescape(encodeURIComponent(svgString)));

        const image = new Image();
        image.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return reject("Could not get canvas context");
          }
          ctx.drawImage(image, 0, 0);
          const pngUrl = canvas.toDataURL('image/png');
          const base64Data = pngUrl.split(',')[1];
          resolve(base64Data);
        };
        image.onerror = (err) => {
            reject(`Failed to load SVG as image: ${err}`);
        };
        image.src = `data:image/svg+xml;base64,${svgBase64}`;
      });
    },
  }));

  return (
    <div ref={containerRef} className="w-full h-full">
      <svg ref={svgRef} width="100%" height="100%"></svg>
    </div>
  );
});