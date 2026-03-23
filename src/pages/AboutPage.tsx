import React from 'react';
import { Info } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-full bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-2xl mx-auto px-6 py-10 md:py-14">
        <div className="flex items-center gap-4 mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 shadow-inner">
            <Info className="w-7 h-7" strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">About</h1>
            <p className="text-gray-500 mt-1">What this application is for</p>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200/80 bg-white p-8 md:p-10 shadow-sm space-y-6 text-gray-700 leading-relaxed">
          <p className="text-lg text-gray-800">
            This is the{' '}
            <span className="font-semibold text-indigo-700">
              Automated Certificate Generation System
            </span>
            . It helps you turn one Word certificate template and a list of names or other details into
            many finished certificates—without copying and pasting each one by hand.
          </p>
          <p>
            You upload a <strong className="font-semibold text-gray-900">DOCX</strong> file with simple
            placeholders (tags) where each person&apos;s information should go, then bring in your data from
            an <strong className="font-semibold text-gray-900">Excel</strong> file (or enter a few rows
            yourself). The app fills the template, lets you preview the result, and can export a merged
            document ready to print or share.
          </p>
          <div className="pt-6 mt-2 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Made by{' '}
              <span className="font-semibold text-gray-900">Emil Joaquin H. Diaz</span>
              , with <span className="font-semibold text-gray-900">Carl Iglesia</span> and{' '}
              <span className="font-semibold text-gray-900">Peter Kent Hinolan</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
