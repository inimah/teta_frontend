import React from "react";
import {
  HeartIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

const IconPreviews: React.FC = () => {
  return (
    <div className="p-4 space-y-6 bg-white rounded-lg shadow-md max-w-sm mx-auto">
      <h2 className="text-lg font-semibold mb-4">Heart Feeling Icon Previews</h2>
      <div className="flex items-center space-x-4">
        <HeartIcon className="h-8 w-8 text-red-500" />
        <span>HeartIcon (Outline)</span>
      </div>
      <div className="flex items-center space-x-4">
        <HeartIcon className="h-8 w-8 text-red-500" />
        <span>HeartIcon (Outline) - Pulse</span>
      </div>
      <div className="flex items-center space-x-4">
        <HeartIcon className="h-8 w-8 text-red-500" />
        <span>HeartIcon (Outline) - Gesture</span>
      </div>
      <div className="flex items-center space-x-4">
        <SparklesIcon className="h-8 w-8 text-yellow-400" />
        <span>SparklesIcon (Outline)</span>
      </div>
    </div>
  );
};

export default IconPreviews;
