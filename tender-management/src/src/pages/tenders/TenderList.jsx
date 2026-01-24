import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tenderAdminAPI } from '../../api/auth.service';
import { IndianRupee, ArrowRight, Clock, Download } from 'lucide-react';
import toast from 'react-hot-toast';

// Separate TenderCard component
const TenderCard = ({ tender, onClick }) => {
  const id = tender.id || 'N/A';
  const title = tender.title || 'Untitled Tender';
  const budget = tender.budget_estimate ?? 'N/A';
  const deadline = tender.tender_timeline?.[0]?.submission_deadline;

  // Unified Download Logic using the centralized API Service
  const handleDownload = async (e, filePath, docType) => {
    e.stopPropagation(); // CRITICAL: Prevents navigation to details page
    
    try {
      const loadToast = toast.loading(`Fetching ${docType}...`);
      
      // Using your centralized service: tenderAdminAPI.getTenderFileUrl
      const res = await tenderAdminAPI.getTenderFileUrl({
        path: filePath,
        fileName: `${title.replace(/\s+/g, '_')}_${docType}.pdf`
      });

      if (res.data.success) {
        toast.dismiss(loadToast);
        
        // Create hidden link to trigger browser download behavior
        const link = document.createElement('a');
        link.href = res.data.url;
        link.setAttribute('download', `${docType}.pdf`);
        link.setAttribute('target', '_blank');
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    } catch (err) {
      toast.error("Could not retrieve document.");
      console.error("Download error:", err);
    }
  };

  return (
    <div
      className="bg-white rounded-[2.5rem] p-8 border border-neutral-100 shadow-sm hover:shadow-2xl transition-all group cursor-pointer flex flex-col justify-between h-full"
      onClick={onClick}
    >
      <div>
        <div className="flex justify-between items-start mb-6">
          <div className="bg-yellow-400 text-[10px] font-black px-3 py-1 rounded-full uppercase">
            Active
          </div>
          <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
            ID: {id.slice(0, 8)}
          </p>
        </div>

        <h3 className="text-xl font-black text-neutral-900 mb-4 line-clamp-2 group-hover:text-yellow-600 transition-colors">
          {title}
        </h3>

        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3 text-sm font-bold text-neutral-600">
            <IndianRupee size={16} className="text-neutral-400" />
            <span>Budget: {budget !== 'N/A' ? `₹${budget.toLocaleString('en-IN')}` : 'N/A'}</span>
          </div>
         
        </div>

        {/* Document Quick Links */}
   
      </div>

      <button className="w-full py-4 bg-neutral-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 group-hover:bg-yellow-400 group-hover:text-neutral-900 transition-all">
        View Details <ArrowRight size={16} />
      </button>
    </div>
  );
};

export default function AvailableTenders() {
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTenders = async () => {
      try {
        setLoading(true);
        const res = await tenderAdminAPI.getAllTenders();
        let rawData = res.data?.success ? res.data.data : (Array.isArray(res.data) ? res.data : []);

        if (Array.isArray(rawData)) {
          const published = rawData.filter((t) => t.status === 'PUBLISHED');
          setTenders(published);
        }
      } catch (err) {
        setError('Failed to load tenders. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchTenders();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 font-black uppercase tracking-widest text-neutral-400 animate-pulse">
      Loading Opportunities...
    </div>
  );

  return (
    <div className="p-8 bg-neutral-50 min-h-screen">
      <div className="mb-10 max-w-7xl mx-auto">
        <h1 className="text-4xl font-black text-neutral-900 uppercase">Available Tenders</h1>
        <p className="text-neutral-500 font-bold">
          {error ? <span className="text-red-500">{error}</span> : `Found ${tenders.length} active projects.`}
        </p>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {tenders.map((tender) => (
          <TenderCard 
            key={tender.id} 
            tender={tender} 
            onClick={() => navigate(`/supplier/tender/${tender.id}`)} 
          />
        ))}
      </div>
    </div>
  );
}