import React, { useState } from 'react';
import { Project } from '../types';
import { Upload as UploadIcon, AlertCircle as AlertIcon, Loader2 as LoaderIcon } from 'lucide-react';

// Mapping Category IDs to Names
export const CAT_MAP: Record<string, string> = {
  "1": "<None>",
  "2": "Energy",
  "3": "Environment",
  "4": "Technology"
};

// Mapping Subcategory IDs to Names
export const SUBCAT_MAP: Record<string, string> = {
  "2": "Energy Market Forecasts and Analysis",
  "3": "Pricing, Financial, and Economic Evaluation",
  "4": "Project Feasibility Analysis",
  "5": "Power Generation and Transformation",
  "6": "Electricity Transmission and Distribution",
  "7": "Oil and Gas Refining and Retailing",
  "8": "Fuel Supply Options",
  "9": "Oil and Gas Processing and Pipeline Systems",
  "10": "Renewable and Alternative Energy Options",
  "11": "Energy Efficiency and Conservation",
  "12": "Policy and Regulatory Advice",
  "13": "Energy Studies and Program Design",
  "14": "Environmental Impact and Risk Assessment",
  "15": "Regulatory Compliance, Guidelines, and Due Diligence",
  "16": "Resource Management and Community Development",
  "17": "Environmental Management and Procedures",
  "18": "Environmental Monitoring and Audits",
  "19": "Health, Safety & Environmental Certification and Training",
  "20": "Pollution Control and Waste Minimization",
  "21": "Emission, Effluent, Air, and Water Analysis",
  "22": "Soil and Groundwater Contamination and Remediation",
  "23": "Environmental and Baseline Surveys",
  "24": "Climate Change and Atmospheric Phenomena",
  "25": "Policy, Strategy, and Program Development",
  "26": "IT Solutions and Software Development",
  "27": "Corporate Management, Governance and HRD Support",
  "28": "Technical Studies and Computer Simulations",
  "29": "Technology Marketing",
  "30": "Policy and Project Development",
  "31": "Spatial Information Applications",
  "32": "Transportation Systems"
};

// Utility to normalize strings for comparison
const normalize = (str: string) => str.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();

// Reverse lookup for canonical subcategories
const CANONICAL_SUBCAT_LOOKUP: Record<string, string> = Object.values(SUBCAT_MAP).reduce((acc, name) => {
  acc[normalize(name)] = name;
  return acc;
}, {} as Record<string, string>);

export const getCanonicalSubcategory = (input: string): string => {
  const norm = normalize(input);
  return CANONICAL_SUBCAT_LOOKUP[norm] || input.replace(/(^,+|,+$)/g, '').trim();
};

// Relationship map: Subcategory ID -> Category Name
export const SUBCAT_TO_CAT: Record<string, string> = {
  "2": "Energy", "3": "Energy", "4": "Energy", "5": "Energy", "6": "Energy", "7": "Energy", "8": "Energy", "9": "Energy", "10": "Energy", "11": "Energy", "12": "Energy", "13": "Energy",
  "14": "Environment", "15": "Environment", "16": "Environment", "17": "Environment", "18": "Environment", "19": "Environment", "20": "Environment", "21": "Environment", "22": "Environment", "23": "Environment", "24": "Environment", "25": "Environment",
  "26": "Technology", "27": "Technology", "28": "Technology", "29": "Technology", "30": "Technology", "31": "Technology", "32": "Technology"
};

interface CSVImporterProps {
  onDataImported: (data: Project[]) => void;
}

