'use client';

interface TestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TestModal({ isOpen, onClose }: TestModalProps) {
  console.log('TestModal render - isOpen:', isOpen);
  
  if (!isOpen) {
    console.log('TestModal returning null because isOpen is false');
    return null;
  }

  console.log('TestModal rendering modal content');

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" 
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg p-6 max-w-md w-full mx-4" 
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4">Test Modal</h2>
        <p className="text-gray-600 mb-4">If you can see this, the modal system is working!</p>
        <div className="flex space-x-3">
          <button 
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
