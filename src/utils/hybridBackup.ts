/**
 * Hybrid Backup System - Enhanced Downloads + Smart Recovery
 * 
 * This system automatically:
 * 1. Saves one backup file per month when data changes
 * 2. Detects when browser cache is cleared
 * 3. Offers smart recovery from monthly backup files
 * 4. Manages backup file lifecycle (keeps recent months)
 */

import { workScheduleDB } from './indexedDB';

interface MonthlyBackup {
  month: number;
  year: number;
  filename: string;
  data: any;
  timestamp: number;
  size: number;
}

interface BackupMetadata {
  lastBackupCheck: number;
  monthlyBackups: MonthlyBackup[];
  autoBackupEnabled: boolean;
  maxBackupsToKeep: number;
}

class HybridBackupSystem {
  private readonly STORAGE_KEY = 'hybridBackupMetadata';
  private readonly MAX_BACKUPS = 6; // Keep 6 months of backups
  private readonly BACKUP_CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
  
  /**
   * Initialize the backup system
   */
  async initialize(): Promise<void> {
    console.log('🔄 Initializing Hybrid Backup System...');
    
    // Check if this is a fresh start (cache cleared)
    const isFreshStart = await this.detectFreshStart();
    
    if (isFreshStart) {
      console.log('🆕 Fresh start detected - checking for recovery options');
      await this.offerRecoveryOptions();
    }
    
    // Set up periodic backup checks
    this.schedulePeriodicBackup();
  }
  
  /**
   * Detect if browser cache was cleared (fresh start)
   */
  private async detectFreshStart(): Promise<boolean> {
    try {
      // Check if IndexedDB has any data
      const schedule = await workScheduleDB.getSchedule();
      const hasScheduleData = Object.keys(schedule).length > 0;
      
      // Check if we have backup metadata in localStorage
      const backupMetadata = this.getBackupMetadata();
      const hasBackupHistory = backupMetadata.monthlyBackups.length > 0;
      
      // Fresh start = no IndexedDB data but we have backup history
      const isFreshStart = !hasScheduleData && hasBackupHistory;
      
      console.log('🔍 Fresh start detection:', {
        hasScheduleData,
        hasBackupHistory,
        isFreshStart
      });
      
      return isFreshStart;
    } catch (error) {
      console.error('❌ Error detecting fresh start:', error);
      return false;
    }
  }
  
  /**
   * Offer recovery options to user
   */
  private async offerRecoveryOptions(): Promise<void> {
    const backupMetadata = this.getBackupMetadata();
    
    if (backupMetadata.monthlyBackups.length === 0) {
      console.log('📝 No backup files available for recovery');
      return;
    }
    
    // Sort backups by date (newest first)
    const sortedBackups = backupMetadata.monthlyBackups.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
    
    // Show recovery modal
    this.showRecoveryModal(sortedBackups);
  }
  
