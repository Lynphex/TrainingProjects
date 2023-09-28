CREATE OR REPLACE TABLE keepcoding.ivr_summary AS
WITH CallData AS (
  SELECT
    calls_ivr_id AS ivr_id,
    calls_phone_number AS phone_number,
    calls_ivr_result AS ivr_result,
    CASE
      WHEN calls_vdn_label LIKE 'ATC%' THEN 'FRONT'
      WHEN calls_vdn_label LIKE 'TECH%' THEN 'TECH'
      WHEN calls_vdn_label = 'ABSORPTION' THEN 'ABSORPTION'
      ELSE 'RESTO'
    END AS vdn_aggregation,
    calls_start_date AS start_date,
    calls_end_date AS end_date,
    TIMESTAMP_DIFF(calls_end_date, calls_start_date, SECOND) AS total_duration,
    calls_customer_segment AS customer_segment,
    calls_ivr_language AS ivr_language,
    MAX(calls_steps_module) AS steps_module,
    STRING_AGG(DISTINCT module_name, ', ') AS module_aggregation,
    MAX(document_type) AS document_type,
    MAX(document_identification) AS document_identification,
    MAX(customer_phone) AS customer_phone,
    MAX(billing_account_id) AS billing_account_id,
    MAX(CASE WHEN module_name = 'AVERIA_MASIVA' THEN 1 ELSE 0 END) AS masiva_lg,
    MAX(CASE WHEN step_name = 'CUSTOMERINFOBYPHONE.TX' AND step_description_error IS NULL THEN 1 ELSE 0 END) AS info_by_phone_lg,
    MAX(CASE WHEN step_name = 'CUSTOMERINFOBYDNI.TX' AND step_description_error IS NULL THEN 1 ELSE 0 END) AS info_by_dni_lg
  FROM
    keepcoding.ivr_detail
  GROUP BY
    ivr_id,
    phone_number,
    ivr_result,
    vdn_aggregation,
    start_date,
    end_date,
    customer_segment,
    ivr_language
),
RepeatedPhoneData AS (
  SELECT
    calls_ivr_id,
    calls_phone_number,
    LAG(calls_end_date) OVER(PARTITION BY calls_phone_number ORDER BY calls_start_date) AS prev_end_date
  FROM
    keepcoding.ivr_detail
),
CauseRecallData AS (
  SELECT
    calls_ivr_id,
    calls_phone_number,
    LEAD(calls_start_date) OVER(PARTITION BY calls_phone_number ORDER BY calls_start_date) AS next_start_date
  FROM
    keepcoding.ivr_detail
)
SELECT
  C.*,
  MAX(CASE WHEN TIMESTAMP_DIFF(C.start_date, R.prev_end_date, HOUR) <= 24 THEN 1 ELSE 0 END) AS repeated_phone_24H,
  MAX(CASE WHEN TIMESTAMP_DIFF(CR.next_start_date, C.end_date, HOUR) <= 24 THEN 1 ELSE 0 END) AS cause_recall_phone_24H
FROM
  CallData C
LEFT JOIN
  RepeatedPhoneData R
ON
  C.ivr_id = R.calls_ivr_id
  AND C.phone_number = R.calls_phone_number
LEFT JOIN
  CauseRecallData CR
ON
  C.ivr_id = CR.calls_ivr_id
  AND C.phone_number = CR.calls_phone_number
GROUP BY
  C.ivr_id,
  C.phone_number,
  C.ivr_result,
  C.vdn_aggregation,
  C.start_date,
  C.end_date,
  C.total_duration,
  C.customer_segment,
  C.ivr_language,
  C.steps_module,
  C.module_aggregation,
  C.document_type,
  C.document_identification,
  C.customer_phone,
  C.billing_account_id,
  C.masiva_lg,
  C.info_by_phone_lg,
  C.info_by_dni_lg;


