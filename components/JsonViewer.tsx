
import React from 'react';

interface JsonViewerProps {
  data: any;
}

const JsonViewer: React.FC<JsonViewerProps> = ({ data }) => {
  const formatValue = (val: any): string => {
    if (typeof val === 'string') return `"${val}"`;
    return String(val);
  };

  const renderContent = (obj: any, indent = 0): React.ReactNode => {
    const spacing = '  '.repeat(indent);
    
    if (obj === null) return <span className="text-gray-400">null</span>;
    if (typeof obj !== 'object') {
      const color = typeof obj === 'string' ? 'text-green-600' : 'text-blue-600';
      return <span className={color}>{formatValue(obj)}</span>;
    }

    if (Array.isArray(obj)) {
      if (obj.length === 0) return <span>[]</span>;
      return (
        <span>
          [
          <div className="ml-4">
            {obj.map((item, i) => (
              <div key={i}>
                {renderContent(item, indent + 1)}
                {i < obj.length - 1 ? ',' : ''}
              </div>
            ))}
          </div>
          {spacing}]
        </span>
      );
    }

    const keys = Object.keys(obj);
    if (keys.length === 0) return <span>{`{}`}</span>;

    return (
      <span>
        {`{`}
        <div className="ml-4">
          {keys.map((key, i) => (
            <div key={key}>
              <span className="text-purple-600">"{key}"</span>: {renderContent(obj[key], indent + 1)}
              {i < keys.length - 1 ? ',' : ''}
            </div>
          ))}
        </div>
        {spacing}{`}`}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
        <span className="text-sm font-semibold text-slate-700">Structured JSON Output</span>
        <button 
          onClick={() => navigator.clipboard.writeText(JSON.stringify(data, null, 2))}
          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
        >
          Copy JSON
        </button>
      </div>
      <div className="p-4 overflow-auto max-h-[600px] code-font text-sm leading-relaxed whitespace-pre bg-slate-50/50">
        {renderContent(data)}
      </div>
    </div>
  );
};

export default JsonViewer;
