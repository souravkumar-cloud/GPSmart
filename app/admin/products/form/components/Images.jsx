'use client';

export default function Images({
  data,
  featureImage,
  setFeatureImage,
  imageList,
  setImageList,
}) {
  // Display images from state or database
  const displayImages = imageList?.length > 0 ? imageList : data?.featured_img || [];

  const handleRemoveImage = (index) => {
    const currentImages = imageList?.length > 0 ? imageList : (data?.featured_img || []);
    const updatedImages = currentImages.filter((_, idx) => idx !== index);
    setImageList(updatedImages);
  };

  return (
    <section className="flex flex-col gap-3 bg-white border p-4 rounded-xl">
      <h1 className="font-semibold">Images</h1>

      {/* Main Product Image */}
      <div className="flex flex-col gap-1">
        {!featureImage && data?.image_url && (
          <div className="flex justify-center relative group">
            <img
              className="h-32 object-cover rounded-lg"
              src={data.image_url}
              alt="Main Product Image"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
              <span className="text-white opacity-0 group-hover:opacity-100 text-xs">Current Image</span>
            </div>
          </div>
        )}
        {featureImage && (
          <div className="flex justify-center relative group">
            <img
              className="h-32 object-cover rounded-lg"
              src={URL.createObjectURL(featureImage)}
              alt="New Main Product Image"
            />
            <button
              type="button"
              onClick={() => setFeatureImage(null)}
              className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        <label className="text-gray-500 text-xs font-medium" htmlFor="product-feature-image">
          Main Product Image <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-gray-400">Primary image shown in product listings</p>

        <input
          type="file"
          id="product-feature-image"
          accept="image/*"
          onChange={(e) => {
            if (e.target.files.length > 0) setFeatureImage(e.target.files[0]);
          }}
          className="border px-4 py-2 rounded-lg w-full outline-none focus:ring-2 focus:ring-blue-500 transition-all"
        />
      </div>

      {/* Featured Images Gallery (JSONB Array) */}
      <div className="flex flex-col gap-1">
        {displayImages.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-2">
            {displayImages.map((img, idx) => {
              const src = img instanceof File ? URL.createObjectURL(img) : img;
              return (
                <div key={idx} className="relative group">
                  <img
                    className="w-20 h-20 object-cover rounded-lg border-2 border-gray-200 hover:border-blue-400 transition-all"
                    src={src}
                    alt={`Featured Image ${idx + 1}`}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80"%3E%3Crect fill="%23ddd" width="80" height="80"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="12"%3EError%3C/text%3E%3C/svg%3E';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-lg"
                    title="Remove image"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <span className="absolute bottom-1 left-1 bg-black bg-opacity-60 text-white text-xs px-1.5 py-0.5 rounded">
                    {idx + 1}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <label className="text-gray-500 text-xs font-medium" htmlFor="product-images">
          Featured Images Gallery
        </label>
        <p className="text-xs text-gray-400">Additional images for product gallery (stored in JSONB)</p>

        <input
          type="file"
          id="product-images"
          accept="image/*"
          multiple
          onChange={(e) => {
            const files = Array.from(e.target.files);
            if (files.length > 0) {
              const currentImages = imageList?.length > 0 ? imageList : (data?.featured_img || []);
              setImageList([...currentImages, ...files]);
            }
          }}
          className="border px-4 py-2 rounded-lg w-full outline-none focus:ring-2 focus:ring-blue-500 transition-all"
        />
        <p className="text-xs text-gray-500 mt-1">
          {displayImages.length > 0 ? `${displayImages.length} image(s) selected` : 'No images yet'}
        </p>
      </div>
    </section>
  );
}