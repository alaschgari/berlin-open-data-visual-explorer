-- Create a function to get business counts per LOR with a search query
CREATE OR REPLACE FUNCTION get_business_counts(search_query text, district_filter text DEFAULT NULL)
RETURNS TABLE (lor_id text, count bigint) AS $$
BEGIN
    RETURN QUERY
    SELECT b.lor_id, COUNT(*) as count
    FROM businesses b
    WHERE b.branch ILIKE '%' || search_query || '%'
      AND (district_filter IS NULL OR b.lor_id LIKE district_filter || '%')
    GROUP BY b.lor_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
