export interface AttendanceRecord {
  id: string;
  matric_number?: string;
  name: string;
  email?: string;
  department?: string;
  timestamp: Date;
  confidence: number;
  imageData?: string; // Base64 encoded image
}

export class AttendanceManager {
  private records: AttendanceRecord[] = [];
  private readonly storageKey = 'facial-attendance-records';
  private readonly debounceTime = 30000; // 30 seconds between same person detections
  private lastDetections: Map<string, number> = new Map();

  constructor() {
    this.loadRecords();
  }

  // Load records from localStorage
  private loadRecords(): void {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
          this.records = JSON.parse(stored).map((record: any) => ({
            ...record,
            timestamp: new Date(record.timestamp)
          }));
        }
      } catch (error) {
        console.error('Error loading attendance records:', error);
      }
    }
  }

  // Save records to localStorage
  private saveRecords(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(this.records));
      } catch (error) {
        console.error('Error saving attendance records:', error);
      }
    }
  }

  // Add new attendance record with debouncing
  addRecord(name: string, confidence: number, imageData?: string, metadata?: { matric_number?: string; email?: string; department?: string }): boolean {
    const now = Date.now();
    const lastDetection = this.lastDetections.get(name);
    
    // Check if enough time has passed since last detection of this person
    if (lastDetection && (now - lastDetection) < this.debounceTime) {
      return false; // Skip this detection
    }

    const record: AttendanceRecord = {
      id: `${name}-${now}`,
      matric_number: metadata?.matric_number,
      name,
      email: metadata?.email,
      department: metadata?.department,
      timestamp: new Date(),
      confidence,
      imageData
    };

    this.records.unshift(record); // Add to beginning for chronological order
    this.lastDetections.set(name, now);
    this.saveRecords();
    
    return true;
  }

  // Get all records
  getRecords(): AttendanceRecord[] {
    return [...this.records];
  }

  // Get records for today
  getTodayRecords(): AttendanceRecord[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.records.filter(record => 
      record.timestamp >= today && record.timestamp < tomorrow
    );
  }

  // Get records by date range
  getRecordsByDateRange(startDate: Date, endDate: Date): AttendanceRecord[] {
    return this.records.filter(record => 
      record.timestamp >= startDate && record.timestamp <= endDate
    );
  }

  // Clear all records
  clearRecords(): void {
    this.records = [];
    this.lastDetections.clear();
    this.saveRecords();
  }

  // Export to CSV with full details
  exportToCSV(): string {
    const headers = ['ID', 'Matric Number', 'Name', 'Email', 'Department', 'Date', 'Time', 'Confidence'];
    const csvContent = [
      headers.join(','),
      ...this.records.map(record => [
        record.id,
        `"${record.matric_number || 'N/A'}"`,
        `"${record.name}"`,
        `"${record.email || 'N/A'}"`,
        `"${record.department || 'N/A'}"`,
        record.timestamp.toLocaleDateString(),
        record.timestamp.toLocaleTimeString(),
        record.confidence.toFixed(2)
      ].join(','))
    ].join('\n');

    return csvContent;
  }

  // Export to JSON
  exportToJSON(): string {
    return JSON.stringify(this.records, null, 2);
  }

  // Download CSV file
  downloadCSV(filename?: string): void {
    const csvContent = this.exportToCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename || `attendance-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Download JSON file
  downloadJSON(filename?: string): void {
    const jsonContent = this.exportToJSON();
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename || `attendance-${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Get daily attendance (first entry per person per day)
  getDailyAttendance(date?: Date): AttendanceRecord[] {
    const targetDate = date || new Date();
    const dayStart = new Date(targetDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);

    const dayRecords = this.records.filter(record => 
      record.timestamp >= dayStart && record.timestamp <= dayEnd
    );

    // Get only the first entry per person for the day
    const firstEntries = new Map<string, AttendanceRecord>();
    
    // Sort by timestamp ascending to get earliest entries first
    dayRecords.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    dayRecords.forEach(record => {
      if (!firstEntries.has(record.name)) {
        firstEntries.set(record.name, record);
      }
    });

    return Array.from(firstEntries.values()).sort((a, b) => 
      a.timestamp.getTime() - b.timestamp.getTime()
    );
  }

  // Get all activity logs (all entries)
  getActivityLog(date?: Date): AttendanceRecord[] {
    if (!date) {
      return [...this.records];
    }

    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    return this.records.filter(record => 
      record.timestamp >= dayStart && record.timestamp <= dayEnd
    );
  }

  // Export daily attendance to CSV with full details
  exportDailyAttendanceToCSV(date?: Date): string {
    const dailyRecords = this.getDailyAttendance(date);
    const headers = ['Matric Number', 'Name', 'Email', 'Department', 'First Entry Time', 'Date', 'Confidence'];
    const csvContent = [
      headers.join(','),
      ...dailyRecords.map(record => [
        `"${record.matric_number || 'N/A'}"`,
        `"${record.name}"`,
        `"${record.email || 'N/A'}"`,
        `"${record.department || 'N/A'}"`,
        record.timestamp.toLocaleTimeString(),
        record.timestamp.toLocaleDateString(),
        record.confidence.toFixed(2)
      ].join(','))
    ].join('\n');

    return csvContent;
  }

  // Export activity log to CSV with full details
  exportActivityLogToCSV(date?: Date): string {
    const activityRecords = this.getActivityLog(date);
    const headers = ['ID', 'Matric Number', 'Name', 'Email', 'Department', 'Date', 'Time', 'Confidence'];
    const csvContent = [
      headers.join(','),
      ...activityRecords.map(record => [
        record.id,
        `"${record.matric_number || 'N/A'}"`,
        `"${record.name}"`,
        `"${record.email || 'N/A'}"`,
        `"${record.department || 'N/A'}"`,
        record.timestamp.toLocaleDateString(),
        record.timestamp.toLocaleTimeString(),
        record.confidence.toFixed(2)
      ].join(','))
    ].join('\n');

    return csvContent;
  }

  // Download daily attendance CSV
  downloadDailyAttendanceCSV(date?: Date, filename?: string): void {
    const csvContent = this.exportDailyAttendanceToCSV(date);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const dateStr = (date || new Date()).toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', filename || `daily-attendance-${dateStr}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Download activity log CSV (rename existing method)
  downloadActivityLogCSV(date?: Date, filename?: string): void {
    const csvContent = this.exportActivityLogToCSV(date);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const dateStr = (date || new Date()).toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', filename || `activity-log-${dateStr}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Export daily attendance to Excel
  exportDailyAttendanceToExcel(date?: Date): void {
    if (typeof window === 'undefined') return;
    
    const dailyRecords = this.getDailyAttendance(date);
    const worksheet = [
      ['Matric Number', 'Name', 'Email', 'Department', 'First Entry Time', 'Date', 'Confidence'],
      ...dailyRecords.map(record => [
        record.matric_number || 'N/A',
        record.name,
        record.email || 'N/A',
        record.department || 'N/A',
        record.timestamp.toLocaleTimeString(),
        record.timestamp.toLocaleDateString(),
        record.confidence.toFixed(2)
      ])
    ];
    
    this.downloadExcelFile(worksheet, `daily-attendance-${(date || new Date()).toISOString().split('T')[0]}.xlsx`);
  }

  // Export activity log to Excel
  exportActivityLogToExcel(date?: Date): void {
    if (typeof window === 'undefined') return;
    
    const activityRecords = this.getActivityLog(date);
    const worksheet = [
      ['ID', 'Matric Number', 'Name', 'Email', 'Department', 'Date', 'Time', 'Confidence'],
      ...activityRecords.map(record => [
        record.id,
        record.matric_number || 'N/A',
        record.name,
        record.email || 'N/A',
        record.department || 'N/A',
        record.timestamp.toLocaleDateString(),
        record.timestamp.toLocaleTimeString(),
        record.confidence.toFixed(2)
      ])
    ];
    
    this.downloadExcelFile(worksheet, `activity-log-${(date || new Date()).toISOString().split('T')[0]}.xlsx`);
  }

  // Helper method to download Excel file
  private downloadExcelFile(data: any[][], filename: string): void {
    if (typeof window === 'undefined') return;
    
    import('xlsx').then((XLSX) => {
      const ws = XLSX.utils.aoa_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
      XLSX.writeFile(wb, filename);
    }).catch(error => {
      console.error('Error exporting to Excel:', error);
    });
  }

  // Get statistics
  getStats() {
    const today = this.getTodayRecords();
    const dailyAttendance = this.getDailyAttendance();
    const uniqueTotal = new Set(this.records.map(r => r.name)).size;
    
    return {
      totalRecords: this.records.length,
      todayRecords: today.length,
      dailyAttendanceCount: dailyAttendance.length,
      uniquePeopleToday: dailyAttendance.length,
      uniquePeopleTotal: uniqueTotal,
      lastAttendance: this.records.length > 0 ? this.records[0].timestamp : null
    };
  }
}

// Global instance
export const attendanceManager = new AttendanceManager();
