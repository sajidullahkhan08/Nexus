import React, { useState } from 'react';
import { X, Download, FileText, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardBody } from '../ui/Card';

interface DocumentPreviewProps {
  document: {
    _id: string;
    name: string;
    originalName: string;
    fileUrl: string;
    fileType: string;
  };
  onClose: () => void;
  onDownload: () => void;
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  document,
  onClose,
  onDownload
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isPDF = document.fileType === 'application/pdf';
  const isImage = document.fileType.startsWith('image/');
  const isText = document.fileType === 'text/plain';

  const handleLoad = () => {
    setLoading(false);
  };

  const handleError = () => {
    setLoading(false);
    setError('Failed to load document preview');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <FileText size={24} className="text-primary-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{document.name}</h2>
              <p className="text-sm text-gray-600">{document.fileType.split('/')[1]?.toUpperCase()}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onDownload}
              leftIcon={<Download size={16} />}
            >
              Download
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              leftIcon={<X size={16} />}
            >
              Close
            </Button>
          </div>
        </div>

        {/* Content */}
        <CardBody className="flex-1 overflow-auto p-0">
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <AlertCircle size={48} className="text-red-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Preview Unavailable</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={onDownload} leftIcon={<Download size={16} />}>
                Download File
              </Button>
            </div>
          )}

          {!error && (
            <div className="w-full h-full min-h-[400px]">
              {isPDF ? (
                <iframe
                  src={`${document.fileUrl}#toolbar=0`}
                  className="w-full h-full min-h-[600px]"
                  onLoad={handleLoad}
                  onError={handleError}
                  title={document.name}
                />
              ) : isImage ? (
                <div className="flex items-center justify-center h-full p-4">
                  <img
                    src={document.fileUrl}
                    alt={document.name}
                    className="max-w-full max-h-full object-contain"
                    onLoad={handleLoad}
                    onError={handleError}
                  />
                </div>
              ) : isText ? (
                <iframe
                  src={document.fileUrl}
                  className="w-full h-full min-h-[400px] border-0"
                  onLoad={handleLoad}
                  onError={handleError}
                  title={document.name}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <FileText size={48} className="text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Preview Not Available</h3>
                  <p className="text-gray-600 mb-4">
                    This file type cannot be previewed in the browser.
                  </p>
                  <Button onClick={onDownload} leftIcon={<Download size={16} />}>
                    Download File
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};