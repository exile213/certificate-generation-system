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
 * Build a Docxtemplater instance with a first-page-block-based value-index mapping.
 *
 * The TemplatesPage uses the same split regex to count how many distinct tag
 * occurrences appear on the "first certificate block" of the template — that count
 * becomes fieldOccurrences[tag] (= the number of students per document).
 *
 * For the generator, we mirror that split to assign slot indices:
 *   • Occurrences inside firstPageXml  → sequential slot 0, 1, 2 …
 *   • Occurrences after firstPageXml   → same as the LAST slot (limit−1)
 *
 * Example (2-cert template, data["name"] = ["Emil","Peter"]):
 *   charPos 70438  (Cert Participation — inside firstPage) → slot 0 → "Emil"  ✓
 *   charPos 100233 (Cert Appearance bold — inside firstPage) → slot 1 → "Peter" ✓
 *   charPos 117141 (Cert Appearance inline — after firstPage) → slot 1 → "Peter" ✓
 *
 * The split regex is identical to what TemplatesPage uses so the slot count
 * always matches fieldOccurrences.
 */
function createDocxtemplater(
  zip: PizZip,
  effectiveCounts: Record<string, number> = {}
): Docxtemplater {
  // Maps tag → { lIndex → valueArrayIndex }
  const lIndexValueMap: Record<string, Record<number, number>> = {};

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

          if (!Array.isArray(values)) return values;

          const valueMap = lIndexValueMap[cleanTag];
          let valueIndex = 0;

          if (valueMap) {
            const mapped = valueMap[lIndex];
            if (mapped !== undefined) {
              valueIndex = mapped;
            }
          }

          const result = valueIndex < values.length ? values[valueIndex] : values[values.length - 1] || '';

          return result;
        }
      };
    }
  });

  // @ts-ignore
  const compiled = doc.compiled;
  if (compiled) {
    const docXml = zip.file('word/document.xml')?.asText() || '';

    // Mirror exactly the TemplatesPage firstPageXml split so our slot boundaries match.
    const pageBlockSplitRe = /<w:br\b[^>]*w:type="page"[^>]*\/>|<w:sectPr[\s\S]*?<\/w:sectPr>/i;
    const firstPageXml = docXml.split(pageBlockSplitRe)[0] || docXml;
    const firstPageEndPos = firstPageXml.length; // = start of the matched split block in docXml

    // Collect all lIndexes from word/document.xml
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

    const escRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    Object.entries(allTagLIndexes).forEach(([tag, lIndexes]) => {
      lIndexes.sort((a, b) => a - b);

      const limit = effectiveCounts[tag] || 1;
      const tagRe = new RegExp(`\\{\\{\\s*${escRe(tag)}\\s*\\}\\}`, 'g');
      const allCharPositions: number[] = [];
      let cm;
      while ((cm = tagRe.exec(docXml)) !== null) allCharPositions.push(cm.index);

      const map: Record<number, number> = {};

      if (allCharPositions.length === lIndexes.length) {
        // Occurrences inside firstPageXml are the canonical slots (in document order).
        // Occurrences outside get the same slot as the last canonical occurrence.
        const primaryPositions = allCharPositions.filter(pos => pos < firstPageEndPos);
        const lastSlot = Math.max(0, primaryPositions.length - 1);

        allCharPositions.forEach((pos, i) => {
          let slotIdx: number;
          if (pos < firstPageEndPos) {
            slotIdx = primaryPositions.indexOf(pos);
          } else {
            slotIdx = lastSlot;
          }
          map[lIndexes[i]] = Math.min(slotIdx, limit - 1);
        });
      } else {
        // Fallback: sequential, clamped to last slot.
        lIndexes.forEach((li, i) => { map[li] = Math.min(i, limit - 1); });
      }

      lIndexValueMap[tag] = map;
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
