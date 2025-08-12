export interface AttendanceRecord {
  id: string;
  name: string;
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
  addRecord(name: string, confidence: number, imageData?: string): boolean {
    const now = Date.now();
    const lastDetection = this.lastDetections.get(name);
    
    // Check if enough time has passed since last detection of this person
    if (lastDetection && (now - lastDetection) < this.debounceTime) {
      return false; // Skip this detection
    }

    const record: AttendanceRecord = {
      id: `${name}-${now}`,
      name,
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

  // Export to CSV
  exportToCSV(): string {
    const headers = ['ID', 'Name', 'Date', 'Time', 'Confidence'];
    const csvContent = [
      headers.join(','),
      ...this.records.map(record => [
        record.id,
        `"${record.name}"`,
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

  // Get statistics
  getStats() {
    const today = this.getTodayRecords();
    const uniqueToday = new Set(today.map(r => r.name)).size;
    const uniqueTotal = new Set(this.records.map(r => r.name)).size;
    
    return {
      totalRecords: this.records.length,
      todayRecords: today.length,
      uniquePeopleToday: uniqueToday,
      uniquePeopleTotal: uniqueTotal,
      lastAttendance: this.records.length > 0 ? this.records[0].timestamp : null
    };
  }
}

// Global instance
export const attendanceManager = new AttendanceManager();
