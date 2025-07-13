
-- Create a helper function to insert order line items
CREATE OR REPLACE FUNCTION insert_order_line_items(items jsonb)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    item jsonb;
BEGIN
    FOR item IN SELECT * FROM jsonb_array_elements(items)
    LOOP
        INSERT INTO public.order_line_items (
            order_id,
            child_id,
            child_name,
            child_class,
            menu_item_id,
            quantity,
            unit_price,
            total_price,
            delivery_date,
            order_date,
            notes
        ) VALUES (
            (item->>'order_id')::uuid,
            (item->>'child_id')::uuid,
            item->>'child_name',
            item->>'child_class',
            (item->>'menu_item_id')::uuid,
            (item->>'quantity')::integer,
            (item->>'unit_price')::numeric,
            (item->>'total_price')::numeric,
            (item->>'delivery_date')::date,
            (item->>'order_date')::date,
            item->>'notes'
        );
    END LOOP;
END;
$$;
