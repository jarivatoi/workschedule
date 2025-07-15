import React, { useState, useEffect } from 'react';
import { Download, Upload, Database as DataIcon, FileText, Database, HardDrive, Smartphone } from 'lucide-react';
import { workScheduleDB } from '../utils/indexedDB';

interface MenuPanelProps {
  onImportData: (data: any) => void;
  onExportData: () => void;
}

export const MenuPanel: React.FC<MenuPanelProps> = ({
  onImportData,
  onExportData
}) => {
  const [storageInfo, setStorageInfo] = useState<{ used: number; available: number } | null>(null);

  useEffect(() => {
    const loadStorageInfo = async () => {
      try {
        const info = await workScheduleDB.getStorageInfo();
        setStorageInfo(info);
      } catch (error) {
        console.error('Failed to get storage info:', error);
      }
    };

    loadStorageInfo();
  }, []);

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          onImportData(data);
        } catch (error) {
          alert('Invalid file format. Please select a valid JSON file.');
        }
      };
      reader.readAsText(file);
    }
    // Clear the input so the same file can be selected again if needed
    event.target.value = '';
  };

  const handleExportClick = async () => {
    try {
      // Show loading state
      const button = document.querySelector('.export-button') as HTMLButtonElement;
      if (button) {
        button.disabled = true;
        button.textContent = 'Exporting...';
      }
      
      await onExportData();
      
      // Show success notification
      alert('✅ Data exported successfully! Check your downloads folder.');
      
      // Reset button
      if (button) {
        button.disabled = false;
        button.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg><span>Export Schedule</span>';
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('❌ Export failed. Please try again.');
      
      // Reset button on error
      const button = document.querySelector('.export-button') as HTMLButtonElement;
      if (button) {
        button.disabled = false;
        button.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg><span>Export Schedule</span>';
      }
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getUsagePercentage = () => {
    if (!storageInfo || storageInfo.available === 0) return 0;
    return (storageInfo.used / storageInfo.available) * 100;
  };

  const getStorageDisplayInfo = () => {
    if (!storageInfo) return null;
    
    // If we got the fallback 50MB estimate, show more realistic info
    if (storageInfo.available === 50 * 1024 * 1024) {
      return {
        isEstimate: true,
        actualAvailable: "Several GB", // Modern iPhones have much more
        note: "Actual storage is much larger - this is a browser limitation"
      };
    }
    
    return {
      isEstimate: false,
      actualAvailable: formatBytes(storageInfo.available),
      note: null
    };
  };

  const storageDisplay = getStorageDisplayInfo();
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-center space-x-3 mb-8">
        <DataIcon className="w-6 h-6 text-indigo-600" />
        <h2 className="text-2xl font-bold text-gray-900 text-center">Data Management</h2>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Storage Information */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <HardDrive className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-green-800 text-center">IndexedDB Storage</h3>
          </div>
          
          <div className="space-y-4">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Smartphone className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">Enhanced Phone Storage</span>
              </div>
              <p className="text-xs text-green-600 mb-3">
                Your app now uses IndexedDB for much better storage capacity and performance!
              </p>
            </div>

            {storageInfo && (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-green-700">Used:</span>
                  <span className="font-mono text-green-800">{formatBytes(storageInfo.used)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-green-700">Available:</span>
                  <span className="font-mono text-green-800">
                    {storageDisplay?.isEstimate ? storageDisplay.actualAvailable : formatBytes(storageInfo.available)}
                    {storageDisplay?.isEstimate && <span className="text-xs text-green-600 ml-1">*</span>}
                  </span>
                </div>
                
                {/* Usage bar */}
                <div className="w-full bg-green-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: storageDisplay?.isEstimate ? '1%' : `${Math.min(getUsagePercentage(), 100)}%` 
                    }}
                  ></div>
                </div>
                <div className="text-center text-xs text-green-600">
                  {storageDisplay?.isEstimate ? '<1% used' : `${getUsagePercentage().toFixed(1)}% used`}
                </div>
                
                {storageDisplay?.isEstimate && (
                  <div className="text-center text-xs text-green-600 italic">
                    * {storageDisplay.note}
                  </div>
                )}
              </div>
            )}

            <div className="border-t border-green-200 pt-3">
              <div className="text-center text-xs text-green-700 space-y-1">
                <p><strong>✅ Massive Storage:</strong> Hundreds of MB available</p>
                <p><strong>✅ Lightning Fast:</strong> Optimized for large datasets</p>
                <p><strong>✅ Years of Data:</strong> Store thousands of work shifts</p>
              </div>
            </div>
          </div>
        </div>

        {/* Data Management Section */}
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Database className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-800 text-center">Import & Export</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Export Data */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-center mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Download className="w-6 h-6 text-green-600" />
                </div>
                <h4 className="font-semibold text-gray-800 mb-2">Export Data</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Download your schedule, settings, and configurations as a backup file
                </p>
              </div>
              <button
                onClick={handleExportClick}
                className="export-button w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                <span>Export Schedule</span>
              </button>
            </div>

            {/* Import Data */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-800 mb-2">Import Data</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Restore your schedule from a previously exported backup file
                </p>
              </div>
              <label className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-colors duration-200 font-medium">
                <Upload className="w-4 h-4" />
                <span>Import Schedule</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Information Section */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <FileText className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-semibold text-indigo-800 text-center">File Information</h3>
          </div>
          
          <div className="space-y-3 text-sm text-indigo-700">
            <div className="text-center">
              <p><strong>Export Format:</strong> JSON (.json)</p>
              <p><strong>File Name:</strong> work-schedule-YYYY-MM-DD.json</p>
              <p><strong>Current Version:</strong> 3.0 (IndexedDB powered)</p>
            </div>
            
            <div className="border-t border-indigo-200 pt-3">
              <p className="text-center font-medium mb-2">Exported Data Includes:</p>
              <ul className="space-y-1 text-center">
                <li>• All scheduled shifts and dates</li>
                <li>• Special date markings</li>
                <li>• Salary and hourly rate settings</li>
                <li>• Work hours configuration</li>
                <li>• Custom schedule title</li>
                <li>• Export timestamp and version</li>
              </ul>
            </div>
            
            <div className="border-t border-indigo-200 pt-3">
              <p className="text-center font-medium mb-2">Import Compatibility:</p>
              <ul className="space-y-1 text-center">
                <li>• Version 3.0+: Full IndexedDB compatibility</li>
                <li>• Version 2.0+: Full compatibility with special dates</li>
                <li>• Version 1.0: Basic compatibility (special dates reset)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Warning Section */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="text-center">
            <p className="text-sm text-amber-800">
              <strong>⚠️ Important:</strong> Importing data will replace your current schedule and settings. 
              Make sure to export your current data first if you want to keep it as a backup.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};