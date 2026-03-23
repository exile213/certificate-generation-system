import { create } from 'zustand';

export interface StudentData {
  [key: string]: string;
}

interface CertificateState {
  templateFile: ArrayBuffer | null;
  templateFileName: string | null;
  templateFields: string[];
  maxOccurrences: number;
  fieldOccurrences: Record<string, number>;
  fieldRepeatMap: Record<string, boolean>;
  students: StudentData[];
  previewValues: Record<string, string>;
  
  setTemplateFile: (file: ArrayBuffer | null, fileName: string | null, fields: string[], maxOccurrences?: number, fieldOccurrences?: Record<string, number>) => void;
  setFieldRepeatMap: (map: Record<string, boolean>) => void;
  updateFieldRepeat: (field: string, repeat: boolean) => void;
  setStudents: (students: StudentData[]) => void;
  addStudent: (data: StudentData) => void;
  addMultipleStudents: (dataArray: StudentData[]) => void;
  duplicateStudent: (index: number) => void;
  duplicateStudentMultiple: (index: number, count: number) => void;
  deleteStudent: (index: number) => void;
  updateStudent: (index: number, data: StudentData) => void;
  updatePreviewValue: (key: string, value: string) => void;
  clearData: () => void;
}

export const useCertificateStore = create<CertificateState>((set) => ({
  templateFile: null,
  templateFileName: null,
  templateFields: [],
  maxOccurrences: 1,
  fieldOccurrences: {},
  fieldRepeatMap: {},
  students: [],
  previewValues: {},
  
  setTemplateFile: (file, fileName, fields, maxOccurrences = 1, fieldOccurrences = {}) => set({ 
    templateFile: file, 
    templateFileName: fileName, 
    templateFields: fields,
    maxOccurrences,
    fieldOccurrences,
    fieldRepeatMap: fields.reduce((acc, field) => ({ ...acc, [field]: true }), {}),
    previewValues: fields.reduce((acc, field) => ({ ...acc, [field]: '' }), {})
  }),
  setFieldRepeatMap: (map) => set({ fieldRepeatMap: map }),
  updateFieldRepeat: (field, repeat) => set((state) => ({
    fieldRepeatMap: { ...state.fieldRepeatMap, [field]: repeat }
  })),
  setStudents: (students) => set({ students }),
  addStudent: (data) => set((state) => ({
    students: [...state.students, data]
  })),
  addMultipleStudents: (dataArray) => set((state) => ({
    students: [...state.students, ...dataArray]
  })),
  duplicateStudent: (index) => set((state) => {
    const uncheckedFields = Object.keys(state.fieldRepeatMap).filter(k => state.fieldRepeatMap[k] === false);
    let step = 1;
    if (uncheckedFields.length > 0) {
      step = Math.max(...uncheckedFields.map(k => state.fieldOccurrences[k] || 1));
    }

    const newStudents = [...state.students];
    const emptyRecord = state.templateFields.reduce((acc, field) => ({ ...acc, [field]: '' }), {});
    
    // Pad to multiple of step
    const remainder = newStudents.length % step;
    if (remainder !== 0) {
      const padCount = step - remainder;
      for (let i = 0; i < padCount; i++) {
        newStudents.push({ ...emptyRecord });
      }
    }

    const chunkStart = Math.floor(index / step) * step;
    const pageToDuplicate = newStudents.slice(chunkStart, chunkStart + step).map(s => ({ ...s }));
    
    newStudents.splice(chunkStart + step, 0, ...pageToDuplicate);
    return { students: newStudents };
  }),
  duplicateStudentMultiple: (index, count) => set((state) => {
    const uncheckedFields = Object.keys(state.fieldRepeatMap).filter(k => state.fieldRepeatMap[k] === false);
    let step = 1;
    if (uncheckedFields.length > 0) {
      step = Math.max(...uncheckedFields.map(k => state.fieldOccurrences[k] || 1));
    }

    const newStudents = [...state.students];
    const emptyRecord = state.templateFields.reduce((acc, field) => ({ ...acc, [field]: '' }), {});
    
    // Pad to multiple of step
    const remainder = newStudents.length % step;
    if (remainder !== 0) {
      const padCount = step - remainder;
      for (let i = 0; i < padCount; i++) {
        newStudents.push({ ...emptyRecord });
      }
    }

    const chunkStart = Math.floor(index / step) * step;
    const pageToDuplicate = newStudents.slice(chunkStart, chunkStart + step);
    
    const copies = [];
    for (let i = 0; i < count; i++) {
      copies.push(...pageToDuplicate.map(s => ({ ...s })));
    }
    
    newStudents.splice(chunkStart + step, 0, ...copies);
    return { students: newStudents };
  }),
  deleteStudent: (index) => set((state) => {
    const uncheckedFields = Object.keys(state.fieldRepeatMap).filter(k => state.fieldRepeatMap[k] === false);
    let step = 1;
    if (uncheckedFields.length > 0) {
      step = Math.max(...uncheckedFields.map(k => state.fieldOccurrences[k] || 1));
    }

    const newStudents = [...state.students];
    const emptyRecord = state.templateFields.reduce((acc, field) => ({ ...acc, [field]: '' }), {});
    
    // Pad to multiple of step
    const remainder = newStudents.length % step;
    if (remainder !== 0) {
      const padCount = step - remainder;
      for (let i = 0; i < padCount; i++) {
        newStudents.push({ ...emptyRecord });
      }
    }

    const chunkStart = Math.floor(index / step) * step;
    newStudents.splice(chunkStart, step);
    return { students: newStudents };
  }),
  updateStudent: (index, data) => set((state) => {
    const newStudents = [...state.students];
    newStudents[index] = data;
    return { students: newStudents };
  }),
  updatePreviewValue: (key, value) => set((state) => ({
    previewValues: { ...state.previewValues, [key]: value }
  })),
  clearData: () => set({ templateFile: null, templateFileName: null, templateFields: [], maxOccurrences: 1, fieldOccurrences: {}, fieldRepeatMap: {}, students: [], previewValues: {} }),
}));
