
-- First, let's check what roles are currently allowed and fix the constraint
DROP CONSTRAINT IF EXISTS profiles_role_check ON public.profiles;

-- Add the correct constraint that allows all the roles we need
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('parent', 'admin', 'cashier'));

-- Update any invalid role values to 'parent' as default
UPDATE public.profiles 
SET role = 'parent' 
WHERE role IS NULL OR role NOT IN ('parent', 'admin', 'cashier');

-- Also fix the user_roles table constraint to match
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
ALTER TABLE public.user_roles 
ADD CONSTRAINT user_roles_role_check 
CHECK (role IN ('admin', 'parent', 'cashier'));

-- Update any invalid role values in user_roles
UPDATE public.user_roles 
SET role = 'parent' 
WHERE role NOT IN ('admin', 'parent', 'cashier');

-- Make sure the handle_new_user function creates valid data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, address, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(new.raw_user_meta_data ->> 'phone', ''),
    COALESCE(new.raw_user_meta_data ->> 'address', ''),
    'parent'  -- Always set to 'parent' as default
  );
  
  -- Also insert into user_roles table
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    new.id,
    'parent'  -- Always set to 'parent' as default
  );
  
  RETURN new;
END;
$$;
