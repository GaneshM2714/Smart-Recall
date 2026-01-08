import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

const RichText = ({ content }) => {
  return (
    // Added 'dark:prose-invert' so text turns white in dark mode
    <div className="prose prose-indigo dark:prose-invert max-w-none leading-relaxed">
      <ReactMarkdown
        children={content}
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // Override paragraph to handle dark mode colors explicitly
          p: ({node, ...props}) => <p className="mb-2 text-gray-800 dark:text-gray-200" {...props} />,
          // Style inline code blocks
          code: ({node, inline, className, children, ...props}) => (
            <code className={`${className} bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-sm font-mono text-pink-600 dark:text-pink-400`} {...props}>
              {children}
            </code>
          )
        }}
      />
    </div>
  );
};

export default RichText;