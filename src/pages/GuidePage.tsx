import React from 'react';
import { BookOpen, Lightbulb } from 'lucide-react';

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-gray-200/80 bg-white p-6 md:p-8 shadow-sm">
      <h2 className="text-xl font-bold text-gray-900 mb-1">{title}</h2>
      {subtitle && <p className="text-sm text-indigo-600 font-medium mb-4">{subtitle}</p>}
      <div className="text-gray-700 leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

export default function GuidePage() {
  return (
    <div className="min-h-full bg-gradient-to-b from-gray-50 to-indigo-50/20">
      <div className="max-w-2xl mx-auto px-6 py-10 md:py-14">
        <div className="flex items-center gap-4 mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 shadow-inner">
            <BookOpen className="w-7 h-7" strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Guide</h1>
            <p className="text-gray-500 mt-1">Easy steps from start to finish</p>
          </div>
        </div>

        <div className="space-y-6">
          <Section title="Template" subtitle="Start here">
            <ul className="list-none space-y-3 pl-0">
              <li className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" aria-hidden />
                <span>
                  Open <strong className="font-medium text-gray-900">Template</strong> in the sidebar and
                  upload your certificate as a Word file (<strong className="font-medium text-gray-900">.docx</strong>).
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" aria-hidden />
                <span>
                  In Word, use placeholders like{' '}
                  <code className="text-sm bg-gray-100 px-2 py-0.5 rounded-md text-indigo-800">{`{{name}}`}</code> or{' '}
                  <code className="text-sm bg-gray-100 px-2 py-0.5 rounded-md text-indigo-800">{`{{school}}`}</code>{' '}
                  where data should go. Use the same spelling later for your Excel column titles.
                </span>
              </li>
            </ul>
          </Section>

          <Section title="Data import" subtitle="Add your list">
            <ul className="list-none space-y-3 pl-0">
              <li className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
                <span>
                  Go to <strong className="font-medium text-gray-900">Data Import</strong> and upload an Excel
                  file (<strong className="font-medium text-gray-900">.xlsx</strong> or{' '}
                  <strong className="font-medium text-gray-900">.csv</strong>) with one row per person.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
                <span>
                  Each column heading should match a placeholder from your template. If you see warnings about
                  missing or extra columns, adjust the Excel headers or your Word tags until they match.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
                <span>
                  If the same tag appears more than once on one page (for example, several certificates on one
                  sheet), use the options on that screen so the app knows how to group rows—the labels on the page
                  will guide you.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
                <span>
                  You can skip the file and enter a few people by hand on the next step if you only need a small
                  list.
                </span>
              </li>
            </ul>
          </Section>

          <Section title="Export" subtitle="Preview and download">
            <ul className="list-none space-y-3 pl-0">
              <li className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" aria-hidden />
                <span>
                  Open <strong className="font-medium text-gray-900">Export</strong> and use the preview to check
                  each page.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" aria-hidden />
                <span>
                  When everything looks right, download the merged Word file and open it in Word to print or share.
                </span>
              </li>
            </ul>
          </Section>

          <div className="flex gap-4 rounded-2xl border border-amber-200/80 bg-amber-50/80 px-5 py-4 text-amber-950">
            <Lightbulb className="w-6 h-6 shrink-0 text-amber-600 mt-0.5" />
            <p className="text-sm leading-relaxed">
              <strong className="font-semibold text-amber-900">Tip:</strong> Work in order—template first, then
              data, then export—so nothing is missing when you generate the file.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
