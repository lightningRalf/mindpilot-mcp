interface DiagramTitleProps {
  title: string | null;
  collection: string | null;
  isDarkMode: boolean;
}

export function DiagramTitle({ title, collection, isDarkMode }: DiagramTitleProps) {
  if (!title) return null;

  return (
    <div className="absolute top-4 left-0 right-0 flex justify-center items-center pointer-events-none z-40">
      <div className={`px-4 py-2 mt-3 rounded-lg backdrop-blur-md ${isDarkMode ? "bg-neutral-900/50" : "bg-neutral-200/50"}`}>
        {collection && (
          <div className={`text-xs text-center mb-0.5 ${isDarkMode ? "text-neutral-400" : "text-neutral-500"}`}>
            {collection}
          </div>
        )}
        <h1 className={`text-lg text-center ${isDarkMode ? "text-neutral-200" : "text-neutral-600"}`}>
          {title}
        </h1>
      </div>
    </div>
  );
}
