export default function SkeletonLoader({ type = 'card' }) {
  if (type === 'table') {
    return (
      <div className="animate-pulse flex flex-col space-y-4 w-full">
         <div className="h-10 bg-gray-200 rounded-md w-full"></div>
         {[1, 2, 3, 4, 5].map(i => (
           <div key={i} className="h-16 bg-white border border-gray-100 rounded-md w-full flex items-center px-4 space-x-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-100 rounded w-1/4"></div>
              <div className="h-4 bg-gray-100 rounded w-1/4"></div>
           </div>
         ))}
      </div>
    );
  }

  // Default meal card wrapper
  return (
    <div className="animate-pulse bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-start mb-4">
        <div className="h-5 bg-gray-200 rounded w-1/3"></div>
        <div className="h-5 bg-gray-100 rounded w-16"></div>
      </div>
      <div className="space-y-3 mb-6">
        <div className="h-4 bg-gray-100 rounded w-3/4"></div>
        <div className="h-4 bg-gray-100 rounded w-full"></div>
        <div className="h-4 bg-gray-100 rounded w-5/6"></div>
      </div>
      <div className="h-10 bg-gray-200 rounded-lg w-full"></div>
    </div>
  );
}