  /**
   * Show recovery modal to user
   */
  private showRecoveryModal(backups: MonthlyBackup[]): void {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    `;
    
    const modal = document.createElement('div');
    modal.style.cssText = `
      background: white;
      border-radius: 16px;
      padding: 24px;
      max-width: 500px;
      width: 100%;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    `;
    
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    modal.innerHTML = `
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="width: 64px; height: 64px; background: #3b82f6; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
          <svg width="32" height="32" fill="white" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
        <h2 style="margin: 0 0 8px; font-size: 24px; font-weight: 600; color: #1f2937;">
          🔄 Data Recovery Available
        </h2>
        <p style="margin: 0; color: #6b7280; font-size: 16px;">
          Your browser data was cleared, but we found ${backups.length} monthly backup${backups.length > 1 ? 's' : ''}!
        </p>
      </div>
      
      <div style="margin-bottom: 24px;">
        <h3 style="margin: 0 0 16px; font-size: 18px; font-weight: 600; color: #374151;">
          Available Backups:
        </h3>
        <div style="space-y: 8px;">
          ${backups.map((backup, index) => `
            <div style="border: 2px solid ${index === 0 ? '#3b82f6' : '#e5e7eb'}; border-radius: 8px; padding: 12px; cursor: pointer; transition: all 0.2s;" 
                 onclick="window.restoreBackup(${backup.month}, ${backup.year})" 
                 onmouseover="this.style.borderColor='#3b82f6'; this.style.backgroundColor='#f8fafc';"
                 onmouseout="this.style.borderColor='${index === 0 ? '#3b82f6' : '#e5e7eb'}'; this.style.backgroundColor='white';">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div style="font-weight: 600; color: #1f2937;">
                    ${monthNames[backup.month]} ${backup.year} ${index === 0 ? '(Latest)' : ''}
                  </div>
                  <div style="font-size: 14px; color: #6b7280;">
                    ${new Date(backup.timestamp).toLocaleDateString()} • ${this.formatFileSize(backup.size)}
                  </div>
                </div>
                <div style="color: #3b82f6; font-weight: 600;">
                  Restore →
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      
      <div style="display: flex; gap: 12px;">
        <button onclick="window.dismissRecovery()" style="
          flex: 1;
          padding: 12px 24px;
          background: #f3f4f6;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          color: #374151;
          cursor: pointer;
          transition: background-color 0.2s;
        " onmouseover="this.style.backgroundColor='#e5e7eb'" onmouseout="this.style.backgroundColor='#f3f4f6'">
          Start Fresh
        </button>
        <button onclick="window.restoreLatest()" style="
          flex: 1;
          padding: 12px 24px;
          background: #3b82f6;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          color: white;
          cursor: pointer;
          transition: background-color 0.2s;
        " onmouseover="this.style.backgroundColor='#2563eb'" onmouseout="this.style.backgroundColor='#3b82f6'">
          Restore Latest
        </button>
      </div>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    // Add global functions for modal interactions
    (window as any).restoreBackup = async (month: number, year: number) => {
      await this.restoreFromBackup(month, year);
      document.body.removeChild(overlay);
      window.location.reload();
    };
    
    (window as any).restoreLatest = async () => {
      const latest = backups[0];
      await this.restoreFromBackup(latest.month, latest.year);
      document.body.removeChild(overlay);
      window.location.reload();
    };
    
    (window as any).dismissRecovery = () => {
      document.body.removeChild(overlay);
    };
  }
  
  /**
   * Create monthly backup when data changes
   */
  async createMonthlyBackup(month: number, year: number): Promise<void> {
    try {
      console.log(`💾 Creating monthly backup for ${month + 1}/${year}...`);
      
      // Export current data
      const exportData = await workScheduleDB.exportAllData();
      
      // Create filename
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const filename = `work-schedule-${monthNames[month]}-${year}.json`;
      
      // Create backup object
      const backup: MonthlyBackup = {
        month,
        year,
        filename,
        data: exportData,
        timestamp: Date.now(),
        size: JSON.stringify(exportData).length
      };
      
      // Save backup file
      await this.saveBackupFile(backup);
      
      // Update metadata
      const metadata = this.getBackupMetadata();
      
      // Remove existing backup for this month/year
      metadata.monthlyBackups = metadata.monthlyBackups.filter(
        b => !(b.month === month && b.year === year)
      );
      
      // Add new backup
      metadata.monthlyBackups.push(backup);
      
      // Keep only recent backups
      metadata.monthlyBackups = this.cleanupOldBackups(metadata.monthlyBackups);
      
      // Save metadata
      this.saveBackupMetadata(metadata);
      
      console.log(`✅ Monthly backup created: ${filename}`);
    } catch (error) {
      console.error('❌ Error creating monthly backup:', error);
    }
  }
  
  /**
   * Save backup file to downloads
   */
  private async saveBackupFile(backup: MonthlyBackup): Promise<void> {
    const dataStr = JSON.stringify(backup.data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = backup.filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }
  
  /**
   * Restore data from backup
   */
  private async restoreFromBackup(month: number, year: number): Promise<void> {
    try {
      console.log(`🔄 Restoring backup for ${month + 1}/${year}...`);
      
      const metadata = this.getBackupMetadata();
      const backup = metadata.monthlyBackups.find(
        b => b.month === month && b.year === year
      );
      
      if (!backup) {
        throw new Error('Backup not found');
      }
      
      // Import the backup data
      await workScheduleDB.importAllData(backup.data);
      
      console.log(`✅ Successfully restored backup for ${month + 1}/${year}`);
    } catch (error) {
      console.error('❌ Error restoring backup:', error);
      throw error;
    }
  }
  
  /**
   * Check if monthly backup is needed
   */
  async checkAndCreateBackup(): Promise<void> {
    try {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      // Check if we already have a backup for current month
      const metadata = this.getBackupMetadata();
      const hasCurrentMonthBackup = metadata.monthlyBackups.some(
        b => b.month === currentMonth && b.year === currentYear
      );
      
      // Check if we have any data for current month
      const schedule = await workScheduleDB.getSchedule();
      const hasCurrentMonthData = Object.keys(schedule).some(dateKey => {
        const date = new Date(dateKey);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      });
      
      // Create backup if we have data but no backup
      if (hasCurrentMonthData && !hasCurrentMonthBackup) {
        await this.createMonthlyBackup(currentMonth, currentYear);
      }
      
      // Also check previous month (in case we missed it)
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      
      const hasPrevMonthBackup = metadata.monthlyBackups.some(
        b => b.month === prevMonth && b.year === prevYear
      );
      
      const hasPrevMonthData = Object.keys(schedule).some(dateKey => {
        const date = new Date(dateKey);
        return date.getMonth() === prevMonth && date.getFullYear() === prevYear;
      });
      
      if (hasPrevMonthData && !hasPrevMonthBackup) {
        await this.createMonthlyBackup(prevMonth, prevYear);
      }
      
    } catch (error) {
      console.error('❌ Error checking backup needs:', error);
    }
  }
  
  /**
   * Schedule periodic backup checks
   */
  private schedulePeriodicBackup(): void {
    // Check immediately
    setTimeout(() => this.checkAndCreateBackup(), 5000);
    
    // Then check every 24 hours
    setInterval(() => {
      this.checkAndCreateBackup();
    }, this.BACKUP_CHECK_INTERVAL);
  }
  
  /**
   * Clean up old backups (keep only recent months)
   */
  private cleanupOldBackups(backups: MonthlyBackup[]): MonthlyBackup[] {
    // Sort by date (newest first)
    const sorted = backups.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
    
    // Keep only the most recent backups
    return sorted.slice(0, this.MAX_BACKUPS);
  }
  
  /**
   * Get backup metadata from localStorage
   */
  private getBackupMetadata(): BackupMetadata {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('❌ Error reading backup metadata:', error);
    }
    
    // Return default metadata
    return {
      lastBackupCheck: 0,
      monthlyBackups: [],
      autoBackupEnabled: true,
      maxBackupsToKeep: this.MAX_BACKUPS
    };
  }
  
  /**
   * Save backup metadata to localStorage
   */
  private saveBackupMetadata(metadata: BackupMetadata): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(metadata));
    } catch (error) {
      console.error('❌ Error saving backup metadata:', error);
    }
  }
  
  /**
   * Format file size for display
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  /**
   * Get backup status for UI
   */
  getBackupStatus(): {
    enabled: boolean;
    backupCount: number;
    lastBackup: MonthlyBackup | null;
    nextBackupDue: boolean;
  } {
    const metadata = this.getBackupMetadata();
    const sorted = metadata.monthlyBackups.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const hasCurrentMonthBackup = metadata.monthlyBackups.some(
      b => b.month === currentMonth && b.year === currentYear
    );
    
    return {
      enabled: metadata.autoBackupEnabled,
      backupCount: metadata.monthlyBackups.length,
      lastBackup: sorted[0] || null,
      nextBackupDue: !hasCurrentMonthBackup
    };
  }
  
  /**
   * Manually trigger backup creation
   */
  async createBackupNow(): Promise<void> {
    const now = new Date();
    await this.createMonthlyBackup(now.getMonth(), now.getFullYear());
  }
}

// Create singleton instance
export const hybridBackup = new HybridBackupSystem();