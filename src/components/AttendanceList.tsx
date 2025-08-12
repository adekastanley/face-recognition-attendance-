"use client";

import React, { useEffect, useState } from 'react';
import { attendanceManager, AttendanceRecord } from '@/lib/attendance';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Trash2, Users, Calendar, Clock, TrendingUp, List, UserCheck } from 'lucide-react';

type ViewMode = 'daily' | 'activity';

interface AttendanceListProps {
  onRecordsUpdate?: (records: AttendanceRecord[]) => void;
}

export default function AttendanceList({ onRecordsUpdate }: AttendanceListProps) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [dailyAttendance, setDailyAttendance] = useState<AttendanceRecord[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [stats, setStats] = useState({
    totalRecords: 0,
    todayRecords: 0,
    dailyAttendanceCount: 0,
    uniquePeopleToday: 0,
    uniquePeopleTotal: 0,
    lastAttendance: null as Date | null
  });

  useEffect(() => {
    const updateData = () => {
      const allRecords = attendanceManager.getRecords();
      const dailyRecords = attendanceManager.getDailyAttendance();
      const currentStats = attendanceManager.getStats();
      setRecords(allRecords);
      setDailyAttendance(dailyRecords);
      setStats(currentStats);
      onRecordsUpdate?.(allRecords);
    };

    updateData();
    
    // Update every second to catch new records
    const interval = setInterval(updateData, 1000);
    return () => clearInterval(interval);
  }, [onRecordsUpdate]);

  const handleExportDailyCSV = () => {
    attendanceManager.downloadDailyAttendanceCSV();
  };

  const handleExportActivityCSV = () => {
    attendanceManager.downloadActivityLogCSV();
  };

  const handleExportJSON = () => {
    attendanceManager.downloadJSON();
  };

  const handleClearRecords = () => {
    if (window.confirm('Are you sure you want to clear all attendance records? This action cannot be undone.')) {
      attendanceManager.clearRecords();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const currentRecords = viewMode === 'daily' ? dailyAttendance : records;
  const recordsCount = viewMode === 'daily' ? stats.dailyAttendanceCount : stats.todayRecords;

  return (
    <div className="w-full max-w-md space-y-4">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 gap-2">
        <Card className="p-3">
          <div className="flex items-center space-x-2">
            <UserCheck className="h-4 w-4 text-blue-600" />
            <div>
              <p className="text-xs text-muted-foreground">Present</p>
              <p className="text-lg font-semibold">{stats.dailyAttendanceCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center space-x-2">
            <List className="h-4 w-4 text-green-600" />
            <div>
              <p className="text-xs text-muted-foreground">Activity</p>
              <p className="text-lg font-semibold">{stats.todayRecords}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* View Toggle */}
      <Card>
        <CardContent className="p-3">
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <Button
              size="sm"
              variant={viewMode === 'daily' ? 'default' : 'ghost'}
              onClick={() => setViewMode('daily')}
              className="flex-1 h-8"
            >
              <UserCheck className="h-3 w-3 mr-1" />
              Daily Attendance
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'activity' ? 'default' : 'ghost'}
              onClick={() => setViewMode('activity')}
              className="flex-1 h-8"
            >
              <List className="h-3 w-3 mr-1" />
              Activity Log
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Attendance Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">
                {viewMode === 'daily' ? 'Daily Attendance' : 'Activity Log'}
              </CardTitle>
              <CardDescription>
                {viewMode === 'daily' 
                  ? `${stats.dailyAttendanceCount} people present today`
                  : `${stats.todayRecords} total entries today`
                }
              </CardDescription>
            </div>
            <div className="flex space-x-1">
              <Button
                size="sm"
                variant="outline"
                onClick={viewMode === 'daily' ? handleExportDailyCSV : handleExportActivityCSV}
                disabled={currentRecords.length === 0}
                className="h-8 px-2"
                title={viewMode === 'daily' ? 'Export Daily Attendance' : 'Export Activity Log'}
              >
                <Download className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleClearRecords}
                disabled={records.length === 0}
                className="h-8 px-2 text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-96 overflow-y-auto">
            {currentRecords.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                {viewMode === 'daily' ? (
                  <>
                    <UserCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No attendance recorded today</p>
                  </>
                ) : (
                  <>
                    <List className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No activity recorded today</p>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-1">
                {currentRecords.slice(0, 50).map((record, index) => (
                  <div
                    key={record.id}
                    className={`px-4 py-2 border-b last:border-b-0 hover:bg-gray-50 transition-colors ${
                      viewMode === 'activity' && index === 0 ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {record.name}
                        </p>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatTime(record.timestamp)}</span>
                          </div>
                          {viewMode === 'activity' && (
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(record.timestamp)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-xs font-medium ${getConfidenceColor(record.confidence)}`}>
                          {(record.confidence * 100).toFixed(0)}%
                        </div>
                        {viewMode === 'activity' && index === 0 && (
                          <div className="text-xs text-blue-600 font-medium">
                            Latest
                          </div>
                        )}
                        {viewMode === 'daily' && (
                          <div className="text-xs text-green-600 font-medium">
                            First Entry
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {currentRecords.length > 50 && (
                  <div className="px-4 py-2 text-center text-xs text-muted-foreground">
                    ... and {currentRecords.length - 50} more entries
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Export Options */}
      {currentRecords.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Export Options</CardTitle>
            <CardDescription className="text-xs">
              {viewMode === 'daily' 
                ? 'Export daily attendance (first entry per person)'
                : 'Export complete activity log (all entries)'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="space-y-2">
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={viewMode === 'daily' ? handleExportDailyCSV : handleExportActivityCSV}
                  className="flex-1"
                >
                  <Download className="h-3 w-3 mr-1" />
                  {viewMode === 'daily' ? 'Daily CSV' : 'Activity CSV'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleExportJSON}
                  className="flex-1"
                >
                  <Download className="h-3 w-3 mr-1" />
                  JSON
                </Button>
              </div>
              
              {/* Additional export option for the other view */}
              <Button
                size="sm"
                variant="ghost"
                onClick={viewMode === 'daily' ? handleExportActivityCSV : handleExportDailyCSV}
                className="w-full text-xs"
              >
                <Download className="h-3 w-3 mr-1" />
                Also export {viewMode === 'daily' ? 'Activity Log' : 'Daily Attendance'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
