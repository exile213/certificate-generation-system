import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Info, BookOpen, ChevronRight } from 'lucide-react';

const actions = [
  {
    to: '/template',
    title: 'Upload Template',
    description: 'Add your Word certificate file and set up placeholders.',
    icon: FileText,
    accent: 'from-indigo-500 to-violet-600',
    iconBg: 'bg-indigo-100 text-indigo-600',
  },
  {
    to: '/about',
    title: 'About',
    description: 'Learn what this system does and who built it.',
    icon: Info,
    accent: 'from-sky-500 to-cyan-600',
    iconBg: 'bg-sky-100 text-sky-600',
  },
  {
    to: '/guide',
    title: 'Guide',
    description: 'Simple walkthrough from template to export.',
    icon: BookOpen,
    accent: 'from-emerald-500 to-teal-600',
    iconBg: 'bg-emerald-100 text-emerald-600',
  },
] as const;

export default function HomePage() {
  return (
    <div className="min-h-full bg-gradient-to-b from-gray-50 via-white to-indigo-50/30">
      <div className="max-w-2xl mx-auto px-6 py-12 md:py-16">
        <div className="text-center mb-10 md:mb-14">
          <p className="text-sm font-medium text-indigo-600 tracking-wide uppercase mb-3">
            Welcome
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight mb-4">
            What would you like to do?
          </h1>
          <p className="text-lg text-gray-600 max-w-md mx-auto leading-relaxed">
            Pick an option below to upload a template, read about the app, or follow the guide.
          </p>
        </div>

        <ul className="space-y-4 md:space-y-5 list-none p-0 m-0">
          {actions.map(({ to, title, description, icon: Icon, accent, iconBg }) => (
            <li key={to}>
              <Link
                to={to}
                className="group flex items-stretch gap-4 md:gap-5 w-full p-5 md:p-6 rounded-2xl bg-white border border-gray-200/80 shadow-sm hover:shadow-md hover:border-indigo-200/80 transition-all duration-200 hover:-translate-y-0.5 text-left"
              >
                <div
                  className={`flex h-14 w-14 md:h-16 md:w-16 shrink-0 items-center justify-center rounded-xl ${iconBg} transition-transform group-hover:scale-105`}
                >
                  <Icon className="w-7 h-7 md:w-8 md:h-8" strokeWidth={1.75} />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <span
                    className={`text-lg md:text-xl font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors`}
                  >
                    {title}
                  </span>
                  <span className="text-sm md:text-base text-gray-500 mt-1 leading-snug">
                    {description}
                  </span>
                </div>
                <div className="flex items-center shrink-0">
                  <span
                    className={`hidden sm:flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${accent} text-white opacity-90 group-hover:opacity-100 transition-opacity`}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </span>
                  <ChevronRight className="w-6 h-6 text-gray-300 group-hover:text-indigo-400 sm:hidden transition-colors" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
