import React, { useState } from 'react';
import { todoService } from '../api/todoService';

const CreateTodo = ({ onTodoCreated }) => {
  const [formData, setFormData] = useState({ title: '', description: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Backend addnote stores user_id and email from the token
      await todoService.createNote(formData);
      setFormData({ title: '', description: '' });
      onTodoCreated(); // Refresh the list in parent component
    } catch (err) {
      alert("Error creating todo");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input 
        value={formData.title} 
        onChange={(e) => setFormData({...formData, title: e.target.value})}
        placeholder="Task Title"
        required
      />
      <textarea 
        value={formData.description}
        onChange={(e) => setFormData({...formData, description: e.target.value})}
        placeholder="Description"
      />
      <button type="submit">Add Task</button>
    </form>
  );
};