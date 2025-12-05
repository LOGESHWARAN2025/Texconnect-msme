/**
 * Offline Data Synchronization Service
 * Handles local storage, sync queue, and conflict resolution
 */

export interface SyncQueueItem {
  id: string;
  action: 'create' | 'update' | 'delete';
  collection: string;
  data: any;
  timestamp: number;
  synced: boolean;
}

export interface SyncConflict {
  id: string;
  localData: any;
  remoteData: any;
  resolution: 'local' | 'remote' | 'merge';
}

class OfflineSyncService {
  private syncQueue: SyncQueueItem[] = [];
  private localStorageKey = 'texconnect_sync_queue';
  private dataStorageKey = 'texconnect_offline_data';
  private isOnline = navigator.onLine;

  constructor() {
    this.loadSyncQueue();
    this.setupOnlineListener();
  }

  /**
   * Setup online/offline event listeners
   */
  private setupOnlineListener(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('🟢 Online - Starting sync');
      this.syncWithServer();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('🔴 Offline - Queuing changes');
    });
  }

  /**
   * Check if application is online
   */
  public getOnlineStatus(): boolean {
    return this.isOnline;
  }

  /**
   * Add item to sync queue
   */
  public addToSyncQueue(
    action: 'create' | 'update' | 'delete',
    collection: string,
    data: any
  ): void {
    const item: SyncQueueItem = {
      id: `${collection}_${Date.now()}_${Math.random()}`,
      action,
      collection,
      data,
      timestamp: Date.now(),
      synced: false,
    };

    this.syncQueue.push(item);
    this.saveSyncQueue();

    console.log(`📝 Added to sync queue: ${action} in ${collection}`);
  }

  /**
   * Save sync queue to localStorage
   */
  private saveSyncQueue(): void {
    try {
      localStorage.setItem(this.localStorageKey, JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('Error saving sync queue:', error);
    }
  }

  /**
   * Load sync queue from localStorage
   */
  private loadSyncQueue(): void {
    try {
      const stored = localStorage.getItem(this.localStorageKey);
      if (stored) {
        this.syncQueue = JSON.parse(stored);
        console.log(`📦 Loaded ${this.syncQueue.length} items from sync queue`);
      }
    } catch (error) {
      console.error('Error loading sync queue:', error);
      this.syncQueue = [];
    }
  }

  /**
   * Save data locally
   */
  public saveDataLocally(collection: string, data: any): void {
    try {
      const key = `${this.dataStorageKey}_${collection}`;
      const existing = localStorage.getItem(key);
      const items = existing ? JSON.parse(existing) : [];

      // Check if item exists
      const index = items.findIndex((item: any) => item.id === data.id);
      if (index >= 0) {
        items[index] = { ...items[index], ...data, lastUpdated: Date.now() };
      } else {
        items.push({ ...data, createdAt: Date.now(), lastUpdated: Date.now() });
      }

      localStorage.setItem(key, JSON.stringify(items));
      console.log(`💾 Saved to local storage: ${collection}`);
    } catch (error) {
      console.error('Error saving data locally:', error);
    }
  }

  /**
   * Get data from local storage
   */
  public getDataLocally(collection: string): any[] {
    try {
      const key = `${this.dataStorageKey}_${collection}`;
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting data locally:', error);
      return [];
    }
  }

  /**
   * Delete data from local storage
   */
  public deleteDataLocally(collection: string, id: string): void {
    try {
      const key = `${this.dataStorageKey}_${collection}`;
      const items = this.getDataLocally(collection);
      const filtered = items.filter((item: any) => item.id !== id);
      localStorage.setItem(key, JSON.stringify(filtered));
      console.log(`🗑️ Deleted from local storage: ${collection}/${id}`);
    } catch (error) {
      console.error('Error deleting data locally:', error);
    }
  }

  /**
   * Clear all local data
   */
  public clearAllLocalData(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith(this.dataStorageKey)) {
          localStorage.removeItem(key);
        }
      });
      console.log('🧹 Cleared all local data');
    } catch (error) {
      console.error('Error clearing local data:', error);
    }
  }

  /**
   * Get sync queue
   */
  public getSyncQueue(): SyncQueueItem[] {
    return [...this.syncQueue];
  }

  /**
   * Get pending sync count
   */
  public getPendingSyncCount(): number {
    return this.syncQueue.filter((item) => !item.synced).length;
  }

  /**
   * Sync with server
   */
  public async syncWithServer(): Promise<void> {
    if (!this.isOnline) {
      console.log('⚠️ Cannot sync - offline');
      return;
    }

    const pendingItems = this.syncQueue.filter((item) => !item.synced);
    if (pendingItems.length === 0) {
      console.log('✅ No items to sync');
      return;
    }

    console.log(`🔄 Syncing ${pendingItems.length} items...`);

    for (const item of pendingItems) {
      try {
        await this.syncItem(item);
        item.synced = true;
      } catch (error) {
        console.error(`Error syncing item ${item.id}:`, error);
      }
    }

    // Remove synced items
    this.syncQueue = this.syncQueue.filter((item) => !item.synced);
    this.saveSyncQueue();

    console.log('✅ Sync complete');
  }

  /**
   * Sync individual item
   */
  private async syncItem(item: SyncQueueItem): Promise<void> {
    // This would be implemented based on your backend API
    // For now, it's a placeholder
    console.log(`Syncing: ${item.action} ${item.collection}/${item.id}`);

    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(resolve, 100);
    });
  }

  /**
   * Detect conflicts
   */
  public detectConflicts(
    localData: any,
    remoteData: any
  ): SyncConflict | null {
    if (
      localData.lastUpdated > remoteData.lastUpdated &&
      JSON.stringify(localData) !== JSON.stringify(remoteData)
    ) {
      return {
        id: localData.id,
        localData,
        remoteData,
        resolution: 'local',
      };
    }
    return null;
  }

  /**
   * Resolve conflict
   */
  public resolveConflict(
    conflict: SyncConflict,
    resolution: 'local' | 'remote' | 'merge'
  ): any {
    switch (resolution) {
      case 'local':
        return conflict.localData;
      case 'remote':
        return conflict.remoteData;
      case 'merge':
        return {
          ...conflict.remoteData,
          ...conflict.localData,
          mergedAt: Date.now(),
        };
      default:
        return conflict.localData;
    }
  }

  /**
   * Get sync status
   */
  public getSyncStatus(): {
    isOnline: boolean;
    pendingItems: number;
    lastSync: number | null;
  } {
    return {
      isOnline: this.isOnline,
      pendingItems: this.getPendingSyncCount(),
      lastSync: this.syncQueue.length > 0 ? this.syncQueue[0].timestamp : null,
    };
  }

  /**
   * Export offline data
   */
  public exportOfflineData(): string {
    try {
      const data = {
        syncQueue: this.syncQueue,
        timestamp: Date.now(),
      };
      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.error('Error exporting offline data:', error);
      return '';
    }
  }

  /**
   * Import offline data
   */
  public importOfflineData(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData);
      this.syncQueue = data.syncQueue || [];
      this.saveSyncQueue();
      console.log('✅ Offline data imported');
    } catch (error) {
      console.error('Error importing offline data:', error);
    }
  }

  /**
   * Clear sync queue
   */
  public clearSyncQueue(): void {
    this.syncQueue = [];
    this.saveSyncQueue();
    console.log('🧹 Sync queue cleared');
  }
}

// Export singleton instance
export const offlineSyncService = new OfflineSyncService();

// Export service class
export default OfflineSyncService;
