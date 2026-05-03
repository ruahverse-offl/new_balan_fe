import { useCallback, useState } from 'react';

/**
 * Provides a screen-lock flag + a wrapper that sets it while an async task runs.
 *
 * @param {string} [defaultMessage='Processing…'] - Shown in ActionOverlay by default
 * @returns {{ locked: boolean, message: string, run: function }}
 *
 * Usage:
 *   const { locked, message, run } = useActionLock();
 *
 *   // Wrap any async operation:
 *   const handleSave = () => run(async () => {
 *     await saveData(form);
 *     showNotify('Saved', 'success');
 *   }, 'Saving…');
 *
 *   // In JSX:
 *   <div style={{ position: 'relative' }}>
 *     <ActionOverlay show={locked} message={message} />
 *     … content …
 *   </div>
 */
export function useActionLock(defaultMessage = 'Processing…') {
  const [locked, setLocked] = useState(false);
  const [message, setMessage] = useState(defaultMessage);

  const run = useCallback(async (asyncFn, msg) => {
    setMessage(msg || defaultMessage);
    setLocked(true);
    try {
      return await asyncFn();
    } finally {
      setLocked(false);
    }
  }, [defaultMessage]);

  return { locked, message, run };
}

export default useActionLock;
