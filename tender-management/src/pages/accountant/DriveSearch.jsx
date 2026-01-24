import React, { useState } from 'react';
import { financeAPI } from '../../api/auth.service'; // Adjust path to your service file
import { Search, ExternalLink, FileText, Folder, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AccountantDriveSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setLoading(true);
    try {
      const { data } = await financeAPI.searchDrive(searchTerm);
      if (data.success) {
        setFiles(data.data);
      }
    } catch (err) {
      toast.error("Could not reach Google Drive");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-[2rem] shadow-sm border border-neutral-100">
      <div className="mb-8">
        <h2 className="text-2xl font-black text-neutral-900 flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Search className="text-blue-600" size={24} />
          </div>
          Central Document Search
        </h2>
        <p className="text-neutral-500 font-medium mt-1">Access all association files from the linked Google Drive</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <input 
          type="text"
          className="flex-1 bg-neutral-100 border-none rounded-xl px-6 py-4 font-bold focus:ring-2 ring-blue-500 outline-none"
          placeholder="Search invoices, reports, audit docs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button 
          disabled={loading}
          className="bg-neutral-900 text-white px-8 rounded-xl font-black hover:bg-blue-600 transition-all flex items-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : "SEARCH"}
        </button>
      </form>

      <div className="space-y-2">
        {files.length > 0 ? files.map((file) => (
          <div key={file.id} className="group flex items-center justify-between p-4 rounded-2xl border border-neutral-50 hover:border-blue-200 hover:bg-blue-50/50 transition-all">
            <div className="flex items-center gap-4">
              {file.mimeType.includes('folder') ? (
                <Folder className="text-yellow-500" fill="currentColor" />
              ) : (
                <FileText className="text-neutral-400" />
              )}
              <div>
                <p className="font-bold text-neutral-900 text-sm">{file.name}</p>
                <p className="text-[10px] uppercase font-black text-neutral-400">
                  {file.mimeType.split('.').pop()} • Modified {new Date(file.modifiedTime).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <a 
              href={file.webViewLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg text-xs font-black text-neutral-900 shadow-sm border border-neutral-100 hover:bg-neutral-900 hover:text-white transition-all"
            >
              VIEW <ExternalLink size={14} />
            </a>
          </div>
        )) : !loading && (
          <div className="text-center py-12 text-neutral-400">
            <p className="italic font-medium">Type a filename to search the cloud storage.</p>
          </div>
        )}
      </div>
    </div>
  );
}