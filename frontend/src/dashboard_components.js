// ============================================
// FILE: frontend/src/components/Dashboard/Dashboard.jsx
// ============================================

import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import VideoDetails from '../Video/VideoDetails';
import VideoEditor from '../Video/VideoEditor';
import CommentSection from '../Comments/CommentSection';
import NotesPanel from '../Notes/NotesPanel';
import EventLogs from '../Logs/EventLogs';
import { useAuth } from '../../hooks/useAuth';

function Dashboard() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentVideoId, setCurrentVideoId] = useState(null);

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Sidebar */}
      <Sidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen}
        currentVideoId={currentVideoId}
        setCurrentVideoId={setCurrentVideoId}
      />

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        {/* Top navigation */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                {/* Mobile menu button */}
                <button
                  type="button"
                  className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
                  onClick={() => setSidebarOpen(true)}
                >
                  <span className="sr-only">Open sidebar</span>
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>

                {/* Logo and title */}
                <div className="flex items-center">
                  <div className="flex-shrink-0 ml-4 md:ml-0">
                    <div className="h-8 w-8 bg-youtube-red rounded-lg flex items-center justify-center">
                      <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                    </div>
                  </div>
                  <div className="ml-3">
                    <h1 className="text-lg font-semibold text-gray-900">YouTube Companion</h1>
                  </div>
                </div>
              </div>

              {/* User menu */}
              <div className="flex items-center space-x-4">
                <UserMenu user={user} />
              </div>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <Routes>
              <Route path="/" element={<DashboardHome currentVideoId={currentVideoId} />} />
              <Route path="/video/:videoId" element={<VideoDetails />} />
              <Route path="/video/:videoId/edit" element={<VideoEditor />} />
              <Route path="/video/:videoId/comments" element={<CommentSection />} />
              <Route path="/notes" element={<NotesPanel />} />
              <Route path="/logs" element={<EventLogs />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}

// Dashboard Home Component
function DashboardHome({ currentVideoId }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
        <p className="mt-1 text-sm text-gray-600">
          Manage your YouTube content, comments, and notes
        </p>
      </div>

      {currentVideoId ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video details - 2/3 width */}
          <div className="lg:col-span-2">
            <VideoDetails videoId={currentVideoId} embedded />
          </div>
          
          {/* Notes sidebar - 1/3 width */}
          <div>
            <NotesPanel videoId={currentVideoId} embedded />
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No video selected</h3>
          <p className="mt-1 text-sm text-gray-500">
            Select a video from the sidebar to get started
          </p>
        </div>
      )}
    </div>
  );
}

// User Menu Component
function UserMenu({ user }) {
  const { logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
      >
        <img
          className="h-8 w-8 rounded-full"
          src={user?.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=3b82f6&color=fff`}
          alt={user?.name || 'User'}
        />
        <span className="ml-2 text-gray-700 hidden sm:block">{user?.name}</span>
        <svg className="ml-1 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown menu */}
          <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
            <div className="py-1">
              <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                <div className="font-medium">{user?.name}</div>
                <div className="text-gray-500 truncate">{user?.email}</div>
              </div>
              
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;

// ============================================
// FILE: frontend/src/components/Dashboard/Sidebar.jsx
// ============================================

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