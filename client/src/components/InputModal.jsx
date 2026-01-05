import { X } from 'lucide-react';

function InputModal({ isOpen, onClose, onSubmit, title, placeholder }) {
  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const value = e.target.elements.inputValue.value;
    if (value.trim()) {
      onSubmit(value);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-96 animate-fade-in">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            name="inputValue"
            autoFocus
            defaultValue={placeholder} // <--- ADD THIS so the old name appears
            className="w-full p-2 border border-gray-300 rounded mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
          // remove placeholder prop if you want, or keep it.
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default InputModal;