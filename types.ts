
export interface Project {
  id: string | number;
  code?: string;
  name: string;
  description: string;
  categories: string[];
  subcategories: string[];
  year?: string;
  client?: string;
  clientType?: string;
  [key: string]: any;
}

export interface FilterState {
  search: string;
  categories: string[];
  subcategories: string[];
  yearRange?: [number, number];
}

export interface DataInsight {
  summary: string;
  suggestions: string[];
}
