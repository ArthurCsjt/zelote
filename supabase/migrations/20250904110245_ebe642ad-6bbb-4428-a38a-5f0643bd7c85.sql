-- Update profiles to change super_admin to admin
UPDATE public.profiles 
SET role = 'admin' 
WHERE role = 'super_admin';