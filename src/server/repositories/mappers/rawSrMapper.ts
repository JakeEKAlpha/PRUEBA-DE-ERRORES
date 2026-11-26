import { rawSr } from '../../../db/schema.ts';
import { readRawString } from './rawWoMapper.ts';

export function buildRawSrInsertValues(
  serviceId: string,
  columns: Record<string, unknown>,
  ingestedAt: Date
): typeof rawSr.$inferInsert {
  return {
    requestNumber: serviceId,
    serviceRequestId: readRawString(columns, 'Service Request ID', 'service_request_id'),
    activityId: readRawString(columns, 'Activity ID', 'activity_id'),
    openedDateTime: readRawString(columns, 'Opened Date / Time', 'opened_date_time'),
    requestStatus: readRawString(columns, 'Request Status', 'request_status'),
    customerName: readRawString(columns, 'Customer Name', 'customer_name'),
    customerAccount: readRawString(columns, 'Customer Account', 'customer_account'),
    customerAddress: readRawString(columns, 'Customer Address', 'customer_address'),
    city: readRawString(columns, 'City', 'city'),
    stateProvince: readRawString(columns, 'State-Province', 'state_province'),
    country: readRawString(columns, 'Country', 'country'),
    postalCode: readRawString(columns, 'Postal Code', 'postal_code'),
    primaryContact: readRawString(columns, 'Primary Contact', 'primary_contact'),
    primaryContactPhone: readRawString(columns, 'Primary Contact Phone', 'primary_contact_phone'),
    primaryContactAlternatePhone: readRawString(
      columns,
      'Primary Contact Alternate Phone',
      'primary_contact_alternate_phone'
    ),
    primaryContactEmail: readRawString(columns, 'Primary Contact Email', 'primary_contact_email'),
    secondaryContact: readRawString(columns, 'Secondary Contact', 'secondary_contact'),
    secondaryContactPhone: readRawString(
      columns,
      'Secondary Contact Phone',
      'secondary_contact_phone'
    ),
    secondaryContactAlternatePhone: readRawString(
      columns,
      'Secondary Contact Alternate Phone',
      'secondary_contact_alternate_phone'
    ),
    secondaryContactEmail: readRawString(
      columns,
      'Secondary Contact Email',
      'secondary_contact_email'
    ),
    product: readRawString(columns, 'Product', 'product'),
    serialNumber: readRawString(columns, 'Serial Number', 'serial_number'),
    mtm: readRawString(columns, 'Machine Type Model', 'mtm'),
    productPnTli: readRawString(columns, 'Product PN/TLI', 'product_pn_tli'),
    problemCode: readRawString(columns, 'Problem Code', 'problem_code'),
    accountSpecialHandling: readRawString(
      columns,
      'Account Special Handling',
      'account_special_handling'
    ),
    productAndAssetWarningMessage: readRawString(
      columns,
      'Product and Asset Warning Message',
      'product_and_asset_warning_message'
    ),
    respondWithin: readRawString(columns, 'Respond Within', 'respond_within'),
    customerRequestedResponse: readRawString(
      columns,
      'Customer Requested Response',
      'customer_requested_response'
    ),
    mustResolveWithin: readRawString(columns, 'Must Resolve Within', 'must_resolve_within'),
    mustResolveBy: readRawString(columns, 'Must Resolve By', 'must_resolve_by'),
    serviceActivityWithin30Days: readRawString(
      columns,
      'Service Activity within 30 Days',
      'service_activity_within_30_days'
    ),
    orderedPartsOrderDate: readRawString(
      columns,
      'Ordered Parts - Order Date',
      'ordered_parts_order_date'
    ),
    orderedPartsQty: readRawString(columns, 'Ordered Parts - Qty', 'ordered_parts_qty'),
    orderedPartsPartNumber: readRawString(
      columns,
      'Ordered Parts - Part Number',
      'ordered_parts_part_number'
    ),
    orderedPartsPartName: readRawString(
      columns,
      'Ordered Parts - Part Name',
      'ordered_parts_part_name'
    ),
    orderedPartsStatus: readRawString(columns, 'Ordered Parts - Status', 'ordered_parts_status'),
    orderedPartsShipDate: readRawString(
      columns,
      'Ordered Parts - Ship Date',
      'ordered_parts_ship_date'
    ),
    orderedPartsTrackingNumber: readRawString(
      columns,
      'Ordered Parts - Tracking Number',
      'ordered_parts_tracking_number'
    ),
    recommendedPartsPartNumber: readRawString(
      columns,
      'Recommended Parts - Part Number',
      'recommended_parts_part_number'
    ),
    recommendedPartsPartName: readRawString(
      columns,
      'Recommended Parts - Part Name',
      'recommended_parts_part_name'
    ),
    payload: columns,
    ingestedAt,
  };
}
