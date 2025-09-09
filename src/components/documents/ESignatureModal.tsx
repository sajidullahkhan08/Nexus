import React, { useRef, useState, useEffect } from 'react';
import { X, Download, PenTool, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardBody, CardHeader } from '../ui/Card';

interface ESignatureModalProps {
  document: {
    _id: string;
    name: string;
    originalName: string;
  };
  onClose: () => void;
  onSign: (signatureData: FormData) => void;
}

export const ESignatureModal: React.FC<ESignatureModalProps> = ({
  document,
  onClose,
  onSign
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        setContext(ctx);
      }
    }
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!context) return;

    setIsDrawing(true);
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    context.beginPath();
    context.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !context) return;

    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    context.lineTo(x, y);
    context.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    if (context) {
      context.closePath();
    }
    setIsDrawing(false);
  };

  const clearSignature = () => {
    if (context && canvasRef.current) {
      context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      setHasSignature(false);
    }
  };

  const handleSign = () => {
    if (!canvasRef.current || !hasSignature) return;

    // Convert canvas to blob
    canvasRef.current.toBlob((blob) => {
      if (blob) {
        const formData = new FormData();
        formData.append('signature', blob, 'signature.png');
        onSign(formData);
      }
    }, 'image/png');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <PenTool size={24} className="text-primary-600" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Add Your Signature</h2>
                <p className="text-sm text-gray-600">{document.name}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              leftIcon={<X size={16} />}
            >
              Close
            </Button>
          </div>
        </CardHeader>

        <CardBody className="space-y-6">
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              Please sign in the box below using your mouse or touch device.
            </p>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
              <canvas
                ref={canvasRef}
                width={400}
                height={200}
                className="border border-gray-300 rounded bg-white cursor-crosshair mx-auto block"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                style={{ touchAction: 'none' }}
              />

              {!hasSignature && (
                <p className="text-gray-400 text-sm mt-2">
                  Click and drag to sign here
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={clearSignature}
              leftIcon={<Trash2 size={16} />}
              disabled={!hasSignature}
            >
              Clear
            </Button>

            <div className="flex space-x-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleSign}
                disabled={!hasSignature}
                leftIcon={<PenTool size={16} />}
              >
                Sign Document
              </Button>
            </div>
          </div>

          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
            <p className="font-medium mb-1">Legal Notice:</p>
            <p>
              By signing this document electronically, you agree that your electronic signature
              is the legal equivalent of your manual signature and has the same legal effect,
              validity, and enforceability.
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};