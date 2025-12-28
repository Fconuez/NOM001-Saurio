
export interface Project {
  id: string;
  name: string;
  client: string;
  location: string;
  status: 'In Progress' | 'Approved' | 'Review';
  voltage: string;
  temp: number;
  lastModified: number;
}

export interface ConductorData {
  awg: string;
  area_mm2: number;
  resistance_copper: number; // Ohm/km at 75C
  reactance_steel: number; // Ohm/km
  ampacity_75c: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  isThinking?: boolean;
}
