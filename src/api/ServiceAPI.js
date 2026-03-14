import api from './axiosConfig';

export const todoService ={
    createnote : async(todoData)=>{
        const response= await api.post('api/todolist/' ,{
            title: todoData.title,
            description: todoData.description,
            tags: todoData.tags || []});
        return response.data;
    },
    updatenote :async(noteId,todoData)=>{
        const response =await api.put(`api/todolist/${noteId}`,{
            title:todoData.title , description :todoData.description
        });
        return response.data;
    },
    updateStatus :async(noteId,newStatus)=>{
        const response =await api.put(`api/todolist/updateStatus/${noteId}`,{
            status:newStatus
        })
        return response.data;
    },
    updatedate:async(noteid,newDate)=>{
        const response =await api.put(`/api/todolist/updateDate/${noteid}`,{
            date:newDate
        })
        return response.data;
    },
    softDelete: async (noteId) => {
        const response = await api.delete(`/api/todolist/softdelete/${noteId}`);
        return response.data;
    },
     bulkDelete: async (ids) => {
        const response = await api.delete('/api/todolist/softdeletemany', {
            data: {ids }
        });
        return response.data;
    },
    getNotes :async()=>{
        const response =await api.get(`/api/todolist/getallbyuser`);
        return response.data;
    },
    getNoteById: async (noteId) => {
        const response = await api.get(`/api/todolist/${noteId}`);
        return response.data;
    },
    getNotesByDate: async (date) => {
        const response = await api.get(`/api/todolist/getbydate/${date}`);
        return response.data;
    },
    // Get user's tags
    getTags: async () => {
    const response = await api.get(`/api/todolist/tags`);
    return response.data;
  },
  
  // Add new tag
    addTag: async (tag_name) => {
    const response = await api.post(`api/todolist/addtags`, {tag_name:tag_name} );
    return response.data;
    },
    // Update all tags
   updateTags: async (tags) => {
    try {
      const response = await api.put(`/tags`,
        { tags }
      );
      return response.data;
    } catch (error) {
      console.error("Update tags error:", error);
      throw error;
    }
    },
    updateOrder: async (orderData) => {
        try {
            // Sends the array of {id, order} objects to the backend
            const response = await api.put('/api/todolist/updateOrder', { 
                note_orders: orderData 
            });
            return response.data;
        } catch (error) {
            console.error("Service Error: Failed to update note order", error);
            throw error;
        }
    }
}