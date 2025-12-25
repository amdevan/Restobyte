import React from 'react';

// Define a more specific type for icon props
interface IconElementProps {
  size?: string | number;
  className?: string;
  // Allow other props that icons might have, making it flexible
  [key: string]: any; 
}

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  actions?: React.ReactNode;
  onClick?: () => void;
  icon?: React.ReactElement<IconElementProps>; // Use the specific IconElementProps
}

const Card: React.FC<CardProps> = ({ children, className = '', title, actions, icon, onClick }) => {
  return (
    <div 
      className={`bg-white shadow-lg rounded-xl overflow-hidden transition-all duration-300 flex flex-col ${onClick ? 'cursor-pointer hover:shadow-2xl hover:-translate-y-1' : ''} ${className}`}
      onClick={onClick}
    >
      {(title || actions || icon) && (
        <div className="p-5 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center">
            {icon && (
              <span className="mr-2">
                {React.cloneElement(icon, { 
                  size: icon.props.size || 20, // Default size if not provided by the icon's original props
                  className: `${icon.props.className || ''} text-gray-700` // Default color, can be overridden by icon's own class
                })}
              </span>
            )}
            {title && <h3 className="text-lg font-semibold text-gray-800">{title}</h3>}
          </div>
          {actions && <div>{actions}</div>}
        </div>
      )}
      <div className="p-5 flex-grow">
        {children}
      </div>
    </div>
  );
};

export default Card;