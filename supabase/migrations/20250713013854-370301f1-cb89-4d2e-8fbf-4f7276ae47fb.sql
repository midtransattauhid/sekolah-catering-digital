
-- Create order_line_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.order_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  child_id UUID NULL,
  child_name TEXT NOT NULL,
  child_class TEXT NULL,
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NULL,
  delivery_date DATE NOT NULL,
  order_date DATE NOT NULL,
  notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add missing columns to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS snap_token TEXT NULL,
ADD COLUMN IF NOT EXISTS parent_notes TEXT NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_order_line_items_order_id ON public.order_line_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_line_items_menu_item_id ON public.order_line_items(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_order_line_items_child_id ON public.order_line_items(child_id);
CREATE INDEX IF NOT EXISTS idx_order_line_items_delivery_date ON public.order_line_items(delivery_date);

-- Enable Row Level Security
ALTER TABLE public.order_line_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for order_line_items
CREATE POLICY "Users can view their own order line items" ON public.order_line_items
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_line_items.order_id 
    AND orders.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create order line items for their orders" ON public.order_line_items
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_line_items.order_id 
    AND orders.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own order line items" ON public.order_line_items
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_line_items.order_id 
    AND orders.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own order line items" ON public.order_line_items
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_line_items.order_id 
    AND orders.user_id = auth.uid()
  )
);

-- Admin policies for order_line_items
CREATE POLICY "Admins can view all order line items" ON public.order_line_items
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can manage all order line items" ON public.order_line_items
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);
