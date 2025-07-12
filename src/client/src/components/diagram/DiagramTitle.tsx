interface DiagramTitleProps {
  title: string | null;
  collection: string | null;
  isDarkMode: boolean;
}

export function DiagramTitle({ title, collection, isDarkMode }: DiagramTitleProps) {
  if (!title) return null;

  return (
    <div className="absolute top-4 left-0 right-0 flex justify-center items-center pointer-events-none z-40">
      <div className={`px-4 py-2 mt-3 rounded-lg backdrop-blur-md ${isDarkMode ? "bg-gray-900/50" : "bg-gray-200/50"}`}>
        {collection && (
          <div className={`text-xs text-center mb-0.5 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            {collection}
          </div>
        )}
        <h1 className={`text-lg text-center ${isDarkMode ? "text-gray-200" : "text-gray-600"}`}>
          {title}
        </h1>
      </div>
    </div>
  );
}