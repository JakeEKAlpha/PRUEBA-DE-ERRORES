import type { ServiceRecord } from '../types/index.ts';
import { PRELOADED_SERVICES_PART_1 } from './preloadedServicesBatch1.ts';
import { PRELOADED_SERVICES_PART_2 } from './preloadedServicesBatch2.ts';

export const INITIAL_PRELOADED_SERVICES: ServiceRecord[] = [
  ...PRELOADED_SERVICES_PART_1,
  ...PRELOADED_SERVICES_PART_2,
];
