import React from 'react';

/**
 * HelpButton displays a floating help button with keyboard shortcuts info.
 */
export const HelpButton: React.FC = () => {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <button
        className="fixed bottom-6 right-6 btn btn-circle btn-info z-40"
        aria-label="Help"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        ?
      </button>
      {open && (
        <div className="fixed bottom-20 right-6 bg-base-100 p-4 rounded shadow-xl z-50 max-w-xs">
          <div className="font-bold mb-2">Keyboard Shortcuts</div>
          <ul className="text-xs space-y-1">
            <li>
              <b>Ctrl+S</b>: Save
            </li>
            <li>
              <b>Ctrl+Z</b>: Undo
            </li>
            <li>
              <b>Ctrl+Shift+Z</b>: Redo
            </li>
            <li>
              <b>Ctrl+F</b>: Find
            </li>
            <li>
              <b>Esc</b>: Close dialogs
            </li>
          </ul>
          <button
            className="btn btn-xs btn-ghost mt-2"
            onClick={() => setOpen(false)}
          >
            Close
          </button>
        </div>
      )}
    </>
  );
};

export default HelpButton;
