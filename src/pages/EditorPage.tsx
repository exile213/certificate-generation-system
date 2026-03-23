import React, { useState, useCallback } from 'react';
import { useCertificateStore } from '../store/certificateStore';
import { FileSpreadsheet, AlertCircle, CheckCircle2, ArrowRight, List } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { parseExcel } from '../lib/excelParser';

export default function EditorPage() {
  const { templateFile, templateFields, students, setStudents, maxOccurrences, fieldOccurrences, fieldRepeatMap, updateFieldRepeat, setFieldRepeatMap } = useCertificateStore();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [validation, setValidation] = useState<{
    missingInExcel: string[];
    extraInExcel: string[];
    isValid: boolean;
  } | null>(null);

  const repeatableFields = templateFields.filter(f => (fieldOccurrences[f] || 1) > 1);
  const hasRepeatableFields = repeatableFields.length > 0;

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setError(null);
      try {
        const data = await parseExcel(file);
        if (data && data.length > 0) {
          let finalData = data;
          setStudents(finalData);
          
          // Validate columns against template fields
          const excelColumns = Object.keys(data[0] || {});
          
          const missingInExcel = templateFields.filter(f => !excelColumns.includes(f));
          const extraInExcel = excelColumns.filter(c => !templateFields.includes(c));
          
          setValidation({
            missingInExcel,
            extraInExcel,
            isValid: missingInExcel.length === 0
          });

        } else {
          setError('The Excel file appears to be empty.');
          setStudents([]);
          setValidation(null);
        }
      } catch (err) {
        setError('Failed to parse Excel file. Please ensure it is a valid .xlsx or .csv file.');
        console.error(err);
        setStudents([]);
        setValidation(null);
      }
    }
    // Reset input so the same file can be selected again if needed
    e.target.value = '';
  }, [setStudents, templateFields, maxOccurrences]);

  if (!templateFile) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-full">
        <p className="text-gray-500 mb-4">Please upload a DOCX template first.</p>
        <button onClick={() => navigate('/template')} className="text-indigo-600 font-medium hover:underline">
          Go to Upload
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Data Import & Validation</h2>
          <p className="text-gray-500 mt-2">Upload your recipient data and map it to your template placeholders.</p>
        </div>
        <button
          onClick={() => navigate('/certificates')}
          className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          {students.length === 0 ? 'Skip & Fill Manually' : 'Next: Export'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: Template Fields */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <List className="w-5 h-5 text-indigo-600" />
              Template Placeholders
            </h3>
            {hasRepeatableFields && (
              <button
                onClick={() => {
                  const allChecked = repeatableFields.every(f => fieldRepeatMap[f] !== false);
                  const newMap = { ...fieldRepeatMap };
                  repeatableFields.forEach(f => {
                    newMap[f] = !allChecked;
                  });
                  setFieldRepeatMap(newMap);
                }}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                {repeatableFields.every(f => fieldRepeatMap[f] !== false) ? 'Uncheck All' : 'Check All'}
              </button>
            )}
          </div>
          <p className="text-sm text-gray-600 mb-4">
            These fields were found in your DOCX template. Your Excel file should have columns matching these exact names.
          </p>
          
          {hasRepeatableFields && (
            <div className="mb-4 p-3 bg-indigo-50 rounded-lg border border-indigo-100 text-sm text-indigo-800">
              <p className="font-medium mb-1">Repeating Tags</p>
              <p className="opacity-90 text-xs">
                Some tags appear multiple times on your template. 
                <br/>• <strong>Checked:</strong> Use the exact same data for every copy of this tag on the page.
                <br/>• <strong>Unchecked:</strong> Move down to the next row in your spreadsheet for each copy of this tag.
              </p>
            </div>
          )}
          
          {templateFields.length > 0 ? (
            <div className="space-y-2">
              {templateFields.map((field, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-3">
                    {(fieldOccurrences[field] || 1) > 1 && (
                      <input
                        type="checkbox"
                        checked={fieldRepeatMap[field] !== false}
                        onChange={(e) => updateFieldRepeat(field, e.target.checked)}
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        title="Repeat same row data for this tag"
                      />
                    )}
                    <span className="font-mono text-sm text-gray-800">{field}</span>
                  </div>
                  {validation && (
                    validation.missingInExcel.includes(field) ? (
                      <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full">Missing in Excel</span>
                    ) : (
                      <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Found
                      </span>
                    )
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-amber-50 text-amber-800 rounded-lg border border-amber-200 text-sm">
              No placeholders detected in the template.
            </div>
          )}
        </div>

        {/* Right Column: Data Import */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
            <FileSpreadsheet className="w-5 h-5 text-green-600" />
            Import Data
          </h3>
          
          <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-8 bg-gray-50 hover:bg-gray-100 transition-colors text-center">
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <FileSpreadsheet className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <span className="block text-sm font-medium text-gray-900">
              Click or drag to upload Excel / CSV
            </span>
            <span className="block text-xs text-gray-500 mt-1">
              First row must contain column headers
            </span>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg border border-red-100 text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {students.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-900">Import Summary</h4>
                <span className="text-sm text-gray-500">{students.length} rows loaded</span>
              </div>

              {validation && (
                <div className="space-y-3">
                  {validation.isValid ? (
                    <div className="p-3 bg-green-50 text-green-800 rounded-lg border border-green-200 text-sm flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium">All template fields matched!</p>
                        <p className="mt-1 opacity-90">Your data is ready for generation.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-50 text-amber-800 rounded-lg border border-amber-200 text-sm flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium">Some fields are missing in your Excel file.</p>
                        <p className="mt-1 opacity-90">
                          Missing columns: <span className="font-mono">{validation.missingInExcel.join(', ')}</span>
                        </p>
                        <p className="mt-2 text-xs">Certificates will be generated, but these placeholders will remain empty or show as tags.</p>
                      </div>
                    </div>
                  )}

                  {validation.extraInExcel.length > 0 && (
                    <div className="p-3 bg-blue-50 text-blue-800 rounded-lg border border-blue-200 text-sm">
                      <p className="font-medium">Extra columns ignored:</p>
                      <p className="mt-1 opacity-90 font-mono text-xs">{validation.extraInExcel.join(', ')}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
