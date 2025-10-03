import React from "react";

export default function UserAvatar({ user, size = "sm" }) {
  const sizeClasses = {
    xs: "w-5 h-5 text-[9px]",
    sm: "w-6 h-6 text-[10px]",
    md: "w-8 h-8 text-xs",
    lg: "w-12 h-12 text-sm",
    xl: "w-16 h-16 text-lg"
  };

  if (user?.avatar_url) {
    return (
      <img 
        src={user.avatar_url} 
        alt={user.full_name || user.email}
        className={`${sizeClasses[size]} rounded-full object-cover`}
      />
    );
  }

  const initial = (user?.full_name?.[0] || user?.email?.[0] || 'U').toUpperCase();
  
  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-[#0A4D4E] to-[#0A4D4E]/80 flex items-center justify-center flex-shrink-0`}>
      <span className={`font-semibold text-white ${sizeClasses[size].split(' ')[2]}`}>
        {initial}
      </span>
    </div>
  );
}