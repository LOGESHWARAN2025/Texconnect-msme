
import { PerformanceMetric } from '../types';

export class PerformanceMonitor {
    private static STORAGE_KEY = 'texconnect_perf_metrics';
    private static ALERT_THRESHOLD_LOAD_TIME = 3000; // 3 seconds
    private static ALERT_THRESHOLD_NETWORK_LATENCY = 1000; // 1 second

    static logMetric(
        metricType: 'network' | 'web_app' | 'mobile_app',
        value: number,
        unit: string,
        context?: any
    ) {
        const status = this.determineStatus(metricType, value);

        const metric: PerformanceMetric = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            metricType,
            value,
            unit,
            context,
            status
        };

        this.saveMetric(metric);
        this.checkAndAlert(metric);
    }

    private static determineStatus(type: string, value: number): 'good' | 'warning' | 'critical' {
        if (type === 'web_app' || type === 'mobile_app') {
            if (value < 1000) return 'good';
            if (value < 3000) return 'warning';
            return 'critical';
        }
        if (type === 'network') {
            if (value < 200) return 'good';
            if (value < 1000) return 'warning';
            return 'critical';
        }
        return 'good';
    }

    private static saveMetric(metric: PerformanceMetric) {
        try {
            const existing = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
            // Keep last 100 metrics
            const updated = [metric, ...existing].slice(0, 100);
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));

            // In a real app, this would also push to Supabase/Backend
            // supabase.from('performance_metrics').insert(metric)
        } catch (e) {
            console.error('Failed to save metric', e);
        }
    }

    static getMetrics(): PerformanceMetric[] {
        try {
            return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
        } catch {
            return [];
        }
    }

    static checkAndAlert(metric: PerformanceMetric) {
        if (metric.status === 'critical') {
            this.sendAlert(metric);
        }
    }

    private static sendAlert(metric: PerformanceMetric) {
        const message = `CRITICAL ALERT: ${metric.metricType} performance is low! Value: ${metric.value}${metric.unit}. Context: ${JSON.stringify(metric.context)}`;
        console.error(message);

        // Simulate SMS/WhatsApp Alert
        // In production, call an API endpoint here
        this.mockSendSMS(message);
        this.mockSendWhatsApp(message);
    }

    private static mockSendSMS(message: string) {
        console.log(`[SMS SENT to Admin]: ${message}`);
        // api.post('/send-sms', { to: adminNumber, body: message })
    }

    private static mockSendWhatsApp(message: string) {
        console.log(`[WHATSAPP SENT to Admin]: ${message}`);
        // api.post('/send-whatsapp', { to: adminNumber, body: message })
    }
}

// React Hook for auto-monitoring
import { useEffect } from 'react';

export const usePerformanceMonitoring = (componentName: string) => {
    useEffect(() => {
        const start = performance.now();

        return () => {
            const end = performance.now();
            const duration = Math.round(end - start);
            PerformanceMonitor.logMetric('web_app', duration, 'ms', { component: componentName });
        };
    }, [componentName]);
};
