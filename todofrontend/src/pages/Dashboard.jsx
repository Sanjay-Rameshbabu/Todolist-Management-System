import React, { useEffect, useState, useContext, useRef,useCallback} from 'react';
import { AuthContext } from '../context/AuthContext';
import { todoService } from '../api/ServiceAPI';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import DoneIcon from '@mui/icons-material/Done';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import FilterListAltIcon from '@mui/icons-material/FilterListAlt';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { rearrangeSetNotes,moveNoteToLast,updateNoteStatus } from '../Store';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState(new Set());
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editDate, setEditDate] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [filterByDate, setFilterByDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [availableTags, setAvailableTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [tagSearch , setTagSearch] =useState("");
  const [loadingTags, setLoadingTags] = useState(false);

  const profileRef = useRef(null);
  const dateInputRef = useRef(null);
    //rearrange the notes
  const dispatch = useDispatch();
  const reduxnotes = useSelector(state => state.notes.items);

    //Handle function for rearrange
  const handleTitleClick = async (id) => {
  const index = reduxnotes.findIndex(n => n._id === id);
  if (index === -1) return;

  // 1. Create the new sequence (move clicked item to end)
  const updatedItems = [...reduxnotes];
  const [movedItem] = updatedItems.splice(index, 1);
  updatedItems.push(movedItem);

  // 2. Map new order indices
  const finalNotes = updatedItems.map((note, idx) => ({
    ...note,
    order_index: idx
  }));

  // 3. Update UI instantly via Redux
  dispatch(rearrangeSetNotes(finalNotes));

  // 4. Persist to DB
  try {
    const payload = finalNotes.map(n => ({ id: n._id, order: n.order_index }));
    await todoService.updateOrder(payload);
  } catch (err) {
    console.error("Autosave failed", err);
  }
};

  const onDragEnd = async (result) => {
    const { source, destination } = result;
    if (!destination || (source.index === destination.index)) return;

    // We reorder the list derived from Redux
    const reorderedItems = [...filteredByDate]; 
    const [movedItem] = reorderedItems.splice(source.index, 1);
    reorderedItems.splice(destination.index, 0, movedItem);

    const updatedWithOrder = reorderedItems.map((note, idx) => ({
      ...note,
      order_index: idx 
    }));

    // Update Redux - This triggers the UI re-render immediately and permanently
    dispatch(rearrangeSetNotes(updatedWithOrder));

    try {
      const orderData = updatedWithOrder.map((note) => ({
        id: note._id,
        order: note.order_index
      }));
      await todoService.updateOrder(orderData); 
    } catch (err) {
      console.error("Failed to persist order", err);
      toast.error("Failed to save new order");
    }
  };
  const fetchNotes = useCallback(async (specificDate = null) => {
    setLoading(true);
    try {
      let response;
      if (specificDate) {
        response = await todoService.getNotesByDate(specificDate);
      } else {
        response = await todoService.getNotes();
      }
      const fetchedItems = response.notes || (Array.isArray(response) ? response : []);
      
      // We only update Redux now
      dispatch(rearrangeSetNotes(fetchedItems));
    } catch (err) {
      console.error("Fetch failed", err);
      toast.error("Failed to fetch notes");
    } finally {
      setLoading(false);
    }
  }, [dispatch]);
  // useEffect(() => {
  //   const today = new Date().toISOString().split('T')[0];
  //   fetchNotes(today);
  // }, []);
  
  useEffect(() => {
    if (user) { // Ensure user is logged in before fetching
      fetchNotes(selectedDate); 
    }
  }, [fetchNotes, selectedDate, user]); // Include fetchNotes here 

  const fetchTags = async () => {
  try {
    const response = await todoService.getTags();  
    console.log(response);
    const tagsArray = Array.isArray(response) ? response : (response.data || []);
    setAvailableTags(tagsArray); 
  } catch (err) {
    console.error("Failed to fetch tags", err);
    setAvailableTags([]); 
  }
};

  useEffect(() => {
    if(user)
    fetchTags();
  }, [user]);
/*
  // This effect runs every time selectedDate changes
  useEffect(() => {
      if (selectedDate) {
        fetchNotes(selectedDate);
      } else {
        // Optional: Fetch all if no date is selected
        fetchNotes();
      }
  }, [selectedDate]); // Dependency array: triggers when selectedDate updates
*/
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfile(false);
      }
    };
    if (showProfile) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfile]);

