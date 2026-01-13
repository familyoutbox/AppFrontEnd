import React, { useState, useEffect } from 'react';
import { Database, Table, Plus, Trash2, Download, Eye, EyeOff, Play } from 'lucide-react';
import { dbSchemaAPI } from '@/services/api';

const DatabaseSchemaPreview = ({ projectId }) => {
  const [schemas, setSchemas] = useState([]);
  const [sampleData, setSampleData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState(null);
  const [showDataEditor, setShowDataEditor] = useState(false);
  const [newRow, setNewRow] = useState({});
  const [expandedTables, setExpandedTables] = useState(new Set());
  const [seedScriptType, setSeedScriptType] = useState('postgresql');

  useEffect(() => {
    loadSchemas();
  }, [projectId]);

  const loadSchemas = async () => {
    try {
      setLoading(true);
      console.log('[DatabaseSchema] Loading schemas for project:', projectId);
      const response = await dbSchemaAPI.getSchemas(projectId);
      console.log('[DatabaseSchema] Response:', response.data);
      setSchemas(response.data.schemas || []);
      setSampleData(response.data.sample_data || []);
      console.log('[DatabaseSchema] Loaded', response.data.schemas?.length || 0, 'schemas');
    } catch (error) {
      console.error('[DatabaseSchema] Failed to load schemas:', error);
      console.error('[DatabaseSchema] Error details:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const toggleTable = (tableName) => {
    const newExpanded = new Set(expandedTables);
    if (newExpanded.has(tableName)) {
      newExpanded.delete(tableName);
    } else {
      newExpanded.add(tableName);
    }
    setExpandedTables(newExpanded);
  };

  const getTableSampleData = (tableName) => {
    const tableData = sampleData.find(sd => sd.table_name === tableName);
    return tableData?.rows || [];
  };

  const handleAddRow = async () => {
    if (!selectedTable) return;

    try {
      await dbSchemaAPI.addSampleData(projectId, {
        project_id: projectId,
        table_name: selectedTable.name,
        rows: [newRow]
      });
      
      setNewRow({});
      setShowDataEditor(false);
      loadSchemas(); // Reload to get updated data
    } catch (error) {
      console.error('Failed to add sample data:', error);
    }
  };

  const handleClearData = async (tableName) => {
    if (!window.confirm(`Clear all sample data for ${tableName}?`)) return;

    try {
      await dbSchemaAPI.clearSampleData(projectId, tableName);
      loadSchemas();
    } catch (error) {
      console.error('Failed to clear sample data:', error);
    }
  };

  const handleGenerateSeedScript = async () => {
    try {
      const response = await dbSchemaAPI.generateSeedScript(projectId, {
        project_id: projectId,
        database_type: seedScriptType
      });
      
      // Download the script
      const blob = new Blob([response.data.script], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `seed_${seedScriptType}.${seedScriptType === 'mongodb' ? 'js' : 'sql'}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to generate seed script:', error);
    }
  };

  const getColumnTypeColor = (type) => {
    const typeColors = {
      'VARCHAR': 'text-blue-600',
      'INTEGER': 'text-green-600',
      'SERIAL': 'text-purple-600',
      'TEXT': 'text-blue-500',
      'BOOLEAN': 'text-yellow-600',
      'DATE': 'text-pink-600',
      'TIMESTAMP': 'text-pink-700',
      'FLOAT': 'text-green-500',
      'DOUBLE': 'text-green-700',
    };
    
    const upperType = type.toUpperCase();
    for (const [key, color] of Object.entries(typeColors)) {
      if (upperType.includes(key)) return color;
    }
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading database schemas...</div>
      </div>
    );
  }

  if (schemas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <Database className="w-16 h-16 mb-4 opacity-50" />
        <p className="font-medium">No database schemas found</p>
        <p className="text-sm mt-2">Generate code with database models to see schemas here</p>
        <p className="text-xs mt-1 text-gray-400">Supported: SQL, C# EF Models, Python Pydantic, Mongoose</p>
        <button
          onClick={loadSchemas}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
        >
          Retry Loading
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold">Database Schema Preview</h2>
          <span className="text-sm text-gray-500">({schemas.length} tables)</span>
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={seedScriptType}
            onChange={(e) => setSeedScriptType(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded text-sm"
          >
            <option value="postgresql">PostgreSQL</option>
            <option value="mysql">MySQL</option>
            <option value="mongodb">MongoDB</option>
            <option value="sqlite">SQLite</option>
          </select>
          
          <button
            onClick={handleGenerateSeedScript}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            <Download className="w-4 h-4" />
            Download Seed Script
          </button>
        </div>
      </div>

      {/* Tables List */}
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-4">
          {schemas.map((table) => {
            const isExpanded = expandedTables.has(table.name);
            const tableData = getTableSampleData(table.name);
            
            return (
              <div key={table.name} className="bg-white rounded-lg border border-gray-200 shadow-sm">
                {/* Table Header */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleTable(table.name)}
                >
                  <div className="flex items-center gap-2">
                    <Table className="w-5 h-5 text-gray-600" />
                    <h3 className="font-semibold text-gray-900">{table.name}</h3>
                    <span className="text-sm text-gray-500">
                      ({table.columns.length} columns)
                    </span>
                    {tableData.length > 0 && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                        {tableData.length} sample rows
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTable(table);
                        setShowDataEditor(true);
                        setNewRow({});
                      }}
                      className="p-1.5 hover:bg-gray-200 rounded"
                      title="Add sample data"
                    >
                      <Plus className="w-4 h-4 text-gray-600" />
                    </button>
                    
                    {tableData.length > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClearData(table.name);
                        }}
                        className="p-1.5 hover:bg-red-100 rounded"
                        title="Clear sample data"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    )}
                    
                    {isExpanded ? (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Table Details */}
                {isExpanded && (
                  <div className="border-t border-gray-200">
                    {/* Columns */}
                    <div className="p-4 bg-gray-50">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Columns</h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Name</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Type</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Constraints</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {table.columns.map((column) => (
                              <tr key={column.name}>
                                <td className="px-3 py-2 text-sm">
                                  <span className="font-mono font-medium">{column.name}</span>
                                  {column.primary_key && (
                                    <span className="ml-2 px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">PK</span>
                                  )}
                                  {column.foreign_key && (
                                    <span className="ml-2 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">FK → {column.foreign_key}</span>
                                  )}
                                </td>
                                <td className={`px-3 py-2 text-sm font-mono ${getColumnTypeColor(column.type)}`}>
                                  {column.type}
                                </td>
                                <td className="px-3 py-2 text-sm text-gray-600">
                                  {!column.nullable && <span className="mr-2 text-red-600">NOT NULL</span>}
                                  {column.default_value && (
                                    <span className="text-gray-500">DEFAULT: {column.default_value}</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Sample Data */}
                    {tableData.length > 0 && (
                      <div className="p-4 border-t border-gray-200">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Sample Data</h4>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-blue-50">
                              <tr>
                                {table.columns.map((column) => (
                                  <th key={column.name} className="px-3 py-2 text-left text-xs font-medium text-gray-600">
                                    {column.name}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {tableData.map((row, idx) => (
                                <tr key={idx}>
                                  {table.columns.map((column) => (
                                    <td key={column.name} className="px-3 py-2 text-sm text-gray-900 font-mono">
                                      {row.values[column.name] !== undefined ? String(row.values[column.name]) : '—'}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Sample Data Editor Modal */}
      {showDataEditor && selectedTable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Add Sample Data - {selectedTable.name}</h3>
              <button
                onClick={() => setShowDataEditor(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="p-4 space-y-3">
              {selectedTable.columns.map((column) => (
                <div key={column.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {column.name}
                    <span className={`ml-2 text-xs ${getColumnTypeColor(column.type)}`}>
                      {column.type}
                    </span>
                    {!column.nullable && <span className="ml-1 text-red-600">*</span>}
                  </label>
                  <input
                    type={column.type.includes('INT') || column.type.includes('NUMBER') ? 'number' : 'text'}
                    value={newRow[column.name] || ''}
                    onChange={(e) => setNewRow({ ...newRow, [column.name]: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={column.default_value ? `Default: ${column.default_value}` : ''}
                  />
                </div>
              ))}
            </div>
            
            <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setShowDataEditor(false)}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddRow}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Row
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatabaseSchemaPreview;
