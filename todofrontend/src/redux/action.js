// actions.js
export const updateNotesOrder = (reorderedNotes) => {
  return async (dispatch) => {
    // 1. Update UI immediately (Optimistic Update)
    dispatch({ type: 'SET_NOTES', payload: reorderedNotes });

    // 2. Autosave to Backend
    try {
      await fetch('/api/todolist/updateOrder', {
        method: 'PUT',
        body: JSON.stringify({ notes: reorderedNotes }),
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error("Failed to autosave order", error);
    }
  };
};