CREATE OR REPLACE TABLE keepcoding.ivr_detail AS
SELECT
  calls.ivr_id AS calls_ivr_id,
  calls.phone_number AS calls_phone_number,
  calls.ivr_result AS calls_ivr_result,
  calls.vdn_label AS calls_vdn_label,
  calls.start_date AS calls_start_date,
  FORMAT_TIMESTAMP('%Y%m%d', calls.start_date) AS calls_start_date_id,
  calls.end_date AS calls_end_date,
  FORMAT_TIMESTAMP('%Y%m%d', calls.end_date) AS calls_end_date_id,
  calls.total_duration AS calls_total_duration,
  calls.customer_segment AS calls_customer_segment,
  calls.ivr_language AS calls_ivr_language,
  calls.steps_module AS calls_steps_module,
  calls.module_aggregation AS calls_module_aggregation,
  module.module_sequece AS module_sequece,
  module.module_name AS module_name,
  module.module_duration AS module_duration,
  module.module_result AS module_result,
  steps.step_sequence AS step_sequence,
  steps.step_name AS step_name,
  steps.step_result AS step_result,
  steps.step_description_error AS step_description_error,
  steps.document_type AS document_type,
  steps.document_identification AS document_identification,
  steps.customer_phone AS customer_phone,
  steps.billing_account_id  AS billing_account_id
FROM
  keepcoding.ivr_calls calls
JOIN
  keepcoding.ivr_modules module
ON
  calls.ivr_id = module.ivr_id
JOIN
  keepcoding.ivr_steps steps
ON
  module.ivr_id = steps.ivr_id
  AND module.module_sequece = steps.module_sequece;


WITH DeduplicatedTable AS (
  SELECT
    *,
    ROW_NUMBER() OVER (ORDER BY calls_ivr_id) AS row_num
  FROM
    keepcoding.ivr_detail
)
SELECT
  * EXCEPT (row_num)
FROM
  DeduplicatedTable
WHERE
  row_num = 1;