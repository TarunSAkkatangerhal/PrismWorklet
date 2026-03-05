import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, CheckCircle, XCircle, X, AlertCircle, Loader2 } from 'lucide-react';

const EmailNotification = ({ 
  isOpen, 
  onClose, 
  type = 'success', // 'success', 'error', 'confirm', 'info'
  title,
  message,
  recipientCount,
  onConfirm,
  onCancel
}) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-12 h-12 text-green-500" />;
      case 'error':
        return <XCircle className="w-12 h-12 text-red-500" />;
      case 'confirm':
        return <Mail className="w-12 h-12 text-indigo-500" />;
      case 'info':
        return <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="w-12 h-12 text-blue-500" />;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'from-green-50 to-emerald-50',
          border: 'border-green-200',
          icon: 'bg-green-100',
          button: 'bg-green-600 hover:bg-green-700',
        };
      case 'error':
        return {
          bg: 'from-red-50 to-rose-50',
          border: 'border-red-200',
          icon: 'bg-red-100',
          button: 'bg-red-600 hover:bg-red-700',
        };
      case 'confirm':
        return {
          bg: 'from-indigo-50 to-purple-50',
          border: 'border-indigo-200',
          icon: 'bg-indigo-100',
          button: 'bg-indigo-600 hover:bg-indigo-700',
        };
      default:
        return {
          bg: 'from-blue-50 to-cyan-50',
          border: 'border-blue-200',
          icon: 'bg-blue-100',
          button: 'bg-blue-600 hover:bg-blue-700',
        };
    }
  };

  const colors = getColors();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={type === 'confirm' ? onCancel : (type === 'info' ? null : onClose)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            {/* Modal */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', duration: 0.5 }}
              onClick={(e) => e.stopPropagation()}
              className={`bg-gradient-to-br ${colors.bg} rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border-2 ${colors.border}`}
            >
              {/* Header with icon */}
              <div className="relative p-6 pb-4">
                {type !== 'info' && (
                  <button
                    onClick={type === 'confirm' ? onCancel : onClose}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/50 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                )}
                
                <div className="flex flex-col items-center text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    className={`${colors.icon} rounded-full p-4 mb-4`}
                  >
                    {getIcon()}
                  </motion.div>
                  
                  <motion.h3
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-2xl font-bold text-gray-800 mb-2"
                  >
                    {title}
                  </motion.h3>
                  
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-gray-600 text-base leading-relaxed"
                  >
                    {message}
                  </motion.p>

                  {recipientCount !== undefined && type === 'success' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 }}
                      className="mt-4 bg-white/60 backdrop-blur-sm rounded-xl px-4 py-3 border border-green-200"
                    >
                      <div className="flex items-center gap-2">
                        <Mail className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-semibold text-gray-700">
                          Sent to <span className="text-green-600 text-lg">{recipientCount}</span> member{recipientCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Footer with buttons */}
              {type !== 'info' && (
                <div className="bg-white/40 backdrop-blur-sm p-6 pt-4">
                  {type === 'confirm' ? (
                    <div className="flex gap-3">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onCancel}
                        className="flex-1 px-6 py-3 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold transition-colors"
                      >
                        Cancel
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onConfirm}
                        className={`flex-1 px-6 py-3 rounded-xl ${colors.button} text-white font-semibold transition-colors shadow-lg`}
                      >
                        Send Email
                      </motion.button>
                    </div>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onClose}
                      className={`w-full px-6 py-3 rounded-xl ${colors.button} text-white font-semibold transition-colors shadow-lg`}
                    >
                      Got it!
                    </motion.button>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default EmailNotification;
