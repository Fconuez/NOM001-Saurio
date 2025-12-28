
import React from 'react';
import { ConductorData } from './types';

// Simplified Table 8, Chapter 10 NOM-001-SEDE-2012
export const TABLE_8_CONDUCTORS: ConductorData[] = [
  { awg: '14', area_mm2: 2.08, resistance_copper: 10.1, reactance_steel: 0.190, ampacity_75c: 20 },
  { awg: '12', area_mm2: 3.31, resistance_copper: 6.33, reactance_steel: 0.177, ampacity_75c: 25 },
  { awg: '10', area_mm2: 5.26, resistance_copper: 3.99, reactance_steel: 0.164, ampacity_75c: 35 },
  { awg: '8', area_mm2: 8.37, resistance_copper: 2.52, reactance_steel: 0.171, ampacity_75c: 50 },
  { awg: '6', area_mm2: 13.3, resistance_copper: 1.61, reactance_steel: 0.167, ampacity_75c: 65 },
  { awg: '4', area_mm2: 21.2, resistance_copper: 1.02, reactance_steel: 0.157, ampacity_75c: 85 },
  { awg: '2', area_mm2: 33.6, resistance_copper: 0.640, reactance_steel: 0.148, ampacity_75c: 115 },
  { awg: '1/0', area_mm2: 53.5, resistance_copper: 0.407, reactance_steel: 0.144, ampacity_75c: 150 },
  { awg: '2/0', area_mm2: 67.4, resistance_copper: 0.322, reactance_steel: 0.141, ampacity_75c: 175 },
  { awg: '3/0', area_mm2: 85.0, resistance_copper: 0.256, reactance_steel: 0.138, ampacity_75c: 200 },
  { awg: '4/0', area_mm2: 107, resistance_copper: 0.203, reactance_steel: 0.135, ampacity_75c: 230 },
];

export const NAV_ITEMS = [
  { label: 'Dashboard', path: '/', icon: 'dashboard' },
  { label: 'Proyectos', path: '/config', icon: 'folder_open' },
  { label: 'Caída de Tensión', path: '/voltage-drop', icon: 'bolt' },
  { label: 'Tubería', path: '/conduit', icon: 'straighten' },
  { label: 'Ampacidad', path: '/conductor', icon: 'table_view' },
  { label: 'Protecciones', path: '/protection', icon: 'shield' },
  { label: 'Motores', path: '/motor', icon: 'settings' },
  { label: 'Transformadores', path: '/transformer', icon: 'electrical_services' },
  { label: 'Cédula de Cargas', path: '/schedule', icon: 'view_list' },
];
