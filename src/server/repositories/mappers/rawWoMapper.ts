import { rawWo } from '../../../db/schema.ts';

export function readRawString(
  columns: Record<string, unknown>,
  ...keys: string[]
): string | null {
  for (const key of keys) {
    const val = columns[key];
    if (typeof val === 'string' && val.trim() !== '') {
      return val;
    }
    if (typeof val === 'number' && Number.isFinite(val)) {
      return String(val);
    }
  }
  return null;
}

export function buildRawWoInsertValues(
  serviceId: string,
  columns: Record<string, unknown>,
  ingestedAt: Date
): typeof rawWo.$inferInsert {
  return {
    company: readRawString(columns, 'Company', 'company'),
    portalUser: readRawString(columns, 'Portal User', 'portal_user'),
    workOrderNumber: serviceId,
    workOrderType: readRawString(columns, 'Work Order Type', 'work_order_type'),
    subStatus: readRawString(columns, 'Sub-Status', 'sub_status'),
    serialNumber: readRawString(columns, 'Serial Number', 'serial_number'),
    primaryIncidentType: readRawString(columns, 'Primary Incident Type', 'primary_incident_type'),
    woCommunicationStatus: readRawString(
      columns,
      'Work Order Communication Status',
      'wo_communication_status'
    ),
    product: readRawString(columns, 'Product', 'product'),
    productNumber: readRawString(columns, 'Product Number', 'product_number'),
    mtm: readRawString(columns, 'Machine Type Model (MTM)', 'mtm'),
    createdOn: readRawString(columns, 'Created On', 'created_on'),
    partnerReference: readRawString(columns, 'Partner Reference #', 'partner_reference'),
    customerReference: readRawString(columns, 'Customer Reference', 'customer_reference'),
    customerRequestedStartTime: readRawString(
      columns,
      'Customer Requested Start Time',
      'customer_requested_start_time'
    ),
    customerCommittedResponseDate: readRawString(
      columns,
      'Customer Committed Response Date',
      'customer_committed_response_date'
    ),
    customerCommittedCompletionDate: readRawString(
      columns,
      'Customer Committed Completion Date',
      'customer_committed_completion_date'
    ),
    startTime: readRawString(columns, 'Start Time', 'start_time'),
    customerCommitTimeZone: readRawString(
      columns,
      'Customer Commit Time Zone',
      'customer_commit_time_zone'
    ),
    assignedResource: readRawString(columns, 'Assigned Resource', 'assigned_resource'),
    externalSpecialHandlingInstructions: readRawString(
      columns,
      'External Special Handling Instructions',
      'external_special_handling_instructions'
    ),
    coveredServiceType: readRawString(columns, 'Covered Service Type', 'covered_service_type'),
    workOrderSummary: readRawString(columns, 'Work Order Summary', 'work_order_summary'),
    customerReportedProblemCode: readRawString(
      columns,
      'Customer Reported Problem Code',
      'customer_reported_problem_code'
    ),
    problemDescription: readRawString(columns, 'Problem Description', 'problem_description'),
    customerTicketNumber: readRawString(
      columns,
      'Customer Ticket/Reference Number',
      'customer_ticket_number'
    ),
    serviceAccount: readRawString(columns, 'Service Account', 'service_account'),
    onsiteContact: readRawString(columns, 'Onsite Contact', 'onsite_contact'),
    onsiteContactPhone: readRawString(columns, 'Onsite Contact Phone #', 'onsite_contact_phone'),
    resolveWithin: readRawString(columns, 'Resolve Within', 'resolve_within'),
    street1: readRawString(columns, 'Street 1', 'street_1'),
    street2: readRawString(columns, 'Street 2', 'street_2'),
    city: readRawString(columns, 'City', 'city'),
    stateProvince: readRawString(columns, 'State-Province', 'state_province'),
    country: readRawString(columns, 'Country', 'country'),
    postalCode: readRawString(columns, 'Postal Code', 'postal_code'),
    floor: readRawString(columns, 'Floor', 'floor'),
    room: readRawString(columns, 'Room', 'room'),
    building: readRawString(columns, 'Building', 'building'),
    payload: columns,
    ingestedAt,
  };
}
