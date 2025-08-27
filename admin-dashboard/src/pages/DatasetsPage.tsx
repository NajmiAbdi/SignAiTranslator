import { useEffect, useState } from 'react';
import { Upload, Download, Play, Pause, Trash2, Eye } from 'lucide-react';
import { getDatasets } from '../services/supabase';
import LoadingSpinner from '../components/LoadingSpinner';

interface Dataset {
  dataset_id: string;
  type: string;
  status: 'uploading' | 'processing' | 'training' | 'completed' | 'failed';
  uploaded_by: string;
  trained_model_link: string | null;
  created_at: string;
  metadata: any;
}

export default function DatasetsPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  useEffect(() => {
    loadDatasets();
  }, []);

  const loadDatasets = async () => {
    try {
      const { data, error } = await getDatasets();
      
      if (error) {
        console.error('Error loading datasets:', error);
        setError(error.message || 'Failed to load datasets');
        setDatasets([]);
      } else {
        setDatasets(data || []);
      }
    } catch (err: any) {
      console.error('Datasets page error:', err);
      setError(err.message || 'Failed to load datasets');
      setDatasets([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'training':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'training':
        return <Play className="h-4 w-4" />;
      case 'completed':
        return <Download className="h-4 w-4" />;
      case 'failed':
        return <Pause className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const DatasetCard = ({ dataset }: { dataset: Dataset }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {dataset.type} Dataset
          </h3>
          <p className="text-sm text-gray-500">
            ID: {dataset.dataset_id.slice(0, 8)}...
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(dataset.status)}`}>
            {getStatusIcon(dataset.status)}
            <span className="ml-1 capitalize">{dataset.status}</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">Upload Date</p>
          <p className="text-sm text-gray-900">
            {new Date(dataset.created_at).toLocaleDateString()}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">Uploaded By</p>
          <p className="text-sm text-gray-900">{dataset.uploaded_by}</p>
        </div>
      </div>

      {dataset.metadata && (
        <div className="mb-4">
          <p className="text-xs font-medium text-gray-500 mb-1">Metadata</p>
          <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
            Files: {dataset.metadata.fileCount || 'N/A'} | 
            Size: {dataset.metadata.totalSize || 'N/A'}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          <button className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">
            <Eye className="h-3 w-3 mr-1" />
            View
          </button>
          {dataset.trained_model_link && (
            <button className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 rounded-md hover:bg-primary-100 transition-colors">
              <Download className="h-3 w-3 mr-1" />
              Download Model
            </button>
          )}
        </div>
        <button className="p-1.5 text-gray-400 hover:text-red-600 transition-colors">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {dataset.status === 'training' && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Training Progress</span>
            <span>75%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-primary-600 h-2 rounded-full" style={{ width: '75%' }}></div>
          </div>
        </div>
      )}
    </div>
  );

  const UploadModal = () => (
    uploadModalOpen && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 w-full max-w-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Dataset</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dataset Type
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                <option>American Sign Language (ASL)</option>
                <option>British Sign Language (BSL)</option>
                <option>Indian Sign Language (ISL)</option>
                <option>Custom Dataset</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Files
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  Drop files here or <button className="text-primary-600 hover:text-primary-700">browse</button>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Supports ZIP, CSV, JSON formats
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Optional description for this dataset..."
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => setUploadModalOpen(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
              Upload Dataset
            </button>
          </div>
        </div>
      </div>
    )
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Datasets</h1>
          <p className="text-gray-600">Manage training datasets and AI models</p>
        </div>
        <button
          onClick={() => setUploadModalOpen(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center"
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload Dataset
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-600">Total Datasets</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{datasets.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-600">Training</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {datasets.filter(d => d.status === 'training').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-600">Completed</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {datasets.filter(d => d.status === 'completed').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-600">Failed</p>
          <p className="text-2xl font-bold text-red-600 mt-1">
            {datasets.filter(d => d.status === 'failed').length}
          </p>
        </div>
      </div>

      {/* Datasets Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="large" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">Error loading datasets: {error}</p>
        </div>
      ) : datasets.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Upload className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No datasets found</h3>
          <p className="text-gray-500 mb-4">Get started by uploading your first dataset</p>
          <button
            onClick={() => setUploadModalOpen(true)}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Upload Dataset
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {datasets.map((dataset) => (
            <DatasetCard key={dataset.dataset_id} dataset={dataset} />
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <UploadModal />
    </div>
  );
}