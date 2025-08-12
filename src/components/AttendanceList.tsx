"use client";

import React, { useEffect, useState } from 'react';
import { attendanceManager, AttendanceRecord } from '@/lib/attendance';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Trash2, Users, Calendar, Clock, TrendingUp } from 'lucide-react';

interface AttendanceListProps {
  onRecordsUpdate?: (records: AttendanceRecord[]) => void;
}

export default function AttendanceList({ onRecordsUpdate }: AttendanceListProps) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState({
    totalRecords: 0,
    todayRecords: 0,
    uniquePeopleToday: 0,
    uniquePeopleTotal: 0,
    lastAttendance: null as Date | null
  });

  useEffect(() => {
    const updateData = () => {
      const allRecords = attendanceManager.getRecords();
      const currentStats = attendanceManager.getStats();
      setRecords(allRecords);
      setStats(currentStats);
      onRecordsUpdate?.(allRecords);
    };

    updateData();
    
    // Update every second to catch new records
    const interval = setInterval(updateData, 1000);
    return () => clearInterval(interval);
  }, [onRecordsUpdate]);

  const handleExportCSV = () => {
    attendanceManager.downloadCSV();
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

  return (
    <div className="w-full max-w-md space-y-4">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 gap-2">
        <Card className="p-3">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-blue-600" />
            <div>
              <p className="text-xs text-muted-foreground">Today</p>
              <p className="text-lg font-semibold">{stats.uniquePeopleToday}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-lg font-semibold">{stats.totalRecords}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Attendance Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Attendance Log</CardTitle>
              <CardDescription>
                {stats.todayRecords} entries today
              </CardDescription>
            </div>
            <div className="flex space-x-1">
              <Button
                size="sm"
                variant="outline"
                onClick={handleExportCSV}
                disabled={records.length === 0}
                className="h-8 px-2"
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
            {records.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No attendance records yet</p>
              </div>
            ) : (
              <div className="space-y-1">
                {records.slice(0, 50).map((record, index) => (
                  <div
                    key={record.id}
                    className={`px-4 py-2 border-b last:border-b-0 hover:bg-gray-50 transition-colors ${
                      index === 0 ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {record.name}
                        </p>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(record.timestamp)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatTime(record.timestamp)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-xs font-medium ${getConfidenceColor(record.confidence)}`}>
                          {(record.confidence * 100).toFixed(0)}%
                        </div>
                        {index === 0 && (
                          <div className="text-xs text-blue-600 font-medium">
                            Latest
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {records.length > 50 && (
                  <div className="px-4 py-2 text-center text-xs text-muted-foreground">
                    ... and {records.length - 50} more entries
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Export Options */}
      {records.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Export Options</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleExportCSV}
                className="flex-1"
              >
                <Download className="h-3 w-3 mr-1" />
                CSV
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}
