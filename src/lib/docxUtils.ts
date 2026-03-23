import PizZip from 'pizzip';

/**
 * Preprocesses a DOCX zip file to merge split delimiters (e.g. {{ and }}).
 * Word often splits consecutive characters into separate XML text nodes,
 * which prevents docxtemplater from recognizing the tags.
 * This function finds `{` and `{` separated only by XML tags, and merges them.
 */
export function preprocessDocxZip(zip: PizZip): PizZip {
  // Find all XML files that might contain text
  const xmlFiles = zip.file(/^word\/(document|header|footer|footnotes|endnotes).*\.xml$/);
  
  xmlFiles.forEach((file) => {
    let content = file.asText();
    
    // Merge split {{
    // Matches '{' followed by one or more XML tags, followed by '{'
    // Replaces with '{{' followed by the matched XML tags
    content = content.replace(/\{((?:<[^>]+>)+)\{/g, '{{$1');
    
    // Merge split }}
    // Matches '}' followed by one or more XML tags, followed by '}'
    // Replaces with '}}' followed by the matched XML tags
    content = content.replace(/\}((?:<[^>]+>)+)\}/g, '}}$1');
    
    // Update the file in the zip
    zip.file(file.name, content);
  });
  
  return zip;
}

/**
 * Preprocesses a DOCX ArrayBuffer to merge split delimiters, returning the modified ArrayBuffer.
 */
export function preprocessTemplateBuffer(buffer: ArrayBuffer): ArrayBuffer {
  const zip = new PizZip(buffer);
  preprocessDocxZip(zip);
  return zip.generate({ type: 'arraybuffer' }) as ArrayBuffer;
}
