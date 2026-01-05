import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css'; // Import the CSS for math

const RichText = ({ content }) => {
  return (
    <div className="prose prose-blue max-w-none">
      <ReactMarkdown
        children={content}
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
            // Styling overrides if needed
            p: ({node, ...props}) => <p className="mb-2 text-gray-800" {...props} />,
            code: ({node, inline, className, children, ...props}) => (
                <code className={`${className} bg-gray-100 px-1 rounded text-sm font-mono text-pink-600`} {...props}>
                  {children}
                </code>
            )
        }}
      />
    </div>
  );
};

export default RichText;