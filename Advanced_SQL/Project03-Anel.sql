CREATE OR REPLACE FUNCTION keepcoding.clean_integer(input_int INT64) AS (
  CASE
    WHEN input_int IS NULL THEN -999999
    ELSE input_int
  END
);