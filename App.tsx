
import React, { useState, useCallback, useRef } from 'react';
import { 
  FileJson, 
  Upload, 
  FileText, 
  AlertCircle, 
  Loader2, 
  ArrowRight,
  CheckCircle2,
  Trash2,
  Image as ImageIcon
} from 'lucide-react';
import { AppStatus, ExtractionResult } from './types';
import { processDocument } from './services/geminiService';
import JsonViewer from './components/JsonViewer';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith('image/') && selectedFile.type !== 'application/pdf') {
        setError('Please upload an image or PDF file.');
        return;
      }
      
      setFile(selectedFile);
      setError(null);
      setResult(null);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
      setStatus(AppStatus.IDLE);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setStatus(AppStatus.IDLE);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result?.toString().split(',')[1];
        if (base64String) resolve(base64String);
        else reject(new Error('Failed to convert file to base64'));
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleProcess = async () => {
    if (!file) return;

    setStatus(AppStatus.PROCESSING);
    setError(null);

    try {
      const base64 = await convertFileToBase64(file);
      const data = await processDocument(base64, file.type);
      setResult(data);
      setStatus(AppStatus.SUCCESS);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred during processing.');
      setStatus(AppStatus.ERROR);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <FileJson className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">PDF2JSON <span className="text-indigo-600">AI</span></h1>
          </div>
          <div className="text-sm text-slate-500 font-medium hidden sm:block">
            Intelligent Document Extraction
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* Left Column: Upload and Preview */}
          <div className="space-y-6">
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-indigo-500" />
                Upload Document
              </h2>
              
              {!file ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 rounded-xl p-10 flex flex-col items-center justify-center gap-4 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all cursor-pointer group"
                >
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                    <Upload className="w-8 h-8 text-slate-400 group-hover:text-indigo-600" />
                  </div>
                  <div className="text-center">
                    <p className="text-slate-700 font-medium">Click to select file</p>
                    <p className="text-slate-400 text-sm mt-1">Image or PDF (Max 10MB)</p>
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleFileChange}
                    accept="image/*,application/pdf"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative group">
                    <div className="bg-slate-100 rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center aspect-video sm:aspect-auto sm:min-h-[300px]">
                      {file.type === 'application/pdf' ? (
                        <div className="flex flex-col items-center gap-3 py-12">
                          <FileText className="w-16 h-16 text-red-500" />
                          <p className="text-slate-600 font-medium">{file.name}</p>
                        </div>
                      ) : (
                        <img 
                          src={preview!} 
                          alt="Preview" 
                          className="max-h-[500px] w-full object-contain"
                        />
                      )}
                    </div>
                    <button 
                      onClick={handleReset}
                      className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-full shadow-lg transition-all backdrop-blur-sm"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleProcess}
                      disabled={status === AppStatus.PROCESSING}
                      className="flex-grow bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold py-3 px-6 rounded-xl shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2"
                    >
                      {status === AppStatus.PROCESSING ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Analyzing with AI...
                        </>
                      ) : (
                        <>
                          Process Document
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-700">
                  <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}
            </section>

            {/* Features Guide (Contextual) */}
            {!file && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-start gap-3">
                  <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">OCR & Vision</h3>
                    <p className="text-xs text-slate-500 mt-1">High-accuracy extraction for both typed and handwritten text.</p>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-start gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                    <FileJson className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">JSON Formatting</h3>
                    <p className="text-xs text-slate-500 mt-1">Automatic schema generation for complex documents.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Results */}
          <div className="space-y-6 lg:sticky lg:top-24">
            {status === AppStatus.IDLE && !result && (
              <div className="bg-slate-100/50 border-2 border-dashed border-slate-200 rounded-2xl p-12 flex flex-col items-center justify-center text-center opacity-60 h-full min-h-[400px]">
                <FileJson className="w-16 h-16 text-slate-300 mb-4" />
                <h3 className="text-slate-500 font-medium italic">JSON result will appear here after processing</h3>
              </div>
            )}

            {status === AppStatus.PROCESSING && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex flex-col items-center justify-center text-center space-y-4 min-h-[400px]">
                <div className="relative">
                  <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Processing Document</h3>
                  <p className="text-slate-500 mt-2 text-sm max-w-[280px]">
                    Gemini AI is interpreting content, recognizing patterns, and structuring data...
                  </p>
                </div>
              </div>
            )}

            {result && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="mb-6 bg-green-50 border border-green-100 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-1.5 rounded-full text-green-600">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-green-900">Success!</p>
                      <p className="text-xs text-green-700">Data structured as requested.</p>
                    </div>
                  </div>
                  <div className="px-2 py-1 bg-green-100 text-green-700 rounded text-[10px] font-bold uppercase tracking-wider">
                    {result.metadata.documentType}
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Meta Summary Cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-slate-200">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Confidence</p>
                      <p className="text-lg font-bold text-slate-900">{(result.metadata.confidenceScore * 100).toFixed(0)}%</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Language</p>
                      <p className="text-lg font-bold text-slate-900 uppercase">{result.metadata.detectedLanguage}</p>
                    </div>
                  </div>

                  {/* Main JSON Viewer */}
                  <JsonViewer data={result} />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-400 text-xs">
          <p>© {new Date().getFullYear()} PDF2JSON AI. Powered by Google Gemini 3.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
