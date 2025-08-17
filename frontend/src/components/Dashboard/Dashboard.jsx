

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

