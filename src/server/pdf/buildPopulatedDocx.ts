import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import type { ServiceRecord, VisitRecord } from '../../types/index.ts';
import { buildServiceOrderMarkers } from '../../domain/index.ts';

/**
 * Populates the official .docx Word template with the 16 TemplateMarkerService markers.
 * Shared single source of truth for both ?format=docx and ?format=pdf flows.
 */
export function buildPopulatedDocx(
  templateBuffer: Buffer,
  service: ServiceRecord,
  visit?: VisitRecord
): Buffer {
  const zip = new PizZip(templateBuffer);
  const doc = new Docxtemplater(zip, {
    delimiters: { start: '{{', end: '}}' },
    paragraphLoop: true,
    linebreaks: true,
  });

  const markers = buildServiceOrderMarkers(service, visit);
  doc.render(markers);
  return doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });
}
