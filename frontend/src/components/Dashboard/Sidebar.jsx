
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUserVideos } from '../../hooks/useApi';
import { YouTubeService } from '../../services/youtube';

function Sidebar({ sidebarOpen, setSidebarOpen, currentVideoId, setCurrentVideoId }) {
  const location = useLocation();
  const [videoIdInput, setVideoIdInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Fetch user's videos
  const { data: videosData, isLoading: videosLoading } = useUserVideos({
    maxResults: 50
  });

  const videos = videosData?.videos || [];

  // Filter videos based on search
  const filteredVideos = videos.filter(video =>
    video.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleVideoIdSubmit = (e) => {
    e.preventDefault();
    const videoId = YouTubeService.extractVideoId(videoIdInput.trim());
    if (videoId) {
      setCurrentVideoId(videoId);
      setVideoIdInput('');
      setSidebarOpen(false);
    }
  };

  const navigation = [
    {
      name: 'Overview',
      href: '/dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2H3z" />
        </svg>
      ),
    },
    {
      name: 'All Notes',
      href: '/dashboard/notes',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
    },
    {
      name: 'Activity Logs',
      href: '/dashboard/logs',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 bg-gray-800">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`${
                  isActive
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                onClick={() => setSidebarOpen(false)}
              >
                {item.icon}
                <span className="ml-3">{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Video ID Input */}
        <div className="mt-6 pt-6 border-t border-gray-700">
          <h3 className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Quick Access
          </h3>
          <form onSubmit={handleVideoIdSubmit} className="mt-2">
            <input
              type="text"
              value={videoIdInput}
              onChange={(e) => setVideoIdInput(e.target.value)}
              placeholder="Enter Video ID or URL"
              className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={!videoIdInput.trim()}
              className="w-full mt-2 px-3 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Load Video
            </button>
          </form>
        </div>

        {/* Recent Videos */}
        <div className="mt-6 pt-6 border-t border-gray-700">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Your Videos
            </h3>
            {videosLoading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
            )}
          </div>

          {/* Search videos */}
          <div className="mt-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search videos..."
              className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Videos list */}
          <div className="mt-3 space-y-1 max-h-96 overflow-y-auto">
            {filteredVideos.length > 0 ? (
              filteredVideos.map((video) => (
                <VideoItem
                  key={video.id}
                  video={video}
                  isActive={currentVideoId === video.id}
                  onClick={() => {
                    setCurrentVideoId(video.id);
                    setSidebarOpen(false);
                  }}
                />
              ))
            ) : searchQuery ? (
              <p className="px-2 py-2 text-sm text-gray-400">No videos found</p>
            ) : (
              <p className="px-2 py-2 text-sm text-gray-400">No videos available</p>
            )}
          </div>
        </div>
      </nav>
    </div>
  );

  return (
    <>
      {/* Mobile sidebar */}
      <div className={`md:hidden ${sidebarOpen ? 'fixed inset-0 flex z-40' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-gray-800">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <span className="sr-only">Close sidebar</span>
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <SidebarContent />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 bg-gray-800">
            <SidebarContent />
          </div>
        </div>
      </div>
    </>
  );
}

// Video Item Component
function VideoItem({ video, isActive, onClick }) {
  const formatDuration = (publishedAt) => {
    const date = new Date(publishedAt);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
    return `${Math.floor(diffDays / 365)}y ago`;
  };

  return (
    <button
      onClick={onClick}
      className={`${
        isActive
          ? 'bg-primary-600 text-white'
          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
      } group flex items-start w-full px-2 py-2 text-sm rounded-md transition-colors duration-150`}
    >
      <div className="flex-shrink-0">
        <img
          src={video.thumbnails?.default?.url || '/api/placeholder/60/45'}
          alt={video.title}
          className="w-10 h-8 rounded object-cover"
        />
      </div>
      <div className="ml-3 flex-1 text-left overflow-hidden">
        <p className="text-sm font-medium truncate" title={video.title}>
          {video.title}
        </p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs opacity-75">
            {formatDuration(video.publishedAt)}
          </span>
          {video.notesCount > 0 && (
            <span className="bg-primary-500 text-white text-xs px-1.5 py-0.5 rounded-full">
              {video.notesCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

export default Sidebar;
