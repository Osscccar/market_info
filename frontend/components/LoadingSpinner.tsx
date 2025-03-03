"use client";

export default function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center mt-4">
      <div className="w-8 h-8 border-t-4 border-white rounded-full animate-spin"></div>
    </div>
  );
}
