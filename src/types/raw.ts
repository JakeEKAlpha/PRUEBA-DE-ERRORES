/**
 * 39 Raw Columns contract for Work Orders (table: raw_wo)
 */
export interface RawWoRecord {
  id_raw_wo?: number;
  company?: string;
  portal_user?: string;
  work_order_number: string; // Col 3 (8 digits) PK / link to id_servicio
  work_order_type?: string;
  sub_status?: string;
  serial_number?: string;
  primary_incident_type?: string;
  wo_communication_status?: string;
  product?: string;
  product_number?: string;
  mtm?: string;
  created_on?: string;
  partner_reference?: string;
  customer_reference?: string;
  customer_requested_start_time?: string;
  customer_committed_response_date?: string;
  customer_committed_completion_date?: string;
  start_time?: string;
  customer_commit_time_zone?: string;
  assigned_resource?: string;
  external_special_handling_instructions?: string;
  covered_service_type?: string;
  work_order_summary?: string;
  customer_reported_problem_code?: string;
  problem_description?: string;
  customer_ticket_number?: string;
  service_account?: string;
  onsite_contact?: string;
  onsite_contact_phone?: string;
  resolve_within?: string;
  street_1?: string;
  street_2?: string;
  city?: string;
  state_province?: string;
  country?: string;
  postal_code?: string;
  floor?: string;
  room?: string;
  building?: string;
  [key: string]: unknown;
}

/**
 * 41 Raw Columns contract for Proactive Services (table: raw_sr)
 */
export interface RawSrRecord {
  id_raw_sr?: number;
  request_number: string; // Col 1 (1-XXXXXXXXXXXX) PK / link to id_servicio
  service_request_id?: string;
  activity_id?: string;
  opened_date_time?: string;
  request_status?: string;
  customer_name?: string;
  customer_account?: string;
  customer_address?: string;
  city?: string;
  state_province?: string;
  country?: string;
  postal_code?: string;
  primary_contact?: string;
  primary_contact_phone?: string;
  primary_contact_alternate_phone?: string;
  primary_contact_email?: string;
  secondary_contact?: string;
  secondary_contact_phone?: string;
  secondary_contact_alternate_phone?: string;
  secondary_contact_email?: string;
  product?: string;
  serial_number?: string;
  mtm?: string;
  product_pn_tli?: string;
  problem_code?: string;
  account_special_handling?: string;
  product_and_asset_warning_message?: string;
  respond_within?: string;
  customer_requested_response?: string;
  must_resolve_within?: string;
  must_resolve_by?: string;
  service_activity_within_30_days?: string;
  ordered_parts_order_date?: string;
  ordered_parts_qty?: number | string;
  ordered_parts_part_number?: string;
  ordered_parts_part_name?: string;
  ordered_parts_status?: string;
  ordered_parts_ship_date?: string;
  ordered_parts_tracking_number?: string;
  recommended_parts_part_number?: string;
  recommended_parts_part_name?: string;
  [key: string]: unknown;
}
