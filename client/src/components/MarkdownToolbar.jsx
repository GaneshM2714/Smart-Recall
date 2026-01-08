import { Bold, Italic, Code, Sigma, List } from 'lucide-react';

function MarkdownToolbar({ textAreaId, onInsert }) {
  
  // Helper to wrap selected text or insert at cursor
  const handleFormat = (startTag, endTag) => {
    const textarea = document.getElementById(textAreaId);
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);

    const newText = 
      text.substring(0, start) + 
      startTag + selectedText + endTag + 
      text.substring(end);

    // Call parent to update state
    onInsert(newText);

    // Restore focus and cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + startTag.length, 
        end + startTag.length
      );
    }, 0);
  };

  return (
    <div className="flex items-center gap-1 p-2 bg-gray-100 dark:bg-gray-800 rounded-t-lg border-b border-gray-200 dark:border-gray-600">
      <button 
        type="button"
        onClick={() => handleFormat('**', '**')}
        className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-700 dark:text-gray-300 transition"
        title="Bold (Ctrl+B)"
      >
        <Bold size={16} />
      </button>
      
      <button 
        type="button"
        onClick={() => handleFormat('*', '*')}
        className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-700 dark:text-gray-300 transition"
        title="Italic (Ctrl+I)"
      >
        <Italic size={16} />
      </button>

      <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1"></div>

      <button 
        type="button"
        onClick={() => handleFormat('`', '`')}
        className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-700 dark:text-gray-300 transition"
        title="Inline Code"
      >
        <Code size={16} />
      </button>

      <button 
        type="button"
        onClick={() => handleFormat('$', '$')}
        className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-700 dark:text-gray-300 transition font-serif font-bold"
        title="Math Equation"
      >
        <Sigma size={16} />
      </button>
      
       <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1"></div>

      <button 
        type="button"
        onClick={() => handleFormat('\n- ', '')}
        className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-700 dark:text-gray-300 transition"
        title="Bulleted List"
      >
        <List size={16} />
      </button>
      
    </div>
  );
}

export default MarkdownToolbar;