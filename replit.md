# GPS Route Video Generator

## Overview

The GPS Route Video Generator is a React-based web application that transforms GPS track files (GPX or KML format) into animated video visualizations. The application allows users to upload route data, visualizes the path on an interactive world map, and leverages Google's Gemini AI (specifically the VEO 2.0 model) to generate cinematic MP4 videos showing an animated dot following the route path.

The application serves as a bridge between GPS tracking data and visual storytelling, making geographic journeys more engaging through AI-powered video generation.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

**2025-09-17**: Completed Replit environment setup
- Fixed import paths in src/App.tsx for proper component resolution
- Configured Vite development server with allowedHosts: true for Replit proxy compatibility
- Set up development workflow on port 5000 with webview output
- Configured autoscale deployment with proper port binding ($PORT)
- Resolved all TypeScript/LSP errors

## System Architecture

### Frontend Architecture
- **Framework**: React 19.1.1 with TypeScript for type safety and modern development practices
- **Build System**: Vite for fast development and optimized production builds
- **Styling**: Tailwind CSS via CDN for rapid UI development with utility-first approach
- **State Management**: React hooks (useState, useRef, useEffect) for component-level state management
- **Theme System**: Light/dark mode toggle with localStorage persistence and system preference detection
- **Replit Integration**: Configured for Replit environment with proper host/port settings

### Map Visualization System
- **Mapping Library**: D3.js v7 for data-driven map rendering and geographic projections
- **Geographic Data**: TopoJSON world atlas data for country boundaries and world map rendering
- **Projection**: Mercator projection automatically fitted to route bounds for optimal visualization
- **Route Rendering**: SVG-based path rendering with animated route visualization capabilities

### AI Video Generation Pipeline
- **AI Integration**: Google Gemini AI (VEO 2.0 model) for video generation from static map images
- **Video Processing**: Multi-step pipeline involving map image capture, AI prompt generation, and video compilation
- **Progress Tracking**: Real-time status updates with contextual loading messages during video generation
- **Error Handling**: Comprehensive error management for API failures and generation timeouts

### Component Architecture
- **Modular Design**: Separated components for RouteMap, ThemeToggle, and reusable Icons
- **Ref-based Communication**: Parent-child component communication using React refs for map image extraction
- **File Processing**: Client-side GPS file parsing with support for multiple track formats
- **Responsive Design**: Mobile-first responsive layout with adaptive theming

### Configuration Management
- **Environment Variables**: Secure API key management through environment configuration
- **TypeScript Paths**: Alias configuration (@/) for clean import statements
- **Module Resolution**: ES modules with import maps for external dependencies
- **Development Server**: Vite dev server configured for local development with hot reload

## External Dependencies

### Core Libraries
- **React/ReactDOM**: Frontend framework for component-based UI development
- **TypeScript**: Static typing for enhanced development experience and code reliability
- **Vite**: Modern build tool and development server

### Visualization Libraries
- **D3.js**: Data visualization library for map rendering and geographic projections
- **TopoJSON**: Geographic data format processing for world map visualization

### AI Services
- **Google Gemini AI**: Video generation service using VEO 2.0 model for route animation
- **@google/genai**: Official Google AI SDK for API integration and operation management

### Styling Framework
- **Tailwind CSS**: Utility-first CSS framework delivered via CDN for rapid styling

### Development Tools
- **@vitejs/plugin-react**: Vite plugin for React support with Fast Refresh
- **@types/node**: Node.js type definitions for development tooling

### External Resources
- **World Atlas Data**: TopoJSON country boundaries from topojson/world-atlas repository
- **AI Studio CDN**: Module delivery system for React and Google AI packages via import maps