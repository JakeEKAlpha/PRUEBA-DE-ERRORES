/**
 * TemplateMarkerService
 * SOLID - Single Responsibility: Facade delegating to pure domain marker builder (16 official markers).
 */
import type { ServiceRecord, VisitRecord } from '../../types/index.ts';
import {
  buildServiceOrderMarkers,
  fillRawTemplateText,
  formatTemplateDate,
  type TemplateMarkersDictionary,
} from '../../domain/templateMarkers.ts';

export type { TemplateMarkersDictionary };

export class TemplateMarkerService {
  /**
   * Formats a date string (YYYY-MM-DD or ISO) into DD/MM/YYYY without UTC shift.
   */
  public static formatDate(dateStr?: string): string {
    return formatTemplateDate(dateStr);
  }

  /**
   * Builds the exact 16 markers dictionary for docxtemplater, preview modal, and PDF output.
   */
  public static buildMarkers(
    service: ServiceRecord,
    visit?: VisitRecord
  ): TemplateMarkersDictionary {
    return buildServiceOrderMarkers(service, visit);
  }

  /**
   * Renders the plain-text raw template with all 16 official markers substituted.
   */
  public static fillRawTemplateText(
    service: ServiceRecord,
    visit?: VisitRecord
  ): string {
    return fillRawTemplateText(service, visit);
  }
}
