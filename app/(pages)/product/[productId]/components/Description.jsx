
export function Description({ content }) {
  if (!content) return null;

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6 rounded-xl border border-gray-200 bg-white shadow-sm w-full">
      <h2 className="text-xl font-bold text-gray-900">Product Description</h2>
      <div 
        className="prose prose-sm md:prose-base max-w-none text-gray-700"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  );
}