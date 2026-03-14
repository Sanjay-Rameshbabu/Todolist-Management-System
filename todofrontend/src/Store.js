// src/store.js
import { createAction, createReducer, configureStore } from '@reduxjs/toolkit';

// Ensure these are exported!
export const rearrangeSetNotes = createAction('notes/set');
export const moveNoteToLast = createAction('notes/moveToLast');
export const updateNoteStatus = createAction('notes/updateStatus');

const notesReducer = createReducer({ items: [] }, (builder) => {
  builder
    .addCase(rearrangeSetNotes, (state, action) => {
      state.items = action.payload;
    })
    .addCase(moveNoteToLast, (state, action) => {
        const id = action.payload;
        const index = state.items.findIndex(n => n._id === id);
        
        if (index !== -1) {
            const [movedItem] = state.items.splice(index, 1);
            state.items.push(movedItem);

            // CRITICAL: Re-assign order_index for every item in the list
            state.items.forEach((note, idx) => {
            note.order_index = idx; 
            });
        }
    })
    .addCase(updateNoteStatus, (state, action) => {
      const { id, status } = action.payload;
      const note = state.items.find(n => n._id === id);
      if (note) {
        note.status = status; //
      }
    });
});


export const store = configureStore({
  reducer: { notes: notesReducer }
});