const CSVImporter: React.FC<CSVImporterProps> = ({ onDataImported }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFile = (file: File) => {
    setError(null);
    setLoading(true);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = (e.target?.result as string).replace(/^\uFEFF/, '');
        const lines = text.split(/\r?\n/).filter(line => line.trim());
        
        if (lines.length < 2) throw new Error('CSV is empty.');

        const parseLine = (line: string) => {
          const result = [];
          let current = '';
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              if (inQuotes && line[i+1] === '"') { current += '"'; i++; }
              else { inQuotes = !inQuotes; }
            } else if (char === ',' && !inQuotes) {
              result.push(current.trim());
              current = '';
            } else { current += char; }
          }
          result.push(current.trim());
          return result;
        };

        const rawHeaders = parseLine(lines[0]);
        const headers = rawHeaders.map(h => h.toLowerCase().trim().replace(/[^a-z0-9]/g, ''));
        
        const data = lines.slice(1).map((line, idx) => {
          const values = parseLine(line);
          const project: any = { 
            id: `p-${idx}-${Date.now()}`,
            code: '', name: '', description: '', client: '', clientType: '', year: '', categories: [], subcategories: []
          };

          const cats = new Set<string>();
          const subs = new Set<string>();

          headers.forEach((h, i) => {
            let val = (values[i] || '').trim();
            if (!val) return;

            if (h === 'projectcode') project.code = val;
            else if (h === 'projecttitle') project.name = val;
            else if (h === 'projectdate') project.year = val;
            else if (h === 'clientname') project.client = val;
            else if (h === 'clienttype') {
               const cleanVal = val.replace(/(^,+|,+$)/g, '').trim();
               if (cleanVal.length < 40) project.clientType = cleanVal;
            }
            else if (h === 'description') project.description = val;
            
            else if (h.startsWith('pcatid')) {
              const cleanId = val.replace(/[^0-9]/g, '');
              const mapped = cleanId ? (CAT_MAP[cleanId] || val) : val;
              const final = mapped.replace(/(^,+|,+$)/g, '').trim();
              if (final && final !== '<None>') cats.add(final);
            }
            else if (h.startsWith('psubcatid')) {
              const cleanId = val.replace(/[^0-9]/g, '');
              const mapped = cleanId ? (SUBCAT_MAP[cleanId] || val) : val;
              const final = getCanonicalSubcategory(mapped);
              if (final) subs.add(final);
            }
          });

          // --- FRAGMENT CLEANING LOGIC ---
          const name = project.name || "";
          
          // 1. Remove rows with raw CSV patterns or fragmented IDs (e.g. "Karachi,,,Private Sector...")
          if (name.includes(",,,") || name.startsWith(",") || name.match(/,\d+$/)) return null;

          // 2. Remove single-word or low-quality fragments (e.g. "therefore", "Grenoble", "Pennsylvania")
          const words = name.split(/\s+/);
          const isAllLowercase = name === name.toLowerCase() && name.length > 0;
          
          if (words.length <= 2 && (isAllLowercase || name.length < 15)) {
            // Likely a description fragment like "therefore" or a lone city name
            return null;
          }

          // 3. Remove rows that look like sentence continuations
          if (name.match(/^[a-z]/)) return null; 

          // 4. Final title check - titles must be substantial
          if (name.length < 12) return null;

          project.categories = Array.from(cats);
          project.subcategories = Array.from(subs);
          return project as Project;
        }).filter(p => p !== null);

        onDataImported(data as Project[]);
        setLoading(false);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div 
      className="relative border-2 border-dashed rounded-xl p-8 transition-all flex flex-col items-center justify-center text-center cursor-pointer border-slate-200 bg-white hover:border-hb-navy/40 shadow-sm"
      onClick={() => document.getElementById('csvInput')?.click()}
    >
      <input 
        type="file" 
        id="csvInput" 
        className="hidden" 
        accept=".csv" 
        onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])} 
      />
      
      {loading ? (
        <LoaderIcon className="w-10 h-10 text-hb-navy mb-3 animate-spin" />
      ) : (
        <UploadIcon className="w-10 h-10 mb-3 text-slate-300" />
      )}
      
      <div>
        <p className="text-[12px] font-bold text-hb-navy uppercase tracking-widest">
          {loading ? 'Processing...' : 'Upload Database CSV'}
        </p>
        <p className="text-[10px] text-slate-400 mt-1">Excel or Access exports</p>
      </div>
      
      {error && (
        <div className="mt-4 px-4 py-2 bg-red-50 text-red-600 text-[11px] font-bold rounded-lg border border-red-100 flex items-center gap-2">
          <AlertIcon className="w-4 h-4" /> {error}
        </div>
      )}
    </div>
  );
};

export default CSVImporter;