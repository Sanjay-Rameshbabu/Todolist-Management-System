// reducer.js
const initialState = { notes: [] };

export default function notesReducer(state = initialState, action) {
  switch (action.type) {
    case 'SET_NOTES':
      return {
        ...state,
        notes: action.payload // Replaces the old order with the new one
      };
    default:
      return state;
  }
}