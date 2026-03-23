import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import JSZip from 'jszip';
import DocxMerger from 'docx-merger';

export async function generateSingleDocx(
  templateBuffer: ArrayBuffer,
  data: Record<string, any>,
  effectiveCounts: Record<string, number> = {}
): Promise<Blob> {
  const zip = new PizZip(templateBuffer);
  const doc = createDocxtemplater(zip, effectiveCounts);

  doc.render(data);

  const out = doc.getZip().generate({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });

  return out as Blob;
}

export async function generateSingleDocxArrayBuffer(
  templateBuffer: ArrayBuffer,
  data: Record<string, any>,
  effectiveCounts: Record<string, number> = {}
): Promise<ArrayBuffer> {
  const zip = new PizZip(templateBuffer);
  const doc = createDocxtemplater(zip, effectiveCounts);

  doc.render(data);

  const out = doc.getZip().generate({
    type: 'arraybuffer',
  });

  return out as ArrayBuffer;
}

export function prepareData(studentsChunk: Record<string, string>[], fieldRepeatMap: Record<string, boolean>): Record<string, any> {
  if (studentsChunk.length === 0) {
    return {};
  }
  
  const keys = Object.keys(studentsChunk[0] || {});
  const data: Record<string, any> = {};
  
  keys.forEach(key => {
    if (fieldRepeatMap[key] !== false) {
      // Repeat same row: always return the first student's value for this field
      data[key] = studentsChunk[0]?.[key] || '';
    } else {
      // Do not repeat: return an array of values for this field
      data[key] = studentsChunk.map(student => student[key] || '');
    }
  });
  
  return data;
}

/**
 * Build a Docxtemplater instance with a custom parser that maps array values
 * to the correct {{tag}} slot based on its position in the document.
 *
 * `effectiveCounts` is optional: when provided, it limits how many lIndexes are
 * tracked per tag to exactly that count.  This prevents an "extra" hidden/shadow
 * occurrence from stealing an array slot and leaving a visible certificate blank.
 *
 * Without the limit, 3 occurrences with data = ["Emil","Peter"] would map as:
 *   lIndex[0] → "Emil"   (visible Cert of Participation)
 *   lIndex[1] → "Peter"  (hidden/extra occurrence — steals the slot)
 *   lIndex[2] → ""       (visible Cert of Appearance — left blank!)
 *
 * With effectiveCounts["name"] = 2, only the FIRST 2 lIndexes are registered.
 * The extra occurrence (whichever lIndex it has) falls outside the tracked set
 * and safely defaults to values[0], keeping the visible certificates intact.
 */
function createDocxtemplater(
  zip: PizZip,
  effectiveCounts: Record<string, number> = {}
): Docxtemplater {
  const tagOccurrences: Record<string, number[]> = {};
  
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: '{{', end: '}}' },
    parser: function(tag) {
      return {
        get: function(scope: any, context: any) {
          const cleanTag = tag.trim();
          const lIndex = context.meta.part.lIndex;
          const values = scope[cleanTag];
          
          if (tagOccurrences[cleanTag]) {
            const index = tagOccurrences[cleanTag].indexOf(lIndex);
            if (Array.isArray(values)) {
              if (index !== -1) {
                return index < values.length ? values[index] : '';
              } else {
                // Tag is outside the tracked set (header/footer/extra occurrence) —
                // default to first value so it stays consistent.
                return values[0] || '';
              }
            }
          } else if (Array.isArray(values)) {
            return values[0] || '';
          }
          
          return values;
        }
      };
    }
  });

  // @ts-ignore - accessing internal compiled property to find tag offsets
  const compiled = doc.compiled;
  if (compiled) {
    // Collect all lIndexes from the main document body first.
    const allTagLIndexes: Record<string, number[]> = {};
    Object.entries(compiled).forEach(([fileName, file]: [string, any]) => {
      if (fileName === 'word/document.xml' && file.parsed) {
        file.parsed.forEach((token: any) => {
          if (token.type === 'placeholder') {
            const tag = token.value.trim();
            if (!allTagLIndexes[tag]) allTagLIndexes[tag] = [];
            allTagLIndexes[tag].push(token.lIndex);
          }
        });
      }
    });

    // Sort each list ascending (document order) then slice to the effective
    // count so that any extra occurrences beyond what the template "intends"
    // don't consume an array slot meant for a visible certificate.
    Object.entries(allTagLIndexes).forEach(([tag, lIndexes]) => {
      lIndexes.sort((a, b) => a - b);
      const limit = effectiveCounts[tag];
      tagOccurrences[tag] = limit && limit < lIndexes.length
        ? lIndexes.slice(0, limit)
        : lIndexes;
    });
  }

  return doc;
}

