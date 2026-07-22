import React, { useState, useRef, useEffect } from 'react';
import { X, Edit2, Pencil, Trash } from 'lucide-react';

interface SignaturePadProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (signatureData: string, name: string) => void;
  title?: string;
  defaultName?: string;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Verify & Sign Document",
  defaultName = ""
}) => {
  const [activeTab, setActiveTab] = useState<'draw' | 'type'>('draw');
  const [typedName, setTypedName] = useState(defaultName);
  const [typedFont, setTypedFont] = useState<'cursive' | 'serif' | 'script'>('cursive');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasCanvasContent, setHasCanvasContent] = useState(false);

  // Initialize Canvas Drawing context
  const getCanvasContext = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    return { canvas, ctx };
  };

  useEffect(() => {
    if (isOpen && activeTab === 'draw') {
      // Small timeout to allow canvas to render in DOM
      const timer = setTimeout(() => {
        const canvasObj = getCanvasContext();
        if (canvasObj) {
          const { canvas, ctx } = canvasObj;
          
          // Clear background to pure white for print compatibility
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          ctx.strokeStyle = '#1e3a8a'; // Royal Blue ink
          ctx.lineWidth = 2.5;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, activeTab]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvasObj = getCanvasContext();
    if (!canvasObj) return;
    const { canvas, ctx } = canvasObj;

    const rect = canvas.getBoundingClientRect();
    let x, y;
    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasCanvasContent(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvasObj = getCanvasContext();
    if (!canvasObj) return;
    const { canvas, ctx } = canvasObj;

    const rect = canvas.getBoundingClientRect();
    let x, y;
    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
      // Prevent scrolling when drawing on touch screens
      if (e.cancelable) e.preventDefault();
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvasObj = getCanvasContext();
    if (!canvasObj) return;
    const { canvas, ctx } = canvasObj;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasCanvasContent(false);
  };

  const handleSave = () => {
    if (activeTab === 'draw') {
      const canvas = canvasRef.current;
      if (!canvas || !hasCanvasContent) return;
      // Export canvas image
      const signatureData = canvas.toDataURL('image/png');
      onConfirm(signatureData, typedName || "Client Signatory");
    } else {
      if (!typedName.trim()) return;
      // Create a temporary canvas to render typed signature as image to make it vector-portable and printable
      const canvas = document.createElement('canvas');
      canvas.width = 450;
      canvas.height = 150;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#1e3a8a'; // Ink color
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        if (typedFont === 'cursive') {
          ctx.font = "italic 40px 'Caveat', cursive, Brush Script MT, sans-serif";
        } else if (typedFont === 'script') {
          ctx.font = "italic 36px 'Dancing Script', Brush Script MT, sans-serif";
        } else {
          ctx.font = "italic 32px 'Playfair Display', Georgia, serif";
        }
        
        ctx.fillText(typedName, canvas.width / 2, canvas.height / 2);
        
        // Add a subtle underline
        ctx.strokeStyle = 'rgba(30, 58, 138, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(50, 110);
        ctx.quadraticCurveTo(225, 120, 400, 110);
        ctx.stroke();
        
        const signatureData = canvas.toDataURL('image/png');
        onConfirm(signatureData, typedName);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-fade-in no-print">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 tracking-tight text-lg">{title}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Tab Headers */}
        <div className="flex border-b border-gray-100 px-6">
          <button
            onClick={() => setActiveTab('draw')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 text-sm font-medium transition-all ${
              activeTab === 'draw'
                ? 'border-black text-black'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <Pencil size={15} />
            Draw Signature
          </button>
          <button
            onClick={() => setActiveTab('type')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 text-sm font-medium transition-all ${
              activeTab === 'type'
                ? 'border-black text-black'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <Edit2 size={15} />
            Type Signature
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 flex-1 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Signee Full Name</label>
            <input
              type="text"
              placeholder="e.g. Jane Doe"
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-black text-sm text-gray-900 font-medium"
            />
          </div>

          {activeTab === 'draw' ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Draw in the box below</label>
                <button
                  onClick={clearCanvas}
                  className="flex items-center gap-1 text-[11px] font-bold text-red-500 hover:text-red-700 transition-colors uppercase tracking-wider"
                >
                  <Trash size={12} />
                  Clear Ink
                </button>
              </div>
              <div className="border border-gray-200 rounded-2xl overflow-hidden bg-gray-50 h-44 relative cursor-crosshair">
                <canvas
                  ref={canvasRef}
                  width={450}
                  height={176}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-full block"
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Choose signature font</label>
                <div className="flex gap-1.5 bg-gray-50 border border-gray-100 rounded-lg p-0.5">
                  <button
                    onClick={() => setTypedFont('cursive')}
                    className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded transition-colors ${
                      typedFont === 'cursive' ? 'bg-white shadow-sm text-black' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    Caveat
                  </button>
                  <button
                    onClick={() => setTypedFont('script')}
                    className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded transition-colors ${
                      typedFont === 'script' ? 'bg-white shadow-sm text-black' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    Dancing
                  </button>
                  <button
                    onClick={() => setTypedFont('serif')}
                    className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded transition-colors ${
                      typedFont === 'serif' ? 'bg-white shadow-sm text-black' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    Serif
                  </button>
                </div>
              </div>
              <div className="border border-gray-200 rounded-2xl bg-gray-50 h-44 flex items-center justify-center p-4 relative overflow-hidden select-none">
                {typedName.trim() ? (
                  <span
                    className={`text-4xl text-blue-900 text-center tracking-wide font-medium italic select-none`}
                    style={{
                      fontFamily:
                        typedFont === 'cursive'
                          ? "'Caveat', cursive, Brush Script MT"
                          : typedFont === 'script'
                          ? "'Dancing Script', Brush Script MT"
                          : "'Playfair Display', Georgia, serif"
                    }}
                  >
                    {typedName}
                  </span>
                ) : (
                  <span className="text-sm text-gray-400 italic">Preview will appear here</span>
                )}
                {/* Subtle signing line */}
                <div className="absolute bottom-10 left-12 right-12 border-b border-gray-200/50"></div>
              </div>
            </div>
          )}

          <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-[10px] text-gray-400 space-y-1 mt-1 leading-relaxed">
            <p>🔒 <b>Secure Digital Stamp:</b> Applying this signature will record your printed name, approval timestamp, and simulated authorization IP (verified verification audit trail).</p>
            <p>📅 <b>Signing Date:</b> {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-200 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={activeTab === 'draw' ? !hasCanvasContent : !typedName.trim()}
            className="px-5 py-2 bg-black hover:bg-gray-800 disabled:bg-gray-200 text-white rounded-xl text-xs font-semibold cursor-pointer disabled:cursor-not-allowed transition-colors"
          >
            Sign Document
          </button>
        </div>
      </div>
    </div>
  );
};
