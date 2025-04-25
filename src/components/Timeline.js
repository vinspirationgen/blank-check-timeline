'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';

// Timeline component
const Timeline = () => {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedDirectors, setSelectedDirectors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [viewMode, setViewMode] = useState('film'); // 'film' or 'episode'
  const [filterMode, setFilterMode] = useState('all'); // 'all', 'directors', 'genres'
  const [loading, setLoading] = useState(true);
  const timelineRef = useRef(null);

  // Group directors by era (roughly)
  const directorEras = {
    "Classic Directors": ["Stanley Kubrick", "John Carpenter", "George Lucas", "Robert Zemeckis", "John McTiernan"],
    "90s Breakthroughs": ["James Cameron", "Steven Spielberg", "The Wachowskis", "M. Night Shyamalan", "David Fincher", "Paul Verhoeven", "Tim Burton"],
    "Modern Auteurs": ["Christopher Nolan", "Michael Mann", "Hayao Miyazaki", "Jonathan Demme", "George Miller", "Jane Campion"],
    "Underappreciated Voices": ["Nancy Meyers", "Nora Ephron"]
  };

  // Director color mapping
  const directorColors = {
    "George Lucas": "#0066CC", // Star Wars blue
    "M. Night Shyamalan": "#663399", // Mystery purple
    "The Wachowskis": "#009900", // Matrix green
    "James Cameron": "#0099CC", // Avatar blue
    "Steven Spielberg": "#CC9900", // Gold
    "Christopher Nolan": "#333333", // Dark gray
    "Paul Verhoeven": "#CC0000", // Red
    "Nancy Meyers": "#FF9999", // Soft pink
    "Tim Burton": "#666666", // Gothic gray
    "Michael Mann": "#003366", // Dark blue
    "Hayao Miyazaki": "#99CC33", // Ghibli green
    "Jonathan Demme": "#996633", // Brown
    "George Miller": "#FF6600", // Desert orange
    "Nora Ephron": "#FF99CC", // Rom-com pink
    "Robert Zemeckis": "#9900CC", // Purple
    "John Carpenter": "#000099", // Dark blue
    "Jane Campion": "#CC6699", // Mauve
    "Stanley Kubrick": "#000000", // Black
    "David Fincher": "#333300", // Dark olive
    "John McTiernan": "#990000"  // Dark red
  };

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/data/episodes.json');
        let data = await response.json();
        
        // Convert string dates to Date objects
        data = data.map(event => ({
          ...event,
          date: new Date(event.date),
          episodeDate: new Date(event.episodeDate)
        }));
        
        // Sort by film release date
        data.sort((a, b) => a.date - b.date);
        
        setEvents(data);
        setFilteredEvents(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching episode data:', error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Get color for tag
  const getTagColor = (tag) => {
    // If it's a director, return their color
    if (Object.keys(directorColors).includes(tag)) {
      return directorColors[tag];
    }
    
    // Default colors for genres
    const genreColors = {
      "sci-fi": "#0099CC",
      "action": "#CC0000",
      "thriller": "#660000",
      "drama": "#003366",
      "comedy": "#CC9900",
      "horror": "#000000",
      "animation": "#99CC33",
      "romance": "#FF99CC",
      "fantasy": "#9900CC"
    };
    
    // Return genre color or default
    return genreColors[tag.toLowerCase()] || "#999999";
  };

  // Extract all unique tags from events
  const allTags = [...new Set(events.flatMap(event => event.tags || []))];
  
  // Extract all unique directors
  const allDirectors = [...new Set(events.map(event => event.director))];

  // Filter events based on selected tags, directors and search term
  useEffect(() => {
    let filtered = events;
    
    // Filter by directors if any are selected
    if (selectedDirectors.length > 0) {
      filtered = filtered.filter(event => 
        selectedDirectors.includes(event.director)
      );
    }
    
    // Filter by tags if any are selected
    if (selectedTags.length > 0) {
      filtered = filtered.filter(event => 
        event.tags && selectedTags.some(tag => event.tags.includes(tag))
      );
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(term) || 
        event.description.toLowerCase().includes(term) ||
        event.content.toLowerCase().includes(term) ||
        event.director.toLowerCase().includes(term)
      );
    }
    
    setFilteredEvents(filtered);
  }, [events, selectedTags, selectedDirectors, searchTerm]);

  // Toggle tag selection
  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  // Toggle director selection
  const toggleDirector = (director) => {
    if (selectedDirectors.includes(director)) {
      setSelectedDirectors(selectedDirectors.filter(d => d !== director));
    } else {
      setSelectedDirectors([...selectedDirectors, director]);
    }
  };

  // Set filter mode
  const setFilter = (mode) => {
    setFilterMode(mode);
    // Clear selections when switching modes
    if (mode !== 'all') {
      setSelectedTags([]);
      setSelectedDirectors([]);
    }
  };

  // Zoom in function
  const zoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.5, 3));
  };

  // Zoom out function
  const zoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.5, 0.5));
  };

  // Reset zoom function
  const resetZoom = () => {
    setZoomLevel(1);
  };

  // Handle event click
  const handleEventClick = (event) => {
    setSelectedEvent(event);
  };

  // Close event modal
  const closeEventModal = () => {
    setSelectedEvent(null);
  };

  // Calculate event position based on date
  const getEventPosition = (event) => {
    const dates = viewMode === 'film' 
      ? events.map(e => e.date.getTime())
      : events.map(e => e.episodeDate.getTime());
    
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);
    const totalTime = maxDate - minDate;
    
    const eventDate = viewMode === 'film' 
      ? event.date.getTime() 
      : event.episodeDate.getTime();
      
    const timePassed = eventDate - minDate;
    return (timePassed / totalTime) * 100;
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading timeline data...</div>;
  }

  return (
    <div className="flex flex-col h-screen max-w-6xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Blank Check Podcast Timeline</h1>
      
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search films, directors..."
            className="pl-10 pr-4 py-2 border rounded-md w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {/* Zoom controls */}
        <div className="flex items-center gap-2 border rounded-md p-1">
          <button 
            onClick={zoomOut} 
            className="p-1 hover:bg-gray-100 rounded-md"
            title="Zoom Out"
          >
            <ZoomOut size={20} />
          </button>
          <span className="px-2">{zoomLevel.toFixed(1)}x</span>
          <button 
            onClick={zoomIn} 
            className="p-1 hover:bg-gray-100 rounded-md"
            title="Zoom In"
          >
            <ZoomIn size={20} />
          </button>
          <button 
            onClick={resetZoom} 
            className="p-1 hover:bg-gray-100 rounded-md"
            title="Reset Zoom"
          >
            <RefreshCw size={20} />
          </button>
        </div>
        
        {/* View Mode Toggle */}
        <div className="flex items-center border rounded-md">
          <button
            onClick={() => setViewMode('film')}
            className={`px-3 py-1 text-sm rounded-l-md ${
              viewMode === 'film'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Film Release Date
          </button>
          <button
            onClick={() => setViewMode('episode')}
            className={`px-3 py-1 text-sm rounded-r-md ${
              viewMode === 'episode'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Episode Release Date
          </button>
        </div>
      </div>
      
      {/* Filter Mode Selector */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Filter By:</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-md text-sm ${
              filterMode === 'all'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            All Filters
          </button>
          <button
            onClick={() => setFilter('directors')}
            className={`px-3 py-1 rounded-md text-sm ${
              filterMode === 'directors'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Directors
          </button>
          <button
            onClick={() => setFilter('genres')}
            className={`px-3 py-1 rounded-md text-sm ${
              filterMode === 'genres'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Genres/Tags
          </button>
        </div>
      </div>
      
      {/* Director filters - grouped by era */}
      {(filterMode === 'all' || filterMode === 'directors') && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Directors:</h2>
          <div className="space-y-4">
            {Object.entries(directorEras).map(([era, directors]) => (
              <div key={era} className="space-y-2">
                <h3 className="text-md font-medium">{era}:</h3>
                <div className="flex flex-wrap gap-2">
                  {directors.filter(director => allDirectors.includes(director)).map(director => (
                    <button
                      key={director}
                      onClick={() => toggleDirector(director)}
                      className={`px-3 py-1 rounded-full text-sm ${
                        selectedDirectors.includes(director)
                          ? 'text-white'
                          : `text-gray-800 bg-opacity-20 hover:bg-opacity-30`
                      }`}
                      style={{ 
                        backgroundColor: selectedDirectors.includes(director) 
                          ? directorColors[director] 
                          : `${directorColors[director]}40` // 25% opacity
                      }}
                    >
                      {director}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Genre/Tag filters */}
      {(filterMode === 'all' || filterMode === 'genres') && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Genres/Tags:</h2>
          <div className="flex flex-wrap gap-2">
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1 rounded-full text-sm ${
                  selectedTags.includes(tag)
                    ? 'text-white'
                    : 'text-gray-800 bg-opacity-20 hover:bg-opacity-30'
                }`}
                style={{ 
                  backgroundColor: selectedTags.includes(tag) 
                    ? getTagColor(tag)
                    : `${getTagColor(tag)}40` // 25% opacity
                }}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Horizontal Timeline visualization */}
      <div 
        ref={timelineRef}
        className="relative border-b-4 border-gray-300 mb-8 overflow-x-auto"
        style={{ 
          width: '100%',
          height: '220px'
        }}
      >
        {/* Timeline container with zoom */}
        <div
          className="relative h-full"
          style={{
            width: `${100 * zoomLevel}%`,
            minWidth: '100%'
          }}
        >
          {filteredEvents.map(event => {
            const position = getEventPosition(event);
            return (
              <div 
                key={event.id}
                className="absolute cursor-pointer group"
                style={{ 
                  left: `${position}%`,
                  transform: 'translateX(-50%)',
                  top: event.id % 2 === 0 ? '20px' : '90px',
                  maxWidth: '200px',
                  zIndex: 10
                }}
                onClick={() => handleEventClick(event)}
              >
                {/* Event dot */}
                <div 
                  className="w-4 h-4 rounded-full mb-2 mx-auto"
                  style={{ backgroundColor: directorColors[event.director] || '#666666' }}
                ></div>
                
                {/* Event title */}
                <div className="text-center font-medium text-sm truncate">
                  {event.title}
                </div>
                
                {/* Director name */}
                <div 
                  className="text-center text-xs truncate"
                  style={{ color: directorColors[event.director] || '#666666' }}
                >
                  {event.director}
                </div>
                
                {/* Date */}
                <div className="text-xs text-gray-500 text-center">
                  {viewMode === 'film' 
                    ? event.date.getFullYear()
                    : event.episodeDate.toLocaleDateString().split(',')[0]
                  }
                </div>
                
                {/* Hover tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-white p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                  <div className="font-bold">{event.title} {viewMode === 'episode' && `(${event.episodeNumber})`}</div>
                  <div className="text-sm font-medium" style={{ color: directorColors[event.director] || '#666666' }}>
                    {event.director}
                  </div>
                  <div className="text-xs text-gray-500">
                    Film: {event.date.toLocaleDateString()}<br/>
                    Episode: {event.episodeDate.toLocaleDateString()}
                  </div>
                  <p className="text-sm mt-1">{event.description}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {event.tags && event.tags.map(tag => (
                      <span 
                        key={tag}
                        className="px-1.5 py-0.5 rounded-full text-xs text-white"
                        style={{ backgroundColor: getTagColor(tag) }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="mt-1 text-xs text-blue-500">Click for more details</div>
                </div>
                
                {/* Vertical line */}
                <div 
                  className="absolute top-0 w-px h-16 bg-gray-300"
                  style={{ 
                    left: '50%',
                    top: event.id % 2 === 0 ? '-20px' : '-90px'
                  }}
                ></div>
              </div>
            );
          })}
          
          {/* Timeline year markers */}
          {viewMode === 'film' && events.length > 0 && (
            [1970, 1980, 1990, 2000, 2010, 2020].map(year => {
              const minYear = Math.min(...events.map(e => e.date.getFullYear()));
              const maxYear = Math.max(...events.map(e => e.date.getFullYear()));
              const position = ((year - minYear) / (maxYear - minYear)) * 100;
              
              return (
                <div 
                  key={year}
                  className="absolute bottom-0 transform translate-y-full"
                  style={{ left: `${position}%` }}
                >
                  <div className="w-px h-4 bg-gray-400 mx-auto"></div>
                  <div className="text-xs text-gray-500 mt-1">{year}</div>
                </div>
              );
            })
          )}
          
          {/* Episode year markers */}
          {viewMode === 'episode' && events.length > 0 && (
            [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024].map(year => {
              const minYear = Math.min(...events.map(e => e.episodeDate.getFullYear()));
              const maxYear = Math.max(...events.map(e => e.episodeDate.getFullYear()));
              const position = ((year - minYear) / (maxYear - minYear)) * 100;
              
              return (
                <div 
                  key={year}
                  className="absolute bottom-0 transform translate-y-full"
                  style={{ left: `${position}%` }}
                >
                  <div className="w-px h-4 bg-gray-400 mx-auto"></div>
                  <div className="text-xs text-gray-500 mt-1">{year}</div>
                </div>
              );
            })
          )}
        </div>
      </div>
      
      {/* Event details modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold">{selectedEvent.title}</h2>
                <div className="text-lg" style={{ color: directorColors[selectedEvent.director] || '#666666' }}>
                  {selectedEvent.director}
                </div>
              </div>
              <button 
                onClick={closeEventModal}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                &times;
              </button>
            </div>
            
            <div className="flex justify-between mb-4 text-sm">
              <div>
                <div className="font-medium">Film Release:</div>
                <div className="text-gray-500">{selectedEvent.date.toLocaleDateString()}</div>
              </div>
              <div>
                <div className="font-medium">Podcast Episode:</div>
                <div className="text-gray-500">{selectedEvent.episodeNumber} - {selectedEvent.episodeDate.toLocaleDateString()}</div>
              </div>
            </div>
            
            <p className="mb-4 font-medium">{selectedEvent.description}</p>
            <div className="mb-6">{selectedEvent.content}</div>
            
            {/* Tags */}
            {selectedEvent.tags && selectedEvent.tags.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Tags:</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedEvent.tags.map(tag => (
                    <span 
                      key={tag} 
                      className="px-2 py-1 rounded-full text-sm text-white"
                      style={{ backgroundColor: getTagColor(tag) }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Links */}
            {selectedEvent.links && selectedEvent.links.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Related Links:</h3>
                <ul className="list-disc pl-5">
                  {selectedEvent.links.map((link, index) => (
                    <li key={index}>
                      <a 
                        href={link.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        {link.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* No results message */}
      {filteredEvents.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No episodes match your current filters. Try adjusting your search or tag selection.
        </div>
      )}
    </div>
  );
};

export default Timeline;