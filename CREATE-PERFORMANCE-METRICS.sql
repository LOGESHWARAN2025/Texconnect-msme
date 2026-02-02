
CREATE TABLE IF NOT EXISTS performance_metrics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    metric_type TEXT CHECK (metric_type IN ('network', 'web_app', 'mobile_app')),
    value NUMERIC NOT NULL,
    unit TEXT,
    context JSONB, -- stores extra details like route, device info
    status TEXT CHECK (status IN ('good', 'warning', 'critical')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster querying by time and type
CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp ON performance_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_type ON performance_metrics(metric_type);
