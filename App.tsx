import React, { useState, useMemo } from 'react';
import ProjectFilters from './components/ProjectFilters';
import ProjectTable from './components/ProjectTable';
import CSVImporter, { SUBCAT_TO_CAT, SUBCAT_MAP, getCanonicalSubcategory } from './components/CSVImporter';
import { Project, FilterState } from './types';
import { Download, ShieldCheck, Database } from 'lucide-react';

const STORAGE_KEY = 'hb_pakistan_projects_final_v10';

export type SortConfig = {
  key: 'name' | 'year' | 'client';
  direction: 'asc' | 'desc';
} | null;

const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) { console.error("Cache load error:", e); }
    }
    return [];
  });

  const [filter, setFilter] = useState<FilterState>({
    search: '',
    categories: [],
    subcategories: [],
    yearRange: undefined
  });

  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'year', direction: 'desc' });

  const handleDataImported = (data: Project[]) => {
    const seen = new Set();
    const uniqueData = data.filter(item => {
      const identifier = (item.code || `${item.name}-${item.client}`).toLowerCase().trim();
      if (!identifier || seen.has(identifier)) return false;
      seen.add(identifier);
      return true;
    });
    
    setProjects(uniqueData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(uniqueData));
  };

  const handleExport = () => {
    const json = JSON.stringify(projects, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hagler_bailly_archive.json';
    a.click();
  };

  const yearStats = useMemo(() => {
    const years = projects
      .map(p => {
        const matches = String(p.year || '').match(/\d{4}/);
        return matches ? parseInt(matches[0]) : NaN;
      })
      .filter(y => !isNaN(y) && y > 1950 && y < 2100);
    
    if (years.length === 0) return { min: 1980, max: 2030 };
    return { min: Math.min(...years), max: Math.max(...years) };
  }, [projects]);

  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    projects.forEach(p => {
      p.categories.forEach(c => c && cats.add(c.trim()));
    });
    return Array.from(cats).sort();
  }, [projects]);

  const allClientTypes = useMemo(() => {
    const types = new Set<string>();
    projects.forEach(p => {
      if (p.clientType) types.add(p.clientType.trim());
    });
    return Array.from(types).sort();
  }, [projects]);

  const availableSubcategories = useMemo(() => {
    const subs = new Set<string>();
    const subNameToIdMap: Record<string, string> = {};
    Object.entries(SUBCAT_MAP).forEach(([id, name]) => {
      subNameToIdMap[getCanonicalSubcategory(name)] = id;
    });

    if (filter.categories.length === 0) {
      projects.forEach(p => {
        p.subcategories.forEach(s => s && subs.add(getCanonicalSubcategory(s)));
      });
    } else {
      projects.forEach(p => {
        p.subcategories.forEach(s => {
          const canonicalName = getCanonicalSubcategory(s);
          const subId = subNameToIdMap[canonicalName];
          const parentCat = SUBCAT_TO_CAT[subId];
          if (filter.categories.includes(parentCat)) {
            subs.add(canonicalName);
          }
        });
      });
    }
    return Array.from(subs).sort();
  }, [projects, filter.categories]);

  const filteredProjects = useMemo(() => {
    let result = projects.filter(p => {
      const s = filter.search.toLowerCase();
      const searchMatch = !filter.search || 
        (p.name?.toLowerCase().includes(s)) || 
        (p.client?.toLowerCase().includes(s)) ||
        (p.clientType?.toLowerCase().includes(s)) ||
        (p.description?.toLowerCase().includes(s));
      
      const catMatch = filter.categories.length === 0 || 
        (p.categories && p.categories.some(c => filter.categories.includes(c)));
      
      const subMatch = filter.subcategories.length === 0 || 
        (p.subcategories && p.subcategories.some(s => filter.subcategories.includes(getCanonicalSubcategory(s))));

      let yearMatch = true;
      if (filter.yearRange) {
        const matches = String(p.year || '').match(/\d{4}/);
        const pYear = matches ? parseInt(matches[0]) : NaN;
        if (!isNaN(pYear)) yearMatch = pYear >= filter.yearRange[0] && pYear <= filter.yearRange[1];
      }

      return searchMatch && catMatch && subMatch && yearMatch;
    });

    if (sortConfig) {
      result = [...result].sort((a, b) => {
        let valA: any = '';
        let valB: any = '';

        if (sortConfig.key === 'year') {
          const matchA = String(a.year || '').match(/\d{4}/);
          const matchB = String(b.year || '').match(/\d{4}/);
          valA = matchA ? parseInt(matchA[0]) : 0;
          valB = matchB ? parseInt(matchB[0]) : 0;
        } else if (sortConfig.key === 'name') {
          valA = (a.name || '').toLowerCase();
          valB = (b.name || '').toLowerCase();
        } else if (sortConfig.key === 'client') {
          valA = (a.client || '').toLowerCase();
          valB = (b.client || '').toLowerCase();
        }

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [projects, filter, sortConfig]);

  const handleClientClick = (client: string) => {
    setFilter(prev => ({ ...prev, search: client }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClientTypeClick = (type: string) => {
    setFilter(prev => ({ ...prev, search: type }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCategoryClick = (cat: string) => {
    setFilter(prev => ({ ...prev, categories: [cat], subcategories: [] }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubcategoryClick = (sub: string) => {
    setFilter(prev => ({ ...prev, subcategories: [getCanonicalSubcategory(sub)] }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSort = (key: 'name' | 'year' | 'client') => {
    setSortConfig(prev => {
      if (prev?.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'desc' };
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#fcfcfd]">
      <main className="flex-1 max-w-[1400px] mx-auto px-6 py-12 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          
          <aside className="lg:col-span-1 space-y-10">
            <section>
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-hb-navy mb-4 flex items-center gap-2 opacity-70">
                <Database className="w-3.5 h-3.5" /> Data Import
              </h3>
              <CSVImporter onDataImported={handleDataImported} />
              
              {projects.length > 0 && (
                <button 
                  onClick={handleExport}
                  className="w-full mt-4 flex items-center justify-center gap-2 px-5 py-2.5 bg-hb-navy text-white text-[11px] font-bold uppercase tracking-widest rounded transition-all hover:bg-[#3d374a]"
                >
                  <Download className="w-3.5 h-3.5" /> Export DB
                </button>
              )}
            </section>
            
            <section>
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-hb-navy mb-4 opacity-70">Filters</h3>
              <ProjectFilters 
                filter={filter} 
                setFilter={setFilter} 
                availableCategories={allCategories}
                availableSubcategories={availableSubcategories}
                availableClientTypes={allClientTypes}
                yearStats={yearStats}
              />
            </section>
          </aside>

          <section className="lg:col-span-3">
            <div className="mb-8 flex items-center justify-between border-b border-slate-200 pb-6">
              <h2 className="text-2xl font-bold text-hb-navy">Project Archive</h2>
              <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded border border-slate-200">
                <ShieldCheck className="w-3 h-3 text-hb-navy" />
                <span className="text-[10px] font-bold text-hb-navy uppercase tracking-widest">
                  {filteredProjects.length} Verified Records
                </span>
              </div>
            </div>
            
            <ProjectTable 
              projects={filteredProjects} 
              onClientClick={handleClientClick}
              onClientTypeClick={handleClientTypeClick}
              onCategoryClick={handleCategoryClick}
              onSubcategoryClick={handleSubcategoryClick}
              sortConfig={sortConfig}
              onSort={handleSort}
            />
          </section>
        </div>
      </main>
    </div>
  );
};

export default App;