/**
 * Multi-tab synchronization for AnswerAI questions
 * Ensures questions appear on all active tabs instantly
 */

import type { Question, Answer } from '@/types/answerai';

interface SyncMessage {
  type: 'question-detected' | 'answer-generated' | 'session-update' | 'tab-active' | 'performance-update';
  data: any;
  timestamp: number;
  tabId: string;
}

interface TabState {
  id: string;
  isActive: boolean;
  lastSeen: number;
}

class MultiTabSync {
  private channel: BroadcastChannel;
  private tabId: string;
  private listeners: Map<string, Function[]> = new Map();
  private activeTabs: Map<string, TabState> = new Map();
  private isActive = true;

  constructor(channelName = 'answerai-sync') {
    this.tabId = this.generateTabId();
    this.channel = new BroadcastChannel(channelName);
    this.setupListeners();
    this.registerTab();
    
    // Update tab activity status
    this.setupVisibilityTracking();
    
    // Cleanup inactive tabs periodically
    setInterval(() => this.cleanupInactiveTabs(), 30000);
  }

  private generateTabId(): string {
    return `tab-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  private setupListeners() {
    this.channel.onmessage = (event) => {
      const message: SyncMessage = event.data;
      
      // Don't process our own messages
      if (message.tabId === this.tabId) return;
      
      // Update tab activity
      if (message.type === 'tab-active') {
        this.activeTabs.set(message.tabId, {
          id: message.tabId,
          isActive: message.data.isActive,
          lastSeen: message.timestamp
        });
        return;
      }
      
      // Trigger listeners for this message type
      const typeListeners = this.listeners.get(message.type) || [];
      typeListeners.forEach(listener => {
        try {
          listener(message.data, message);
        } catch (error) {
          console.error('MultiTabSync listener error:', error);
        }
      });
    };
  }

  private setupVisibilityTracking() {
    const updateActivity = () => {
      this.isActive = !document.hidden;
      this.broadcast('tab-active', { isActive: this.isActive });
    };
    
    document.addEventListener('visibilitychange', updateActivity);
    window.addEventListener('focus', updateActivity);
    window.addEventListener('blur', updateActivity);
    
    // Send periodic heartbeat
    setInterval(() => {
      if (this.isActive) {
        this.broadcast('tab-active', { isActive: true });
      }
    }, 5000);
  }

  private registerTab() {
    this.activeTabs.set(this.tabId, {
      id: this.tabId,
      isActive: this.isActive,
      lastSeen: Date.now()
    });
    this.broadcast('tab-active', { isActive: this.isActive });
  }

  private cleanupInactiveTabs() {
    const now = Date.now();
    const timeout = 60000; // 1 minute timeout
    
    for (const [tabId, tab] of this.activeTabs) {
      if (now - tab.lastSeen > timeout) {
        this.activeTabs.delete(tabId);
      }
    }
  }

  // Public API
  broadcast(type: string, data: any) {
    const message: SyncMessage = {
      type: type as any,
      data,
      timestamp: Date.now(),
      tabId: this.tabId
    };
    
    this.channel.postMessage(message);
  }

  on(type: string, listener: Function) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type)!.push(listener);
  }

  off(type: string, listener: Function) {
    const typeListeners = this.listeners.get(type) || [];
    const index = typeListeners.indexOf(listener);
    if (index > -1) {
      typeListeners.splice(index, 1);
    }
  }

  // Enhanced question broadcasting
  broadcastQuestion(question: Question) {
    this.broadcast('question-detected', {
      question,
      activeTabsCount: this.getActiveTabsCount(),
      priority: 'high' // Questions are high priority
    });
  }

  broadcastAnswer(answer: Answer) {
    this.broadcast('answer-generated', {
      answer,
      activeTabsCount: this.getActiveTabsCount()
    });
  }

  broadcastPerformanceUpdate(stats: any) {
    this.broadcast('performance-update', {
      stats,
      tabId: this.tabId
    });
  }

  getActiveTabsCount(): number {
    const now = Date.now();
    return Array.from(this.activeTabs.values())
      .filter(tab => tab.isActive && (now - tab.lastSeen < 30000))
      .length;
  }

  getTabId(): string {
    return this.tabId;
  }

  destroy() {
    this.channel.close();
    this.listeners.clear();
    this.activeTabs.clear();
  }
}

// Singleton instance
let syncInstance: MultiTabSync | null = null;

export function getMultiTabSync(): MultiTabSync {
  if (!syncInstance) {
    syncInstance = new MultiTabSync();
  }
  return syncInstance;
}

export function destroyMultiTabSync() {
  if (syncInstance) {
    syncInstance.destroy();
    syncInstance = null;
  }
}