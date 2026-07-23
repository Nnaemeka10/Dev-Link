interface AvatarProps {
  name?: string;
  avatarUrl?: string;
  isOnline?: boolean;
  size?: "sm" | "md" | "lg";
}

export function Avatar({ name = "User", avatarUrl, isOnline, size = "md" }: AvatarProps) {
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-11 h-11 text-sm",
    lg: "w-12 h-12 text-sm",
  };

  return (
    <div className="relative flex-shrink-0">
      {avatarUrl ? (
        <img src={avatarUrl} alt={name} className={`${sizeClasses[size]} rounded-full object-cover`} />
      ) : (
        <div className={`${sizeClasses[size]} rounded-full bg-orange-100 flex items-center justify-center font-semibold text-orange-800`}>
          {name.slice(0, 2).toUpperCase()}
        </div>
      )}
      {isOnline && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />}
    </div>
  );
}