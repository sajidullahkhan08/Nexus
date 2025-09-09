import React, { useState, useEffect, useRef } from 'react';
import { FileText, Upload, Download, Trash2, Share2, Eye, Plus, File, Image, FileSpreadsheet, Presentation, PenTool } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { documentAPI } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { DocumentPreview } from '../../components/documents/DocumentPreview';
import { ESignatureModal } from '../../components/documents/ESignatureModal';
import toast from 'react-hot-toast';

interface Document {
  _id: string;
  name: string;
  originalName: string;
  description?: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  category: string;
  status: string;
  tags: string[];
  owner: {
    _id: string;
    name: string;
  };
  sharedWith: any[];
  signatures: any[];
  createdAt: string;
  updatedAt: string;
}

export const DocumentsPage: React.FC = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);
  const [signatureDocument, setSignatureDocument] = useState<Document | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchDocuments();
  }, [selectedCategory, searchTerm]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (selectedCategory) params.category = selectedCategory;
      if (searchTerm) params.search = searchTerm;

      const response = await documentAPI.getDocuments(params);
      setDocuments(response.data.data.documents);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                         'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                         'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                         'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a valid document file (PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT)');
      return;
    }

    // Validate file size (25MB limit)
    if (file.size > 25 * 1024 * 1024) {
      toast.error('File size must be less than 25MB');
      return;
    }

    const formData = new FormData();
    formData.append('document', file);
    formData.append('name', file.name);
    formData.append('category', 'pitch-deck'); // Default category

    try {
      setUploading(true);
      await documentAPI.uploadDocument(formData);
      toast.success('Document uploaded successfully');
      fetchDocuments();
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload document');
    } finally {
      setUploading(false);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownload = async (document: Document) => {
    try {
      const response = await documentAPI.downloadDocument(document._id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', document.originalName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Download started');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download document');
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      await documentAPI.deleteDocument(documentId);
      toast.success('Document deleted successfully');
      fetchDocuments();
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Failed to delete document');
    }
  };

  const handlePreview = (document: Document) => {
    setPreviewDocument(document);
  };

  const handleSign = async (signatureData: FormData) => {
    if (!signatureDocument) return;

    try {
      await documentAPI.addSignature(signatureDocument._id, signatureData);
      toast.success('Document signed successfully');
      setSignatureDocument(null);
      fetchDocuments();
    } catch (error) {
      console.error('Signature failed:', error);
      toast.error('Failed to sign document');
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return <FileText size={24} className="text-red-600" />;
    if (fileType.includes('spreadsheet') || fileType.includes('excel')) return <FileSpreadsheet size={24} className="text-green-600" />;
    if (fileType.includes('presentation') || fileType.includes('powerpoint')) return <Presentation size={24} className="text-orange-600" />;
    if (fileType.includes('image')) return <Image size={24} className="text-blue-600" />;
    return <File size={24} className="text-gray-600" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'pitch-deck': return 'primary';
      case 'business-plan': return 'secondary';
      case 'financial': return 'accent';
      case 'legal': return 'error';
      default: return 'gray';
    }
  };
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-600">Manage your startup's important files</p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
            className="hidden"
          />
          <Button
            leftIcon={<Upload size={18} />}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : 'Upload Document'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Storage info */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <h2 className="text-lg font-medium text-gray-900">Storage</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Used</span>
                <span className="font-medium text-gray-900">
                  {formatFileSize(documents.reduce((total, doc) => total + doc.fileSize, 0))}
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full">
                <div
                  className="h-2 bg-primary-600 rounded-full"
                  style={{
                    width: `${Math.min((documents.reduce((total, doc) => total + doc.fileSize, 0) / (100 * 1024 * 1024)) * 100, 100)}%`
                  }}
                ></div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Available</span>
                <span className="font-medium text-gray-900">100 MB</span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Categories</h3>
              <div className="space-y-2">
                <button
                  className={`w-full text-left px-3 py-2 text-sm rounded-md ${
                    selectedCategory === '' ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedCategory('')}
                >
                  All Documents
                </button>
                <button
                  className={`w-full text-left px-3 py-2 text-sm rounded-md ${
                    selectedCategory === 'pitch-deck' ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedCategory('pitch-deck')}
                >
                  Pitch Decks
                </button>
                <button
                  className={`w-full text-left px-3 py-2 text-sm rounded-md ${
                    selectedCategory === 'business-plan' ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedCategory('business-plan')}
                >
                  Business Plans
                </button>
                <button
                  className={`w-full text-left px-3 py-2 text-sm rounded-md ${
                    selectedCategory === 'financial' ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedCategory('financial')}
                >
                  Financial Docs
                </button>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Document list */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">All Documents</h2>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </CardHeader>
            <CardBody>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-8">
                  <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || selectedCategory ? 'Try adjusting your search or filter criteria.' : 'Upload your first document to get started.'}
                  </p>
                  {!searchTerm && !selectedCategory && (
                    <Button
                      leftIcon={<Upload size={18} />}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Upload Document
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {documents.map(doc => (
                    <div
                      key={doc._id}
                      className="flex items-center p-4 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                    >
                      <div className="p-2 bg-primary-50 rounded-lg mr-4">
                        {getFileIcon(doc.fileType)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {doc.name}
                          </h3>
                          <Badge variant={getCategoryBadgeColor(doc.category)} size="sm">
                            {doc.category.replace('-', ' ')}
                          </Badge>
                          {doc.sharedWith.length > 0 && (
                            <Badge variant="secondary" size="sm">Shared</Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          <span>{doc.fileType.split('/')[1]?.toUpperCase()}</span>
                          <span>{formatFileSize(doc.fileSize)}</span>
                          <span>Modified {new Date(doc.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-2"
                          onClick={() => handlePreview(doc)}
                          title="Preview"
                        >
                          <Eye size={18} />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-2"
                          onClick={() => handleDownload(doc)}
                          title="Download"
                        >
                          <Download size={18} />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-2"
                          onClick={() => setSignatureDocument(doc)}
                          title="Sign Document"
                        >
                          <PenTool size={18} />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-2"
                          title="Share"
                        >
                          <Share2 size={18} />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-2 text-error-600 hover:text-error-700"
                          onClick={() => handleDelete(doc._id)}
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Document Preview Modal */}
      {previewDocument && (
        <DocumentPreview
          document={previewDocument}
          onClose={() => setPreviewDocument(null)}
          onDownload={() => handleDownload(previewDocument)}
        />
      )}

      {/* E-Signature Modal */}
      {signatureDocument && (
        <ESignatureModal
          document={signatureDocument}
          onClose={() => setSignatureDocument(null)}
          onSign={handleSign}
        />
      )}
    </div>
  );
};