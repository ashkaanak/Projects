import React, { useState } from 'react';
import { Project } from '../types';
import { ChevronDown, ChevronUp, User, Calendar, Info, Tag, Layers, Building, ArrowUpDown } from 'lucide-react';
import { SortConfig } from '../App';

interface ProjectTableProps {
  projects: Project[];
  onClientClick: (client: string) => void;
  onClientTypeClick: (type: string) => void;
  onCategoryClick: (cat: string) => void;
  onSubcategoryClick: (sub: string) => void;
  sortConfig: SortConfig;
  onSort: (key: 'name' | 'year' | 'client') => void;
}

const ProjectTable: React.FC<ProjectTableProps> = ({ 
  projects, 
  onClientClick, 
  onClientTypeClick,
  onCategoryClick,
  onSubcategoryClick,
  sortConfig,
  onSort
}) => {
  const [expandedRows, setExpandedRows] = useState<Set<string | number>>(new Set());

  const toggleRow = (id: string | number) => {
    const newSet = new Set(expandedRows);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedRows(newSet);
  };

  const getSortIcon = (key: 'name' | 'year' | 'client') => {
    if (sortConfig?.key !== key) return <ArrowUpDown className="w-3 h-3 opacity-30" />;
    return sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />;
  };

  if (projects.length === 0) {
    return (
      <div className="bg-white rounded border border-slate-200 p-20 text-center shadow-sm">
        <h4 className="text-lg font-bold text-hb-navy">Awaiting Project Records</h4>
        <p className="text-slate-500 text-sm mt-2">Upload your archive CSV to view database entries.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded border border-slate-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse table-fixed min-w-[750px]">
          <thead>
            <tr className="bg-hb-navy border-b border-hb-navy">
              <th 
                className="px-6 py-4 text-[10px] font-bold text-white uppercase tracking-widest w-[45%] cursor-pointer select-none group"
                onClick={() => onSort('name')}
              >
                <div className="flex items-center gap-2">
                  Project Title
                  <span className="transition-opacity opacity-0 group-hover:opacity-100 group-[.active]:opacity-100">
                    {getSortIcon('name')}
                  </span>
                </div>
              </th>
              <th 
                className={`px-6 py-4 text-[10px] font-bold text-white uppercase tracking-widest w-[15%] cursor-pointer select-none group ${sortConfig?.key === 'year' ? 'active' : ''}`}
                onClick={() => onSort('year')}
              >
                <div className="flex items-center gap-2">
                  Year
                  <span>
                    {getSortIcon('year')}
                  </span>
                </div>
              </th>
              <th 
                className="px-6 py-4 text-[10px] font-bold text-white uppercase tracking-widest w-[40%] cursor-pointer select-none group"
                onClick={() => onSort('client')}
              >
                <div className="flex items-center gap-2">
                  Client
                  <span className="transition-opacity opacity-0 group-hover:opacity-100 group-[.active]:opacity-100">
                    {getSortIcon('client')}
                  </span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {projects.map((project) => (
              <React.Fragment key={project.id}>
                <tr 
                  className={`hover:bg-slate-50 transition-colors group cursor-pointer ${expandedRows.has(project.id) ? 'bg-[#4D455D]/5' : ''}`}
                  onClick={() => toggleRow(project.id)}
                >
                  <td className="px-6 py-5 align-top">
                    <div className="flex items-start gap-4">
                      <div className={`mt-0.5 flex-shrink-0 transition-colors ${expandedRows.has(project.id) ? 'text-hb-navy' : 'text-slate-300'}`}>
                        {expandedRows.has(project.id) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                      <div className="font-normal text-hb-gray text-[13px] leading-snug break-words">
                        {project.name}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 align-top">
                    <div className="flex items-center gap-2 text-[13px] text-hb-gray font-normal">
                      <Calendar className="w-3.5 h-3.5 opacity-40" />
                      {project.year || "—"}
                    </div>
                  </td>
                  <td className="px-6 py-5 align-top">
                    <div className="flex items-start gap-2 text-[13px]">
                      <div className="flex flex-col">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (project.client) onClientClick(project.client);
                          }}
                          className="text-left leading-snug text-hb-gray hover:text-hb-navy hover:underline transition-colors font-normal break-words"
                        >
                          {project.client || "Unspecified"}
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
                {expandedRows.has(project.id) && (
                  <tr>
                    <td colSpan={3} className="px-6 md:px-12 py-8 bg-[#fcfcfd] border-y border-slate-100">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                        {/* Description Section */}
                        <div className="md:col-span-9">
                          <h5 className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-3 flex items-center gap-2">
                            <Info className="w-3 h-3" /> Project Description
                          </h5>
                          <p className="text-[13px] text-slate-600 leading-relaxed whitespace-pre-line font-normal pr-4">
                            {project.description || "Detailed description not currently available in this archive."}
                          </p>
                        </div>

                        {/* Metadata Column */}
                        <div className="md:col-span-3 space-y-4 md:border-l md:border-slate-100 md:pl-6">
                          {/* Category */}
                          <div>
                            <h5 className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2 flex items-center gap-2">
                              <Tag className="w-3 h-3" /> Category
                            </h5>
                            <div className="flex flex-wrap gap-x-3 gap-y-1">
                              {project.categories?.length > 0 ? project.categories.map(cat => (
                                <button 
                                  key={cat} 
                                  onClick={() => onCategoryClick(cat)}
                                  className="text-left text-[11px] font-normal text-hb-navy capitalize hover:underline transition-all"
                                >
                                  {cat.toLowerCase()}
                                </button>
                              )) : <span className="text-[11px] text-slate-300 italic">None</span>}
                            </div>
                          </div>
                          
                          {/* Subcategory */}
                          <div>
                            <h5 className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2 flex items-center gap-2">
                              <Layers className="w-3 h-3" /> Subcategory
                            </h5>
                            <div className="flex flex-col gap-1.5">
                              {project.subcategories?.length > 0 ? project.subcategories.map(sub => (
                                <button 
                                  key={sub} 
                                  onClick={() => onSubcategoryClick(sub)}
                                  className="text-left text-[11px] font-normal text-hb-navy leading-snug hover:underline transition-all"
                                >
                                  {sub}
                                </button>
                              )) : <span className="text-[11px] text-slate-300 italic">None</span>}
                            </div>
                          </div>

                          {/* Client Type */}
                          {project.clientType && (
                            <div>
                              <h5 className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2 flex items-center gap-2">
                                <Building className="w-3 h-3" /> Client Type
                              </h5>
                              <button 
                                onClick={() => onClientTypeClick(project.clientType || '')}
                                className="text-left text-[11px] font-normal text-hb-navy capitalize hover:underline transition-all"
                              >
                                {project.clientType.toLowerCase()}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProjectTable;