import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCertificateStore } from '../store/certificateStore';
import { Upload, FileText, Loader2, List } from 'lucide-react';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

export default function TemplatesPage() {
  const { templateFile, templateFileName, templateFields, maxOccurrences, setTemplateFile } = useCertificateStore();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  /**
   * Compute how many distinct "slots" for a given tag exist on the first page.
   *
   * The core problem we solve here:
   *   - Word templates for multi-certificate pages often put each certificate
   *     inside its own <w:txbxContent> (textbox).
   *   - Sometimes designers duplicate a tag *inside* the same textbox for a
   *     shadow/outline effect, which inflates the raw regex count.
   *   - Headers/footers may add yet another copy that `docx-preview` hides.
   *
   * Strategy:
   *   1. Count occurrences outside any textbox (regular paragraphs/tables).
   *   2. Count *distinct* textbox containers (<w:txbxContent> blocks) that
   *      contain the tag at least once — 1 point per container, not per
   *      occurrence within that container.
   *   3. If paragraph occurrences cover ≥ 2 distinct spots, use that count
   *      and ignore textboxes (textboxes are decorative copies).
   *   4. Otherwise the template is textbox-based: effectiveCount = paragraphCount
   *      + uniqueTextboxContainerCount.
   *
   * Examples:
   *   • 2 textboxes, each with {{name}} once  → 0 + 2 = 2  ✓
   *   • 1 textbox with {{name}} twice (shadow) → 0 + 1 = 1  (treated as 1 slot)
   *   • 2 textboxes each ×1 + one textbox ×2  → 0 + 3 = 3  (still correct: 3 slots)
   *   • 2 paragraphs + 1 textbox echo         → 2           ✓ (ignores textbox)
   */
  const computeEffectiveOccurrences = (xml: string, tag: string): number => {
    const tagPattern = new RegExp(`\\{\\{\\s*${escapeRegExp(tag)}\\s*\\}\\}`, 'g');

    // Remove all textbox content to isolate paragraph/table runs
    const paragraphOnlyXml = xml
      .replace(/<w:txbxContent\b[\s\S]*?<\/w:txbxContent>/gi, '')
      .replace(/<w:txbxContent\b[^/>]*\/>/gi, '');
    const paragraphCount = (paragraphOnlyXml.match(tagPattern) || []).length;

    if (paragraphCount >= 2) {
      // Enough slots in regular paragraphs; textboxes are just decorative/echo copies.
      return paragraphCount;
    }

    // Count distinct textbox containers (one point per container, not per occurrence).
    const textboxContainerBlocks = xml.match(/<w:txbxContent\b[\s\S]*?<\/w:txbxContent>/gi) || [];
    const uniqueTextboxesWithTag = textboxContainerBlocks.filter(
      (containerBlock) => tagPattern.test(containerBlock)
    ).length;

    return paragraphCount + uniqueTextboxesWithTag;
  };

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.docx')) {
      setError('Please upload a valid .docx file.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const zip = new PizZip(arrayBuffer);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        delimiters: { start: '{{', end: '}}' }
      });

      // Extract placeholders using docxtemplater's compiled AST
      const placeholders = new Set<string>();
      const tagCounts: Record<string, number> = {};
      
      // @ts-ignore - doc.compiled is an internal property but very reliable for this
      const compiled = doc.compiled;
      if (compiled) {
        Object.entries(compiled).forEach(([fileName, file]: [string, any]) => {
          if (file.parsed) {
            file.parsed.forEach((token: any) => {
              if (token.type === 'placeholder') {
                const tag = token.value.trim();
                // Ignore loop closing tags if any somehow get through
                if (tag && !tag.startsWith('/')) {
                  placeholders.add(tag);
                }
              }
            });
          }
        });
      }

      const fields = Array.from(placeholders);

      // Count duplicates on the *first page* only, so repeat behavior matches
      // what the user sees on the template's first certificate page.
      // DOCX "pages" are not explicit, so we approximate page breaks using
      // WordprocessingML page-break markers.
      // Extract the first-page XML from the main document body.
      // DOCX pages are not explicit; we approximate by splitting on page-break
      // or section-break markers — a best-effort heuristic.
      let firstPageXml = '';
      try {
        const docXml = zip.file('word/document.xml')?.asText() || '';
        const pageBreakRegex = /<w:br[^>]*w:type="page"[^>]*\/>|<w:sectPr[\s\S]*?<\/w:sectPr>/i;
        firstPageXml = docXml.split(pageBreakRegex)[0] || docXml;
      } catch {
        firstPageXml = '';
      }

      fields.forEach((tag) => {
        if (!firstPageXml) {
          tagCounts[tag] = 1;
          return;
        }
        const effectiveCount = computeEffectiveOccurrences(firstPageXml, tag);
        tagCounts[tag] = Math.max(1, effectiveCount);
      });
      
      let actualMaxOccurrences = 1;
      if (Object.values(tagCounts).length > 0) {
        actualMaxOccurrences = Math.max(...Object.values(tagCounts));
      }

      setTemplateFile(arrayBuffer, file.name, fields, actualMaxOccurrences, tagCounts);
    } catch (err) {
      console.error('Error processing file:', err);
      setError('Failed to process the DOCX file. Make sure it is a valid Word document.');
    } finally {
      setIsLoading(false);
    }
  }, [setTemplateFile]);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Upload Template</h2>
        <p className="text-gray-500 mt-2">Upload a DOCX certificate template with {"{placeholders}"} to get started.</p>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-12 bg-gray-50 hover:bg-gray-100 transition-colors relative">
          <input
            type="file"
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            id="template-upload"
            disabled={isLoading}
          />
          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4">
            {isLoading ? <Loader2 className="w-8 h-8 animate-spin" /> : <Upload className="w-8 h-8" />}
          </div>
          <span className="text-lg font-medium text-gray-900">
            {isLoading ? 'Processing...' : 'Click or drag to upload DOCX template'}
          </span>
          <span className="text-sm text-gray-500 mt-1">Only .docx files are supported</span>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg border border-red-100">
            {error}
          </div>
        )}

        {templateFile && !isLoading && (
          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {templateFileName}
            </h3>
            
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <List className="w-4 h-4" />
                Detected Placeholders ({templateFields.length})
              </h4>
              {templateFields.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {templateFields.map((field, idx) => (
                    <span key={idx} className="px-3 py-1 bg-white border border-gray-300 rounded-full text-sm font-medium text-indigo-600">
                      {field}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded border border-amber-200">
                  No placeholders found. Make sure your template contains tags like {"{name}"} or {"{date}"}.
                </p>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => navigate('/editor')}
                className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                Continue to Data Import
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
