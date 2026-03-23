import React, { useState, useEffect, useRef } from 'react';
import { useCertificateStore } from '../store/certificateStore';
import { Download, ChevronLeft, ChevronRight, CheckCircle2, Loader2, FileText, Copy, Plus, Trash2, Layers, AlertTriangle } from 'lucide-react';
import { generateSingleDocx, generateBatchSingleDocx, prepareData } from '../lib/docxGenerator';
import { renderAsync } from 'docx-preview';

export default function CertificatesPage() {
  const { 
    templateFile, 
    templateFileName, 
    templateFields, 
    maxOccurrences,
    fieldOccurrences,
    fieldRepeatMap,
    students, 
    previewValues, 
    updateStudent, 
    updatePreviewValue,
    addStudent,
    addMultipleStudents,
    duplicateStudent,
    duplicateStudentMultiple,
    deleteStudent
  } = useCertificateStore();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copyCount, setCopyCount] = useState(1);
  const [pageInputValue, setPageInputValue] = useState('1');
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Determine how many Excel rows feed into a single "page" (document).
  // We now use ONLY the "name" field (or first field containing "name")
  // as the driver for page size. If "name" appears N times in the template
  // and its checkbox is unchecked, we pull exactly N rows per document.
  const nameFieldKey = Object.keys(fieldOccurrences).find((k) =>
    k.toLowerCase().includes('name')
  );
  const step =
    nameFieldKey &&
    fieldRepeatMap[nameFieldKey] === false &&
    (fieldOccurrences[nameFieldKey] || 1) > 1
      ? fieldOccurrences[nameFieldKey] || 1
      : 1;
  const totalPages = Math.ceil(students.length / step) || 1;

  // Sync page input with current index
  useEffect(() => {
    setPageInputValue((Math.floor(currentIndex / step) + 1).toString());
  }, [currentIndex, step]);

  const handlePageSubmit = () => {
    let newPage = parseInt(pageInputValue);
    if (isNaN(newPage) || newPage < 1) {
      newPage = 1;
    } else if (newPage > totalPages) {
      newPage = totalPages;
    }
    setCurrentIndex((newPage - 1) * step);
    setPageInputValue(newPage.toString());
  };

  // Single mode preview rendering
  useEffect(() => {
    if (!templateFile || !previewContainerRef.current) return;
    
    let isCancelled = false;

    const renderPreview = async () => {
      try {
        let dataToPrint: any;
        if (students.length > 0) {
          const chunkIndex = Math.floor(currentIndex / step);
          const chunkStart = chunkIndex * step;
          const chunk = students.slice(chunkStart, chunkStart + step);
          dataToPrint = prepareData(chunk, fieldRepeatMap);
        } else {
          dataToPrint = previewValues;
        }
        
        const docxBlob = await generateSingleDocx(templateFile, dataToPrint, fieldOccurrences);
        
        if (isCancelled) return;

        // Clear previous preview
        if (previewContainerRef.current) {
          previewContainerRef.current.innerHTML = '';
          await renderAsync(docxBlob, previewContainerRef.current, null, {
            className: 'docx-preview-container',
            inWrapper: true,
            ignoreWidth: false,
            ignoreHeight: false,
            experimental: true,
            renderHeaders: true,
            renderFooters: true,
          });
        }
      } catch (err) {
        console.error("Preview render error:", err);
      }
    };

    // Debounce the render slightly to avoid lag while typing
    const timeoutId = setTimeout(() => {
      renderPreview();
    }, 300);

    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
  }, [templateFile, students, currentIndex, previewValues, step, fieldRepeatMap]);

  const handleGenerateMergedDocx = async () => {
    if (!templateFile || students.length === 0) return;
    
    setIsGenerating(true);
    setProgress(0);
    
    try {
      const mergedBlob = await generateBatchSingleDocx(templateFile, students, (p) => setProgress(p), fieldRepeatMap, fieldOccurrences);
      const url = URL.createObjectURL(mergedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'certificates_merged.docx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to generate merged DOCX:", error);
      alert("An error occurred while generating certificates. Make sure your template is valid.");
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  const handleGenerateSingleDocx = async () => {
    if (!templateFile) return;
    setIsGenerating(true);
    
    try {
      let dataToPrint: any;
      if (students.length > 0) {
        const chunkIndex = Math.floor(currentIndex / step);
        const chunkStart = chunkIndex * step;
        const chunk = students.slice(chunkStart, chunkStart + step);
        dataToPrint = prepareData(chunk, fieldRepeatMap);
      } else {
        dataToPrint = previewValues;
      }
      
      const docxBlob = await generateSingleDocx(templateFile, dataToPrint, fieldOccurrences);
      
      const url = URL.createObjectURL(docxBlob);
      const a = document.createElement('a');
      a.href = url;
      
      let fileName = 'certificate.docx';
      if (students.length > 0) {
        const chunkIndex = Math.floor(currentIndex / step);
        const chunkStart = chunkIndex * step;
        const student = students[chunkStart];
        const nameField = Object.keys(student).find(k => k.toLowerCase().includes('name'));
        if (nameField && student[nameField]) {
          fileName = `Certificate_${student[nameField].replace(/[^a-z0-9]/gi, '_')}.docx`;
        } else {
          fileName = `Certificate_${chunkIndex + 1}.docx`;
        }
      } else {
        // Try to find a name field in previewValues
        const nameField = Object.keys(previewValues).find(k => k.toLowerCase().includes('name'));
        if (nameField && previewValues[nameField]) {
          fileName = `Certificate_${previewValues[nameField].replace(/[^a-z0-9]/gi, '_')}.docx`;
        }
      }
      
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to generate DOCX:", error);
      alert("An error occurred while generating the DOCX.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDuplicate = () => {
    if (students.length > 0) {
      duplicateStudent(currentIndex);
      setCurrentIndex(currentIndex + step);
    } else {
      // If no students yet, convert previewValues to the first student, then duplicate
      const firstPage = Array.from({ length: step }, () => ({ ...previewValues }));
      const secondPage = Array.from({ length: step }, () => ({ ...previewValues }));
      addMultipleStudents([...firstPage, ...secondPage]);
      setCurrentIndex(step);
    }
  };

  const handleMakeCopiesConfirm = () => {
    if (copyCount > 0) {
      if (students.length > 0) {
        duplicateStudentMultiple(currentIndex, copyCount);
        setCurrentIndex(currentIndex + (copyCount * step));
      } else {
        const firstPage = Array.from({ length: step }, () => ({ ...previewValues }));
        const copies = Array.from({ length: copyCount * step }, () => ({ ...previewValues }));
        addMultipleStudents([...firstPage, ...copies]);
        setCurrentIndex(copyCount * step);
      }
    }
    setShowCopyModal(false);
    setCopyCount(1);
  };

  const handleAddNew = () => {
    const emptyRecord = templateFields.reduce((acc, field) => ({ ...acc, [field]: '' }), {});
    if (students.length > 0) {
      const newPage = Array.from({ length: step }, () => ({ ...emptyRecord }));
      addMultipleStudents(newPage);
      
      // Calculate the new length after padding
      const remainder = students.length % step;
      const paddedLength = remainder === 0 ? students.length : students.length + (step - remainder);
      setCurrentIndex(paddedLength);
    } else {
      const firstPage = Array.from({ length: step }, () => ({ ...previewValues }));
      const newPage = Array.from({ length: step }, () => ({ ...emptyRecord }));
      addMultipleStudents([...firstPage, ...newPage]);
      setCurrentIndex(step);
    }
  };

  const handleDelete = () => {
    if (students.length > 0) {
      deleteStudent(currentIndex);
      
      // Calculate the new length after padding and deletion
      const remainder = students.length % step;
      const paddedLength = remainder === 0 ? students.length : students.length + (step - remainder);
      const newLength = paddedLength - step;
      
      if (currentIndex >= newLength) {
        setCurrentIndex(Math.max(0, newLength - step));
      }
    }
  };

  if (!templateFile) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-full text-center">
        <p className="text-gray-500 mb-4">Missing template.</p>
        <p className="text-sm text-gray-400">Please upload a DOCX template in step 1 before generating certificates.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div
        className="shrink-0 flex gap-3 items-start px-6 py-3.5 border-b border-amber-200/90 bg-amber-50/95"
        role="status"
      >
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" aria-hidden />
        <p className="text-sm text-amber-950 leading-relaxed">
          <span className="font-semibold text-amber-900">Preview note:</span> The in-browser preview is approximate and may not match Word exactly (layout, fonts, and fine details can differ).{' '}
          <span className="font-medium">Download your DOCX when you are finished</span> and open it in Microsoft Word—or another compatible app—to see how the file will really look before printing or sharing.
        </p>
      </div>
      {/* Header Actions */}
      <div className="bg-white border-b border-gray-200 p-6 flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Export & Preview</h2>
          <p className="text-gray-500 text-sm mt-1">Preview and export your generated DOCX certificates.</p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={handleGenerateSingleDocx}
            disabled={isGenerating}
            className="flex items-center gap-2 px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isGenerating && students.length === 0 ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            Export Current (DOCX)
          </button>

          {students.length > 0 && (
            <button
              onClick={handleGenerateMergedDocx}
              disabled={isGenerating}
              className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing ({Math.round(progress)}%)
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Export All (Single DOCX)
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Preview Area */}
        <div 
          id="preview-scroll-container"
          className="flex-1 p-8 overflow-auto flex flex-col items-center bg-gray-100 relative"
        >
          
          {students.length > 0 && (
            <div className="flex items-center justify-center gap-4 bg-white p-3 rounded-xl shadow-sm border border-gray-200 mb-6 sticky top-0 z-20">
              <button
                onClick={() => setCurrentIndex(prev => Math.max(0, prev - step))}
                disabled={currentIndex < step}
                className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-2 font-medium text-gray-700">
                <span>{step > 1 ? 'Document' : 'Record'}</span>
                <input
                  type="text"
                  value={pageInputValue}
                  onChange={(e) => setPageInputValue(e.target.value)}
                  onBlur={handlePageSubmit}
                  onKeyDown={(e) => e.key === 'Enter' && handlePageSubmit()}
                  className="w-12 text-center border border-gray-300 rounded-md px-1 py-0.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <span>of {totalPages}</span>
              </div>

              <button
                onClick={() => setCurrentIndex(prev => Math.min(students.length - 1, prev + step))}
                disabled={currentIndex >= students.length - step}
                className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          <div className="w-full max-w-full min-h-[500px] relative">
            <div 
              ref={previewContainerRef} 
              className="w-full h-full overflow-auto"
              style={{ minHeight: '500px' }}
            >
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="ml-2">Loading preview...</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Data Preview */}
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col shrink-0">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-lg font-bold text-gray-900">
                {students.length > 0 ? (step > 1 ? 'Edit First Record of Document' : 'Edit Current Record') : 'Fill Template Fields'}
              </h3>
            </div>
            <p className="text-xs text-gray-500 mb-4">Changes will reflect in the preview.</p>
            
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleDuplicate}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm font-medium transition-colors min-w-[100px]"
                title="Duplicate this record"
              >
                <Copy className="w-3.5 h-3.5" />
                Duplicate
              </button>
              <button
                onClick={() => setShowCopyModal(true)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm font-medium transition-colors min-w-[100px]"
                title="Make multiple copies"
              >
                <Layers className="w-3.5 h-3.5" />
                Make Copies
              </button>
              {students.length > 0 && (
                <button
                  onClick={handleDelete}
                  className="flex items-center justify-center px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded transition-colors"
                  title="Delete this record"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          
          <div className="p-6 overflow-auto space-y-4">
            {students.length > 0 ? (
              (() => {
                const chunkIndex = Math.floor(currentIndex / step);
                const chunkStart = chunkIndex * step;
                const chunk = students.slice(chunkStart, chunkStart + step);

                return chunk.map((student, idx) => (
                  <div key={chunkStart + idx} className="space-y-2 mb-4">
                    {step > 1 && (
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        Row {chunkStart + idx + 1} for this document
                      </div>
                    )}
                    {Object.entries(student || {}).map(([key, value]) => (
                      <div key={key} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                          {key}
                        </label>
                        <input
                          type="text"
                          value={value as string}
                          onChange={(e) => {
                            const targetIndex = chunkStart + idx;
                            const newStudent = { ...students[targetIndex], [key]: e.target.value };
                            updateStudent(targetIndex, newStudent);
                          }}
                          className="w-full bg-white border border-gray-300 rounded px-2 py-1.5 text-sm text-gray-900 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        />
                      </div>
                    ))}
                  </div>
                ));
              })()
            ) : (
              templateFields.map((field) => (
                <div key={field} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{field}</label>
                  <input
                    type="text"
                    value={previewValues[field] || ''}
                    onChange={(e) => updatePreviewValue(field, e.target.value)}
                    placeholder={`Enter ${field}`}
                    className="w-full bg-white border border-gray-300 rounded px-2 py-1.5 text-sm text-gray-900 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
              ))
            )}
            {students.length === 0 && templateFields.length === 0 && (
              <p className="text-sm text-gray-500">No fields found in the template.</p>
            )}
          </div>
          
          <div className="p-6 border-t border-gray-200 bg-green-50 mt-auto">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-green-900">Ready to Export</h4>
                <p className="text-xs text-green-700 mt-1">
                  {students.length > 0 
                    ? `${totalPages} certificates ready to be generated as a single DOCX file.`
                    : 'Template is ready for single export.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Copy Modal */}
      {showCopyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Make Copies</h3>
            <p className="text-sm text-gray-500 mb-4">How many copies of this record would you like to make?</p>
            <input
              type="number"
              min="1"
              max="100"
              value={copyCount}
              onChange={(e) => setCopyCount(parseInt(e.target.value) || 1)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-6 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCopyModal(false);
                  setCopyCount(1);
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleMakeCopiesConfirm}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                Create Copies
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
