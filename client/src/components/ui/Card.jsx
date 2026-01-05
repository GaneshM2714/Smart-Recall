// This component acts as the single source of truth for your "Container" styling
const Card = ({ children, className = "" }) => {
  return (
    <div 
      className={`
        bg-white border border-gray-200 shadow-sm rounded-xl 
        dark:bg-gray-800 dark:border-gray-700 
        transition-colors duration-200 
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default Card;