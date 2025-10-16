"use client";

import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

const modules = {
  toolbar: {
    container: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ color: [] }, { background: [] }],
      ["link", "image"],
      ["clean"],
    ],
  },
};

const formats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "blockquote",
  "list",
  "link",
  "image",
  "color",
  "background",
];

export default function Description({ data, handleData, disabled = false }) {
  const handleChange = (value) => {
    handleData("description", value);
  };

  return (
    <section className="flex flex-col gap-3 bg-white border p-4 rounded-xl">
      <h1 className="font-semibold">Description</h1>
      
      <div className="quill-wrapper">
        <ReactQuill
          value={data?.description || ""}
          onChange={handleChange}
          modules={modules}
          formats={formats}
          theme="snow"
          placeholder="Write a detailed product description..."
          readOnly={disabled}
          className={disabled ? "opacity-60" : ""}
        />
      </div>

      <style jsx global>{`
        /* Quill Editor Container */
        .quill-wrapper .quill {
          display: flex;
          flex-direction: column;
          height: 100%;
          min-height: 200px;
          max-height: 350px;
        }

        /* Toolbar Styling */
        .quill-wrapper .ql-toolbar {
          border: 1px solid #e5e7eb !important;
          border-radius: 0.5rem 0.5rem 0 0 !important;
          background: #f9fafb;
          padding: 0.10rem !important;
          flex-shrink: 0;
        }

        .quill-wrapper .ql-toolbar button {
          width: 16px !important;
          height: 16px !important;
          padding: 0 !important;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .quill-wrapper .ql-toolbar button:hover {
          background: #e5e7eb;
          border-radius: 0.25rem;
        }

        .quill-wrapper .ql-toolbar button.ql-active {
          background: #dbeafe;
          border-radius: 0.25rem;
        }

        .quill-wrapper .ql-toolbar .ql-stroke {
          stroke: #374151 !important;
        }

        .quill-wrapper .ql-toolbar .ql-fill {
          fill: #374151 !important;
        }

        .quill-wrapper .ql-toolbar button:hover .ql-stroke {
          stroke: #1f2937 !important;
        }

        .quill-wrapper .ql-toolbar button:hover .ql-fill {
          fill: #1f2937 !important;
        }

        /* Editor Container */
        .quill-wrapper .ql-container {
          border: 1px solid #e5e7eb !important;
          border-top: none !important;
          border-radius: 0 0 0.5rem 0.5rem !important;
          font-size: 0.875rem;
          flex: 1;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        /* Editor Content Area */
        .quill-wrapper .ql-editor {
          padding: 1rem !important;
          font-family: inherit;
          line-height: 1.6;
          color: #1f2937;
          overflow-y: auto;
          flex: 1;
          min-height: 150px;
          max-height: 300px;
        }

        .quill-wrapper .ql-editor.ql-blank::before {
          color: #9ca3af;
          font-style: normal;
          left: 1rem;
        }

        /* Focus State */
        .quill-wrapper .ql-container.ql-snow:focus-within {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        /* Content Styling */
        .quill-wrapper .ql-editor h1 {
          font-size: 1.875rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
          margin-top: 1rem;
        }

        .quill-wrapper .ql-editor h2 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          margin-top: 0.75rem;
        }

        .quill-wrapper .ql-editor h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          margin-top: 0.75rem;
        }

        .quill-wrapper .ql-editor p {
          margin-bottom: 0.75rem;
        }

        .quill-wrapper .ql-editor ul,
        .quill-wrapper .ql-editor ol {
          padding-left: 1.5rem;
          margin-bottom: 0.75rem;
        }

        .quill-wrapper .ql-editor li {
          margin-bottom: 0.25rem;
        }

        .quill-wrapper .ql-editor a {
          color: #3b82f6;
          text-decoration: underline;
        }

        .quill-wrapper .ql-editor img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 0.5rem 0;
        }

        /* Scrollbar Styling */
        .quill-wrapper .ql-editor::-webkit-scrollbar {
          width: 8px;
        }

        .quill-wrapper .ql-editor::-webkit-scrollbar-track {
          background: #f3f4f6;
          border-radius: 0 0 0.5rem 0;
        }

        .quill-wrapper .ql-editor::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 4px;
        }

        .quill-wrapper .ql-editor::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }

        /* Dropdown Menus */
        .ql-snow .ql-picker {
          color: #374151;
        }

        .ql-snow .ql-picker-options {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 0.375rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          padding: 0.25rem;
        }

        .ql-snow .ql-picker-item:hover {
          background: #f3f4f6;
          border-radius: 0.25rem;
        }

        /* Disabled State */
        .quill-wrapper.opacity-60 .ql-toolbar {
          pointer-events: none;
          opacity: 0.5;
        }

        .quill-wrapper.opacity-60 .ql-editor {
          background-color: #f9fafb;
          cursor: not-allowed;
        }

        /* Responsive */
        @media (max-width: 640px) {
          .quill-wrapper .ql-toolbar {
            padding: 0.5rem !important;
          }

          .quill-wrapper .ql-toolbar button {
            width: 24px !important;
            height: 24px !important;
          }

          .quill-wrapper .ql-editor {
            padding: 0.75rem !important;
            font-size: 0.8125rem;
          }

          .quill-wrapper .quill {
            min-height: 180px;
          }
        }
      `}</style>
    </section>
  );
}