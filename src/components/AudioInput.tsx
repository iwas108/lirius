import { useState, useRef } from 'react';
import { UploadCloud, FileAudio, AlertCircle } from 'lucide-react';

interface AudioInputProps {
  onFileSelect: (file: File) => void;
}

export default function AudioInput({ onFileSelect }: AudioInputProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndProcessFile = (file: File | undefined) => {
    setError(null);
    if (!file) return;

    if (
      file.type !== 'audio/flac' &&
      !file.name.toLowerCase().endsWith('.flac')
    ) {
      setError('Invalid file type. Please upload a .flac audio file.');
      return;
    }

    onFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-gray-800'
        }`}
      >
        <input
          type="file"
          accept=".flac,audio/flac"
          ref={fileInputRef}
          onChange={handleChange}
          className="hidden"
          aria-label="Upload .flac audio file"
        />

        <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
          <UploadCloud className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>

        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Select or drop your audio file
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 text-center">
          Only{' '}
          <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-gray-800 dark:text-gray-200">
            .flac
          </span>{' '}
          files are supported
        </p>

        <div className="flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
          <FileAudio className="w-4 h-4 mr-2" />
          Browse Files
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start text-red-600 dark:text-red-400">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}
