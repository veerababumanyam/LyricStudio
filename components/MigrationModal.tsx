import React, { useState, useEffect } from 'react';
import {
  checkMigrationStatus,
  migrateToBackend,
  type MigrationStatus,
  type MigrationProgress
} from '../utils/migrate-to-backend';

interface MigrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export const MigrationModal: React.FC<MigrationModalProps> = ({ isOpen, onClose, onComplete }) => {
  const [status, setStatus] = useState<MigrationStatus | null>(null);
  const [progress, setProgress] = useState<MigrationProgress | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadStatus();
    }
  }, [isOpen]);

  const loadStatus = async () => {
    const migrationStatus = await checkMigrationStatus();
    setStatus(migrationStatus);
  };

  const handleMigrate = async () => {
    setIsLoading(true);
    setErrors([]);
    setProgress(null);

    try {
      const result = await migrateToBackend((prog) => {
        setProgress(prog);
      });

      if (result.success) {
        setIsComplete(true);
        // Optionally clear localStorage after successful migration
        // clearLocalStorageAfterMigration();
      } else {
        setErrors(result.errors);
      }
    } catch (error) {
      setErrors([`Migration failed: ${error}`]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const handleComplete = () => {
    onComplete();
    onClose();
  };

  if (!isOpen || !status) return null;

  if (!status.needsMigration) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
          🔄 Sync Your Data to Cloud
        </h2>

        {!isComplete && !isLoading && (
          <>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              We detected data stored locally on this device. Would you like to sync it to your cloud account
              for access across all your devices?
            </p>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
              <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Data found:</h3>
                <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                {status.items.apiKey && <li key="api">✓ API Key</li>}
                {status.items.appearance && <li key="appearance">✓ Appearance settings</li>}
                {status.items.savedSongs && <li key="songs">✓ {status.counts.songs} saved songs</li>}
                {status.items.profiles && <li key="profiles">✓ {status.counts.profiles} profiles</li>}
                {status.items.customContexts && <li key="contexts">✓ {status.counts.contexts} custom contexts</li>}
              </ul>
            </div>

            {errors.length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 mb-6">
                <h3 className="font-semibold mb-2 text-red-900 dark:text-red-300">Errors:</h3>
                <ul className="space-y-1 text-sm text-red-600 dark:text-red-400">
                  {errors.map((error: string, idx: number) => (
                    <li key={idx}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={handleSkip}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                Skip for now
              </button>
              <button
                onClick={handleMigrate}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition"
              >
                Sync to Cloud
              </button>
            </div>
          </>
        )}

        {isLoading && progress && (
          <>
            <div className="mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-300">{progress.step}</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {progress.percentage}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
            </div>

            <p className="text-center text-gray-600 dark:text-gray-300">
              Please wait while we sync your data...
            </p>
          </>
        )}

        {isComplete && (
          <>
            <div className="text-center mb-6">
              <div className="inline-block p-4 bg-green-100 dark:bg-green-900/20 rounded-full mb-4">
                <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Migration Complete!
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Your data has been successfully synced to the cloud.
              </p>
            </div>

            <button
              onClick={handleComplete}
              className="w-full px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition"
            >
              Continue
            </button>
          </>
        )}
      </div>
    </div>
  );
};