//   //Update the available tags.
//   useEffect(() => {
//   localStorage.setItem('availableTags', JSON.stringify(availableTags));
// }, [availableTags]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!title.trim()) return toast.error("Title cannot be empty");
    const tagsToSave = selectedTags.map(tagName => {
      const tagObj = availableTags.find(t => t.tag_name === tagName);
      if (!tagObj) return null
      return tagObj.isSystemTag ? tagObj.tag_name : tagObj._id;
      }).filter(tag => tag !== null);;
    try {
      await todoService.createnote({ title, description: desc,tags: tagsToSave });
      setTitle(''); 
      setDesc('');
      setSelectedTags([]);
      setTagInput('') 
      fetchNotes();
      toast.success("Note added successfully!");
    } catch (err) { toast.error("Error adding note"); }
  };


  const toggleNoteSelection = (noteId) => {
    const newSelected = new Set(selectedNotes);
    newSelected.has(noteId) ? newSelected.delete(noteId) : newSelected.add(noteId);
    setSelectedNotes(newSelected);
  };

  // Toggle tag selection for the new task
const toggleTag = (tag) => {
  setSelectedTags(prev => 
    prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
  );
};

  // Add a brand new tag to the backend
const addNewTag = async () => {
  const trimmed = tagInput.trim();
  if (!trimmed) {
    toast.error("Tag cannot be empty");
    return;
  }
  
  if (availableTags.includes(trimmed)) {
    toast.error("Tag already exists");
    return;
  }
  
  try {
    console.log("Sending tag to backend:", trimmed);
    const response = await todoService.addTag(trimmed);
    console.log("Full response from backend:", response);
    console.log("Tags from response:", response.tags);
    
    // Re-fetch tags from backend to ensure sync
    await fetchTags();
    
    // Also select the newly added tag
    setSelectedTags(prev => [...prev, trimmed]);
    setTagInput('');
    toast.success("Tag added successfully!");
    
  } catch (err) {
    console.error("Full error object:", err);
    console.error("Error response data:", err.response?.data);
    const errorMsg = err.response?.data?.detail || "Failed to add tag";
    toast.error(errorMsg);
  }
};


  const selectAllNotes = () => {
    if (selectedNotes.size === filteredNotes.length) {
      setSelectedNotes(new Set());
    } else {
      setSelectedNotes(new Set(filteredNotes.map(note => note._id)));
    }
  };

  const handleBulkDelete = async () => {
    toast((t) => (
    <div className="flex flex-col gap-3 shadow-red-400 ">
      <span className="font-medium text-gray-800">
        Are you sure to delete {selectedNotes.size} note ?
      </span>
      <div className="flex gap-2 justify-end">
        {/* Confirm Delete Button */}
        <button
          onClick={async () => {
            toast.dismiss(t.id);
            try {
              await todoService.bulkDelete(Array.from(selectedNotes));
              setSelectedNotes(new Set());
              fetchNotes(selectedDate);
              toast.success("Deleted successfully");
            } catch (err) {
              toast.error("Delete failed");
            }
          }}
          className="px-3 py-1 text-xs bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
        >
          Confirm Delete
        </button>
        {/* Cancel Button */}
        <button
          onClick={() => toast.dismiss(t.id)}
          className="px-3 py-1 text-xs bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
        >
          Cancel
        </button>
        
      </div>
    </div>
  ), {
    position: 'top-center',
  });
  };

 const toggleStatus = async (id, currentStatus) => {
  const newStatus = currentStatus === 'completed' ? 'not-completed' : 'completed';
  
  // 1. Update Redux immediately for "Instant Feedback"
  dispatch(updateNoteStatus({ id, status: newStatus }));

  try {
    // 2. Persist the change to the database
    await todoService.updateStatus(id, newStatus);
  } catch (err) {
    console.error("Update failed", err);
    toast.error("Update failed, reverting changes...");
    
    // 3. Optional: Re-fetch to sync if the API fails
    fetchNotes(selectedDate);
  }
};

  const deleteNote = (id) => {
  toast((t) => (
    <div className="flex flex-col gap-3 shadow-red-400 ">
      <span className="font-medium text-gray-800">
        Are you sure to delete this?
      </span>
      <div className="flex gap-2 justify-end">
        {/* Confirm Delete Button */}
        <button
          onClick={async () => {
            toast.dismiss(t.id);
            try {
              await todoService.softDelete(id);
              fetchNotes(selectedDate);
              toast.success("Deleted successfully");
            } catch (err) {
              toast.error("Delete failed");
            }
          }}
          className="px-3 py-1 text-xs bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
        >
          Confirm Delete
        </button>
        {/* Cancel Button */}
        <button
          onClick={() => toast.dismiss(t.id)}
          className="px-3 py-1 text-xs bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
        >
          Cancel
        </button>
        
      </div>
    </div>
  ), {
    position: 'top-center',
  });
};

  const handleUpdateNote = async (noteId) => {
    if (!editTitle.trim()) return toast.error("Title cannot be empty");
    try {
      await todoService.updatenote(noteId, { title: editTitle, description: editDesc });
      if (editDate) await todoService.updatedate(noteId, editDate);
      setEditingNoteId(null); fetchNotes();
      toast.success("Updated successfully!");
    } catch (err) { toast.error("Error updating note"); }
  };

  const startEditNote = (note) => {
    setEditingNoteId(note._id);
    setEditTitle(note.title);
    setEditDesc(note.description);
    setEditDate(note.date ? note.date.split('T')[0] : '');
  };

  const filteredNotes = reduxnotes.filter(note => {
    if (note.is_deleted) return false;
    const matchesStatus = filter === 'all' || note.status === filter;
    const noteDate = note.date ? note.date.split('T')[0] : '';
    const matchesDate = !filterByDate || noteDate === filterByDate;

    const matchesTags = !tagSearch || (
      Array.isArray(note.tags) && 
      note.tags.some(tag => tag.toLowerCase().includes(tagSearch.toLowerCase()))
    );
    return matchesStatus && matchesDate && matchesTags;
  }).sort((a, b) => {
  // 1. FIRST check the order_index (The Shuffle position)
  if ((a.order_index ?? 0) !== (b.order_index ?? 0)) {
    return (a.order_index ?? 0) - (b.order_index ?? 0);
  }

  // 2. SECOND check Priority (Only if order_index is the same)
  const priority = { "not-completed": 1, "expired": 2, "completed": 3 };
  return (priority[a.status] || 4) - (priority[b.status] || 4);
});
  //For List of notes based on date
  const filteredByDate = reduxnotes.filter(note => {
    if (note.is_deleted) return false;
    const noteDate = note.date ? note.date.split('T')[0] : '';
    return noteDate === selectedDate;
  }).sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));

  // Function to provide status badge colors
  const getStatusBadgeStyles = (status) => {
    if (status === 'completed') return 'bg-emerald-500 text-white';
    if (status === 'expired') return 'bg-red-500 text-white';
    return 'bg-amber-500 text-white';
  };

  const options = {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  };


  const handleFilterClick = () => {
    if (dateInputRef.current) {
      dateInputRef.current.showPicker(); // Modern browser method to open calendar
    }
  };

  return (
    <div className="w-full max-w-[1600px] min-w-[320px] mx-auto min-h-screen py-8 px-4  bg-white rounded-2xl shadow-xl">
      {/* Header */}
      <header className="flex justify-between items-center mb-8 pb-6 border-b border-gray-200">
        <h1 className="lg:text-2xl font-bold sm:text-xl font-bold">📝 My Todo List</h1> 
        <div className="flex items-center gap-3 relative" ref={profileRef}>
          <button onClick={() => setShowProfile(!showProfile)} className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded-lg transition-colors">
            <AccountCircleIcon className="text-gray-500 !text-3xl" />
          </button>
          {showProfile && (
            <div className="absolute top-full right-0 mt-2 p-4 bg-white border rounded-xl shadow-xl z-20 min-w-[220px]">
              <div className="flex flex-col gap-1">
                {/* User Name */}
                <p className="font-bold text-gray-900 text-lg capitalize">
                  {user?.first_name} {user?.last_name}
                </p>
                
                {/* User Email ID */}
                <p className="text-sm text-gray-500 truncate italic">
                  {user?.email || "Email not found"}
                </p>
              </div>
            </div>
          )}
          <button onClick={logout} className="ml-2 bg-red-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-600 transition-colors sm:p">Logout</button>
        </div>
      </header>

      <div className='grid lg:flex gap-5  '>
      {/* Add Task Form */}
      <form onSubmit={handleAdd} className="w-full bg-gray-50 p-6 rounded-xl mb-8 border border-gray-200 lg:w-2/4  ">
        <input type="text" placeholder="Task Title *" value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full p-3 border rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 outline-none" />
        <textarea placeholder="Task Description" value={desc} onChange={(e) => setDesc(e.target.value)} rows="3" className="w-full p-3 border rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 outline-none lg:pt-3 lg:pl-3 p-10" />
        {/* Inside your Add Task Form */}

          {/* Display Stored Tags for Selection */} 
          <div className="mb-4 p-4 ">
            <label className="block text-sm font-bold text-gray-700 mb-2">Tags:</label>
             <div className="flex flex-wrap gap-2">
              {loadingTags ? (
                <p className="text-gray-400 text-sm">Loading tags...</p>
                ) : availableTags.length>0 ?availableTags.map((tag) => (
                /* Each tag MUST be its own button element */
                <button
                  key={tag._id}
                  type="button"
                  onClick={() => toggleTag(tag.tag_name)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all inline-block ${
                    selectedTags.includes(tag.tag_name)
                      ? 'bg-indigo-500 text-white border-indigo-500'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'
                  }`}
                >
                  #{tag.tag_name}
                </button>
                  )) : (<p className="text-gray-400 text-sm">No tags available.</p>)
              }
          </div>

          {/* Input to Add New Tags */}
          <div className="flex gap-2 mt-3">
            <input
              type="text"
              placeholder="Add custom tag..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addNewTag();
                }
              }}
            />
            <button
              type="button"
              onClick={addNewTag}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-300 transition-colors"
            >
              Add
            </button>
          </div>
          </div>

          
        
        <button type="submit" className="px-6 py-3 text-white font-semibold rounded-lg bg-gradient-to-br 
        from-indigo-500 to-purple-600 hover:-translate-y-0.5 hover:shadow-lg 
        transition-all active:translate-y-0">Add Task</button>
      </form>

      {/* Integrated List of Tasks with Reordering Controls */}
<div className="w-full bg-gray-50 p-6 rounded-xl mb-8 border border-gray-200 lg:w-2/4 flex flex-col h-fit">
  <div className="flex justify-between items-center mb-4 border-b pb-2">
    <h2 className="text-lg font-bold text-gray-800">
      Notes for {new Date(selectedDate).toLocaleDateString('en-GB')}
    </h2>
  </div>

  {/* 1. WRAP EVERYTHING IN DRAGDROPCONTEXT */}
  <DragDropContext onDragEnd={onDragEnd}>
    <Droppable droppableId="notes-list">
      {(provided) => (
        <div 
          className='overflow-y-auto flex-grow custom-scroll max-h-[500px]'
          {...provided.droppableProps}
          ref={provided.innerRef}
        >
          {filteredByDate.length === 0 ? (
            <p className='text-center p-20 text-gray-400 italic'>No Notes Available</p>
          ) : (
            <div className="space-y-2">
              {filteredByDate.map((note, index) => (
                <Draggable key={note._id} draggableId={note._id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`group flex items-center gap-3 p-3 bg-white rounded-lg border shadow-sm transition-all ${
                        snapshot.isDragging ? "border-indigo-500 shadow-lg ring-2 ring-indigo-200" : "hover:border-indigo-300"
                      }`}
                    >
                    <span className="text-gray-400 cursor-grab">⋮⋮</span>
      
                    {/* Attach the handler here to use the function */}
                    <div 
                      className="flex-grow cursor-pointer"
                      onClick={() => note._id && handleTitleClick(note._id)}
                    >
                      <p className="font-semibold text-gray-700 truncate text-sm">
                        {note.title}
                      </p>
                    </div>
                  </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder} {/* 2. DON'T FORGET THIS */}
            </div>
          )}
        </div>
      )}
    </Droppable>
  </DragDropContext>
</div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-15 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {["all", "not-completed", "completed", "expired"].map((type) => (
            <button key={type} onClick={() => setFilter(type)} className={`   
              px-1.5 py-1.5 text-xs rounded-md
            sm:px-2 sm:py-1.5 sm:text-sm sm:rounded-lg
            lg:px-3 lg:py-2 lg:text-base lg:rounded-xl
            font-medium border transition
              ${filter === type ?  "bg-blue-500 text-white border-blue-500" : "bg-white text-gray-700 hover:bg-gray-100"}`}>
              {type.replace("-", " ")}
            </button>
          ))}
            <div className='w-full  sm:w-auto '>
                <button 
                    className="px-1.5 py-1.5 text-xs font-medium rounded bg-white border border-gray-200 sm:px-2 sm:py-1.5 
                    sm:text-sm sm:rounded-lg lg:px-3 lg:py-2 lg:text-base lg:rounded-xl 
                    text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    onClick={handleFilterClick}> 
                    <FilterListAltIcon sx={{ fontSize: 'inherit' }} />
                      Filter by Date: {new Date(selectedDate).toLocaleDateString('en-GB')}
                    </button>

                <input
                  type="date"
                  ref={dateInputRef}
                  value={filterByDate}
                  max={new Date().toISOString().split('T')[0]} // Restricts to today or earlier
                  
                  onChange={(e) => { const newDate = e.target.value;
                                  setSelectedDate(newDate); // Update UI state
                                  setFilterByDate(newDate);
                                  fetchNotes(newDate);     
                                  }}
                  className="sr-only" 
                  />
            </div>
            <div className="relative  w-64 lg:pl-10 lg:w-80 ">
              <SearchIcon className="absolute left-2 lg:left-12 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="     Search Tags"
                value={tagSearch}
                onChange={(e) => setTagSearch(e.target.value) }
                className="
                  pl-8 px-1.5 py-1.5 text-xs font-medium
                  bg-white border border-gray-200 text-gray-700
                  rounded sm:px-2 sm:py-1.5 sm:text-sm sm:rounded-lg sm:pl-8 
                  lg:px-3 lg:py-2 lg:text-base lg:rounded-xl lg:pl-8 
                  focus:outline-none focus:ring-1 focus:ring-gray-300
                "
              />
            </div>
        </div>
        {selectedNotes.size > 0 && (
          <div className="ml-auto flex gap-2 items-center p-2 rounded-lg  border-red-100 px-4">
            <span className="text-red-700 font-bold">{selectedNotes.size} selected</span>
            <button onClick={handleBulkDelete} className="bg-red-500 text-white py-2 px-4 rounded-lg font-semibold hover:bg-red-600 transition-colors">Delete Selected</button>
          </div>
        )}
      </div>

      {/* Select All */}
      {filteredNotes.length > 0 && (
        <label className="mb-6 flex items-center gap-2 cursor-pointer w-fit">
          <input type="checkbox" checked={selectedNotes.size === filteredNotes.length} onChange={selectAllNotes} className="w-5 h-5 cursor-pointer accent-blue-500" />
          <span className="font-medium text-gray-700">Select All</span>
        </label>
      )}
      {/* Task Grid */}
      {loading ? (
        <p className="p-20 text-center text-xl font-bold animate-pulse text-indigo-400">⏳ Loading tasks...</p>
      ) : filteredNotes.length === 0 ? (
        <p className="text-center p-20 text-gray-400 italic">No tasks found match your filter.</p>
      ) : (
        <div className=" grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-h-[3000px]">
          {filteredNotes.map(note => (
            <div key={note._id} className="flex flex-col  bg-white rounded-xl border-2 border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden min-h-[250px]">
              {editingNoteId === note._id ? ( 
                /* Edit Mode */
                <div className="p-6 flex flex-col  gap-3 min-h-[250px]">
                  <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-400 outline-none" />
                  <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="w-full p-2 border rounded flex-grow focus:ring-2 focus:ring-blue-400 outline-none resize-none" rows="1" />

                  <input type="date" value={editDate} min={new Date().toISOString().split('T')[0]} onChange={(e) => setEditDate(e.target.value)} className="w-full p-2 border rounded" />
                  <div className="flex gap-2 pt-4">
                    <button onClick={() => handleUpdateNote(note._id)} className="flex-1 bg-emerald-500 text-white py-2 rounded font-bold">Save</button>
                    <button onClick={() => setEditingNoteId(null)} className="flex-1 bg-gray-500 text-white py-2 rounded font-bold">Cancel</button>
                  </div>
                </div>
              ) : (
                /* View Mode */
                <>
                  <div className="flex items-center  justify-between p-4 border-b border-gray-100 bg-gray-50/50">
                    <h3 className="font-bold text-gray-800 truncate flex-1 pr-2">{note.title}</h3>
                    <div className="flex items-center gap-1">
                      <span  className={`p-1.5 rounded-full transition-colors ${getStatusBadgeStyles(note.status) === 'completed' ? 'text-emerald-600 bg-emerald-50 ' : 'text-gray-400'}`} title="Complete">
                       {note.status === 'completed' ? (
                              <DoneIcon sx={{ fontSize: 20, color: '#0a865d' ,backgroundColor:'#95f7d6'}} />
                            ) : (
                              <DoneIcon sx={{ fontSize: 20, color: '#9ca3af' }} />
                            )}
                      </span>
                      <button onClick={() => deleteNote(note._id)} className="p-1.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Delete">
                        <DeleteIcon dx={{fontSize:20}}/>
                      </button>
                      <button onClick={() => startEditNote(note)} className="p-1.5 rounded-full text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors" title="Edit">
                        <EditIcon sx={{ fontSize: 20 }} />
                      </button>
                      <input type="checkbox" className="ml-2 w-4 h-4 cursor-pointer accent-indigo-600" checked={selectedNotes.has(note._id)} onChange={() => toggleNoteSelection(note._id)} />
                    </div>
                  </div>
                  <div className="p-4 flex-grow">
                    <p className="text-gray-600 text-sm leading-relaxed line-clamp-4 ">{note.description}</p>
                  </div>
                  <div className="p-4 pt-0 flex flex-wrap gap-1">
                      {/* Add Array.isArray check to prevent the crash */}
                      {Array.isArray(note.tags) && note.tags.map((tag, index) => {
                        const tagDisplay = availableTags.find(t => t._id === tag || t.tag_name === tag);
                        // <span 
                        //   key={index} 
                        //   className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-md border border-indigo-100"
                        // >
                        //   #{tag}
                        // </span>
                        return (
                            <span key={index} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-md border border-indigo-100">
                              #{tagDisplay ? tagDisplay.tag_name : "Loading..."}
                            </span>
                        );
                      }
                      )}
                    </div>
                  <div className="flex items-center justify-between p-3 px-4 bg-gray-50 border-t border-gray-100">
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <span className="material-icons text-sm">📅</span>
                      <span className="text-[12px] font-semibold">{note.date ? new Date(note.date).toLocaleDateString('en-GB',options) : 'No Deadline'}</span>
                    </div>
                    <button onClick={() => toggleStatus(note._id, note.status)} className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${getStatusBadgeStyles(note.status)}`}>
                      {note.status.replace('-', ' ')}
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;