export async function generateBatchSingleDocx(
  templateBuffer: ArrayBuffer,
  students: Record<string, string>[],
  onProgress: (progress: number) => void,
  fieldRepeatMap: Record<string, boolean> = {},
  fieldOccurrences: Record<string, number> = {}
): Promise<Blob> {
  const files: ArrayBuffer[] = [];
  
  // Calculate chunk size based ONLY on the "name" field (or first key containing "name"),
  // mirroring the logic used on the preview page. If "name" appears N times in the
  // template and is unchecked, we generate N rows per document.
  const nameFieldKey = Object.keys(fieldOccurrences).find((k) =>
    k.toLowerCase().includes('name')
  );
  const chunkSize =
    nameFieldKey &&
    fieldRepeatMap[nameFieldKey] === false &&
    (fieldOccurrences[nameFieldKey] || 1) > 1
      ? fieldOccurrences[nameFieldKey] || 1
      : 1;
  
  const numChunks = Math.ceil(students.length / chunkSize);
  
  for (let i = 0; i < numChunks; i++) {
    const chunk = students.slice(i * chunkSize, (i + 1) * chunkSize);
    const data = prepareData(chunk, fieldRepeatMap);
    const docxBuffer = await generateSingleDocxArrayBuffer(templateBuffer, data, fieldOccurrences);
    files.push(docxBuffer);
    onProgress(((i + 1) / numChunks) * 50); // First 50% is generating individual files
  }

  return new Promise((resolve, reject) => {
    try {
      const merger = new DocxMerger({ pageBreak: false }, files);
      merger.save('blob', function (data: Blob) {
        onProgress(100);
        resolve(data);
      });
    } catch (err) {
      reject(err);
    }
  });
}

export async function generateBatchDocxZip(
  templateBuffer: ArrayBuffer,
  students: Record<string, string>[],
  onProgress: (progress: number) => void,
  fieldRepeatMap: Record<string, boolean> = {},
  fieldOccurrences: Record<string, number> = {}
): Promise<Blob> {
  const zip = new JSZip();

  // Use the same "name"-only logic for ZIP exports so behavior matches merged DOCX
  // and the live preview.
  const nameFieldKey = Object.keys(fieldOccurrences).find((k) =>
    k.toLowerCase().includes('name')
  );
  const chunkSize =
    nameFieldKey &&
    fieldRepeatMap[nameFieldKey] === false &&
    (fieldOccurrences[nameFieldKey] || 1) > 1
      ? fieldOccurrences[nameFieldKey] || 1
      : 1;
  const numChunks = Math.ceil(students.length / chunkSize);

  for (let i = 0; i < numChunks; i++) {
    const chunk = students.slice(i * chunkSize, (i + 1) * chunkSize);
    const data = prepareData(chunk, fieldRepeatMap);
    const docxBlob = await generateSingleDocx(templateBuffer, data, fieldOccurrences);
    
    // Try to find a name field for the filename from the first student in the chunk
    const firstStudent = chunk[0] || {};
    const nameField = Object.keys(firstStudent).find(k => k.toLowerCase().includes('name'));
    const fileName = nameField && firstStudent[nameField] 
      ? `Certificate_${firstStudent[nameField].replace(/[^a-z0-9]/gi, '_')}.docx` 
      : `Certificate_${i + 1}.docx`;

    zip.file(fileName, docxBlob);
    onProgress(((i + 1) / numChunks) * 100);
  }

  return await zip.generateAsync({ type: 'blob' });
}
