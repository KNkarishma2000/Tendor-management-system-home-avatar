import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tenderAdminAPI } from '../../api/auth.service';
import { IndianRupee, ArrowRight, Clock } from 'lucide-react';

// Separate TenderCard component
const TenderCard = ({ tender, onClick }) => {
  const id = tender.id || 'N/A';
  const title = tender.title || 'Untitled Tender';
  const budget = tender.budget_estimate ?? 'N/A';
  const deadline = tender.tender_timeline?.[0]?.submission_deadline;

  return (
    <div
      className="bg-white rounded-[2.5rem] p-8 border border-neutral-100 shadow-sm hover:shadow-2xl transition-all group cursor-pointer flex flex-col justify-between"
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

        <div className="space-y-3 mb-8">
          <div className="flex items-center gap-3 text-sm font-bold text-neutral-600">
            <IndianRupee size={16} className="text-neutral-400" />
            <span>Budget: {budget !== 'N/A' ? `₹${budget.toLocaleString()}` : 'N/A'}</span>
          </div>
          <div className="flex items-center gap-3 text-sm font-bold text-neutral-600">
            <Clock size={16} className="text-neutral-400" />
            <span>
              Deadline: {deadline ? new Date(deadline).toLocaleDateString() : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      <button className="w-full py-4 bg-neutral-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 group-hover:bg-yellow-400 group-hover:text-neutral-900 transition-all">
        View Notice <ArrowRight size={16} />
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
        const res = await tenderAdminAPI.getAllTenders({
          headers: { 'Cache-Control': 'no-cache' }, // always get fresh data
        });

        const allTenders = res.data?.data || [];
        if (Array.isArray(allTenders)) {
          const published = allTenders.filter((t) => t.status === 'PUBLISHED');
          setTenders(published);
        } else {
          console.error('Data received is not an array:', allTenders);
          setError('Unexpected data format from server.');
        }
      } catch (err) {
        console.error('Error fetching tenders:', err);
        setError('Failed to load tenders. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchTenders();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center font-black animate-pulse text-neutral-400 uppercase tracking-widest">
          Loading All Opportunities...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <p className="text-red-500 font-bold">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-8 bg-neutral-50 min-h-screen">
      {/* Header Section */}
      <div className="mb-10 max-w-7xl mx-auto">
        <h1 className="text-4xl font-black text-neutral-900 uppercase tracking-tight">
          Available Tenders
        </h1>
        <p className="text-neutral-500 font-bold">
          Found {tenders.length} active projects open for bidding.
        </p>
      </div>

      {/* Grid Section */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {tenders.length > 0 ? (
          tenders.map((tender) => (
            <TenderCard
              key={tender.id}
              tender={tender}
              onClick={() => navigate(`/supplier/tender/${tender.id}`)}
            />
          ))
        ) : (
          <div className="col-span-full py-20 text-center bg-neutral-100 rounded-[2.5rem] border-2 border-dashed border-neutral-200">
            <p className="font-black text-neutral-400 uppercase">
              No active tenders found at the moment.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
