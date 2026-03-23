import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Database, Download, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-3xl w-full text-center space-y-8">
        
        {/* Logo and Title */}
        <div className="flex flex-col items-center gap-6">
          <img 
            src="/lime.png"
            alt="Certificate system logo"
            className="w-48 h-auto object-contain drop-shadow-sm"
            referrerPolicy="no-referrer"
          />
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
            Automated Certificate Generation System
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Easily generate hundreds of personalized certificates in minutes. Upload your DOCX template, import your Excel data, and export perfectly formatted documents.
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-4">
          <button
            onClick={() => navigate('/home')}
            className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white text-lg font-semibold rounded-xl hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            Get Started
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">1. Upload Template</h3>
            <p className="text-sm text-gray-500">Upload your DOCX file with {'{{tags}}'} where you want data to be inserted.</p>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">2. Import Data</h3>
            <p className="text-sm text-gray-500">Upload an Excel file with your student or participant data to map to your tags.</p>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
              <Download className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">3. Export & Print</h3>
            <p className="text-sm text-gray-500">Preview your certificates and export them all as a single merged DOCX file.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
