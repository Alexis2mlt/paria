
import React from 'react';

interface AnalysisCardProps {
  icon: string;
  title: string;
  color: string;
  content: string;
}

const AnalysisCard: React.FC<AnalysisCardProps> = ({ icon, title, color, content }) => {
  return (
    <div className={`bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-${color}-500/50 transition-all shadow-xl`}>
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">{icon}</span>
        <h3 className={`text-xl font-bold uppercase tracking-wider text-${color}-400`}>{title}</h3>
      </div>
      <div className="prose prose-invert max-w-none prose-sm text-slate-300 whitespace-pre-line">
        {content}
      </div>
    </div>
  );
};

export default AnalysisCard;
