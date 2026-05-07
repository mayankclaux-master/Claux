CREATE OR REPLACE FUNCTION get_current_role()
RETURNS text
LANGUAGE sql
AS $$
  SELECT current_user;
$$;
