import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Edit2, X, AlertTriangle } from 'lucide-react';

const MessageActionModal = ({ 
  isOpen, 
  onClose, 
  type = 'delete', // 'delete' or 'edit'
  onConfirm,
  initialMessage = ''
}) => {
  const [editedMessage, setEditedMessage] = useState(initialMessage);

  // Update editedMessage when initialMessage changes (when modal opens)
  React.useEffect(() => {
    if (isOpen) {
      setEditedMessage(initialMessage);
    }
  }, [isOpen, initialMessage]);

  const handleConfirm = () => {
    if (type === 'edit') {
      if (editedMessage.trim() && editedMessage.length <= 1000) {
        onConfirm(editedMessage.trim());
        onClose();
      }
    } else {
      onConfirm();
      onClose();
    }
  };

  const handleMessageChange = (e) => {
    const newValue = e.target.value;
    if (newValue.length <= 1000) {
      setEditedMessage(newValue);
    }
  };

  const isEditValid = editedMessage.trim() && 
                       editedMessage.trim() !== initialMessage.trim() && 
                       editedMessage.length <= 1000;

  const getConfig = () => {
    if (type === 'delete') {
      return {
        icon: <Trash2 className="w-12 h-12 text-red-500" />,
        title: 'Delete Message?',
        description: 'This message will be permanently deleted. This action cannot be undone.',
        bg: 'from-red-50 to-rose-50',
        border: 'border-red-200',
        iconBg: 'bg-red-100',
        confirmButton: 'bg-red-600 hover:bg-red-700',
        confirmText: 'Delete',
      };
    } else {
      return {
        icon: <Edit2 className="w-12 h-12 text-blue-500" />,
        title: 'Edit Message',
        description: 'Make changes to your message below.',
        bg: 'from-blue-50 to-cyan-50',
        border: 'border-blue-200',
        iconBg: 'bg-blue-100',
        confirmButton: 'bg-blue-600 hover:bg-blue-700',
        confirmText: 'Save Changes',
      };
    }
  };

  const config = getConfig();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            {/* Modal */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', duration: 0.5 }}
              onClick={(e) => e.stopPropagation()}
              className={`bg-gradient-to-br ${config.bg} rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border-2 ${config.border}`}
            >
              {/* Header with icon */}
              <div className="relative p-6 pb-4">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/50 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
                
                <div className="flex flex-col items-center text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    className={`${config.iconBg} rounded-full p-4 mb-4`}
                  >
                    {config.icon}
                  </motion.div>
                  
                  <motion.h3
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-2xl font-bold text-gray-800 mb-2"
                  >
                    {config.title}
                  </motion.h3>
                  
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-gray-600 text-sm leading-relaxed"
                  >
                    {config.description}
                  </motion.p>

                  {type === 'edit' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="w-full mt-4"
                    >
                      <textarea
                        value={editedMessage}
                        onChange={handleMessageChange}
                        className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:border-blue-400 focus:outline-none resize-none bg-white/60 backdrop-blur-sm"
                        rows="5"
                        placeholder="Type your message..."
                        autoFocus
                        spellCheck={true}
                        style={{ lineHeight: '1.6' }}
                      />
                      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                          Spell check enabled
                        </span>
                        <span className={editedMessage.length > 500 ? 'text-red-500 font-semibold' : ''}>
                          {editedMessage.length} / 1000 characters
                        </span>
                      </div>
                    </motion.div>
                  )}

                  {type === 'delete' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 }}
                      className="mt-4 bg-white/60 backdrop-blur-sm rounded-xl px-4 py-3 border border-red-200 flex items-start gap-2"
                    >
                      <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">
                        Other members will no longer see this message.
                      </span>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Footer with buttons */}
              <div className="bg-white/40 backdrop-blur-sm p-6 pt-4">
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onClose}
                    className="flex-1 px-6 py-3 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold transition-colors"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleConfirm}
                    disabled={type === 'edit' ? !isEditValid : false}
                    className={`flex-1 px-6 py-3 rounded-xl ${config.confirmButton} text-white font-semibold transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {config.confirmText}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MessageActionModal;
