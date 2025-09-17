
import React, { useState, useRef, useEffect } from 'react';
import { RouteMap, RouteMapHandle } from '../components/RouteMap';
import { Coordinate, Theme } from '../types';
import { generateRouteVideo, fetchVideoBlob } from '../services/geminiService';
import { VEO_LOADING_MESSAGES } from '@/constants';
import { UploadIcon, VideoIcon, DownloadIcon, ErrorIcon, LoadingSpinner } from '../components/Icons';
import { ThemeToggle } from '../components/ThemeToggle';

const App: React.FC = () => {
  const [routeData, setRouteData] = useState<Coordinate[] | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [progressMessage, setProgressMessage] = useState<string>('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
        const storedTheme = window.localStorage.getItem('theme') as Theme | null;
        if (storedTheme) return storedTheme;
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
    }
    return 'light';
  });

  const mapRef = useRef<RouteMapHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
      setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const resetState = () => {
    setRouteData(null);
    setFileName('');
    setIsLoading(false);
    setProgressMessage('');
    setVideoUrl(null);
    setError(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const parseGpx = (gpxString: string): Coordinate[] => {
    const coords: Coordinate[] = [];
    const trackPoints = gpxString.matchAll(/<trkpt\s+lat="([^"]+)"\s+lon="([^"]+)"/g);
    for (const match of trackPoints) {
      coords.push({ lat: parseFloat(match[1]), lon: parseFloat(match[2]) });
    }
    if (coords.length === 0) {
      throw new Error("No track points found in GPX file.");
    }
    return coords;
  };

  const parseKml = (kmlString: string): Coordinate[] => {
    const coords: Coordinate[] = [];
    const coordinatesTag = /<coordinates>([^<]+)<\/coordinates>/s.exec(kmlString);
    if (coordinatesTag && coordinatesTag[1]) {
      const coordPairs = coordinatesTag[1].trim().split(/\s+/);
      coordPairs.forEach(pair => {
        const [lon, lat] = pair.split(',').map(Number);
        if (!isNaN(lon) && !isNaN(lat)) {
          coords.push({ lat, lon });
        }
      });
    }
     if (coords.length === 0) {
      throw new Error("No coordinates found in KML file.");
    }
    return coords;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    resetState();
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        if (file.name.toLowerCase().endsWith('.gpx')) {
          setRouteData(parseGpx(content));
        } else if (file.name.toLowerCase().endsWith('.kml')) {
          setRouteData(parseKml(content));
        } else {
          throw new Error("Unsupported file type. Please upload a .gpx or .kml file.");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to parse file.");
        setRouteData(null);
      }
    };
    reader.onerror = () => {
        setError("Error reading file.");
        setRouteData(null);
    };
    reader.readAsText(file);
  };

  const handleGenerateVideo = async () => {
    if (!mapRef.current) {
      setError("Map component is not ready.");
      return;
    }

    setIsLoading(true);
    setVideoUrl(null);
    setError(null);
    
    // FIX: Changed NodeJS.Timeout to ReturnType<typeof setInterval> for browser compatibility.
    let messageInterval: ReturnType<typeof setInterval>;
    const onProgress = () => {
        setProgressMessage(prev => {
            const currentIndex = VEO_LOADING_MESSAGES.indexOf(prev);
            const nextIndex = (currentIndex + 1) % VEO_LOADING_MESSAGES.length;
            return VEO_LOADING_MESSAGES[nextIndex];
        });
    };
    
    try {
        setProgressMessage("Generating map snapshot for AI...");
        const mapImageBase64 = await mapRef.current.getMapAsBase64Image();
        
        if (!mapImageBase64) {
            throw new Error("Could not generate map image.");
        }

        setProgressMessage(VEO_LOADING_MESSAGES[0]);
        messageInterval = setInterval(onProgress, 4000);

        const videoUri = await generateRouteVideo(mapImageBase64);
        
        setProgressMessage("Finalizing video file...");
        const videoBlob = await fetchVideoBlob(videoUri);
        const url = URL.createObjectURL(videoBlob);
        setVideoUrl(url);

    } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred during video generation.");
    } finally {
        setIsLoading(false);
        if (messageInterval) {
            clearInterval(messageInterval);
        }
        setProgressMessage('');
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-sans p-4 sm:p-6 lg:p-8 transition-colors duration-300">
      <div className="max-w-5xl mx-auto">
        <header className="relative text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
            GPS Route Video Generator
          </h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
            Upload a GPX/KML file, and let AI create a video of your journey.
          </p>
          <div className="absolute top-0 right-0">
            <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
          </div>
        </header>

        <main className="bg-gray-50/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl shadow-indigo-500/10 p-6 sm:p-8">
          {!routeData && !isLoading && (
            <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                <UploadIcon className="w-16 h-16 text-gray-400 dark:text-gray-500 mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Upload your GPS file</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">Supports .gpx and .kml formats</p>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".gpx,.kml"
                    className="hidden"
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-500 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-indigo-600/30"
                >
                    Select File
                </button>
            </div>
          )}

          {error && (
            <div className="my-4 p-4 bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg flex items-center gap-3">
                <ErrorIcon className="w-6 h-6"/>
                <span className="font-medium">{error}</span>
            </div>
          )}

          {routeData && (
             <div className="space-y-6">
                <h3 className="text-2xl font-bold text-center text-gray-700 dark:text-gray-300">Route Preview: <span className="text-indigo-400">{fileName}</span></h3>
                <div className="w-full aspect-video bg-gray-200 dark:bg-gray-900/50 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-700 shadow-inner">
                    <RouteMap ref={mapRef} routeData={routeData} theme={theme} />
                </div>
                {!isLoading && !videoUrl && (
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button
                            onClick={handleGenerateVideo}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-500 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-purple-600/30 text-lg"
                        >
                            <VideoIcon className="w-6 h-6" />
                            Generate Video
                        </button>
                         <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full sm:w-auto px-6 py-3 bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 font-semibold rounded-lg transition-colors"
                        >
                            Upload another file
                        </button>
                    </div>
                )}
            </div>
          )}

          {isLoading && (
            <div className="flex flex-col items-center justify-center text-center p-8">
              <LoadingSpinner className="w-16 h-16 text-indigo-500" />
              <p className="mt-4 text-xl font-semibold text-gray-900 dark:text-white animate-pulse">{progressMessage}</p>
              <p className="mt-2 text-gray-600 dark:text-gray-400">AI is working its magic. This may take several minutes.</p>
            </div>
          )}

          {videoUrl && (
            <div className="space-y-6 mt-6 text-center">
                <h3 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-cyan-500">Your Video is Ready!</h3>
                <div className="w-full aspect-video rounded-lg overflow-hidden border-2 border-green-500/50 shadow-lg">
                    <video src={videoUrl} controls autoPlay loop className="w-full h-full object-contain bg-black"></video>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <a
                        href={videoUrl}
                        download={`route_video_${fileName.split('.')[0]}.mp4`}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-green-600 text-white font-bold rounded-lg hover:bg-green-500 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-green-600/30 text-lg"
                    >
                        <DownloadIcon className="w-6 h-6" />
                        Download MP4
                    </a>
                    <button
                        onClick={resetState}
                        className="w-full sm:w-auto px-6 py-3 bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 font-semibold rounded-lg transition-colors"
                    >
                        Start Over
                    </button>
                </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
