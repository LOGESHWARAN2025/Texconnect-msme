-- Add printedUnits column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS printedUnits INTEGER DEFAULT 0;

-- Update existing orders to have printedUnits match totalUnits if they have one
UPDATE orders SET printedUnits = totalUnits WHERE totalUnits > 0 AND printedUnits = 0;
